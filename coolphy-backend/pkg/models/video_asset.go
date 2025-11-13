package models

import "time"

// VideoAsset stores metadata about uploaded lecture videos on disk.
type VideoAsset struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	StoragePath  string    `gorm:"not null" json:"-"`
	OriginalName string    `gorm:"not null" json:"original_name"`
	MimeType     string    `json:"mime_type"`
	SizeBytes    int64     `json:"size_bytes"`
	StreamURL    string    `gorm:"-" json:"stream_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

