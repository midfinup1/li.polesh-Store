package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

type AuditHandler struct {
	svc *service.AuditService
}

func NewAuditHandler(svc *service.AuditService) *AuditHandler {
	return &AuditHandler{svc: svc}
}

func (h *AuditHandler) List(w http.ResponseWriter, r *http.Request) {
	limit := 50
	if raw := r.URL.Query().Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			respondError(w, http.StatusBadRequest, "invalid limit")
			return
		}
		limit = parsed
	}

	offset := 0
	if raw := r.URL.Query().Get("offset"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 0 {
			respondError(w, http.StatusBadRequest, "invalid offset")
			return
		}
		offset = parsed
	}

	q := r.URL.Query()
	filter := domain.AdminAuditLogFilter{
		Limit:      limit,
		Offset:     offset,
		Action:     strings.TrimSpace(q.Get("action")),
		EntityType: strings.TrimSpace(q.Get("entity_type")),
		AdminEmail: strings.TrimSpace(q.Get("admin_email")),
	}

	if raw := strings.TrimSpace(q.Get("date_from")); raw != "" {
		parsed, err := time.Parse("2006-01-02", raw)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid date_from")
			return
		}
		filter.DateFrom = &parsed
	}

	if raw := strings.TrimSpace(q.Get("date_to")); raw != "" {
		parsed, err := time.Parse("2006-01-02", raw)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid date_to")
			return
		}
		parsed = parsed.AddDate(0, 0, 1)
		filter.DateTo = &parsed
	}

	logs, err := h.svc.ListRecent(r.Context(), filter)
	if err != nil {
		respondServiceError(w, err, "failed to fetch audit logs")
		return
	}

	respondOK(w, logs)
}
