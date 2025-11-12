package models

import (
	"time"

	"github.com/lib/pq"
)

type Lecture struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Title        string         `gorm:"not null" json:"title"`
	Subject      string         `gorm:"not null;index" json:"subject"` // math, physics, cs
	ContentLaTeX string         `gorm:"type:text;not null" json:"content_latex"`
	Summary      string         `gorm:"type:text" json:"summary"`
	Tags         pq.StringArray `gorm:"type:text[]" json:"tags"`
	Level        string         `gorm:"default:'basic'" json:"level"` // basic, advanced, olympiad
	AuthorID     uint           `json:"author_id"`
	ViewCount    int            `gorm:"default:0" json:"view_count"`
	Status       string         `gorm:"default:'active'" json:"status"` // active, draft, archived
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`

	Topics         []Topic `gorm:"many2many:lecture_topics;"`
	RelatedTasks   []Task  `gorm:"many2many:lecture_tasks;"`
	Notes          []Note  `gorm:"foreignKey:LectureID"`
}
