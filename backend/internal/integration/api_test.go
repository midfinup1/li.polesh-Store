package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/pressly/goose/v3"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	"golang.org/x/crypto/bcrypt"

	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/handler"
	"github.com/midfinup1/li.polesh-Store/backend/internal/repository"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

func TestPublicAndAdminAPI(t *testing.T) {
	ctx := context.Background()

	db, cleanup := startPostgres(t, ctx)
	defer cleanup()

	cfg := &config.Config{
		App: config.AppConfig{
			Env:                "test",
			Port:               "0",
			CORSAllowedOrigins: []string{"http://localhost:3000"},
			UploadDir:          t.TempDir(),
		},
		DB: config.DBConfig{
			URL: "unused",
		},
		JWT: config.JWTConfig{
			Secret:    "test-secret-with-at-least-32-characters",
			ExpiresIn: time.Hour,
		},
		S3: config.S3Config{
			UploadDir: t.TempDir(),
		},
	}

	repos := repository.NewRepositories(db)
	services := service.NewServices(service.Deps{
		Repos:  repos,
		Config: cfg,
	})

	testLogger := slog.New(slog.NewTextHandler(io.Discard, &slog.HandlerOptions{
		Level: slog.LevelError,
	}))

	router := handler.NewRouter(handler.Deps{
		Services: services,
		Config:   cfg,
		Logger:   testLogger,
	})

	server := httptest.NewServer(router)
	defer server.Close()

	t.Run("public lists are arrays", func(t *testing.T) {
		assertJSONStatus(t, http.MethodGet, server.URL+"/api/v1/categories", nil, http.StatusOK)
		assertJSONStatus(t, http.MethodGet, server.URL+"/api/v1/artworks", nil, http.StatusOK)
		assertJSONStatus(t, http.MethodGet, server.URL+"/api/v1/artworks?category_id=bad", nil, http.StatusBadRequest)
	})

	t.Run("admin route rejects anonymous request", func(t *testing.T) {
		assertJSONStatus(t, http.MethodGet, server.URL+"/api/v1/admin/artworks", nil, http.StatusUnauthorized)
	})

	cookie := login(t, server.URL, "admin@example.com", "password123456")

	t.Run("admin route accepts authenticated request", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, server.URL+"/api/v1/admin/artworks", nil)
		if err != nil {
			t.Fatal(err)
		}

		req.AddCookie(cookie)

		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()

		if res.StatusCode != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.StatusCode)
		}
	})

	t.Run("create category and artwork", func(t *testing.T) {
		category := map[string]any{
			"name":       "Живопись",
			"slug":       "painting",
			"sort_order": 1,
		}

		assertAuthenticatedJSONStatus(
			t,
			cookie,
			http.MethodPost,
			server.URL+"/api/v1/admin/categories",
			category,
			http.StatusCreated,
		)

		artwork := map[string]any{
			"title":       "Работа",
			"description": "Описание",
			"status":      "available",
			"price":       1000,
		}

		assertAuthenticatedJSONStatus(
			t,
			cookie,
			http.MethodPost,
			server.URL+"/api/v1/admin/artworks",
			artwork,
			http.StatusCreated,
		)

		assertJSONStatus(t, http.MethodGet, server.URL+"/api/v1/artworks", nil, http.StatusOK)
	})

	t.Run("multiple active orders are allowed until artwork status changes", func(t *testing.T) {
		artwork := map[string]any{
			"title":  "Работа для заявки",
			"status": "available",
			"price":  1000,
		}

		createdArtwork := postAuthenticatedJSON[map[string]any](
			t,
			cookie,
			server.URL+"/api/v1/admin/artworks",
			artwork,
			http.StatusCreated,
		)

		artworkID := int64(createdArtwork["id"].(float64))
		order := map[string]any{
			"artwork_id": artworkID,
			"name":       "Покупатель",
			"email":      "buyer@example.com",
			"phone":      "+79990000000",
			"message":    "Хочу купить",
		}

		assertJSONStatus(t, http.MethodPost, server.URL+"/api/v1/orders", order, http.StatusCreated)
		assertJSONStatus(t, http.MethodPost, server.URL+"/api/v1/orders", order, http.StatusCreated)
	})
}

func startPostgres(t *testing.T, ctx context.Context) (*sqlx.DB, func()) {
	t.Helper()

	container, err := postgres.Run(
		ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("artist_portfolio_test"),
		postgres.WithUsername("postgres"),
		postgres.WithPassword("postgres"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(90*time.Second),
		),
	)
	if err != nil {
		t.Fatalf("start postgres: %v", err)
	}

	connString, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		_ = container.Terminate(ctx)
		t.Fatalf("connection string: %v", err)
	}

	db, err := waitForDatabase(ctx, connString)
	if err != nil {
		_ = container.Terminate(ctx)
		t.Fatalf("connect db: %v", err)
	}

	if err := goose.SetDialect("postgres"); err != nil {
		_ = db.Close()
		_ = container.Terminate(ctx)
		t.Fatalf("goose dialect: %v", err)
	}

	migrationsDir := filepath.Join("..", "..", "migrations")
	if err := goose.Up(db.DB, migrationsDir); err != nil {
		_ = db.Close()
		_ = container.Terminate(ctx)
		t.Fatalf("migrate: %v", err)
	}

	seedAdmin(t, db)

	return db, func() {
		_ = db.Close()
		_ = container.Terminate(ctx)
	}
}

func waitForDatabase(ctx context.Context, connString string) (*sqlx.DB, error) {
	var lastErr error

	for attempt := 1; attempt <= 30; attempt++ {
		db, err := repository.NewDB(connString)
		if err == nil {
			pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
			pingErr := db.PingContext(pingCtx)
			cancel()

			if pingErr == nil {
				return db, nil
			}

			lastErr = pingErr
			_ = db.Close()
		} else {
			lastErr = err
		}

		time.Sleep(time.Second)
	}

	return nil, fmt.Errorf("database is not ready: %w", lastErr)
}

func seedAdmin(t *testing.T, db *sqlx.DB) {
	t.Helper()

	hash, err := bcrypt.GenerateFromPassword([]byte("password123456"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}

	_, err = db.Exec(
		`INSERT INTO admins (email, password_hash) VALUES ($1, $2)`,
		"admin@example.com",
		string(hash),
	)
	if err != nil {
		t.Fatal(err)
	}
}

func login(t *testing.T, baseURL string, email string, password string) *http.Cookie {
	t.Helper()

	payload := map[string]string{
		"email":    email,
		"password": password,
	}

	body, _ := json.Marshal(payload)

	res, err := http.Post(baseURL+"/api/v1/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Fatalf("login status = %d", res.StatusCode)
	}

	for _, cookie := range res.Cookies() {
		if cookie.Name == "admin_session" {
			return cookie
		}
	}

	t.Fatal("admin_session cookie not set")
	return nil
}

func assertJSONStatus(t *testing.T, method string, url string, payload any, want int) {
	t.Helper()

	var body *bytes.Reader
	if payload != nil {
		data, _ := json.Marshal(payload)
		body = bytes.NewReader(data)
	} else {
		body = bytes.NewReader(nil)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		t.Fatal(err)
	}

	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()

	if res.StatusCode != want {
		t.Fatalf("%s %s: expected status %d, got %d", method, url, want, res.StatusCode)
	}
}

func assertAuthenticatedJSONStatus(
	t *testing.T,
	cookie *http.Cookie,
	method string,
	url string,
	payload any,
	want int,
) {
	t.Helper()

	data, _ := json.Marshal(payload)

	req, err := http.NewRequest(method, url, bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(cookie)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()

	if res.StatusCode != want {
		t.Fatalf("%s %s: expected status %d, got %d", method, url, want, res.StatusCode)
	}
}

func postAuthenticatedJSON[T any](
	t *testing.T,
	cookie *http.Cookie,
	url string,
	payload any,
	want int,
) T {
	t.Helper()

	data, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(cookie)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()

	if res.StatusCode != want {
		t.Fatalf("POST %s: expected status %d, got %d", url, want, res.StatusCode)
	}

	var result T
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	return result
}
