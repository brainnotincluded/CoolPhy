package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/datatypes"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Name         string         `gorm:"not null" json:"name"`
	PasswordHash string         `gorm:"not null" json:"-"`
	Points       int            `gorm:"default:0" json:"points"`
	Subjects     pq.StringArray `gorm:"type:text[]" json:"subjects"` // [math, physics, cs]
	Role         string         `gorm:"default:'user'" json:"role"`  // user, admin
	Achievements datatypes.JSON `gorm:"type:jsonb" json:"achievements"`
	Settings     datatypes.JSON `gorm:"type:jsonb" json:"settings"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`

	SolutionAttempts []SolutionAttempt `gorm:"foreignKey:UserID"`
	Notes            []Note            `gorm:"foreignKey:UserID"`
	ChatMessages     []ChatMessage     `gorm:"foreignKey:UserID"`
	Notifications    []Notification    `gorm:"foreignKey:UserID"`
}
