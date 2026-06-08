package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type AnalyticsService struct {
	repo domain.AnalyticsRepository
}

func NewAnalyticsService(repo domain.AnalyticsRepository) *AnalyticsService {
	return &AnalyticsService{repo: repo}
}

func (s *AnalyticsService) Track(ctx context.Context, input domain.AnalyticsTrackInput, userAgent string, referrer string) error {
	path := strings.TrimSpace(input.Path)
	if path == "" || !strings.HasPrefix(path, "/") {
		return fmt.Errorf("%w: path is required", domain.ErrValidation)
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

func trimForStorage(value string, limit int) string {
	value = strings.TrimSpace(value)
	if len(value) <= limit {
		return value
	}
	return value[:limit]
}