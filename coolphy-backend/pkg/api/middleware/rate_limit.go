package middleware

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	memory "github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimiter applies a token bucket limiter like "100-M" (100 reqs per minute)
func RateLimiter(rateStr string) gin.HandlerFunc {
	if strings.TrimSpace(rateStr) == "" {
		rateStr = "100-M"
	}
	rate, err := limiter.NewRateFromFormatted(rateStr)
	if err != nil {
		// Fallback to sane default if parse fails
		rate, _ = limiter.NewRateFromFormatted("100-M")
	}
	store := memory.NewStore()
	lim := limiter.New(store, rate)
	return func(c *gin.Context) {
		ctx, err := lim.Get(c, c.ClientIP())
		if err != nil {
			c.AbortWithStatusJSON(429, gin.H{"error": "rate limit error"})
			return
		}
		c.Header("X-RateLimit-Limit", strconv.FormatInt(int64(ctx.Limit), 10))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(int64(ctx.Remaining), 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(ctx.Reset, 10))
		if ctx.Reached {
			c.AbortWithStatusJSON(429, gin.H{"error": "too many requests"})
			return
		}
		c.Next()
	}
}
