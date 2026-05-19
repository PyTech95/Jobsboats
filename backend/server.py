from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from contextlib import asynccontextmanager

import bcrypt
import jwt
from bson import ObjectId
from bson.errors import InvalidId

from fastapi import (
    FastAPI,
    APIRouter,
    HTTPException,
    Request,
    Response,
    Depends,
    status,
    UploadFile,
    File,
    Form,
    BackgroundTasks,
)
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorGridFSBucket,
)

from pydantic import (
    BaseModel,
    Field,
    EmailStr,
    ConfigDict,
    field_validator,
)

# ----- Logging Setup -----
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("jobsboats")

# ----- Environment Validation -----
REQUIRED_ENV_VARS = ["MONGO_URL", "DB_NAME"]
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.environ.get(var)]
if missing_vars:
    logger.error(f"Missing required environment variables: {missing_vars}")
    if os.environ.get("RENDER"):
        raise RuntimeError(f"Missing env vars: {missing_vars}")

# ----- Database Connection -----
mongo_url = os.environ.get("MONGO_URL")
if not mongo_url:
    raise ValueError("MONGO_URL environment variable is required")

db_name = os.environ.get("DB_NAME", "jobsboats")

# MongoDB connection with proper options
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=50,
    minPoolSize=10,
    maxIdleTimeMS=60000,
    connectTimeoutMS=10000,
    serverSelectionTimeoutMS=10000,
)

db = client[db_name]
gridfs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="resumes")

# ----- App Configuration -----
JWT_ALGO = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me-in-production")
if JWT_SECRET == "dev-secret-change-me-in-production" and os.environ.get("RENDER"):
    logger.warning("Using default JWT_SECRET in production! Set a secure value!")

MAX_RESUME_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_RESUME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}

# ----- Lifespan Management (replaces on_event) -----
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Jobsboats API...")
    await ensure_indexes()
    await seed_users_and_jobs()
    logger.info("Jobsboats startup complete")
    yield
    # Shutdown
    logger.info("Shutting down...")
    client.close()
    logger.info("Shutdown complete")

# ----- FastAPI App -----
app = FastAPI(
    title="Jobsboats API",
    description="Job portal API for seekers and employers",
    version="1.0.0",
    lifespan=lifespan,
)

api = APIRouter(prefix="/api")

# ----- Middleware -----
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for production
if os.environ.get("RENDER"):
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=os.environ.get("ALLOWED_HOSTS", "*").split(","),
    )

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now(timezone.utc)
    response = await call_next(request)
    process_time = (datetime.now(timezone.utc) - start_time).total_seconds()
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s"
    )
    return response

# ----- Helper Functions -----
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def clean_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("password_hash", None)
    return user

def set_auth_cookie(response: Response, token: str) -> None:
    secure = bool(os.environ.get("COOKIE_SECURE", False))
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )

# ----- Pydantic Models -----
Role = Literal["seeker", "employer"]

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=100)
    role: Role
    company: Optional[str] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    name: str
    role: Role
    company: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = []
    resume_filename: Optional[str] = None
    profile_visibility: str = "public"
    created_at: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    company: Optional[str] = None
    profile_visibility: Optional[Literal["public", "private"]] = None
    resume_filename: Optional[str] = None

class JobIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    company: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=200)
    type: Literal["Full-time", "Part-time", "Contract", "Internship"]
    workplace: Literal["Remote", "On-site", "Hybrid"]
    experience: Literal["Entry", "Mid", "Senior", "Lead"]
    salary_min: int = Field(default=0, ge=0)
    salary_max: int = Field(default=0, ge=0)
    description: str = Field(min_length=10)
    tags: List[str] = []
    
    @field_validator('salary_max')
    @classmethod
    def validate_salary(cls, v, info):
        if 'salary_min' in info.data and v < info.data['salary_min']:
            raise ValueError('salary_max must be greater than or equal to salary_min')
        return v

class JobOut(JobIn):
    id: str
    employer_id: Optional[str] = None
    posted_at: str
    source: str = "jobsboats"
    logo: Optional[str] = None

class ApplicationIn(BaseModel):
    job_id: str
    cover_note: Optional[str] = None

class ApplicationStageUpdate(BaseModel):
    stage: Literal["new", "shortlisted", "interview", "offered", "hired", "rejected"]

class AlertIn(BaseModel):
    keyword: str = Field(min_length=1, max_length=100)
    location: Optional[str] = None
    frequency: Literal["daily", "weekly"] = "weekly"

# ----- Auth Routes -----
@api.post("/auth/register", response_model=UserOut)
async def register(payload: RegisterIn, response: Response):
    try:
        email = payload.email.lower().strip()
        
        # Check if user exists
        if await db.users.find_one({"email": email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = str(uuid.uuid4())
        doc = {
            "id": user_id,
            "email": email,
            "name": payload.name.strip(),
            "role": payload.role,
            "company": payload.company,
            "password_hash": hash_password(payload.password),
            "headline": None,
            "location": None,
            "skills": [],
            "resume_filename": None,
            "profile_visibility": "public",
            "created_at": now_iso(),
        }
        await db.users.insert_one(doc)
        
        token = create_access_token(user_id, email)
        set_auth_cookie(response, token)
        
        logger.info(f"New user registered: {email} ({payload.role})")
        return clean_doc(doc)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api.post("/auth/login", response_model=UserOut)
async def login(payload: LoginIn, response: Response):
    try:
        email = payload.email.lower().strip()
        user = await db.users.find_one({"email": email})
        
        if not user or not verify_password(payload.password, user.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        token = create_access_token(user["id"], email)
        set_auth_cookie(response, token)
        
        logger.info(f"User logged in: {email}")
        return clean_doc(dict(user))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return user

@api.patch("/auth/profile", response_model=UserOut)
async def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    try:
        updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if updates:
            await db.users.update_one({"id": user["id"]}, {"$set": updates})
        
        updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
        logger.info(f"Profile updated for user: {user['email']}")
        return updated
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Profile update failed")

# ----- Jobs Routes -----
@api.get("/jobs", response_model=List[JobOut])
async def list_jobs(
    q: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[str] = None,
    workplace: Optional[str] = None,
    experience: Optional[str] = None,
    min_salary: Optional[int] = None,
    page: int = 1,
    limit: int = 20,
):
    query: dict = {}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"company": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if type:
        query["type"] = type
    if workplace:
        query["workplace"] = workplace
    if experience:
        query["experience"] = experience
    if min_salary:
        query["salary_max"] = {"$gte": min_salary}
    
    skip = (page - 1) * limit
    cursor = db.jobs.find(query, {"_id": 0}).sort("posted_at", -1).skip(skip).limit(limit)
    return await cursor.to_list(length=limit)

@api.get("/jobs/{job_id}", response_model=JobOut)
async def get_job(job_id: str):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@api.post("/jobs", response_model=JobOut)
async def create_job(payload: JobIn, user=Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Only employers can post jobs")
    
    job_id = str(uuid.uuid4())
    doc = payload.model_dump()
    doc.update({
        "id": job_id,
        "employer_id": user["id"],
        "posted_at": now_iso(),
        "source": "jobsboats",
        "logo": None,
    })
    await db.jobs.insert_one(doc)
    logger.info(f"New job posted: {payload.title} by {user['email']}")
    return {k: v for k, v in doc.items() if k != "_id"}

@api.get("/employer/jobs", response_model=List[JobOut])
async def employer_jobs(user=Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Employers only")
    
    cursor = db.jobs.find({"employer_id": user["id"]}, {"_id": 0}).sort("posted_at", -1)
    return await cursor.to_list(length=200)

# ----- Applications & Saved Jobs -----
@api.post("/applications")
async def apply_job(payload: ApplicationIn, user=Depends(get_current_user)):
    if user["role"] != "seeker":
        raise HTTPException(status_code=403, detail="Only seekers can apply")
    
    job = await db.jobs.find_one({"id": payload.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    existing = await db.applications.find_one(
        {"seeker_id": user["id"], "job_id": payload.job_id}
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already applied to this job")
    
    app_id = str(uuid.uuid4())
    doc = {
        "id": app_id,
        "seeker_id": user["id"],
        "seeker_name": user["name"],
        "seeker_email": user["email"],
        "seeker_headline": user.get("headline"),
        "seeker_location": user.get("location"),
        "seeker_skills": user.get("skills", []),
        "job_id": payload.job_id,
        "job_title": job["title"],
        "company": job["company"],
        "employer_id": job.get("employer_id"),
        "stage": "new",
        "cover_note": payload.cover_note,
        "applied_at": now_iso(),
    }
    await db.applications.insert_one(doc)
    doc.pop("_id", None)
    logger.info(f"New application: {user['email']} -> {job['title']}")
    return doc

@api.get("/applications/me")
async def my_applications(user=Depends(get_current_user)):
    if user["role"] != "seeker":
        raise HTTPException(status_code=403, detail="Seekers only")
    
    cursor = db.applications.find({"seeker_id": user["id"]}, {"_id": 0}).sort("applied_at", -1)
    return await cursor.to_list(length=200)

@api.get("/employer/applications")
async def employer_applications(job_id: Optional[str] = None, user=Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Employers only")
    
    query: dict = {"employer_id": user["id"]}
    if job_id:
        query["job_id"] = job_id
    
    cursor = db.applications.find(query, {"_id": 0}).sort("applied_at", -1)
    return await cursor.to_list(length=500)

@api.patch("/employer/applications/{app_id}")
async def update_application_stage(
    app_id: str, payload: ApplicationStageUpdate, user=Depends(get_current_user)
):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Employers only")
    
    app_doc = await db.applications.find_one({"id": app_id, "employer_id": user["id"]})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Application not found")
    
    await db.applications.update_one(
        {"id": app_id}, {"$set": {"stage": payload.stage}}
    )
    updated = await db.applications.find_one({"id": app_id}, {"_id": 0})
    logger.info(f"Application {app_id} stage updated to {payload.stage}")
    return updated

@api.post("/saved-jobs/{job_id}")
async def save_job(job_id: str, user=Depends(get_current_user)):
    if user["role"] != "seeker":
        raise HTTPException(status_code=403, detail="Seekers only")
    
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    await db.saved_jobs.update_one(
        {"seeker_id": user["id"], "job_id": job_id},
        {"$set": {
            "seeker_id": user["id"],
            "job_id": job_id,
            "job_title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "saved_at": now_iso(),
        }},
        upsert=True,
    )
    return {"ok": True}

@api.delete("/saved-jobs/{job_id}")
async def unsave_job(job_id: str, user=Depends(get_current_user)):
    await db.saved_jobs.delete_one({"seeker_id": user["id"], "job_id": job_id})
    return {"ok": True}

@api.get("/saved-jobs")
async def list_saved(user=Depends(get_current_user)):
    cursor = db.saved_jobs.find({"seeker_id": user["id"]}, {"_id": 0}).sort("saved_at", -1)
    return await cursor.to_list(length=500)

# ----- Job Alerts -----
@api.get("/alerts")
async def list_alerts(user=Depends(get_current_user)):
    cursor = db.alerts.find({"seeker_id": user["id"]}, {"_id": 0})
    return await cursor.to_list(length=100)

@api.post("/alerts")
async def create_alert(payload: AlertIn, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "seeker_id": user["id"],
        "keyword": payload.keyword,
        "location": payload.location,
        "frequency": payload.frequency,
        "created_at": now_iso(),
    }
    await db.alerts.insert_one(doc)
    doc.pop("_id", None)
    logger.info(f"Alert created for {user['email']}: {payload.keyword}")
    return doc

@api.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, user=Depends(get_current_user)):
    result = await db.alerts.delete_one({"id": alert_id, "seeker_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"ok": True}

# ----- Quick Apply with Resume Upload -----
@api.post("/quick-apply")
async def quick_apply(
    name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    current_role: Optional[str] = Form(None),
    experience_years: Optional[int] = Form(None),
    preferred_title: Optional[str] = Form(None),
    preferred_location: Optional[str] = Form(None),
    cover_note: Optional[str] = Form(None),
    job_id: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
):
    file_id: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_content_type: Optional[str] = None
    
    try:
        if resume is not None and resume.filename:
            # Read file content
            contents = await resume.read()
            if not contents:
                raise HTTPException(status_code=400, detail="Resume file is empty")
            if len(contents) > MAX_RESUME_BYTES:
                raise HTTPException(status_code=400, detail="Resume must be 10MB or smaller")
            
            # Upload to GridFS
            upload_id = await gridfs_bucket.upload_from_stream(
                resume.filename,
                contents,
                metadata={
                    "content_type": resume.content_type or "application/octet-stream",
                    "uploaded_at": now_iso(),
                    "applicant_email": email.lower().strip(),
                },
            )
            file_id = str(upload_id)
            resume_filename = resume.filename
            resume_content_type = resume.content_type
        
        # Save application
        doc = {
            "id": str(uuid.uuid4()),
            "name": name.strip(),
            "email": email.lower().strip(),
            "phone": phone,
            "current_role": current_role,
            "experience_years": experience_years,
            "preferred_title": preferred_title,
            "preferred_location": preferred_location,
            "cover_note": cover_note,
            "job_id": job_id,
            "resume_file_id": file_id,
            "resume_filename": resume_filename,
            "resume_content_type": resume_content_type,
            "submitted_at": now_iso(),
        }
        await db.quick_applications.insert_one(doc)
        doc.pop("_id", None)
        
        logger.info(f"Quick application received from {email}")
        return {"ok": True, "application_id": doc["id"]}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick apply error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Application failed: {str(e)}")

@api.get("/quick-apply/resume/{file_id}")
async def download_resume(file_id: str):
    try:
        # Validate ObjectId
        try:
            oid = ObjectId(file_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        # Download from GridFS
        try:
            stream = await gridfs_bucket.open_download_stream(oid)
        except Exception as e:
            logger.error(f"Resume not found: {file_id}")
            raise HTTPException(status_code=404, detail="Resume not found")
        
        async def file_iterator():
            try:
                while True:
                    chunk = await stream.readchunk()
                    if not chunk:
                        break
                    yield chunk
            finally:
                stream.close()
        
        filename = stream.filename or "resume"
        media_type = (stream.metadata or {}).get("content_type") or "application/octet-stream"
        
        return StreamingResponse(
            file_iterator(),
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume download error: {str(e)}")
        raise HTTPException(status_code=500, detail="Download failed")

# ----- Statistics -----
@api.get("/stats")
async def stats():
    try:
        jobs = await db.jobs.count_documents({})
        users = await db.users.count_documents({})
        companies = await db.jobs.distinct("company")
        
        return {
            "jobs": jobs,
            "users": users,
            "companies": len(companies),
            "applications": await db.applications.count_documents({}),
        }
    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        return {"jobs": 0, "users": 0, "companies": 0, "applications": 0}

# ----- Health Check -----
@api.get("/health")
async def health_check():
    try:
        # Check database connection
        await db.command('ping')
        return {"status": "healthy", "database": "connected", "timestamp": now_iso()}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected", "error": str(e)}
        )

@api.get("/")
async def root():
    return {"service": "jobsboats", "version": "1.0.0", "status": "operational"}

# ----- Database Indexes -----
async def ensure_indexes():
    try:
        await db.users.create_index("email", unique=True)
        await db.jobs.create_index("posted_at")
        await db.jobs.create_index("employer_id")
        await db.jobs.create_index([("title", "text"), ("company", "text"), ("tags", "text")])
        await db.applications.create_index([("seeker_id", 1), ("job_id", 1)], unique=True)
        await db.applications.create_index("employer_id")
        await db.saved_jobs.create_index([("seeker_id", 1), ("job_id", 1)], unique=True)
        await db.alerts.create_index("seeker_id")
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Index creation error: {str(e)}")

# ----- Seed Data -----
SEED_JOBS = [
    {
        "title": "Senior Frontend Engineer",
        "company": "Harbor Labs",
        "location": "Remote · USA",
        "type": "Full-time",
        "workplace": "Remote",
        "experience": "Senior",
        "salary_min": 140000,
        "salary_max": 180000,
        "description": "Build delightful, performant interfaces with React 19 and TypeScript. Partner with product and design to ship customer-facing features end to end.",
        "tags": ["React", "TypeScript", "Tailwind", "Frontend"],
    },
    {
        "title": "Product Designer",
        "company": "Lighthouse Studio",
        "location": "Lisbon, Portugal",
        "type": "Full-time",
        "workplace": "Hybrid",
        "experience": "Mid",
        "salary_min": 55000,
        "salary_max": 80000,
        "description": "Own end-to-end product design for a fast-growing SaaS. Conduct research, prototype in Figma, and partner with engineering.",
        "tags": ["Figma", "UI/UX", "SaaS", "Research"],
    },
    {
        "title": "Backend Engineer (Python)",
        "company": "Anchor Systems",
        "location": "Berlin, Germany",
        "type": "Full-time",
        "workplace": "On-site",
        "experience": "Mid",
        "salary_min": 70000,
        "salary_max": 95000,
        "description": "Design and operate microservices in FastAPI + MongoDB. Comfort with distributed systems, observability and clean APIs is a plus.",
        "tags": ["Python", "FastAPI", "MongoDB", "Kubernetes"],
    },
    {
        "title": "Data Analyst",
        "company": "Compass Insights",
        "location": "Bangalore, India",
        "type": "Full-time",
        "workplace": "Hybrid",
        "experience": "Entry",
        "salary_min": 1200000,
        "salary_max": 1800000,
        "description": "Translate raw events into stories the leadership team can act on. SQL, Looker, light Python.",
        "tags": ["SQL", "Looker", "Analytics"],
    },
    {
        "title": "DevOps Engineer",
        "company": "Tideways",
        "location": "Remote · EU",
        "type": "Contract",
        "workplace": "Remote",
        "experience": "Senior",
        "salary_min": 90000,
        "salary_max": 130000,
        "description": "Run our Kubernetes platform across 3 regions. Author Terraform, harden CI/CD, on-call rotation.",
        "tags": ["Kubernetes", "Terraform", "AWS", "CI/CD"],
    },
]

async def seed_users_and_jobs():
    try:
        # Demo users
        seeker_email = os.environ.get("SEEKER_EMAIL", "seeker@jobsboats.com")
        seeker_password = os.environ.get("SEEKER_PASSWORD", "seeker123")
        employer_email = os.environ.get("EMPLOYER_EMAIL", "employer@jobsboats.com")
        employer_password = os.environ.get("EMPLOYER_PASSWORD", "employer123")
        
        async def upsert_user(email, password, name, role, company=None, **extra):
            existing = await db.users.find_one({"email": email})
            if existing is None:
                doc = {
                    "id": str(uuid.uuid4()),
                    "email": email,
                    "name": name,
                    "role": role,
                    "company": company,
                    "password_hash": hash_password(password),
                    "headline": extra.get("headline"),
                    "location": extra.get("location"),
                    "skills": extra.get("skills", []),
                    "resume_filename": None,
                    "profile_visibility": "public",
                    "created_at": now_iso(),
                }
                await db.users.insert_one(doc)
                logger.info(f"Created demo user: {email}")
                return doc
            # Update password if changed
            if not verify_password(password, existing.get("password_hash", "")):
                await db.users.update_one(
                    {"email": email}, {"$set": {"password_hash": hash_password(password)}}
                )
            return existing
        
        seeker = await upsert_user(
            seeker_email,
            seeker_password,
            "Maya Patel",
            "seeker",
            headline="Senior Product Designer",
            location="Lisbon, Portugal",
            skills=["Figma", "Design Systems", "Prototyping", "Research"],
        )
        
        employer = await upsert_user(
            employer_email,
            employer_password,
            "Harbor Labs Recruiter",
            "employer",
            company="Harbor Labs",
        )
        
        # Seed jobs
        for job in SEED_JOBS:
            exists = await db.jobs.find_one({"title": job["title"], "company": job["company"]})
            if exists:
                continue
            
            doc = dict(job)
            doc.update({
                "id": str(uuid.uuid4()),
                "employer_id": employer["id"] if job["company"] == "Harbor Labs" else None,
                "posted_at": now_iso(),
                "source": "jobsboats",
                "logo": None,
            })
            await db.jobs.insert_one(doc)
            logger.info(f"Seeded job: {job['title']}")
        
        logger.info("Data seeding complete")
    except Exception as e:
        logger.error(f"Seeding error: {str(e)}")

# Include router
app.include_router(api)

# Root endpoint for health check
@app.get("/")
async def root_redirect():
    return {"message": "Jobsboats API is running", "docs": "/docs"}
