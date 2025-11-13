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

		api.GET("/lectures", handlers.ListLectures())
		api.GET("/lectures/:id", handlers.GetLecture())
		api.GET("/tasks", handlers.ListTasks())
		api.GET("/tasks/:id", handlers.GetTask())
		api.GET("/topics", handlers.ListTopics())
		api.GET("/topics/:id", handlers.GetTopic())

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
			auth.GET("/solutions", handlers.ListSolutions())
			// Notes
			auth.GET("/lectures/:id/notes", handlers.GetLectureNotes())
			auth.POST("/lectures/:id/notes", handlers.CreateLectureNote())
			// Notifications
			auth.GET("/notifications", handlers.ListNotifications())
			auth.PUT("/notifications/:id/read", handlers.MarkNotificationRead())
			// Admin
			admin := auth.Group("/admin")
			admin.Use(middleware.RBAC("admin"))
			{
				admin.POST("/lectures", handlers.CreateLecture())
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
			}
		}
	}
}
