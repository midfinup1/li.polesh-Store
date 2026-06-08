package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type analyticsRepository struct {
	db *sqlx.DB
}

func NewAnalyticsRepository(db *sqlx.DB) domain.AnalyticsRepository {
	return &analyticsRepository{db: db}
}

func (r *analyticsRepository) CreateEvent(ctx context.Context, event *domain.AnalyticsEvent) error {
	_, err := r.db.ExecContext(
		ctx,
		`
			INSERT INTO analytics_events (
				path,
				artwork_id,
				category_id,
				event_type,
				user_agent,
				referrer
			)
			VALUES ($1, $2, $3, $4, $5, $6)
		`,
		event.Path,
		event.ArtworkID,
		event.CategoryID,
		event.EventType,
		event.UserAgent,
		event.Referrer,
	)

	return err
}

func (r *analyticsRepository) Summary(ctx context.Context) (*domain.AnalyticsSummary, error) {
	summary := &domain.AnalyticsSummary{
		TopArtworks:    make([]domain.AnalyticsArtworkMetric, 0),
		TopPages:       make([]domain.AnalyticsMetric, 0),
		CategoryClicks: make([]domain.AnalyticsMetric, 0),
	}

	if err := r.db.GetContext(
		ctx,
		&summary.Views7Days,
		`
			SELECT COUNT(*)
			FROM analytics_events
			WHERE event_type = 'page_view'
			  AND created_at >= NOW() - INTERVAL '7 days'
		`,
	); err != nil {
		return nil, err
	}

	if err := r.db.GetContext(
		ctx,
		&summary.Views30Days,
		`
			SELECT COUNT(*)
			FROM analytics_events
			WHERE event_type = 'page_view'
			  AND created_at >= NOW() - INTERVAL '30 days'
		`,
	); err != nil {
		return nil, err
	}

	if err := r.db.GetContext(
		ctx,
		&summary.ArtworkViews30,
		`
			SELECT COUNT(*)
			FROM analytics_events
			WHERE event_type = 'page_view'
			  AND artwork_id IS NOT NULL
			  AND created_at >= NOW() - INTERVAL '30 days'
		`,
	); err != nil {
		return nil, err
	}

	if err := r.db.GetContext(
		ctx,
		&summary.Orders30Days,
		`
			SELECT COUNT(*)
			FROM orders
			WHERE created_at >= NOW() - INTERVAL '30 days'
		`,
	); err != nil {
		return nil, err
	}

	if summary.ArtworkViews30 > 0 {
		summary.Conversion30 = float64(summary.Orders30Days) / float64(summary.ArtworkViews30) * 100
	}

	if err := r.db.SelectContext(
		ctx,
		&summary.TopArtworks,
		`
			SELECT
				a.id AS artwork_id,
				a.title AS title,
				a.title_en AS title_en,
				COUNT(e.id) AS views
			FROM analytics_events e
			JOIN artworks a ON a.id = e.artwork_id
			WHERE e.event_type = 'page_view'
			  AND e.artwork_id IS NOT NULL
			  AND e.created_at >= NOW() - INTERVAL '30 days'
			GROUP BY a.id, a.title, a.title_en
			ORDER BY views DESC, a.title ASC
			LIMIT 5
		`,
	); err != nil {
		return nil, err
	}

	if err := r.db.SelectContext(
		ctx,
		&summary.TopPages,
		`
			SELECT
				path AS label,
				COUNT(id) AS value
			FROM analytics_events
			WHERE event_type = 'page_view'
			  AND created_at >= NOW() - INTERVAL '30 days'
			GROUP BY path
			ORDER BY value DESC, path ASC
			LIMIT 8
		`,
	); err != nil {
		return nil, err
	}

	if err := r.db.SelectContext(
		ctx,
		&summary.CategoryClicks,
		`
			SELECT
				COALESCE(c.name, e.path) AS label,
				COUNT(e.id) AS value
			FROM analytics_events e
			LEFT JOIN categories c ON c.id = e.category_id
			WHERE e.event_type = 'category_click'
			  AND e.created_at >= NOW() - INTERVAL '30 days'
			GROUP BY COALESCE(c.name, e.path)
			ORDER BY value DESC, label ASC
			LIMIT 8
		`,
	); err != nil {
		return nil, err
	}

	return summary, nil
}