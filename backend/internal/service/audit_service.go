package service

import (
	"context"
	"encoding/json"
	"log/slog"
	"strings"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
)

type AuditService struct {
	repo domain.AdminAuditLogRepository
}

func NewAuditService(repo domain.AdminAuditLogRepository) *AuditService {
	return &AuditService{repo: repo}
}

func (s *AuditService) ListRecent(ctx context.Context, limit int) ([]domain.AdminAuditLog, error) {
	return s.repo.GetRecent(ctx, limit)
}

func (s *AuditService) Record(
	ctx context.Context,
	adminID int64,
	adminEmail string,
	action string,
	entityType string,
	entityID *int64,
	metadata map[string]any,
) error {
	action = strings.TrimSpace(action)
	entityType = strings.TrimSpace(entityType)
	adminEmail = strings.TrimSpace(adminEmail)

	if action == "" || entityType == "" {
		return nil
	}

	if metadata == nil {
		metadata = map[string]any{}
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return err
	}

	log := &domain.AdminAuditLog{
		AdminID:    &adminID,
		AdminEmail: adminEmail,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Metadata:   metadataJSON,
	}

	if err := s.repo.Create(ctx, log); err != nil {
		return err
	}

	attrs := []any{
		"admin_id", adminID,
		"admin_email", adminEmail,
		"action", action,
		"entity_type", entityType,
	}
	if entityID != nil {
		attrs = append(attrs, "entity_id", *entityID)
	}

	slog.Info("admin action recorded", attrs...)

	return nil
}
