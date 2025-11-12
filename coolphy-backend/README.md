# CoolPhy Backend

Minimal Go backend scaffold following the BackEndGoDev.md plan:
- Gin HTTP server with CORS, logging, rate limiting
- PostgreSQL via GORM; models for users, lectures, tasks, topics, solution attempts, notes, chat messages, notifications
- JWT auth and RBAC middleware
- Basic endpoints: health, auth/register, auth/login, list for lectures/tasks/topics, protected profile; simple admin creates

Quick start
1) Copy .env.example to .env and adjust values
2) Start Postgres via Docker:
   docker compose up -d
3) Run the server:
   go run ./cmd/server

API
- GET /health
- POST /api/v1/auth/register {email,name,password}
- POST /api/v1/auth/login {email,password}
- GET /api/v1/lectures
- GET /api/v1/tasks
- GET /api/v1/topics
- GET /api/v1/profile (Authorization: Bearer <token>)
- Admin (Bearer token with role=admin):
  - POST /api/v1/admin/lectures
  - POST /api/v1/admin/tasks
  - POST /api/v1/admin/topics

Notes
- Models use GORM with Postgres-specific types (text[], jsonb)
- AutoMigrate runs on startup
- Adjust rate limit via RATE_LIMIT env (e.g., 100-M)
