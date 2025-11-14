package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"coolphy-backend/pkg/db"
	"coolphy-backend/pkg/models"
	"coolphy-backend/pkg/utils"
)

// GetOrCreateSettings retrieves or creates app settings
func getOrCreateSettings() (*models.AppSettings, error) {
	var settings models.AppSettings
	err := db.Get().First(&settings).Error
	if err == gorm.ErrRecordNotFound {
		// Create default settings
		settings = models.AppSettings{
			SystemPrompt:  models.DefaultSystemPrompt,
			PrimaryModel:  "anthropic/claude-3.5-sonnet",
			FallbackModel: "google/gemini-2.0-flash-exp:free",
			UpdatedAt:     time.Now(),
		}
		if err := db.Get().Create(&settings).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	return &settings, nil
}

type chatPayload struct {
	Message     string `json:"message" binding:"required"`
	ContextType string `json:"context_type"` // task, lecture, topic, general
	ContextID   *uint  `json:"context_id"`
}

// ProfessorChatWithAI godoc
// @Summary      Ask AI professor with real LLM
// @Description  Submit question to AI professor using OpenRouter
// @Tags         professor
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        payload  body      chatPayload  true  \"Question\"
// @Success      201      {object}  models.ChatMessage
// @Router       /professor-chat [post]
func ProfessorChatWithAI() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var p chatPayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get settings
		settings, err := getOrCreateSettings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get settings"})
			return
		}

		if settings.OpenRouterAPIKey == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "OpenRouter API key not configured. Please contact admin."})
			return
		}

		// Build context for the AI
		contextInfo := ""
		if p.ContextType == "task" && p.ContextID != nil {
			var task models.Task
			if err := db.Get().First(&task, *p.ContextID).Error; err == nil {
				contextInfo = fmt.Sprintf("\n\n**Task Context:**\nTitle: %s\nDescription:\n%s\n\nSolution (for reference):\n%s",
					task.Title, task.DescriptionLatex, task.SolutionLatex)
			}
		} else if p.ContextType == "lecture" && p.ContextID != nil {
			var lecture models.Lecture
			if err := db.Get().First(&lecture, *p.ContextID).Error; err == nil {
				contextInfo = fmt.Sprintf("\n\n**Lecture Context:**\nTitle: %s\nContent:\n%s",
					lecture.Title, lecture.ContentLatex)
			}
		}

		// Get conversation history for this context (last 10 messages)
		var history []models.ChatMessage
		query := db.Get().Where("user_id = ?", userID).Order("timestamp desc").Limit(10)
		if p.ContextType != "" {
			query = query.Where("context_type = ?", p.ContextType)
			if p.ContextID != nil {
				query = query.Where("context_id = ?", *p.ContextID)
			}
		}
		query.Find(&history)

		// Build messages array for OpenRouter
		messages := []utils.OpenRouterMessage{
			{Role: "system", Content: settings.SystemPrompt + contextInfo},
		}

		// Add history in reverse order (oldest first)
		for i := len(history) - 1; i >= 0; i-- {
			messages = append(messages,
				utils.OpenRouterMessage{Role: "user", Content: history[i].UserMessage},
				utils.OpenRouterMessage{Role: "assistant", Content: history[i].AIReply},
			)
		}

		// Add current user message
		messages = append(messages, utils.OpenRouterMessage{Role: "user", Content: p.Message})

		// Call OpenRouter API
		client := utils.NewOpenRouterClient(settings.OpenRouterAPIKey, settings.PrimaryModel, settings.FallbackModel)
		aiReply, err := client.Chat(messages)
		if err != nil {
			fmt.Printf("OpenRouter API error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get AI response: " + err.Error()})
			return
		}

		// Save to database
		msg := models.ChatMessage{
			UserID:      userID.(uint),
			ContextType: p.ContextType,
			ContextID:   p.ContextID,
			UserMessage: p.Message,
			AIReply:     aiReply,
			Timestamp:   time.Now(),
		}
		if err := db.Get().Create(&msg).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}

		c.JSON(http.StatusCreated, msg)
	}
}

// Admin Settings Endpoints

// GetSettings godoc
// @Summary      Get app settings (admin)
// @Tags         admin
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  models.AppSettings
// @Router       /admin/settings [get]
func GetSettings() gin.HandlerFunc {
	return func(c *gin.Context) {
		settings, err := getOrCreateSettings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get settings"})
			return
		}
		c.JSON(http.StatusOK, settings)
	}
}

type updateSettingsPayload struct {
	OpenRouterAPIKey string `json:"openrouter_api_key"`
	SystemPrompt     string `json:"system_prompt"`
	PrimaryModel     string `json:"primary_model"`
	FallbackModel    string `json:"fallback_model"`
}

// UpdateSettings godoc
// @Summary      Update app settings (admin)
// @Tags         admin
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        payload  body      updateSettingsPayload  true  \"Settings\"
// @Success      200      {object}  models.AppSettings
// @Router       /admin/settings [put]
func UpdateSettings() gin.HandlerFunc {
	return func(c *gin.Context) {
		var p updateSettingsPayload
		if err := c.ShouldBindJSON(&p); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		settings, err := getOrCreateSettings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get settings"})
			return
		}

		if p.OpenRouterAPIKey != "" {
			settings.OpenRouterAPIKey = p.OpenRouterAPIKey
		}
		if p.SystemPrompt != "" {
			settings.SystemPrompt = p.SystemPrompt
		}
		if p.PrimaryModel != "" {
			settings.PrimaryModel = p.PrimaryModel
		}
		if p.FallbackModel != "" {
			settings.FallbackModel = p.FallbackModel
		}
		settings.UpdatedAt = time.Now()

		if err := db.Get().Save(settings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
			return
		}

		c.JSON(http.StatusOK, settings)
	}
}
