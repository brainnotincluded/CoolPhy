package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"coolphy-backend/internal/config"
	"coolphy-backend/pkg/db"
	"coolphy-backend/pkg/models"
	"coolphy-backend/pkg/utils"
)

type registerPayload struct {
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required,min=2"`
	Password string `json:"password" binding:"required,min=6"`
}

type loginPayload struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func RegisterHandler(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p registerPayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		hash, err := utils.HashPassword(p.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "hash error"})
			return
		}
		u := models.User{Email: p.Email, Name: p.Name, PasswordHash: hash}
		if err := db.Get().Create(&u).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "create user failed"})
			return
		}
		token, err := utils.SignJWT(cfg.JWTSecret, u.ID, u.Role, 24*time.Hour)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "jwt error"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"token": token, "user": gin.H{"id": u.ID, "email": u.Email, "name": u.Name}})
	}
}

func LoginHandler(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var p loginPayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var u models.User
		if err := db.Get().Where("email = ?", p.Email).First(&u).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "query error"})
			return
		}
		if !utils.CheckPassword(u.PasswordHash, p.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		token, err := utils.SignJWT(cfg.JWTSecret, u.ID, u.Role, 24*time.Hour)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "jwt error"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": token, "user": gin.H{"id": u.ID, "email": u.Email, "name": u.Name}})
	}
}

func Profile() gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, _ := c.Get("userID")
		var u models.User
		if err := db.Get().First(&u, uid).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"id": u.ID, "email": u.Email, "name": u.Name, "role": u.Role, "points": u.Points})
	}
}

// List endpoints
func ListLectures() gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []models.Lecture
		if err := db.Get().Limit(50).Order("id desc").Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, items)
	}
}

func ListTasks() gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []models.Task
		if err := db.Get().Limit(50).Order("id desc").Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, items)
	}
}

func ListTopics() gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []models.Topic
		if err := db.Get().Order("order_index asc, id asc").Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, items)
	}
}

// Admin create endpoints (simplified)
func CreateLecture() gin.HandlerFunc {
	return func(c *gin.Context) {
		var in models.Lecture
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Get().Create(&in).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}
		c.JSON(http.StatusCreated, in)
	}
}

func CreateTask() gin.HandlerFunc {
	return func(c *gin.Context) {
		var in models.Task
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Get().Create(&in).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}
		c.JSON(http.StatusCreated, in)
	}
}

func CreateTopic() gin.HandlerFunc {
	return func(c *gin.Context) {
		var in models.Topic
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Get().Create(&in).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}
		c.JSON(http.StatusCreated, in)
	}
}
