package models

import "time"

type Notification struct {
	ID      uint      `gorm:"primaryKey" json:"id"`
	UserID  uint      `gorm:"not null;index" json:"user_id"`
	Type    string    `gorm:"not null" json:"type"` // achievement, new_content, reminder
	Title   string    `gorm:"not null" json:"title"`
	Content string    `gorm:"type:text" json:"content"`
	IsRead  bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID"`
}
