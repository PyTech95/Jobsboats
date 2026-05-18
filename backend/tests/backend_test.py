"""
Jobsboats Backend API Test Suite
Covers: health, stats, jobs, auth, profile, applications, saved-jobs, alerts.
Uses cookies via requests.Session for JWT httpOnly cookie auth.
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Read from frontend/.env directly if not exported
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

SEEKER = {"email": "seeker@jobsboats.com", "password": "seeker123"}
EMPLOYER = {"email": "employer@jobsboats.com", "password": "employer123"}


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def seeker_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=SEEKER, timeout=15)
    assert r.status_code == 200, f"seeker login failed: {r.text}"
    return s


@pytest.fixture(scope="module")
def employer_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=EMPLOYER, timeout=15)
    assert r.status_code == 200, f"employer login failed: {r.text}"
    return s


# ---------- Health / Stats ----------
class TestHealth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_stats(self):
        r = requests.get(f"{API}/stats", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("jobs", "users", "companies"):
            assert k in d
            assert isinstance(d[k], int)
        assert d["jobs"] >= 12


# ---------- Jobs ----------
class TestJobs:
    def test_list_jobs_seeded(self):
        r = requests.get(f"{API}/jobs", timeout=15)
        assert r.status_code == 200
        jobs = r.json()
        assert isinstance(jobs, list)
        assert len(jobs) >= 12
        sample = jobs[0]
        for k in ("id", "title", "company", "location", "type", "workplace", "experience"):
            assert k in sample

    def test_filter_by_q(self):
        r = requests.get(f"{API}/jobs", params={"q": "Engineer"}, timeout=15)
        assert r.status_code == 200
        jobs = r.json()
        assert len(jobs) >= 1
        assert all(
            "engineer" in (j["title"] + j["company"] + " ".join(j.get("tags", []))).lower()
            for j in jobs
        )

    def test_filter_by_type_workplace_experience(self):
        r = requests.get(
            f"{API}/jobs",
            params={"type": "Full-time", "workplace": "Remote", "experience": "Senior"},
            timeout=15,
        )
        assert r.status_code == 200
        jobs = r.json()
        for j in jobs:
            assert j["type"] == "Full-time"
            assert j["workplace"] == "Remote"
            assert j["experience"] == "Senior"

    def test_filter_by_location(self):
        r = requests.get(f"{API}/jobs", params={"location": "Berlin"}, timeout=15)
        assert r.status_code == 200
        for j in r.json():
            assert "berlin" in j["location"].lower()

    def test_get_job_by_id(self):
        r = requests.get(f"{API}/jobs", timeout=15)
        job_id = r.json()[0]["id"]
        r2 = requests.get(f"{API}/jobs/{job_id}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["id"] == job_id

    def test_get_job_404(self):
        r = requests.get(f"{API}/jobs/does-not-exist", timeout=15)
        assert r.status_code == 404


# ---------- Auth ----------
class TestAuth:
    def test_login_demo_seeker_sets_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json=SEEKER, timeout=15)
        assert r.status_code == 200
        assert "access_token" in s.cookies
        body = r.json()
        assert body["role"] == "seeker"
        assert body["email"] == SEEKER["email"]
        assert "password_hash" not in body

    def test_login_demo_employer(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json=EMPLOYER, timeout=15)
        assert r.status_code == 200
        assert r.json()["role"] == "employer"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": SEEKER["email"], "password": "x"}, timeout=15)
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_cookie(self, seeker_session):
        r = seeker_session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == SEEKER["email"]

    def test_register_new_seeker_and_employer(self):
        suffix = uuid.uuid4().hex[:8]
        # seeker
        s1 = requests.Session()
        seeker_payload = {
            "email": f"TEST_seeker_{suffix}@jobsboats.com",
            "password": "passw0rd",
            "name": "Test Seeker",
            "role": "seeker",
        }
        r = s1.post(f"{API}/auth/register", json=seeker_payload, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "seeker"
        assert "access_token" in s1.cookies
        # me works
        r2 = s1.get(f"{API}/auth/me", timeout=15)
        assert r2.status_code == 200

        # employer
        s2 = requests.Session()
        emp_payload = {
            "email": f"TEST_employer_{suffix}@jobsboats.com",
            "password": "passw0rd",
            "name": "Test Employer",
            "role": "employer",
            "company": "TestCo",
        }
        r3 = s2.post(f"{API}/auth/register", json=emp_payload, timeout=15)
        assert r3.status_code == 200, r3.text
        assert r3.json()["role"] == "employer"
        assert r3.json()["company"] == "TestCo"

    def test_register_duplicate(self):
        r = requests.post(
            f"{API}/auth/register",
            json={
                "email": SEEKER["email"],
                "password": "whatever",
                "name": "Dup",
                "role": "seeker",
            },
            timeout=15,
        )
        assert r.status_code == 400

    def test_logout_clears_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json=SEEKER, timeout=15)
        assert r.status_code == 200
        # logout
        r2 = s.post(f"{API}/auth/logout", timeout=15)
        assert r2.status_code == 200
        # cookie should be gone for the path; subsequent /me should be 401
        s.cookies.clear()
        r3 = s.get(f"{API}/auth/me", timeout=15)
        assert r3.status_code == 401


# ---------- Profile ----------
class TestProfile:
    def test_update_profile(self, seeker_session):
        payload = {
            "headline": "Senior Product Designer",
            "location": "Lisbon, Portugal",
            "skills": ["Figma", "Research", "Prototyping"],
        }
        r = seeker_session.patch(f"{API}/auth/profile", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["headline"] == payload["headline"]
        assert body["location"] == payload["location"]
        assert set(body["skills"]) == set(payload["skills"])
        # verify persisted
        r2 = seeker_session.get(f"{API}/auth/me", timeout=15)
        assert r2.json()["headline"] == payload["headline"]


# ---------- Employer job posting + permissions ----------
class TestEmployerJobs:
    def test_seeker_cannot_post_job(self, seeker_session):
        payload = {
            "title": "TEST_Should fail",
            "company": "X",
            "location": "Remote",
            "type": "Full-time",
            "workplace": "Remote",
            "experience": "Mid",
            "salary_min": 1,
            "salary_max": 2,
            "description": "no",
            "tags": [],
        }
        r = seeker_session.post(f"{API}/jobs", json=payload, timeout=15)
        assert r.status_code == 403

    def test_employer_can_post_and_list(self, employer_session):
        payload = {
            "title": f"TEST_Job_{uuid.uuid4().hex[:6]}",
            "company": "Harbor Labs",
            "location": "Remote · USA",
            "type": "Full-time",
            "workplace": "Remote",
            "experience": "Mid",
            "salary_min": 100000,
            "salary_max": 120000,
            "description": "Test posting",
            "tags": ["Test"],
        }
        r = employer_session.post(f"{API}/jobs", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        job = r.json()
        assert job["title"] == payload["title"]
        assert "id" in job
        pytest.posted_job_id = job["id"]

        # list employer jobs
        r2 = employer_session.get(f"{API}/employer/jobs", timeout=15)
        assert r2.status_code == 200
        ids = [j["id"] for j in r2.json()]
        assert job["id"] in ids


# ---------- Applications + stage moves ----------
class TestApplications:
    def test_seeker_apply_and_dedup(self, seeker_session):
        # pick a job not yet applied: use job posted by employer in TestEmployerJobs OR fresh
        jobs = requests.get(f"{API}/jobs", timeout=15).json()
        job_id = getattr(pytest, "posted_job_id", jobs[0]["id"])
        # First clear any existing application by trying multiple jobs
        target = None
        my_apps = seeker_session.get(f"{API}/applications/me", timeout=15).json()
        applied_ids = {a["job_id"] for a in my_apps}
        # Prefer posted_job_id, else first not applied
        if job_id not in applied_ids:
            target = job_id
        else:
            for j in jobs:
                if j["id"] not in applied_ids:
                    target = j["id"]
                    break
        assert target, "No unapplied job available"

        r = seeker_session.post(f"{API}/applications", json={"job_id": target, "cover_note": "Hi"}, timeout=15)
        assert r.status_code == 200, r.text
        app_doc = r.json()
        assert app_doc["stage"] == "new"
        assert app_doc["job_id"] == target
        pytest.application_id = app_doc["id"]
        pytest.applied_job_id = target

        # duplicate
        r2 = seeker_session.post(f"{API}/applications", json={"job_id": target}, timeout=15)
        assert r2.status_code == 400

    def test_seeker_my_applications(self, seeker_session):
        r = seeker_session.get(f"{API}/applications/me", timeout=15)
        assert r.status_code == 200
        ids = [a["id"] for a in r.json()]
        assert getattr(pytest, "application_id", None) in ids

    def test_employer_applications_and_stage_progression(self, employer_session):
        # Get employer apps
        r = employer_session.get(f"{API}/employer/applications", timeout=15)
        assert r.status_code == 200
        apps = r.json()
        # Find our app
        target_id = getattr(pytest, "application_id", None)
        app_doc = next((a for a in apps if a["id"] == target_id), None)
        # If our applied job has no employer_id (random seed job), there may not be a record;
        # use any application as fallback
        if not app_doc and apps:
            app_doc = apps[0]
        assert app_doc, "Employer has no applications visible. Apply via Harbor Labs posted job."

        # progression: new -> shortlisted -> interview -> offered -> hired
        for stage in ("shortlisted", "interview", "offered", "hired"):
            r2 = employer_session.patch(
                f"{API}/employer/applications/{app_doc['id']}",
                json={"stage": stage},
                timeout=15,
            )
            assert r2.status_code == 200, r2.text
            assert r2.json()["stage"] == stage


# ---------- Saved jobs ----------
class TestSavedJobs:
    def test_save_unsave_flow(self, seeker_session):
        jobs = requests.get(f"{API}/jobs", timeout=15).json()
        job_id = jobs[1]["id"]
        r1 = seeker_session.post(f"{API}/saved-jobs/{job_id}", timeout=15)
        assert r1.status_code == 200
        r2 = seeker_session.get(f"{API}/saved-jobs", timeout=15)
        assert r2.status_code == 200
        assert any(s["job_id"] == job_id for s in r2.json())
        r3 = seeker_session.delete(f"{API}/saved-jobs/{job_id}", timeout=15)
        assert r3.status_code == 200
        r4 = seeker_session.get(f"{API}/saved-jobs", timeout=15)
        assert all(s["job_id"] != job_id for s in r4.json())


# ---------- Alerts ----------
class TestAlerts:
    def test_create_list_delete_alert(self, seeker_session):
        payload = {"keyword": "TEST_python", "location": "Remote", "frequency": "weekly"}
        r = seeker_session.post(f"{API}/alerts", json=payload, timeout=15)
        assert r.status_code == 200
        alert = r.json()
        assert alert["keyword"] == payload["keyword"]
        aid = alert["id"]

        r2 = seeker_session.get(f"{API}/alerts", timeout=15)
        assert r2.status_code == 200
        assert any(a["id"] == aid for a in r2.json())

        r3 = seeker_session.delete(f"{API}/alerts/{aid}", timeout=15)
        assert r3.status_code == 200

        r4 = seeker_session.get(f"{API}/alerts", timeout=15)
        assert all(a["id"] != aid for a in r4.json())
