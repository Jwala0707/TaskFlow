# TaskFlow

A focused task and project management tool. Create projects, add tasks, drag to reorder, and track progress across three statuses.

**Stack:** Python + Flask · React + TypeScript · SQLite (dev) / PostgreSQL (prod) · TailwindCSS

---

## Quick Start

### Backend

**PowerShell (Windows):**
```powershell
cd taskflow\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py
# API available at http://localhost:5000
```

**bash/macOS/Linux:**
```bash
cd taskflow/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

### Frontend

**PowerShell (Windows):**
```powershell
cd taskflow\frontend
npm install
npm run dev
# UI available at http://localhost:5173
```

### Run Tests

**PowerShell (Windows):**
```powershell
# Backend
cd taskflow\backend
.venv\Scripts\activate
pytest -v

# Frontend
cd taskflow\frontend
npm test
```

---

## Architecture

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # App factory, extension init
│   │   ├── config.py         # Environment-based config
│   │   ├── models.py         # SQLAlchemy domain models
│   │   ├── schemas.py        # Marshmallow input validation
│   │   ├── errors.py         # Centralised error handlers
│   │   └── routes/           # Thin route handlers
│   │       ├── auth.py
│   │       ├── projects.py
│   │       ├── tasks.py
│   │       └── health.py
│   └── tests/                # pytest test suite
└── frontend/
    └── src/
        ├── types.ts           # Shared TypeScript types
        ├── lib/api.ts         # Axios instance + interceptors
        ├── store/authStore.ts # Zustand auth state
        ├── hooks/             # React Query data hooks
        ├── components/        # Reusable UI components
        └── pages/             # Route-level page components
```

---

## Key Technical Decisions

### 1. App Factory Pattern (Backend)
`create_app()` accepts a config name, making it trivial to spin up a test app with an in-memory SQLite database. Extensions are initialised inside the factory, preventing circular imports.

### 2. Schema-First Validation
All HTTP input passes through Marshmallow schemas before touching the database. Invalid input raises `ValidationError`, which the central error handler converts to a 422 response with field-level detail. Route handlers never call `request.json` directly.

### 3. Ownership Checks via Helper Functions
`_owned_project()` and `_assert_project_access()` centralise the "fetch + verify ownership" pattern. Adding a new route that touches a project calls one of these helpers — the check cannot be forgotten.

### 4. React Query for Server State
All API data lives in React Query's cache. Components never manage their own fetch state. Mutations invalidate the relevant query keys, keeping the UI consistent without manual synchronisation.

### 5. Optimistic Updates for Reordering
Drag-and-drop reorder applies the new order to the cache immediately, then confirms with the server. On failure, the previous order is restored. This makes the UI feel instant.

### 6. Enum Constraints at Two Layers
`TaskStatus` and `TaskPriority` are Python enums used in both the SQLAlchemy column definition (database-level CHECK constraint) and the Marshmallow schema (API-level validation). Invalid values are rejected before they reach the database.

### 7. JWT in localStorage via Zustand Persist
Tokens are stored in `localStorage` through Zustand's persist middleware. The Axios interceptor reads the token on every request. A 401 response clears auth state and redirects to login automatically.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project + tasks |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/tasks/project/:id` | List tasks (filterable) |
| POST | `/api/tasks/project/:id` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PUT | `/api/tasks/project/:id/reorder` | Reorder tasks |
| GET | `/health` | Health check |

---

## Risks and Tradeoffs

| Area | Decision | Tradeoff |
|------|----------|----------|
| Auth | JWT in localStorage | Simpler than httpOnly cookies; vulnerable to XSS — mitigated by no inline scripts and strict CSP in production |
| Database | SQLite in dev | Zero-config setup; swap `DATABASE_URL` for PostgreSQL in production |
| Ownership model | Single owner per project | Simple and safe; multi-user collaboration would require a membership table |
| Token refresh | Manual refresh endpoint | Client must handle expiry; a silent refresh interceptor would improve UX |
| Migrations | Flask-Migrate included | `flask db migrate` must be run manually after model changes |

---

## Extension Approach

**Add collaborators:** Introduce a `ProjectMember` join table. Update `_assert_project_access` to check membership. No route changes needed.

**Add comments on tasks:** New `Comment` model with FK to `Task`. New `/api/tasks/:id/comments` blueprint. Existing task routes unchanged.

**Add due-date notifications:** A background worker (Celery + Redis) queries tasks where `due_date < now + 24h` and sends emails. Zero impact on the API layer.

**Switch to PostgreSQL:** Change `DATABASE_URL` in `.env`. Run `flask db upgrade`. Done.

---

## AI Usage

This project was built with AI assistance (Kiro). The `agents.md` file at the repo root constrained the AI to:
- Use schema validation on all inputs
- Return consistent error envelopes
- Keep route handlers thin
- Write tests for every endpoint
- Avoid speculative abstractions

All generated code was reviewed for correctness, security, and adherence to the patterns above.
