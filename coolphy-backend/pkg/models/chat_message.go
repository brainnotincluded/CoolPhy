package models

import "time"

type ChatMessage struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	ContextType string    `json:"context_type"` // lecture, task, topic, general
	ContextID   *uint     `json:"context_id"`
	UserMessage string    `gorm:"type:text;not null" json:"user_message"`
	AIReply     string    `gorm:"type:text" json:"ai_reply"`
	Timestamp   time.Time `json:"timestamp"`

	User User `gorm:"foreignKey:UserID"`
}
