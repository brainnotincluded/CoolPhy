package models

import "time"

type AppSettings struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	OpenRouterAPIKey  string    `gorm:"type:text" json:"openrouter_api_key,omitempty"`
	SystemPrompt      string    `gorm:"type:text" json:"system_prompt"`
	PrimaryModel      string    `gorm:"default:'anthropic/claude-3.5-sonnet'" json:"primary_model"`
	FallbackModel     string    `gorm:"default:'google/gemini-2.0-flash-exp:free'" json:"fallback_model"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// Default system prompt for the AI teacher
const DefaultSystemPrompt = `You are an expert teacher specialized in mathematics, physics, and computer science. Your role is to help students understand concepts and solve problems.

Guidelines:
- Be encouraging and supportive
- Explain concepts clearly with examples
- If a student is stuck, provide hints rather than direct answers
- Use LaTeX notation for mathematical expressions (wrap in $ for inline or $$ for block)
- When discussing a specific task, reference the problem statement
- Break down complex problems into manageable steps
- Encourage critical thinking and problem-solving skills

Remember: Your goal is to help students learn, not just give them answers.`
