package models

import "time"

type Topic struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Subject     string    `gorm:"not null;index" json:"subject"`
	Description string    `gorm:"type:text" json:"description"`
	ParentID    *uint     `gorm:"index" json:"parent_id"`
	Level       int       `gorm:"default:0" json:"level"`
	OrderIndex  int       `gorm:"default:0" json:"order_index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Parent   *Topic   `gorm:"foreignKey:ParentID"`
	Children []Topic  `gorm:"foreignKey:ParentID"`
	Lectures []Lecture `gorm:"many2many:lecture_topics;"`
	Tasks    []Task    `gorm:"many2many:task_topics;"`
}
