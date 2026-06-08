package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	App      AppConfig
	DB       DBConfig
	JWT      JWTConfig
	S3       S3Config
	Telegram TelegramConfig
}

type AppConfig struct {
	Env                string
	Port               string
	CORSAllowedOrigins []string
	UploadDir          string
	PublicSiteURL      string
}

type DBConfig struct{ URL string }

type JWTConfig struct {
	Secret    string
	ExpiresIn time.Duration
}

type S3Config struct {
	Endpoint  string
	Region    string
	Bucket    string
	AccessKey string
	SecretKey string
	PublicURL string
	UploadDir string
}

type TelegramConfig struct {
	BotToken             string
	ChatID               string
	NotificationsEnabled bool
}

func Load() *Config {
	jwtExpires, err := time.ParseDuration(getEnv("JWT_EXPIRES_IN", "12h"))
	if err != nil {
		jwtExpires = 12 * time.Hour
	}
	uploadDir := getEnv("UPLOAD_DIR", "./uploads")
	return &Config{
		App: AppConfig{
			Env:                getEnv("APP_ENV", "development"),
			Port:               getEnv("APP_PORT", "8080"),
			CORSAllowedOrigins: splitCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
			UploadDir:          uploadDir,
			PublicSiteURL:      strings.TrimRight(getEnv("PUBLIC_SITE_URL", getEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")), "/"),
		},
		DB:  DBConfig{URL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/artist_portfolio?sslmode=disable")},
		JWT: JWTConfig{Secret: getEnv("JWT_SECRET", "dev-only-secret-replace-before-production-at-least-32-characters"), ExpiresIn: jwtExpires},
		S3: S3Config{
			Endpoint: getEnv("S3_ENDPOINT", ""), Region: getEnv("S3_REGION", "eu-central-1"),
			Bucket: getEnv("S3_BUCKET", "artist-portfolio"), AccessKey: getEnv("S3_ACCESS_KEY", ""),
			SecretKey: getEnv("S3_SECRET_KEY", ""), PublicURL: strings.TrimRight(getEnv("S3_PUBLIC_URL", ""), "/"),
			UploadDir: uploadDir,
		},
		Telegram: TelegramConfig{
			BotToken:             getEnv("TELEGRAM_BOT_TOKEN", ""),
			ChatID:               getEnv("TELEGRAM_CHAT_ID", ""),
			NotificationsEnabled: getEnvBool("TELEGRAM_NOTIFICATIONS_ENABLED", false),
		},
	}
}

func (c *Config) Validate() error {
	if c.DB.URL == "" {
		return errors.New("DATABASE_URL is required")
	}
	if c.App.Env == "production" {
		if len(c.JWT.Secret) < 32 || strings.Contains(c.JWT.Secret, "dev-only") {
			return errors.New("JWT_SECRET must be a non-default secret of at least 32 characters in production")
		}
		if len(c.App.CORSAllowedOrigins) == 0 {
			return errors.New("CORS_ALLOWED_ORIGINS is required in production")
		}
		if c.S3.Endpoint == "" {
			return errors.New("S3_ENDPOINT is required in production; container-local uploads are not durable")
		}
	}
	if c.S3.Endpoint != "" && (c.S3.AccessKey == "" || c.S3.SecretKey == "" || c.S3.PublicURL == "") {
		return fmt.Errorf("S3_ACCESS_KEY, S3_SECRET_KEY and S3_PUBLIC_URL are required when S3_ENDPOINT is set")
	}
	return nil
}

func splitCSV(value string) []string {
	var values []string
	for _, v := range strings.Split(value, ",") {
		if trimmed := strings.TrimSpace(v); trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}
func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}

	return parsed
}
