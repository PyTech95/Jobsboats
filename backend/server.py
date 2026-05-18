from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ----- Logging -----
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("jobsboats")

# ----- DB -----
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ----- App -----
app = FastAPI(title="Jobsboats API")
api = APIRouter(prefix="/api")

JWT_ALGO = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")


# =============================================================
# Helpers
# =============================================================
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
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("password_hash", None)
    return user


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )


# =============================================================
# Models
# =============================================================
Role = Literal["seeker", "employer"]


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: Role
    company: Optional[str] = None


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
    title: str
    company: str
    location: str
    type: Literal["Full-time", "Part-time", "Contract", "Internship"]
    workplace: Literal["Remote", "On-site", "Hybrid"]
    experience: Literal["Entry", "Mid", "Senior", "Lead"]
    salary_min: int = 0
    salary_max: int = 0
    description: str
    tags: List[str] = []


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


# =============================================================
# Auth Routes
# =============================================================
@api.post("/auth/register", response_model=UserOut)
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower().strip()
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
    return clean_doc(doc)


@api.post("/auth/login", response_model=UserOut)
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return clean_doc(dict(user))


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return user


@api.patch("/auth/profile", response_model=UserOut)
async def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated


# =============================================================
# Jobs Routes
# =============================================================
@api.get("/jobs", response_model=List[JobOut])
async def list_jobs(
    q: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[str] = None,
    workplace: Optional[str] = None,
    experience: Optional[str] = None,
    min_salary: Optional[int] = None,
    limit: int = 100,
):
    query: dict = {}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"company": {"$regex": q, "$options": "i"}},
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
    cursor = db.jobs.find(query, {"_id": 0}).sort("posted_at", -1).limit(limit)
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
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/employer/jobs", response_model=List[JobOut])
async def employer_jobs(user=Depends(get_current_user)):
    if user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Employers only")
    cursor = db.jobs.find({"employer_id": user["id"]}, {"_id": 0}).sort("posted_at", -1)
    return await cursor.to_list(length=200)


# =============================================================
# Applications & Saved jobs
# =============================================================
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


@api.get("/alerts")
async def list_alerts(user=Depends(get_current_user)):
    cursor = db.alerts.find({"seeker_id": user["id"]}, {"_id": 0})
    return await cursor.to_list(length=100)


class AlertIn(BaseModel):
    keyword: str
    location: Optional[str] = None
    frequency: Literal["daily", "weekly"] = "weekly"


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
    return doc


@api.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, user=Depends(get_current_user)):
    await db.alerts.delete_one({"id": alert_id, "seeker_id": user["id"]})
    return {"ok": True}


# =============================================================
# Stats
# =============================================================
@api.get("/stats")
async def stats():
    jobs = await db.jobs.count_documents({})
    users = await db.users.count_documents({})
    companies = len(await db.jobs.distinct("company"))
    return {"jobs": jobs, "users": users, "companies": companies}


# =============================================================
# Seeding
# =============================================================
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
    {
        "title": "Marketing Manager",
        "company": "Skybridge",
        "location": "New York, NY",
        "type": "Full-time",
        "workplace": "On-site",
        "experience": "Mid",
        "salary_min": 95000,
        "salary_max": 125000,
        "description": "Plan and execute lifecycle, paid, and content programs that move pipeline.",
        "tags": ["Lifecycle", "Content", "Growth"],
    },
    {
        "title": "iOS Engineer",
        "company": "Beacon Apps",
        "location": "Remote · Worldwide",
        "type": "Full-time",
        "workplace": "Remote",
        "experience": "Mid",
        "salary_min": 110000,
        "salary_max": 150000,
        "description": "SwiftUI, modern concurrency, deep love for craft.",
        "tags": ["iOS", "Swift", "SwiftUI"],
    },
    {
        "title": "Customer Success Lead",
        "company": "Harbor Labs",
        "location": "London, UK",
        "type": "Full-time",
        "workplace": "Hybrid",
        "experience": "Lead",
        "salary_min": 80000,
        "salary_max": 110000,
        "description": "Build the customer success function from scratch. Coach a team of 4.",
        "tags": ["CS", "Onboarding", "Retention"],
    },
    {
        "title": "Machine Learning Engineer",
        "company": "Northstar AI",
        "location": "Toronto, Canada",
        "type": "Full-time",
        "workplace": "Hybrid",
        "experience": "Senior",
        "salary_min": 150000,
        "salary_max": 200000,
        "description": "Train, evaluate and ship LLM-driven features. Strong Python and ML fundamentals required.",
        "tags": ["ML", "Python", "LLM", "PyTorch"],
    },
    {
        "title": "QA Automation Engineer",
        "company": "Compass Insights",
        "location": "Remote · India",
        "type": "Full-time",
        "workplace": "Remote",
        "experience": "Mid",
        "salary_min": 1000000,
        "salary_max": 1600000,
        "description": "Own E2E test infrastructure with Playwright and Cypress. Champion a quality-first culture.",
        "tags": ["Playwright", "Cypress", "QA"],
    },
    {
        "title": "Talent Acquisition Partner",
        "company": "Lighthouse Studio",
        "location": "Berlin, Germany",
        "type": "Full-time",
        "workplace": "On-site",
        "experience": "Mid",
        "salary_min": 50000,
        "salary_max": 70000,
        "description": "Source senior IC talent in design and engineering across EMEA.",
        "tags": ["Recruiting", "Sourcing"],
    },
    {
        "title": "Solutions Architect",
        "company": "Anchor Systems",
        "location": "Remote · USA",
        "type": "Full-time",
        "workplace": "Remote",
        "experience": "Senior",
        "salary_min": 160000,
        "salary_max": 210000,
        "description": "Partner with strategic accounts on technical adoption and integration.",
        "tags": ["Architecture", "Pre-sales", "Cloud"],
    },
]


async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.jobs.create_index("posted_at")
    await db.applications.create_index([("seeker_id", 1), ("job_id", 1)], unique=True)
    await db.saved_jobs.create_index([("seeker_id", 1), ("job_id", 1)], unique=True)


async def seed_users_and_jobs():
    # demo users
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
            return doc
        # keep password fresh with env
        if not verify_password(password, existing.get("password_hash", "")):
            await db.users.update_one(
                {"email": email}, {"$set": {"password_hash": hash_password(password)}}
            )
        return existing

    await upsert_user(
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

    # seed jobs (idempotent on title+company)
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


@app.on_event("startup")
async def startup_event():
    await ensure_indexes()
    await seed_users_and_jobs()
    logger.info("Jobsboats startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    client.close()


# Health
@api.get("/")
async def root():
    return {"service": "jobsboats", "ok": True}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
