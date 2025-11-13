# API Endpoints List for Backend Developer

## Authentication & Profile
POST /api/register — user registration
POST /api/login — user login, returns access token
POST /api/logout — user logout
POST /api/password/reset — password recovery
POST /api/password/change — change password
GET /api/profile — get user profile and stats
PUT /api/profile — update profile
GET /api/profile/stats — user progress, points, analytics

## Users (admin)
GET /api/users — list all users
GET /api/users/{id} — view user profile
PUT /api/users/{id} — edit profile (admin access)
DELETE /api/users/{id} — delete user

## Lectures
GET /api/lectures — lectures catalog, filters, search
POST /api/lectures — create lecture (admin)
GET /api/lectures/{id} — view lecture
PUT /api/lectures/{id} — edit lecture
DELETE /api/lectures/{id} — delete lecture
POST /api/lectures/{id}/complete — mark as studied
GET /api/lectures/{id}/notes — get all user notes for lecture
POST /api/lectures/{id}/notes — add note for lecture
POST /api/admin/videos — upload lecture video (multipart/form-data, field `file`)
GET /api/videos/{id}/stream — stream uploaded lecture video

## Problems/Tasks
GET /api/tasks — problem/task catalog, filtering, search
POST /api/tasks — create (admin)
GET /api/tasks/{id} — view problem/task
PUT /api/tasks/{id} — edit problem/task
DELETE /api/tasks/{id} — delete problem/task
POST /api/tasks/{id}/solve — submit solution attempt
GET /api/tasks/{id}/solutions — get solution history for problem
PUT /api/tasks/{id}/status — update problem/task status

## Solution Attempts
GET /api/solutions — all user solution attempts
GET /api/solutions/{id} — view solution attempt
PUT /api/solutions/{id} — update solution attempt
DELETE /api/solutions/{id} — delete solution attempt

## Topics & Structure
GET /api/topics — list all topics
GET /api/topics/tree — topics tree
GET /api/topics/{id} — topic overview, connected problems/lectures
POST /api/topics — create topic (admin)
PUT /api/topics/{id} — edit topic
DELETE /api/topics/{id} — delete topic

## LLM-Chat (“Professor”)
POST /api/professor-chat — ask AI professor
GET /api/professor-chat/history — chat history
GET /api/professor-chat/{id} — view specific chat

## Notifications
GET /api/notifications — all user notifications
PUT /api/notifications/{id}/read — mark as read

## History & Statistics
GET /api/history/tasks — user problem/task history
GET /api/history/lectures — user lecture history
GET /api/history/profile — total activity log

## Leaderboard & Achievements
GET /api/leaderboard — leaderboard, user ranking
GET /api/achievements — user achievements/badges

## Admin Panel
GET /api/admin — admin dashboard
GET /api/admin/logs — view logs
GET /api/admin/lectures — lectures for admin
GET /api/admin/tasks — problems/tasks for admin
GET /api/admin/topics — topics for admin
PUT/POST /api/admin/* — manage platform entities via admin panel

## Technical
GET /api/ping — server status
