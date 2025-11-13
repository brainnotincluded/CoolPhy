package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	ginSwagger "github.com/swaggo/gin-swagger"
	swaggerFiles "github.com/swaggo/files"

	"coolphy-backend/internal/config"
	"coolphy-backend/pkg/api/routes"
	"coolphy-backend/pkg/db"
	"coolphy-backend/docs"
)

// @title           CoolPhy API
// @version         1.0
// @description     Backend API for educational platform (lectures, tasks, topics, auth)
// @BasePath        /api/v1
// @schemes         http
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	cfg := config.Load()

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	if err := db.Connect(cfg); err != nil {
		log.Fatalf("db connect failed: %v", err)
	}

	// Swagger metadata
	docs.SwaggerInfo.BasePath = "/api/v1"

	r := gin.New()
	// Swagger route
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	routes.Register(r, cfg)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("server listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
