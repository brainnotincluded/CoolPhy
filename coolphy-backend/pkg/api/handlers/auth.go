package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
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

		c.JSON(http.StatusOK, gin.H{
			"id":       u.ID,
			"email":    u.Email,
			"name":     u.Name,
			"role":     u.Role,
			"points":   u.Points,
			"subjects": u.Subjects,
			"settings": u.Settings,
		})
	}
}

type updateProfilePayload struct {
	Name     string   `json:"name"`
	Subjects []string `json:"subjects"`
	Settings struct {
		Language string `json:"language"`
	} `json:"settings"`
}

// UpdateProfile godoc
// @Summary      Update profile
// @Tags         profile
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        payload  body      updateProfilePayload  true  "Profile data"
// @Success      200      {object}  map[string]interface{}
// @Router       /profile [put]
func UpdateProfile() gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, _ := c.Get("userID")
		var p updateProfilePayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var u models.User
		if err := db.Get().First(&u, uid).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		if p.Name != "" {
			u.Name = p.Name
		}
		if p.Subjects != nil {
			u.Subjects = p.Subjects
		}

		// Update language setting if provided
		if p.Settings.Language != "" {
			settings := map[string]interface{}{}
			if len(u.Settings) > 0 {
				if err := json.Unmarshal(u.Settings, &settings); err != nil {
					// If existing settings are invalid, reset to empty map
					settings = map[string]interface{}{}
				}
			}
			settings["language"] = p.Settings.Language
			if b, err := json.Marshal(settings); err == nil {
				u.Settings = datatypes.JSON(b)
			} else {
				fmt.Println("failed to marshal user settings:", err)
			}
		}

		if err := db.Get().Save(&u).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"id":       u.ID,
			"email":    u.Email,
			"name":     u.Name,
			"subjects": u.Subjects,
			"settings": u.Settings,
		})
	}
}

// ProfileStats godoc
// @Summary      Get profile statistics
// @Tags         profile
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /profile/stats [get]
func ProfileStats() gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, _ := c.Get("userID")
		var u models.User
		if err := db.Get().First(&u, uid).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		var solvedCount int64
		db.Get().Model(&models.SolutionAttempt{}).Where("user_id = ? AND status = ?", uid, "correct").Count(&solvedCount)
		var totalAttempts int64
		db.Get().Model(&models.SolutionAttempt{}).Where("user_id = ?", uid).Count(&totalAttempts)
		c.JSON(http.StatusOK, gin.H{
			"points":         u.Points,
			"solved_count":   solvedCount,
			"total_attempts": totalAttempts,
			"subjects":       u.Subjects,
		})
	}
}

type changePasswordPayload struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// ChangePassword godoc
// @Summary      Change password
// @Tags         profile
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        payload  body      changePasswordPayload  true  "Passwords"
// @Success      200      {object}  map[string]interface{}
// @Router       /password/change [post]
func ChangePassword() gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, _ := c.Get("userID")
		var p changePasswordPayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var u models.User
		if err := db.Get().First(&u, uid).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		if !utils.CheckPassword(u.PasswordHash, p.OldPassword) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "incorrect old password"})
			return
		}
		hash, err := utils.HashPassword(p.NewPassword)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "hash error"})
			return
		}
		u.PasswordHash = hash
		if err := db.Get().Save(&u).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "password changed"})
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
		if err := db.Get().Preload("VideoAsset").Limit(50).Order("id desc").Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		for i := range items {
			attachVideoAssetURL(&items[i])
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
		if err := db.Get().Preload("VideoAsset").First(&item, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "lecture not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		attachVideoAssetURL(&item)
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
		if err := db.Get().Preload("VideoAsset").First(&in, in.ID).Error; err == nil {
			attachVideoAssetURL(&in)
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
		if err := db.Get().Preload("VideoAsset").First(&existing, id).Error; err == nil {
			attachVideoAssetURL(&existing)
		}
		c.JSON(http.StatusOK, existing)
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

// Admin User Management

// ListUsers godoc
// @Summary      List all users (admin)
// @Tags         admin
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.User
// @Router       /users [get]
func ListUsers() gin.HandlerFunc {
	return func(c *gin.Context) {
		var users []models.User
		if err := db.Get().Select("id, email, name, role, points, created_at").Limit(100).Order("created_at desc").Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, users)
	}
}

// GetUser godoc
// @Summary      Get user by ID (admin)
// @Tags         admin
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      int  true  "User ID"
// @Success      200  {object}  models.User
// @Router       /users/{id} [get]
func GetUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var user models.User
		if err := db.Get().First(&user, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, user)
	}
}

// UpdateUser godoc
// @Summary      Update user (admin)
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      int                   true  "User ID"
// @Param        user  body      updateProfilePayload  true  "User data"
// @Success      200   {object}  models.User
// @Router       /users/{id} [put]
func UpdateUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var existing models.User
		if err := db.Get().First(&existing, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		var p updateProfilePayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if p.Name != "" {
			existing.Name = p.Name
		}
		if p.Subjects != nil {
			existing.Subjects = p.Subjects
		}
		if err := db.Get().Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
		c.JSON(http.StatusOK, existing)
	}
}

// DeleteUser godoc
// @Summary      Delete user (admin)
// @Tags         admin
// @Security     BearerAuth
// @Param        id   path      int  true  "User ID"
// @Success      204
// @Router       /users/{id} [delete]
func DeleteUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Get().Delete(&models.User{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// Notifications

// ListNotifications godoc
// @Summary      Get user notifications
// @Tags         notifications
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.Notification
// @Router       /notifications [get]
func ListNotifications() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var notifications []models.Notification
		if err := db.Get().Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&notifications).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, notifications)
	}
}

// MarkNotificationRead godoc
// @Summary      Mark notification as read
// @Tags         notifications
// @Security     BearerAuth
// @Param        id   path      int  true  "Notification ID"
// @Success      200  {object}  map[string]interface{}
// @Router       /notifications/{id}/read [put]
func MarkNotificationRead() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		userID, _ := c.Get("userID")
		var notif models.Notification
		if err := db.Get().Where("id = ? AND user_id = ?", id, userID).First(&notif).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		notif.IsRead = true
		if err := db.Get().Save(&notif).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "marked as read"})
	}
}

// AI Professor Chat

type chatPayload struct {
	Message     string `json:"message" binding:"required"`
	ContextType string `json:"context_type"` // lecture, task, topic, general
	ContextID   *uint  `json:"context_id"`
}

// ProfessorChat godoc
// @Summary      Ask AI professor
// @Description  Submit question to AI professor (placeholder - integrate LLM later)
// @Tags         professor
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        payload  body      chatPayload  true  "Question"
// @Success      201      {object}  models.ChatMessage
// @Router       /professor-chat [post]
func ProfessorChat() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var p chatPayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// TODO: Integrate with LLM API (OpenAI/Anthropic/local)
		aiReply := "AI response placeholder - integrate LLM here"
		msg := models.ChatMessage{
			UserID:      userID.(uint),
			ContextType: p.ContextType,
			ContextID:   p.ContextID,
			UserMessage: p.Message,
			AIReply:     aiReply,
		}
		if err := db.Get().Create(&msg).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}
		c.JSON(http.StatusCreated, msg)
	}
}

// ChatHistory godoc
// @Summary      Get chat history
// @Tags         professor
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.ChatMessage
// @Router       /professor-chat/history [get]
func ChatHistory() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var messages []models.ChatMessage
		if err := db.Get().Where("user_id = ?", userID).Order("timestamp desc").Limit(50).Find(&messages).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, messages)
	}
}

// GetChatMessage godoc
// @Summary      Get specific chat message
// @Tags         professor
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      int  true  "Chat message ID"
// @Success      200  {object}  models.ChatMessage
// @Router       /professor-chat/{id} [get]
func GetChatMessage() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		userID, _ := c.Get("userID")
		var msg models.ChatMessage
		if err := db.Get().Where("id = ? AND user_id = ?", id, userID).First(&msg).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, msg)
	}
}

// Leaderboard & Achievements

// Leaderboard godoc
// @Summary      Get leaderboard
// @Tags         leaderboard
// @Produce      json
// @Success      200  {array}   map[string]interface{}
// @Router       /leaderboard [get]
func Leaderboard() gin.HandlerFunc {
	return func(c *gin.Context) {
		var users []models.User
		if err := db.Get().Select("id, name, points").Order("points desc").Limit(100).Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		leaderboard := make([]map[string]interface{}, len(users))
		for i, u := range users {
			leaderboard[i] = map[string]interface{}{
				"rank":   i + 1,
				"id":     u.ID,
				"name":   u.Name,
				"points": u.Points,
			}
		}
		c.JSON(http.StatusOK, leaderboard)
	}
}

// Achievements godoc
// @Summary      Get user achievements
// @Tags         achievements
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /achievements [get]
func Achievements() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var u models.User
		if err := db.Get().First(&u, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"achievements": u.Achievements,
			"points":       u.Points,
		})
	}
}

// History

// TaskHistory godoc
// @Summary      Get user task history
// @Tags         history
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.SolutionAttempt
// @Router       /history/tasks [get]
func TaskHistory() gin.HandlerFunc {
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

// LectureHistory godoc
// @Summary      Get user lecture history
// @Tags         history
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.Note
// @Router       /history/lectures [get]
func LectureHistory() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var notes []models.Note
		if err := db.Get().Where("user_id = ?", userID).Order("created_at desc").Limit(100).Find(&notes).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, notes)
	}
}

// ProfileHistory godoc
// @Summary      Get user activity log
// @Tags         history
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /history/profile [get]
func ProfileHistory() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var attempts []models.SolutionAttempt
		db.Get().Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&attempts)
		var notes []models.Note
		db.Get().Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&notes)
		var chats []models.ChatMessage
		db.Get().Where("user_id = ?", userID).Order("timestamp desc").Limit(50).Find(&chats)
		c.JSON(http.StatusOK, gin.H{
			"solution_attempts": attempts,
			"notes":             notes,
			"chat_history":      chats,
		})
	}
}

// Admin Dashboard

// AdminDashboard godoc
// @Summary      Admin dashboard stats
// @Tags         admin
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /admin [get]
func AdminDashboard() gin.HandlerFunc {
	return func(c *gin.Context) {
		var userCount, lectureCount, taskCount, solutionCount int64
		db.Get().Model(&models.User{}).Count(&userCount)
		db.Get().Model(&models.Lecture{}).Count(&lectureCount)
		db.Get().Model(&models.Task{}).Count(&taskCount)
		db.Get().Model(&models.SolutionAttempt{}).Count(&solutionCount)
		c.JSON(http.StatusOK, gin.H{
			"users":             userCount,
			"lectures":          lectureCount,
			"tasks":             taskCount,
			"solution_attempts": solutionCount,
		})
	}
}

// AdminLectures godoc
// @Summary      Admin lectures list with stats
// @Tags         admin
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.Lecture
// @Router       /admin/lectures [get]
func AdminLectures() gin.HandlerFunc {
	return func(c *gin.Context) {
		var lectures []models.Lecture
		if err := db.Get().Preload("VideoAsset").Order("created_at desc").Limit(100).Find(&lectures).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		for i := range lectures {
			attachVideoAssetURL(&lectures[i])
		}
		c.JSON(http.StatusOK, lectures)
	}
}

// AdminTasks godoc
// @Summary      Admin tasks list with stats
// @Tags         admin
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.Task
// @Router       /admin/tasks [get]
func AdminTasks() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tasks []models.Task
		if err := db.Get().Order("created_at desc").Limit(100).Find(&tasks).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, tasks)
	}
}

// AdminTopics godoc
// @Summary      Admin topics list
// @Tags         admin
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.Topic
// @Router       /admin/topics [get]
func AdminTopics() gin.HandlerFunc {
	return func(c *gin.Context) {
		var topics []models.Topic
		if err := db.Get().Order("subject, order_index, id").Find(&topics).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		c.JSON(http.StatusOK, topics)
	}
}

// Ping godoc
// @Summary      Server status check
// @Tags         technical
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /ping [get]
func Ping() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "timestamp": time.Now().Unix()})
	}
}

// Logout godoc
// @Summary      User logout (JWT stateless - client-side token removal)
// @Tags         auth
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /auth/logout [post]
func Logout() gin.HandlerFunc {
	return func(c *gin.Context) {
		// JWT is stateless, so logout is handled client-side by removing token
		c.JSON(http.StatusOK, gin.H{"message": "logged out successfully"})
	}
}

// PasswordReset godoc
// @Summary      Request password reset email
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body  body      map[string]string  true  "Email"
// @Success      200   {object}  map[string]interface{}
// @Router       /password/reset [post]
func PasswordReset() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email string `json:"email" binding:"required,email"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
			return
		}
		// TODO: implement email sending with reset token
		// For now, return success (placeholder)
		c.JSON(http.StatusOK, gin.H{"message": "password reset email sent if account exists"})
	}
}

// CompleteLecture godoc
// @Summary      Mark lecture as completed/studied
// @Tags         lectures
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      int  true  "Lecture ID"
// @Success      200  {object}  map[string]interface{}
// @Router       /lectures/{id}/complete [post]
func CompleteLecture() gin.HandlerFunc {
	return func(c *gin.Context) {
		var lect models.Lecture
		if err := db.Get().First(&lect, c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "lecture not found"})
			return
		}
		// Record completion by incrementing view count
		db.Get().Model(&lect).Update("view_count", lect.ViewCount+1)
		c.JSON(http.StatusOK, gin.H{"message": "lecture marked as complete"})
	}
}

// GetTopicsTree godoc
// @Summary      Get topics in tree structure
// @Tags         topics
// @Produce      json
// @Success      200  {array}   models.Topic
// @Router       /topics/tree [get]
func GetTopicsTree() gin.HandlerFunc {
	return func(c *gin.Context) {
		var topics []models.Topic
		if err := db.Get().Order("subject, order_index, id").Find(&topics).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}
		// Build tree structure from flat list
		tree := buildTopicTree(topics)
		c.JSON(http.StatusOK, tree)
	}
}

func buildTopicTree(topics []models.Topic) []map[string]interface{} {
	topicMap := make(map[uint]*models.Topic)
	for i := range topics {
		topicMap[topics[i].ID] = &topics[i]
	}
	var roots []map[string]interface{}
	for _, topic := range topics {
		node := map[string]interface{}{
			"id":          topic.ID,
			"title":       topic.Title,
			"subject":     topic.Subject,
			"description": topic.Description,
			"parent_id":   topic.ParentID,
			"order_index": topic.OrderIndex,
			"children":    []map[string]interface{}{},
		}
		if topic.ParentID == nil {
			roots = append(roots, node)
		}
	}
	return roots
}

// UpdateTaskStatus godoc
// @Summary      Update task status
// @Tags         tasks
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      int                 true  "Task ID"
// @Param        body  body      map[string]string   true  "Status"
// @Success      200   {object}  models.Task
// @Router       /tasks/{id}/status [put]
func UpdateTaskStatus() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Status string `json:"status" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
			return
		}
		var task models.Task
		if err := db.Get().First(&task, c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}
		task.Status = req.Status
		if err := db.Get().Save(&task).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
			return
		}
		c.JSON(http.StatusOK, task)
	}
}

// GetSolution godoc
// @Summary      Get specific solution attempt
// @Tags         solutions
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      int  true  "Solution ID"
// @Success      200  {object}  models.SolutionAttempt
// @Router       /solutions/{id} [get]
func GetSolution() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var attempt models.SolutionAttempt
		if err := db.Get().Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&attempt).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "solution not found"})
			return
		}
		c.JSON(http.StatusOK, attempt)
	}
}

// UpdateSolution godoc
// @Summary      Update solution attempt
// @Tags         solutions
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id    path      int                        true  "Solution ID"
// @Param        body  body      models.SolutionAttempt     true  "Solution data"
// @Success      200   {object}  models.SolutionAttempt
// @Router       /solutions/{id} [put]
func UpdateSolution() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var attempt models.SolutionAttempt
		if err := db.Get().Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&attempt).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "solution not found"})
			return
		}
		var req models.SolutionAttempt
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
			return
		}
		attempt.Answer = req.Answer
		attempt.Status = req.Status
		if err := db.Get().Save(&attempt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
			return
		}
		c.JSON(http.StatusOK, attempt)
	}
}

// DeleteSolution godoc
// @Summary      Delete solution attempt
// @Tags         solutions
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      int  true  "Solution ID"
// @Success      200  {object}  map[string]interface{}
// @Router       /solutions/{id} [delete]
func DeleteSolution() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var attempt models.SolutionAttempt
		if err := db.Get().Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&attempt).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "solution not found"})
			return
		}
		if err := db.Get().Delete(&attempt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "solution deleted"})
	}
}

// AdminLogs godoc
// @Summary      View system logs (placeholder)
// @Tags         admin
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /admin/logs [get]
func AdminLogs() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: implement log file reading or log aggregation
		// For now, return placeholder data
		c.JSON(http.StatusOK, gin.H{
			"logs": []string{
				"System operational",
				"No critical errors",
			},
			"message": "Log viewing not yet implemented",
		})
	}
}

func attachVideoAssetURL(lecture *models.Lecture) {
	if lecture == nil || lecture.VideoAsset == nil {
		return
	}
	lecture.VideoAsset.StreamURL = fmt.Sprintf("/api/v1/videos/%d/stream", lecture.VideoAsset.ID)
}
