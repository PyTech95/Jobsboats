# Jobsboats — Product Requirements (Living)

## Original Problem Statement
Design a modern, responsive landing page and core screens for a job search and recruitment platform called "Jobsboats" — connecting job seekers and employers, aggregating jobs from multiple boards and company sites, and offering premium services (verification, profile highlight, immigration advisory). Theme: navigation & boats. Style: clean, tech-forward, friendly. Colors: navy/teal gradient + bright accent. Must include responsive mobile-first marketing pages (Home, For Job Seekers, For Employers, Services, About) and functional dashboards with smart filters, job detail side panel, candidate Kanban pipeline.

## Personas
- **Job Seeker (Maya)** — wants relevant roles, smart alerts, applications & saved jobs in one place.
- **Employer / Recruiter (Daniel)** — wants to post jobs in <3 mins and move candidates through a clean pipeline.

## Core Requirements (locked)
- Stack: FastAPI + React + MongoDB (UUID ids, JWT cookie auth)
- Mobile-first responsive design (Tailwind, shadcn/ui)
- Navy/Teal palette: `#0B1528`, `#00B4D8`; coral accent `#FF5959`
- Fonts: Cabinet Grotesk + Manrope + JetBrains Mono
- `data-testid` on every interactive element

## What's been implemented (Dec 2025)
- Backend (`/app/backend/server.py`):
  - JWT cookie auth (register / login / me / logout / profile update)
  - Jobs CRUD with filters (q, location, type, workplace, experience, min_salary)
  - Applications + Saved jobs + Job alerts
  - Employer pipeline (stage transitions: new → shortlisted → interview → offered → hired/rejected)
  - Stats endpoint
  - Seeded 12 demo jobs + 1 seeker + 1 employer (idempotent)
  - Indexes on users.email (unique), applications + saved_jobs (unique compound)
- Frontend:
  - Marketing: Home (hero + search + how-it-works + benefits + services strip + testimonials + CTA), For Job Seekers, For Employers, Services, About
  - Jobs page (filters sidebar, chips, side-sheet job details, save/apply)
  - Auth: Login + Register (role toggle: seeker/employer) + demo credentials hint
  - Seeker Dashboard: tabs (Recommended/Saved/Applied/Alerts), profile-completion sidebar, alert creation, profile editor
  - Employer Dashboard: stats, Kanban pipeline (horizontal scroll, 5 columns), my jobs, post-a-job dialog
  - 404 page
  - Sticky transparent → blurred navbar with mobile sheet
  - Sonner toasts

## Demo credentials
See `/app/memory/test_credentials.md`.

## Backlog (P0/P1/P2)
- **P1** Real resume upload (S3 / GridFS) — currently stores filename only
- **P1** Google/LinkedIn social login (Emergent-managed)
- **P1** Stripe payment integration for premium services (Verification, Highlight, Combo Packs)
- **P1** Application detail drawer with cover note + recruiter messaging
- **P2** Job alerts background scheduler + email digests (Resend/SendGrid)
- **P2** AI-assisted candidate scoring (Claude/GPT)
- **P2** Real job aggregation (Workable / Greenhouse public boards)
- **P2** Drag-and-drop Kanban (currently stage select)
- **P2** Company branded pages
