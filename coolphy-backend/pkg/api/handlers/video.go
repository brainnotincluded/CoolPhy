package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"coolphy-backend/internal/config"
	"coolphy-backend/pkg/db"
	"coolphy-backend/pkg/models"
)

const maxVideoUploadSize = int64(1 << 30) // 1 GiB

var allowedVideoExtensions = map[string]struct{}{
	".mp4":  {},
	".mov":  {},
	".m4v":  {},
	".webm": {},
	".avi":  {},
}

// UploadVideo handles admin video uploads and stores metadata in DB.
func UploadVideo(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := ensureUploadDir(cfg.UploadDir); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "storage init failed"})
			return
		}

		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxVideoUploadSize)
		if err := c.Request.ParseMultipartForm(maxVideoUploadSize); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid upload payload"})
			return
		}

		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
			return
		}

		ext := strings.ToLower(filepath.Ext(file.Filename))
		if _, ok := allowedVideoExtensions[ext]; !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported video format"})
			return
		}

		destPath, err := buildDestinationPath(cfg.UploadDir, ext)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "storage path error"})
			return
		}

		if err := os.MkdirAll(filepath.Dir(destPath), 0o755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to prepare storage"})
			return
		}

		if err := c.SaveUploadedFile(file, destPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save video"})
			return
		}

		mimeType := file.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = mime.TypeByExtension(ext)
		}

		video := models.VideoAsset{
			StoragePath:  destPath,
			OriginalName: file.Filename,
			MimeType:     mimeType,
			SizeBytes:    file.Size,
		}

		if err := db.Get().Create(&video).Error; err != nil {
			os.Remove(destPath)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record video"})
			return
		}

		video.StreamURL = fmt.Sprintf("/api/v1/videos/%d/stream", video.ID)

		c.JSON(http.StatusCreated, gin.H{
			"id":            video.ID,
			"original_name": video.OriginalName,
			"mime_type":     video.MimeType,
			"size_bytes":    video.SizeBytes,
			"stream_url":    video.StreamURL,
		})
	}
}

// StreamVideo streams a stored video asset by ID.
func StreamVideo(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var asset models.VideoAsset
		if err := db.Get().First(&asset, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "video not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		}

		if _, err := os.Stat(asset.StoragePath); err != nil {
			if os.IsNotExist(err) {
				c.JSON(http.StatusGone, gin.H{"error": "stored file missing"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
			return
		}

		if asset.MimeType != "" {
			c.Header("Content-Type", asset.MimeType)
		}
		c.File(asset.StoragePath)
	}
}

func ensureUploadDir(base string) error {
	absBase, err := filepath.Abs(base)
	if err != nil {
		return err
	}
	return os.MkdirAll(filepath.Join(absBase, "videos"), 0o755)
}

func buildDestinationPath(base, ext string) (string, error) {
	absBase, err := filepath.Abs(base)
	if err != nil {
		return "", err
	}
	filename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), randomHex(6), ext)
	return filepath.Join(absBase, "videos", filename), nil
}

func randomHex(n int) string {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buf)
}

