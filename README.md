# Bug Reporting System

This workspace contains two folders: `backend` (Django REST) and `frontend` (Next.js).

Quick start (backend):

1. Create a virtualenv and install requirements:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r backend\requirements.txt
```

2.Run migrations and start server:

```powershell
cd backend; .\.venv\Scripts\Activate.ps1; python manage.py migrate; python manage.py runserver
```

Quick start (frontend):

1. Install dependencies:

```powershell
cd frontend; npm install
```

1. Run dev server:

```powershell
npm run dev
```

Notes:

- Settings use SQLite by default for quick local setup.
- JWT auth endpoints will be under `/api/auth/` once wired.
