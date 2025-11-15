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
			SystemPrompt:        models.DefaultSystemPrompt,
			ProfessorPrompt:     models.DefaultProfessorPrompt,
			TaskAssistantPrompt: models.DefaultTaskAssistantPrompt,
			PrimaryModel:        "anthropic/claude-3.5-sonnet",
			FallbackModel:       "google/gemini-2.0-flash-exp:free",
			UpdatedAt:           time.Now(),
		}
		if err := db.Get().Create(&settings).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	// Migrate old settings that don't have new prompts
	if settings.ProfessorPrompt == "" {
		settings.ProfessorPrompt = models.DefaultProfessorPrompt
	}
	if settings.TaskAssistantPrompt == "" {
		settings.TaskAssistantPrompt = models.DefaultTaskAssistantPrompt
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

		// Get student stats for professor context
		var user models.User
		db.Get().First(&user, userID)
		var solvedCount int64
		db.Get().Model(&models.SolutionAttempt{}).Where("user_id = ? AND status = ?", userID, "correct").Count(&solvedCount)
		var totalAttempts int64
		db.Get().Model(&models.SolutionAttempt{}).Where("user_id = ?", userID).Count(&totalAttempts)

		// Get subject performance
		type SubjectPerf struct {
			Subject     string
			Correct     int64
			Total       int64
			SuccessRate float64
		}
		var subjectPerf []SubjectPerf
		rows, _ := db.Get().Raw(`
			SELECT t.subject, 
				COUNT(CASE WHEN sa.status = 'correct' THEN 1 END) as correct,
				COUNT(*) as total
			FROM solution_attempts sa
			JOIN tasks t ON sa.task_id = t.id
			WHERE sa.user_id = ?
			GROUP BY t.subject
		`, userID).Rows()
		if rows != nil {
			defer rows.Close()
			for rows.Next() {
				var sp SubjectPerf
				if err := rows.Scan(&sp.Subject, &sp.Correct, &sp.Total); err == nil {
					if sp.Total > 0 {
						sp.SuccessRate = float64(sp.Correct) / float64(sp.Total) * 100
					}
					subjectPerf = append(subjectPerf, sp)
				}
			}
		}

		// Build student stats context
		statsContext := fmt.Sprintf("\n\n**Student Performance:**\nName: %s\nTotal Points: %d\nTasks Solved: %d/%d\n",
			user.Name, user.Points, solvedCount, totalAttempts)
		for _, sp := range subjectPerf {
			statsContext += fmt.Sprintf("- %s: %d/%d correct (%.1f%%)\n", sp.Subject, sp.Correct, sp.Total, sp.SuccessRate)
		}

		// Get available tasks and lectures for RAG
		var tasks []models.Task
		db.Get().Select("id, title, subject, level").Limit(50).Find(&tasks)
		var lectures []models.Lecture
		db.Get().Select("id, title, subject").Limit(50).Find(&lectures)

		ragContext := "\n\n**Available Resources:**\n"
		if len(tasks) > 0 {
			ragContext += "\nTasks:\n"
			for _, t := range tasks {
				ragContext += fmt.Sprintf("- [Task: %s](#/tasks/%d) - %s, %s\n", t.Title, t.ID, t.Subject, t.Level)
			}
		}
		if len(lectures) > 0 {
			ragContext += "\nLectures:\n"
			for _, l := range lectures {
				ragContext += fmt.Sprintf("- [Lecture: %s](#/lectures/%d) - %s\n", l.Title, l.ID, l.Subject)
			}
		}

		contextInfo := statsContext + ragContext

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

		// Build messages array for OpenRouter with professor prompt
		messages := []utils.OpenRouterMessage{
			{Role: "system", Content: settings.ProfessorPrompt + contextInfo},
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

		c.JSON(http.StatusCreated, gin.H{"ai_reply": aiReply})
	}
}

// TaskChatWithAI godoc
// @Summary      Task assistant chat for in-task help
// @Description  Chat with AI assistant while solving a task
// @Tags         tasks
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        payload  body      chatPayload  true  "Question"
// @Success      201      {object}  map[string]interface{}
// @Router       /task-chat [post]
func TaskChatWithAI() gin.HandlerFunc {
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

		// Build task context with solution for evaluation
		contextInfo := ""
		var currentTask *models.Task
		if p.ContextType == "task" && p.ContextID != nil {
			var task models.Task
			if err := db.Get().First(&task, *p.ContextID).Error; err == nil {
				currentTask = &task
				contextInfo = fmt.Sprintf(`

**Current Task:**
Title: %s
Description:
%s

**Correct Solution (for your reference only):**
%s

**Your Role:**
- Guide the student with hints and questions
- When the student provides what seems to be a final answer, evaluate it against the correct solution
- If correct, respond with JSON: {"action":"evaluate","answer":"student's answer","is_correct":true,"feedback":"positive feedback"}
- If incorrect but close, provide hints
- If they're stuck, break down the problem into steps
- Use LaTeX for math and TikZ for diagrams`,
					task.Title, task.DescriptionLaTeX, task.SolutionLaTeX)
			}
		}

		// Get conversation history for this specific task (last 10 messages)
		var history []models.ChatMessage
		query := db.Get().Where("user_id = ? AND context_type = 'task'", userID).Order("timestamp desc").Limit(10)
		if p.ContextID != nil {
			query = query.Where("context_id = ?", *p.ContextID)
		}
		query.Find(&history)

		// Build messages array for OpenRouter with task assistant prompt
		messages := []utils.OpenRouterMessage{
			{Role: "system", Content: settings.TaskAssistantPrompt + contextInfo},
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

		// Check if AI decided to evaluate the answer
		type EvalDecision struct {
			Action    string `json:"action"`
			Answer    string `json:"answer"`
			IsCorrect bool   `json:"is_correct"`
			Feedback  string `json:"feedback"`
		}
		var evalDecision EvalDecision
		evaluationTriggered := false
		
		// Try to parse JSON evaluation decision from AI response
		if err := json.Unmarshal([]byte(aiReply), &evalDecision); err == nil && evalDecision.Action == "evaluate" {
			evaluationTriggered = true
			// AI decided to evaluate - create solution attempt
			if currentTask != nil {
				status := "incorrect"
				pointsAwarded := 0
				if evalDecision.IsCorrect {
					status = "correct"
					pointsAwarded = currentTask.Points
					// Award points to user
					var user models.User
					if err := db.Get().First(&user, userID).Error; err == nil {
						user.Points += currentTask.Points
						db.Get().Save(&user)
					}
				}
				
				// Create solution attempt record
				attempt := models.SolutionAttempt{
					UserID:        userID.(uint),
					TaskID:        currentTask.ID,
					Answer:        evalDecision.Answer,
					Status:        status,
					PointsAwarded: pointsAwarded,
					AIFeedback:    evalDecision.Feedback,
				}
				db.Get().Create(&attempt)
				
				// Replace AI response with user-friendly message
				if evalDecision.IsCorrect {
					aiReply = fmt.Sprintf("✅ **Correct!** +%d points\n\n%s", pointsAwarded, evalDecision.Feedback)
				} else {
					aiReply = fmt.Sprintf("❌ **Not quite right**\n\n%s", evalDecision.Feedback)
				}
			}
		}

		// Save to database
		msg := models.ChatMessage{
			UserID:      userID.(uint),
			ContextType: "task",
			ContextID:   p.ContextID,
			UserMessage: p.Message,
			AIReply:     aiReply,
			Timestamp:   time.Now(),
		}
		if err := db.Get().Create(&msg).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
			return
		}

		response := gin.H{"ai_reply": aiReply}
		if evaluationTriggered {
			response["evaluation"] = gin.H{
				"is_correct": evalDecision.IsCorrect,
				"score":      evalDecision.IsCorrect && currentTask != nil,
			}
		}
		c.JSON(http.StatusCreated, response)
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
	OpenRouterAPIKey    string `json:"openrouter_api_key"`
	SystemPrompt        string `json:"system_prompt"`
	ProfessorPrompt     string `json:"professor_prompt"`
	TaskAssistantPrompt string `json:"task_assistant_prompt"`
	PrimaryModel        string `json:"primary_model"`
	FallbackModel       string `json:"fallback_model"`
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
		if p.ProfessorPrompt != "" {
			settings.ProfessorPrompt = p.ProfessorPrompt
		}
		if p.TaskAssistantPrompt != "" {
			settings.TaskAssistantPrompt = p.TaskAssistantPrompt
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
