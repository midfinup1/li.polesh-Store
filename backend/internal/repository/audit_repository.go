package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type adminAuditLogRepository struct {
	db *sqlx.DB
}

func NewAdminAuditLogRepository(db *sqlx.DB) domain.AdminAuditLogRepository {
	return &adminAuditLogRepository{db: db}
}

func (r *adminAuditLogRepository) Create(ctx context.Context, log *domain.AdminAuditLog) error {
	metadata := log.Metadata
	if len(metadata) == 0 {
		metadata = json.RawMessage(`{}`)
	}

	if !json.Valid(metadata) {
		return fmt.Errorf("invalid audit metadata json")
	}

	_, err := r.db.ExecContext(
		ctx,
		`
			INSERT INTO admin_audit_logs (
				admin_id,
				admin_email,
				action,
				entity_type,
				entity_id,
				metadata
			)
			VALUES ($1, $2, $3, $4, $5, $6::jsonb)
		`,
		log.AdminID,
		log.AdminEmail,
		log.Action,
		log.EntityType,
		log.EntityID,
		string(metadata),
	)

	return err
}

func (r *adminAuditLogRepository) GetRecent(ctx context.Context, limit int) ([]domain.AdminAuditLog, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}

	logs := make([]domain.AdminAuditLog, 0)

	err := r.db.SelectContext(
		ctx,
		&logs,
		`
			SELECT
				id,
				admin_id,
				admin_email,
				action,
				entity_type,
				entity_id,
				metadata,
				created_at
			FROM admin_audit_logs
			ORDER BY created_at DESC, id DESC
			LIMIT $1
		`,
		limit,
	)
	if err != nil {
		return nil, err
	}

	return logs, nil
}
