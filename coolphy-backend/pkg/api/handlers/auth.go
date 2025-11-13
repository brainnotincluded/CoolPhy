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

// RegisterHandler godoc
// @Summary      Register a new user
// @Description  Create a user and return JWT token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        payload  body      registerPayload  true  "Register payload"
// @Success      201      {object}  map[string]interface{}
// @Failure      400      {object}  map[string]interface{}
// @Router       /auth/register [post]
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

// LoginHandler godoc
// @Summary      Login
// @Description  Returns JWT token for valid credentials
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        payload  body      loginPayload  true  "Login payload"
// @Success      200      {object}  map[string]interface{}
// @Failure      401      {object}  map[string]interface{}
// @Router       /auth/login [post]
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

// Profile godoc
// @Summary      Get profile
// @Tags         profile
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /profile [get]
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

// ListLectures godoc
// @Summary      List lectures
// @Tags         lectures
// @Produce      json
// @Success      200  {array}   models.Lecture
// @Router       /lectures [get]
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

// ListTasks godoc
// @Summary      List tasks
// @Tags         tasks
// @Produce      json
// @Success      200  {array}   models.Task
// @Router       /tasks [get]
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

// ListTopics godoc
// @Summary      List topics
// @Tags         topics
// @Produce      json
// @Success      200  {array}   models.Topic
// @Router       /topics [get]
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

// CreateLecture godoc
// @Summary      Create lecture
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        lecture  body      models.Lecture  true  "Lecture"
// @Success      201      {object}  models.Lecture
// @Router       /admin/lectures [post]
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

// CreateTask godoc
// @Summary      Create task
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        task  body      models.Task  true  "Task"
// @Success      201   {object}  models.Task
// @Router       /admin/tasks [post]
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

// CreateTopic godoc
// @Summary      Create topic
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        topic  body      models.Topic  true  "Topic"
// @Success      201    {object}  models.Topic
// @Router       /admin/topics [post]
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
