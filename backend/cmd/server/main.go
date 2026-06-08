package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/pressly/goose/v3"

	"github.com/midfinup1/li.polesh-Store/backend/config"
	"github.com/midfinup1/li.polesh-Store/backend/internal/handler"
	"github.com/midfinup1/li.polesh-Store/backend/internal/repository"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		panic(fmt.Sprintf("invalid configuration: %v", err))
	}

	logLevel := slog.LevelInfo
	if cfg.App.Env == "development" {
		logLevel = slog.LevelDebug
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))
	slog.SetDefault(logger)

	db, err := repository.NewDB(cfg.DB.URL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	logger.Info("connected to database")

	if err := goose.SetDialect("postgres"); err != nil {
		logger.Error("failed to configure migration dialect", "error", err)
		os.Exit(1)
	}

	if err := goose.Up(db.DB, "migrations"); err != nil {
		logger.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}

	logger.Info("migrations applied")

	repos := repository.NewRepositories(db)

	services := service.NewServices(service.Deps{
		Repos:  repos,
		Config: cfg,
	})

	cleanupCtx, cleanupCancel := context.WithCancel(context.Background())
	defer cleanupCancel()
	go services.Analytics.RunRetentionCleanup(cleanupCtx, cfg.Analytics.RetentionDays, 24*time.Hour)

	router := handler.NewRouter(handler.Deps{
		Services: services,
		Config:   cfg,
		Logger:   logger,
		DB:       db,
	})

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.App.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		logger.Info("server starting", "port", cfg.App.Port, "env", cfg.App.Env)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-quit

	cleanupCancel()

	logger.Info("shutting down server")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("forced shutdown", "error", err)
	}

	logger.Info("server stopped")
}
