package models

import (
	"time"

	"github.com/lib/pq"
)

type Task struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Title            string         `gorm:"not null" json:"title"`
	DescriptionLaTeX string         `gorm:"type:text;not null" json:"description_latex"`
	Subject          string         `gorm:"not null;index" json:"subject"`
	Tags             pq.StringArray `gorm:"type:text[]" json:"tags"`
	Level            string         `gorm:"not null" json:"level"` // 1-10 or basic/advanced/olympiad
	Type             string         `gorm:"not null" json:"type"`  // ege, olympiad, practice
	CorrectAnswer    string         `gorm:"type:text" json:"-"`    // Hidden from regular users
	SolutionLaTeX    string         `gorm:"type:text" json:"solution_latex"`
	HintLaTeX        string         `gorm:"type:text" json:"hint_latex"`
	Points           int            `gorm:"default:10" json:"points"`
	Status           string         `gorm:"default:'active'" json:"status"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`

	Topics           []Topic           `gorm:"many2many:task_topics;"`
	RelatedLectures  []Lecture         `gorm:"many2many:lecture_tasks;"`
	SolutionAttempts []SolutionAttempt `gorm:"foreignKey:TaskID"`
}
