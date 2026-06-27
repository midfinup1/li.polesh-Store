package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type AnalyticsService struct {
	repo domain.AnalyticsRepository
}

const maxAnalyticsPathLength = 512

func NewAnalyticsService(repo domain.AnalyticsRepository) *AnalyticsService {
	return &AnalyticsService{repo: repo}
}

func (s *AnalyticsService) Track(ctx context.Context, input domain.AnalyticsTrackInput, userAgent string, referrer string) error {
	path := strings.TrimSpace(input.Path)
	if path == "" || !strings.HasPrefix(path, "/") {
		return fmt.Errorf("%w: path is required", domain.ErrValidation)
	}
	if len(path) > maxAnalyticsPathLength {
		return fmt.Errorf("%w: path is too long", domain.ErrValidation)
	}

	eventType := input.EventType
	if eventType == "" {
		eventType = domain.AnalyticsEventPageView
	}

	if eventType != domain.AnalyticsEventPageView && eventType != domain.AnalyticsEventCategoryClick {
		return fmt.Errorf("%w: invalid analytics event type", domain.ErrValidation)
	}

	event := &domain.AnalyticsEvent{
		Path:       path,
		ArtworkID:  input.ArtworkID,
		CategoryID: input.CategoryID,
		EventType:  eventType,
		UserAgent:  trimForStorage(userAgent, 600),
		Referrer:   trimForStorage(referrer, 600),
	}

	return s.repo.CreateEvent(ctx, event)
}

func (s *AnalyticsService) Summary(ctx context.Context) (*domain.AnalyticsSummary, error) {
	return s.repo.Summary(ctx)
}

func (s *AnalyticsService) CleanupOldEvents(ctx context.Context, retentionDays int) (int64, error) {
	if retentionDays <= 0 {
		return 0, nil
	}

	before := time.Now().AddDate(0, 0, -retentionDays)
	return s.repo.CleanupOldEvents(ctx, before)
}

func (s *AnalyticsService) RunRetentionCleanup(ctx context.Context, retentionDays int, interval time.Duration) {
	if retentionDays <= 0 {
		slog.Info("analytics retention cleanup disabled", "retention_days", retentionDays)
		return
	}

	run := func() {
		cleanupCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()

		deleted, err := s.CleanupOldEvents(cleanupCtx, retentionDays)
		if err != nil {
			slog.Error("failed to cleanup old analytics events", "retention_days", retentionDays, "error", err)
			return
		}

		if deleted > 0 {
			slog.Info("old analytics events cleaned up", "retention_days", retentionDays, "deleted", deleted)
		}
	}

	run()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("analytics retention cleanup stopped")
			return
		case <-ticker.C:
			run()
		}
	}
}

func trimForStorage(value string, limit int) string {
	value = strings.TrimSpace(value)
	if len(value) <= limit {
		return value
	}
	return value[:limit]
}
