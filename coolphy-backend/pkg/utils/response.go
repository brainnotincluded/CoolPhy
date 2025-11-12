package utils

import "github.com/gin-gonic/gin"

type ErrorResponse struct {
	Error   string      `json:"error"`
	Details interface{} `json:"details,omitempty"`
}

type OKResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func JSON(c *gin.Context, code int, payload interface{}) {
	c.JSON(code, payload)
}

func Fail(c *gin.Context, code int, msg string, details interface{}) {
	c.JSON(code, ErrorResponse{Error: msg, Details: details})
}

func Ok(c *gin.Context, data interface{}) {
	c.JSON(200, data)
}
