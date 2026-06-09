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
			VALUES (
				(SELECT id FROM admins WHERE id = $1),
				$2,
				$3,
				$4,
				$5,
				$6::jsonb
			)
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

func (r *adminAuditLogRepository) GetRecent(ctx context.Context, filter domain.AdminAuditLogFilter) (*domain.AdminAuditLogPage, error) {
	if filter.Limit <= 0 || filter.Limit > 200 {
		filter.Limit = 50
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	where := ` WHERE 1 = 1`
	args := make([]any, 0)
	argNumber := 1

	if filter.Action != "" {
		where += fmt.Sprintf(" AND action = $%d", argNumber)
		args = append(args, filter.Action)
		argNumber++
	}

	if filter.EntityType != "" {
		where += fmt.Sprintf(" AND entity_type = $%d", argNumber)
		args = append(args, filter.EntityType)
		argNumber++
	}

	if filter.AdminEmail != "" {
		where += fmt.Sprintf(" AND admin_email ILIKE $%d", argNumber)
		args = append(args, "%"+filter.AdminEmail+"%")
		argNumber++
	}

	if filter.DateFrom != nil {
		where += fmt.Sprintf(" AND created_at >= $%d", argNumber)
		args = append(args, *filter.DateFrom)
		argNumber++
	}

	if filter.DateTo != nil {
		where += fmt.Sprintf(" AND created_at < $%d", argNumber)
		args = append(args, *filter.DateTo)
		argNumber++
	}

	var total int64
	if err := r.db.GetContext(ctx, &total, `SELECT COUNT(*) FROM admin_audit_logs`+where, args...); err != nil {
		return nil, err
	}

	query := `
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
	` + where + fmt.Sprintf(" ORDER BY created_at DESC, id DESC LIMIT $%d OFFSET $%d", argNumber, argNumber+1)

	args = append(args, filter.Limit, filter.Offset)

	logs := make([]domain.AdminAuditLog, 0)
	if err := r.db.SelectContext(ctx, &logs, query, args...); err != nil {
		return nil, err
	}

	return &domain.AdminAuditLogPage{
		Items:  logs,
		Total:  total,
		Limit:  filter.Limit,
		Offset: filter.Offset,
	}, nil
}
