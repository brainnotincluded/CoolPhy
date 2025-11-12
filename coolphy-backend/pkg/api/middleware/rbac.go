package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RBAC ensures the user has at least one of the required roles
func RBAC(roles ...string) gin.HandlerFunc {
	roleSet := map[string]struct{}{}
	for _, r := range roles {
		roleSet[r] = struct{}{}
	}
	return func(c *gin.Context) {
		val, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no role in context"})
			return
		}
		userRole, _ := val.(string)
		if _, ok := roleSet[userRole]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient role"})
			return
		}
		c.Next()
	}
}
