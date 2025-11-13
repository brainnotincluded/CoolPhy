package db

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"coolphy-backend/internal/config"
	"coolphy-backend/pkg/models"
)

var DB *gorm.DB

func Connect(cfg config.Config) error {
	gcfg := &gorm.Config{Logger: logger.Default.LogMode(logger.Info)}
	db, err := gorm.Open(postgres.Open(cfg.DBURL), gcfg)
	if err != nil {
		return err
	}
	if err := db.Exec("SET TIME ZONE 'UTC'").Error; err != nil {
		log.Println("warning: failed to set timezone:", err)
	}
	DB = db
	return autoMigrate()
}

func autoMigrate() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.Lecture{},
		&models.Task{},
		&models.VideoAsset{},
		&models.Topic{},
		&models.SolutionAttempt{},
		&models.Note{},
		&models.ChatMessage{},
		&models.Notification{},
	)
}

func Get() *gorm.DB { return DB }
