package models

import "time"

type SolutionAttempt struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"not null;index" json:"user_id"`
	TaskID        uint      `gorm:"not null;index" json:"task_id"`
	Answer        string    `gorm:"type:text;not null" json:"answer"`
	SolutionText  string    `gorm:"type:text" json:"solution_text"`
	Status        string    `gorm:"default:'pending'" json:"status"` // correct, incorrect, pending
	PointsAwarded int       `gorm:"default:0" json:"points_awarded"`
	AIFeedback    string    `gorm:"type:text" json:"ai_feedback"`
	TimeSpent     int       `gorm:"default:0" json:"time_spent"` // seconds
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID"`
	Task Task `gorm:"foreignKey:TaskID"`
}
