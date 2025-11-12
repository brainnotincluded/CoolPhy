package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv   string
	Port     string
	DBURL    string
	JWTSecret string
	RateLimit string
	CORSAllowedOrigins string
}

func Load() Config {
	_ = godotenv.Load()
	cfg := Config{
		AppEnv:   get("APP_ENV", "development"),
		Port:     get("PORT", "8080"),
		DBURL:    get("DB_URL", "postgres://postgres:postgres@localhost:5432/coolphy?sslmode=disable"),
		JWTSecret: get("JWT_SECRET", "changeme_in_prod"),
		RateLimit: get("RATE_LIMIT", "100-M"),
		CORSAllowedOrigins: get("CORS_ALLOWED_ORIGINS", "*"),
	}
	return cfg
}

func get(key, def string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return def
}

func MustGet(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("missing required env: %s", key)
	}
	return v
}
