package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

func CORS(allowedOrigins string) gin.HandlerFunc {
	cfg := cors.DefaultConfig()
	if allowedOrigins == "*" || allowedOrigins == "" {
		cfg.AllowAllOrigins = true
	} else {
		cfg.AllowOrigins = strings.Split(allowedOrigins, ",")
	}
	cfg.AllowCredentials = true
	cfg.AllowHeaders = []string{"Authorization", "Content-Type"}
	cfg.ExposeHeaders = []string{"Content-Length"}
	cfg.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	return cors.New(cfg)
}
