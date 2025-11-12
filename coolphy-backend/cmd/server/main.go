package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"

	"coolphy-backend/internal/config"
	"coolphy-backend/pkg/api/routes"
	"coolphy-backend/pkg/db"
)

func main() {
	cfg := config.Load()

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	if err := db.Connect(cfg); err != nil {
		log.Fatalf("db connect failed: %v", err)
	}

	r := gin.New()
	routes.Register(r, cfg)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("server listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
