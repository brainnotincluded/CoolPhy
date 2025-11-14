package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"coolphy-backend/internal/config"
	"coolphy-backend/pkg/api/handlers"
	"coolphy-backend/pkg/api/middleware"
)

func Register(r *gin.Engine, cfg config.Config) {
	// Middlewares
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg.CORSAllowedOrigins))
	r.Use(middleware.RateLimiter(cfg.RateLimit))

	// Health
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })

	api := r.Group("/api/v1")
	{
		api.POST("/auth/register", handlers.RegisterHandler(cfg))
		api.POST("/auth/login", handlers.LoginHandler(cfg))
		api.POST("/auth/logout", handlers.Logout())
		api.POST("/password/reset", handlers.PasswordReset())
		api.GET("/ping", handlers.Ping())

		api.GET("/lectures", handlers.ListLectures())
		api.GET("/lectures/:id", handlers.GetLecture())
		api.GET("/videos/:id/stream", handlers.StreamVideo(cfg))
		api.GET("/tasks", handlers.ListTasks())
		api.GET("/tasks/:id", handlers.GetTask())
		api.GET("/topics", handlers.ListTopics())
		api.GET("/topics/:id", handlers.GetTopic())
		api.GET("/topics/tree", handlers.GetTopicsTree())

		// Protected routes
		auth := api.Group("")
		auth.Use(middleware.Auth(cfg))
		{
			// Profile
			auth.GET("/profile", handlers.Profile())
			auth.PUT("/profile", handlers.UpdateProfile())
			auth.GET("/profile/stats", handlers.ProfileStats())
			auth.POST("/password/change", handlers.ChangePassword())
			// Solutions
			auth.POST("/tasks/:id/solve", handlers.SolveTask())
			auth.GET("/tasks/:id/solutions", handlers.GetTaskSolutions())
			auth.PUT("/tasks/:id/status", handlers.UpdateTaskStatus())
			auth.GET("/solutions", handlers.ListSolutions())
			auth.GET("/solutions/:id", handlers.GetSolution())
			auth.PUT("/solutions/:id", handlers.UpdateSolution())
			auth.DELETE("/solutions/:id", handlers.DeleteSolution())
			// Lectures
			auth.POST("/lectures/:id/complete", handlers.CompleteLecture())
			// Notes
			auth.GET("/lectures/:id/notes", handlers.GetLectureNotes())
			auth.POST("/lectures/:id/notes", handlers.CreateLectureNote())
			// Notifications
			auth.GET("/notifications", handlers.ListNotifications())
			auth.PUT("/notifications/:id/read", handlers.MarkNotificationRead())
			// Professor Chat (with AI)
			auth.POST("/professor-chat", handlers.ProfessorChatWithAI())
			auth.GET("/professor-chat/history", handlers.ChatHistory())
			auth.GET("/professor-chat/:id", handlers.GetChatMessage())
			// Achievements
			auth.GET("/achievements", handlers.Achievements())
			// History
			auth.GET("/history/tasks", handlers.TaskHistory())
			auth.GET("/history/lectures", handlers.LectureHistory())
			auth.GET("/history/profile", handlers.ProfileHistory())
			// Admin
			admin := auth.Group("/admin")
			admin.Use(middleware.RBAC("admin"))
			{
				// Admin dashboard
				admin.GET("", handlers.AdminDashboard())
				admin.GET("/logs", handlers.AdminLogs())
				admin.GET("/lectures", handlers.AdminLectures())
				admin.GET("/tasks", handlers.AdminTasks())
				admin.GET("/topics", handlers.AdminTopics())
				// Admin CRUD
				admin.POST("/lectures", handlers.CreateLecture())
				admin.POST("/videos", handlers.UploadVideo(cfg))
				admin.POST("/tasks", handlers.CreateTask())
				admin.POST("/topics", handlers.CreateTopic())
				// Admin update/delete
				admin.PUT("/lectures/:id", handlers.UpdateLecture())
				admin.DELETE("/lectures/:id", handlers.DeleteLecture())
				admin.PUT("/tasks/:id", handlers.UpdateTask())
				admin.DELETE("/tasks/:id", handlers.DeleteTask())
				admin.PUT("/topics/:id", handlers.UpdateTopic())
				admin.DELETE("/topics/:id", handlers.DeleteTopic())
				// Admin user management
				admin.GET("/users", handlers.ListUsers())
				admin.GET("/users/:id", handlers.GetUser())
				admin.PUT("/users/:id", handlers.UpdateUser())
				admin.DELETE("/users/:id", handlers.DeleteUser())
				// Admin AI settings
				admin.GET("/settings", handlers.GetSettings())
				admin.PUT("/settings", handlers.UpdateSettings())
			}
		}
		// Leaderboard (public)
		api.GET("/leaderboard", handlers.Leaderboard())
	}
}
