# ResolvIt 🏙️

**ResolvIt** is a civic issue-reporting platform that empowers citizens to report local problems (potholes, broken streetlights, water leaks, etc.), track their resolution, and earn civic points for active participation. Authorities and admins manage issues through a dedicated dashboard with SLA tracking, priority scoring, and analytics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Client                      │
│              React + Vite + Leaflet + Recharts               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST (port 5173 → 80)
┌──────────────────────────▼──────────────────────────────────┐
│                    Nginx (frontend container)                 │
│          Serves static assets, proxies /api → backend        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (port 5000)
┌──────────────────────────▼──────────────────────────────────┐
│               Node.js / Express (backend container)          │
│   Auth · Issues · Reports · Users · Departments · Admin      │
│              JWT Auth · Multer uploads · Cron jobs           │
└──────────────────────────┬──────────────────────────────────┘
                           │ pg (port 5432)
┌──────────────────────────▼──────────────────────────────────┐
│              PostgreSQL 15 (postgres container)              │
│   users · issues · reports · departments · status_logs       │
│              issue_upvotes · points_ledger                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

- 📍 **Geo-tagged issue reporting** – pin issues on an interactive Leaflet map
- 🔁 **Real-time status tracking** – Open → In Progress → Resolved with full audit log
- 🤖 **Auto-prioritisation** – priority score computed from severity, upvotes, and report count
- ⚠️ **SLA enforcement** – deadline tracking with automated escalation via cron jobs
- 🗳️ **Upvoting & deduplication** – citizens upvote and add reports to existing issues
- 🏆 **Civic points & badges** – gamified leaderboard rewarding active citizens
- 📊 **Analytics dashboard** – heatmaps, escalation trends, department performance
- 🌐 **Multilingual** – i18next-powered internationalisation
- 🔐 **Role-based access control** – citizen / authority / admin roles
- 📷 **Image uploads** – attach photos to issues and reports

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, React Router 6, Vite 5, Axios         |
| Map        | React-Leaflet / Leaflet                         |
| Charts     | Recharts                                        |
| i18n       | i18next, react-i18next                          |
| Backend    | Node.js 20, Express 4                           |
| Auth       | JSON Web Tokens (jsonwebtoken), bcryptjs        |
| Uploads    | Multer                                          |
| Scheduler  | node-cron                                       |
| Database   | PostgreSQL 15                                   |
| ORM/Driver | node-postgres (pg)                              |
| Container  | Docker, Docker Compose, Nginx                   |

---

## Quick Start

### Option 1 — Docker (recommended)

**Prerequisites:** Docker ≥ 24 and Docker Compose v2.

```bash
# Clone the repository
git clone https://github.com/your-org/resolvit.git
cd resolvit

# Start all services (postgres + backend + frontend)
docker compose up --build

# The app is now available at:
#   Frontend  →  http://localhost:5173
#   Backend   →  http://localhost:5000
#   Database  →  localhost:5432  (postgres / password)
```

> The database schema and seed data are applied automatically on first run via
> `database/schema.sql` mounted into the Postgres container.

To stop and remove containers:

```bash
docker compose down
# Add -v to also remove the postgres_data volume
docker compose down -v
```

---

### Option 2 — Manual (local development)

**Prerequisites:** Node.js ≥ 20, PostgreSQL ≥ 14.

#### 1. Database

```bash
psql -U postgres -c "CREATE DATABASE resolvit;"
psql -U postgres -d resolvit -f database/schema.sql
```

#### 2. Backend

```bash
cd backend
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET, etc.
npm install
npm run dev            # starts on http://localhost:5000
```

Minimum `.env` for the backend:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/resolvit
JWT_SECRET=your_super_secret_32_char_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

---

## API Endpoints

All endpoints are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Path        | Auth | Description              |
|--------|-------------|------|--------------------------|
| POST   | `/register` | —    | Register a new user      |
| POST   | `/login`    | —    | Login and receive JWT    |
| GET    | `/me`       | ✅   | Get current user profile |

### Issues — `/api/issues`

| Method | Path              | Auth      | Description                          |
|--------|-------------------|-----------|--------------------------------------|
| GET    | `/`               | —         | List issues (filters: status, category, department) |
| POST   | `/`               | ✅ citizen | Create a new issue                   |
| GET    | `/categories`     | —         | List available issue categories      |
| GET    | `/:id`            | —         | Get a single issue by ID             |
| PUT    | `/:id`            | ✅        | Update issue (authority/admin)       |
| POST   | `/:id/upvote`     | ✅ citizen | Upvote an issue                      |

### Reports — `/api/reports`

| Method | Path               | Auth      | Description                   |
|--------|--------------------|-----------|-------------------------------|
| POST   | `/`                | ✅ citizen | Add a report to an issue      |
| GET    | `/issue/:issue_id` | —         | List all reports for an issue |

### Users — `/api/users`

| Method | Path              | Auth | Description                  |
|--------|-------------------|------|------------------------------|
| GET    | `/leaderboard`    | —    | Top citizens by civic points |
| GET    | `/profile`        | ✅   | Current user profile         |
| GET    | `/:id/points`     | —    | Points history for a user    |

### Departments — `/api/departments`

| Method | Path            | Auth     | Description                     |
|--------|-----------------|----------|---------------------------------|
| GET    | `/`             | —        | List all departments            |
| GET    | `/:id/analytics`| ✅ admin | Analytics for a department      |
| POST   | `/`             | ✅ admin | Create a department             |

### Admin — `/api/admin`

| Method | Path                      | Auth     | Description                     |
|--------|---------------------------|----------|---------------------------------|
| GET    | `/heatmap`                | ✅ admin | Issue heatmap data              |
| GET    | `/escalations`            | ✅ admin | Escalated issues list           |
| GET    | `/engagement`             | ✅ admin | Citizen engagement metrics      |
| GET    | `/departments/performance`| ✅ admin | Per-department performance stats|

---

## Database Schema

```
departments          users
───────────          ─────
id (PK)              id (PK)
name                 name
description          email
head_authority_id ──►id    role (citizen|authority|admin)
created_at           department_id ──► departments.id
                     civic_points
                     badge
                     language_preference
                     created_at

issues               issue_upvotes
──────               ─────────────
id (PK)              issue_id ──► issues.id  ┐ PK
title                user_id  ──► users.id   ┘
description          created_at
category
location_lat/lng     reports
location_address     ───────
image_url            id (PK)
status               issue_id ──► issues.id
priority_score       citizen_id ──► users.id
priority_label       description
severity_level       image_url
reporter_id ──► users.id    created_at
department_id ──► departments.id
escalation_count     status_logs
reports_count        ───────────
upvotes_count        id (PK)
is_clustered         issue_id ──► issues.id
parent_issue_id ──► issues.id   old_status / new_status
sla_deadline         changed_by ──► users.id
created_at           note
updated_at           created_at
resolved_at
                     points_ledger
                     ─────────────
                     id (PK)
                     user_id ──► users.id
                     points
                     reason
                     issue_id ──► issues.id
                     created_at
```

---

## Project Status

✅ **The project is complete.**

All features described in the [Features](#features) section are fully implemented. All frontend pages and components build successfully, and all backend routes, services, and scheduled jobs are implemented.

---

## Project Structure

```
resolvit/
├── backend/
│   ├── src/
│   │   ├── app.js            # Express app entry point
│   │   ├── config/           # DB connection config
│   │   ├── routes/           # auth, issues, reports, users, departments, admin
│   │   ├── middleware/       # JWT auth, role authorisation
│   │   ├── services/         # Business logic
│   │   └── jobs/             # Cron jobs (SLA escalation)
│   ├── uploads/              # Uploaded images (git-ignored)
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/                  # React components, pages, hooks
│   ├── nginx.conf            # Nginx config for production container
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── schema.sql            # Full PostgreSQL schema + seed data
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Contributing

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```
2. **Commit** your changes with clear messages:
   ```bash
   git commit -m "feat: add notification system"
   ```
3. **Push** to your fork and open a **Pull Request** against `main`.
4. Ensure your PR includes a description of the change and any relevant screenshots.

### Code Style

- Backend: follow existing Express patterns; use `async/await` with `next(err)` error propagation.
- Frontend: functional React components with hooks; keep components small and composable.
- SQL: use `IF NOT EXISTS` guards; add indexes for all foreign keys and frequently filtered columns.

---

## License

This project was built for the **Synaptix 2026** hackathon by team **404-Found**.
# ResolvIt Monorepo

This is the monorepo structure for ResolvIt. 

## Folder Structure
- `services/`: Contains all service applications.
- `libs/`: Contains shared libraries.
- `packages/`: Contains package.json files.

## Documentation
Documentation files will be added here.
