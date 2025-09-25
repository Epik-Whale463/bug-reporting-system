# Bug Reporting System

A full-stack bug reporting system built with Django REST Framework (backend) and Next.js (frontend). This application allows users to create projects, report and track issues, manage issue status and assignments through a modern web interface.

## Features

- User authentication with JWT tokens
- Project management (create, list projects)
- Issue tracking with status and priority management
- Comment system with nested replies
- Role-based permissions (Admin, Project Manager, Developer, Tester, Guest)
- Real-time filtering and search capabilities
- Responsive web interface with modern UI
- RESTful API with comprehensive documentation
- Docker containerization for easy deployment
- Unit tests for both backend and frontend

## Architecture

### Backend (Django REST Framework)

- **Models**: User (Django built-in), UserProfile, Project, Issue, Comment
- **Authentication**: JWT-based authentication with refresh tokens
- **API**: RESTful API with nested routes for hierarchical resources
- **Database**: PostgreSQL with optimized queries using select_related/prefetch_related
- **Documentation**: Auto-generated Swagger/OpenAPI documentation

### Frontend (Next.js)

- **Framework**: Next.js with React 18
- **Styling**: Tailwind CSS with custom components
- **State Management**: React hooks with local state
- **API Integration**: Axios with JWT interceptors
- **Routing**: Next.js file-based routing

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL (for local development)

### Docker Deployment (Recommended)

1. Clone the repository:

```bash
git clone https://github.com/Epik-Whale463/bug-reporting-system.git
cd bug-reporting-system
```

2. Start the application:

```bash
docker-compose up -d
```

3. Access the application:

- Frontend: http://localhost
- Backend API: http://localhost/api
- API Documentation: http://localhost/api/docs

### To keep the application running after terminal closes:

```bash
# Use detached mode
docker-compose up -d

# Or use nohup (Linux/Unix)
nohup docker-compose up &

# Or use screen/tmux sessions
screen -S bugtracker
docker-compose up
# Press Ctrl+A then D to detach
```

## Local Development Setup

### Backend Setup

1. Navigate to backend directory:

```powershell
cd backend
```

2. Create virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Setup environment variables:

```powershell
# Create .env file
DATABASE_URL=postgresql://postgres:password@localhost:5432/bugtracker
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

5. Run migrations:

```powershell
python manage.py migrate
python manage.py createsuperuser
```

6. Start development server:
```powershell
python manage.py runserver
```

### Frontend Setup

1. Navigate to frontend directory:
```powershell
cd frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Setup environment variables:
```powershell
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. Start development server:
```powershell
npm run dev
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - User login (returns JWT tokens)
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/user/` - Get current user info

### Project Endpoints
- `GET /api/projects/` - List all projects
- `POST /api/projects/` - Create new project
- `GET /api/projects/{id}/` - Get project details
- `PUT /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Delete project

### Issue Endpoints
- `GET /api/projects/{project_id}/issues/` - List issues in project
- `POST /api/projects/{project_id}/issues/` - Create issue in project
- `GET /api/issues/{id}/` - Get issue details
- `PATCH /api/issues/{id}/` - Update issue (status, assignee, etc.)
- `DELETE /api/issues/{id}/` - Delete issue

### Comment Endpoints
- `GET /api/issues/{issue_id}/comments/` - List comments for issue
- `POST /api/issues/{issue_id}/comments/` - Add comment to issue
- `GET /api/comments/{id}/` - Get comment details
- `PUT /api/comments/{id}/` - Update comment
- `DELETE /api/comments/{id}/` - Delete comment

### User Management
- `GET /api/users/` - List users (with pagination)
- `GET /api/users/{id}/` - Get user details

## Database Schema

### User Profile
- Extends Django's built-in User model
- Roles: Admin, Project Manager, Developer, Tester, Guest
- Permissions: can_create_projects, can_delete_issues, can_assign_issues

### Project
- Fields: name, description, created_at, owner
- Relationships: One-to-many with Issues

### Issue
- Fields: title, description, status, priority, created_at, updated_at
- Status: open, in_progress, closed
- Priority: low, medium, high, critical
- Relationships: Many-to-one with Project, User (reporter, assignee)

### Comment
- Fields: content, created_at
- Relationships: Many-to-one with Issue, User (author)
- Supports nested replies with parent_comment field

## Testing

### Backend Tests
```powershell
cd backend
python manage.py test
```

### Frontend Tests
```powershell
cd frontend
npm test
```

### API Testing
Use the provided smoke test script:
```powershell
python scripts\smoke_issue_test.py
```

## Deployment

### Production Environment Variables

Backend (.env):
```
DATABASE_URL=postgresql://user:password@host:port/dbname
DEBUG=False
SECRET_KEY=production-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

Frontend (.env.production):
```
NEXT_PUBLIC_API_URL=/api
NODE_ENV=production
```

### Docker Production
The included docker-compose.yml is production-ready with:
- Nginx reverse proxy
- PostgreSQL database with persistent volumes
- Gunicorn WSGI server for Django
- Next.js optimized build
- SSL/HTTPS support (configure nginx.prod.conf)

## Security Features

- JWT authentication with access and refresh tokens
- Role-based access control (RBAC)
- CORS protection
- SQL injection prevention through Django ORM
- XSS protection through React's built-in escaping
- CSRF protection for API endpoints
- Environment-based configuration management

## Performance Optimizations

- Database query optimization with select_related/prefetch_related
- Frontend code splitting with Next.js
- Static file serving with Nginx
- Image optimization and compression
- API response caching headers
- Pagination for large datasets

## Monitoring and Health Checks

- Health check endpoint: `GET /health/`
- API endpoint monitoring: `GET /api/health/`
- Docker container health checks
- Application logging with structured format

## Project Structure

```
bug-reporting-system/
├── backend/                 # Django REST Framework API
│   ├── api/                # Main API application
│   │   ├── models.py       # Database models
│   │   ├── serializers.py  # API serializers
│   │   ├── views.py        # API views
│   │   └── urls.py         # API routing
│   ├── backend/            # Django project settings
│   ├── manage.py           # Django management script
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Next.js pages
│   │   └── lib/            # Utility functions
│   ├── package.json        # Node.js dependencies
│   └── next.config.js      # Next.js configuration
├── scripts/                # Utility scripts
├── docker-compose.yml      # Docker composition
├── nginx.conf              # Nginx configuration
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Commit changes: `git commit -am 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/api/docs/`
- Review the test files for usage examples