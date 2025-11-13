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

// GetLecture godoc
// @Summary      Get lecture by ID
// @Tags         lectures
// @Produce      json
// @Param        id   path      int  true  "Lecture ID"
// @Success      200  {object}  models.Lecture
// @Failure      404  {object}  map[string]interface{}
// @Router       /lectures/{id} [get]
func GetLecture() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var item models.Lecture
		if err := db.Get().First(&item, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "lecture not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, item)
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

// GetTask godoc
// @Summary      Get task by ID
// @Tags         tasks
// @Produce      json
// @Param        id   path      int  true  "Task ID"
// @Success      200  {object}  models.Task
// @Failure      404  {object}  map[string]interface{}
// @Router       /tasks/{id} [get]
func GetTask() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var item models.Task
		if err := db.Get().First(&item, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, item)
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

// GetTopic godoc
// @Summary      Get topic by ID
// @Tags         topics
// @Produce      json
// @Param        id   path      int  true  "Topic ID"
// @Success      200  {object}  models.Topic
// @Failure      404  {object}  map[string]interface{}
// @Router       /topics/{id} [get]
func GetTopic() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var item models.Topic
		if err := db.Get().Preload("Children").First(&item, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "topic not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, item)
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

// UpdateLecture godoc
// @Summary      Update lecture
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      int             true  "Lecture ID"
// @Param        lecture  body      models.Lecture  true  "Lecture"
// @Success      200      {object}  models.Lecture
// @Router       /lectures/{id} [put]
func UpdateLecture() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var existing models.Lecture
		if err := db.Get().First(&existing, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "lecture not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		var in models.Lecture
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		in.ID = existing.ID
		if err := db.Get().Model(&existing).Updates(&in).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
		c.JSON(http.StatusOK, in)
	}
}

// DeleteLecture godoc
// @Summary      Delete lecture
// @Tags         admin
// @Security     BearerAuth
// @Param        id   path      int  true  "Lecture ID"
// @Success      204
// @Router       /lectures/{id} [delete]
func DeleteLecture() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Get().Delete(&models.Lecture{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
			return
		}
		c.Status(http.StatusNoContent)
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

// UpdateTask godoc
// @Summary      Update task
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      int          true  "Task ID"
// @Param        task  body      models.Task  true  "Task"
// @Success      200   {object}  models.Task
// @Router       /tasks/{id} [put]
func UpdateTask() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var existing models.Task
		if err := db.Get().First(&existing, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		var in models.Task
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		in.ID = existing.ID
		if err := db.Get().Model(&existing).Updates(&in).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
		c.JSON(http.StatusOK, in)
	}
}

// DeleteTask godoc
// @Summary      Delete task
// @Tags         admin
// @Security     BearerAuth
// @Param        id   path      int  true  "Task ID"
// @Success      204
// @Router       /tasks/{id} [delete]
func DeleteTask() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Get().Delete(&models.Task{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
			return
		}
		c.Status(http.StatusNoContent)
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

// UpdateTopic godoc
// @Summary      Update topic
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id     path      int           true  "Topic ID"
// @Param        topic  body      models.Topic  true  "Topic"
// @Success      200    {object}  models.Topic
// @Router       /topics/{id} [put]
func UpdateTopic() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var existing models.Topic
		if err := db.Get().First(&existing, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "topic not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		var in models.Topic
		if err := c.ShouldBindJSON(&in); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		in.ID = existing.ID
		if err := db.Get().Model(&existing).Updates(&in).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
		c.JSON(http.StatusOK, in)
	}
}

// DeleteTopic godoc
// @Summary      Delete topic
// @Tags         admin
// @Security     BearerAuth
// @Param        id   path      int  true  "Topic ID"
// @Success      204
// @Router       /topics/{id} [delete]
func DeleteTopic() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Get().Delete(&models.Topic{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// Solutions

type solvePayload struct {
	Answer       string `json:"answer" binding:"required"`
	SolutionText string `json:"solution_text"`
	TimeSpent    int    `json:"time_spent"`
}

// SolveTask godoc
// @Summary      Submit solution attempt for task
// @Tags         solutions
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      int           true  "Task ID"
// @Param        payload  body      solvePayload  true  "Solution"
// @Success      201      {object}  models.SolutionAttempt
// @Router       /tasks/{id}/solve [post]
func SolveTask() gin.HandlerFunc {
	return func(c *gin.Context) {
		taskID := c.Param("id")
		userID, _ := c.Get("userID")
		var p solvePayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Verify task exists
		var task models.Task
		if err := db.Get().First(&task, taskID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		attempt := models.SolutionAttempt{
			UserID:       userID.(uint),
			TaskID:       task.ID,
			Answer:       p.Answer,
			SolutionText: p.SolutionText,
			TimeSpent:    p.TimeSpent,
			Status:       "pending",
		}
		if err := db.Get().Create(&attempt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}
		c.JSON(http.StatusCreated, attempt)
	}
}

// GetTaskSolutions godoc
// @Summary      Get solution history for task
// @Tags         solutions
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      int  true  "Task ID"
// @Success      200  {array}   models.SolutionAttempt
// @Router       /tasks/{id}/solutions [get]
func GetTaskSolutions() gin.HandlerFunc {
	return func(c *gin.Context) {
		taskID := c.Param("id")
		userID, _ := c.Get("userID")
		var attempts []models.SolutionAttempt
		if err := db.Get().Where("task_id = ? AND user_id = ?", taskID, userID).Order("created_at desc").Find(&attempts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, attempts)
	}
}

// ListSolutions godoc
// @Summary      Get all user's solution attempts
// @Tags         solutions
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.SolutionAttempt
// @Router       /solutions [get]
func ListSolutions() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var attempts []models.SolutionAttempt
		if err := db.Get().Where("user_id = ?", userID).Order("created_at desc").Limit(100).Find(&attempts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, attempts)
	}
}

// Notes

type notePayload struct {
	Content string `json:"content" binding:"required"`
}

// GetLectureNotes godoc
// @Summary      Get user notes for lecture
// @Tags         notes
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      int  true  "Lecture ID"
// @Success      200  {array}   models.Note
// @Router       /lectures/{id}/notes [get]
func GetLectureNotes() gin.HandlerFunc {
	return func(c *gin.Context) {
		lectureID := c.Param("id")
		userID, _ := c.Get("userID")
		var notes []models.Note
		if err := db.Get().Where("lecture_id = ? AND user_id = ?", lectureID, userID).Order("created_at desc").Find(&notes).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, notes)
	}
}

// CreateLectureNote godoc
// @Summary      Add note for lecture
// @Tags         notes
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      int          true  "Lecture ID"
// @Param        payload  body      notePayload  true  "Note"
// @Success      201      {object}  models.Note
// @Router       /lectures/{id}/notes [post]
func CreateLectureNote() gin.HandlerFunc {
	return func(c *gin.Context) {
		lectureID := c.Param("id")
		userID, _ := c.Get("userID")
		var p notePayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Verify lecture exists
		var lecture models.Lecture
		if err := db.Get().First(&lecture, lectureID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "lecture not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		note := models.Note{
			UserID:    userID.(uint),
			LectureID: lecture.ID,
			Content:   p.Content,
		}
		if err := db.Get().Create(&note).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}
		c.JSON(http.StatusCreated, note)
	}
}
