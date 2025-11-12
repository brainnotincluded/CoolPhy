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
		api.GET("/tasks", handlers.ListTasks())
		api.GET("/topics", handlers.ListTopics())

		// Protected routes
		auth := api.Group("")
		auth.Use(middleware.Auth(cfg))
		{
			auth.GET("/profile", handlers.Profile())
			// Admin examples
			admin := auth.Group("/admin")
			admin.Use(middleware.RBAC("admin"))
			{
				admin.POST("/lectures", handlers.CreateLecture())
				admin.POST("/tasks", handlers.CreateTask())
				admin.POST("/topics", handlers.CreateTopic())
			}
		}
	}
}
