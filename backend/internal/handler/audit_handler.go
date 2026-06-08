package handler

import (
	"net/http"
	"strconv"

	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

type AuditHandler struct {
	svc *service.AuditService
}

func NewAuditHandler(svc *service.AuditService) *AuditHandler {
	return &AuditHandler{svc: svc}
}

func (h *AuditHandler) List(w http.ResponseWriter, r *http.Request) {
	limit := 100
	if raw := r.URL.Query().Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			respondError(w, http.StatusBadRequest, "invalid limit")
			return
		}
		limit = parsed
	}

	logs, err := h.svc.ListRecent(r.Context(), limit)
	if err != nil {
		respondServiceError(w, err, "failed to fetch audit logs")
		return
	}

	respondOK(w, logs)
}
