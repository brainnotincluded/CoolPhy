package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"coolphy-backend/internal/config"
	"coolphy-backend/pkg/utils"
)

// Auth middleware validates JWT and stores user id and role in context
func Auth(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if h == "" || !strings.HasPrefix(strings.ToLower(h), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid auth header"})
			return
		}
		tok := strings.TrimSpace(h[len("Bearer "):])
		claims, err := utils.ParseJWT(cfg.JWTSecret, tok)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}
