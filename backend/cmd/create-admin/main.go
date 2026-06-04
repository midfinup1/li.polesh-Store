package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/pressly/goose/v3"
	"golang.org/x/crypto/bcrypt"

	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/repository"
)

func main() {
	_ = godotenv.Load()

	email := flag.String("email", "", "administrator email")
	password := flag.String("password", "", "administrator password")
	flag.Parse()

	normalizedEmail := strings.ToLower(strings.TrimSpace(*email))

	if normalizedEmail == "" {
		log.Fatal("administrator email is required")
	}

	if len(*password) < 12 {
		log.Fatal("administrator password must contain at least 12 characters")
	}

	cfg := config.Load()

	db, err := repository.NewDB(cfg.DB.URL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("failed to configure migration dialect: %v", err)
	}

	if err := goose.Up(db.DB, "migrations"); err != nil {
		log.Fatalf("failed to apply migrations: %v", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to generate password hash: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = db.ExecContext(
		ctx,
		`
			INSERT INTO admins (email, password_hash)
			VALUES ($1, $2)
			ON CONFLICT (email)
			DO UPDATE SET password_hash = EXCLUDED.password_hash
		`,
		normalizedEmail,
		string(hash),
	)
	if err != nil {
		log.Fatalf("failed to save administrator: %v", err)
	}

	fmt.Fprintln(os.Stdout, "administrator credentials saved")
}