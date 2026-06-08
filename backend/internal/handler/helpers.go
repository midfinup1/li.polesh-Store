package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/middleware"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

func respondOK(w http.ResponseWriter, data any) {
	respondJSON(w, http.StatusOK, data)
}

func respondCreated(w http.ResponseWriter, data any) {
	respondJSON(w, http.StatusCreated, data)
}

// respondServiceError maps domain sentinel errors (and sql.ErrNoRows) to the
// correct HTTP status. Without this, client mistakes like "title is required"
// would surface as 500, polluting 5xx metrics and alerting.
func respondServiceError(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, domain.ErrValidation):
		respondError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrNotFound), errors.Is(err, sql.ErrNoRows):
		respondError(w, http.StatusNotFound, fallback)
	case errors.Is(err, domain.ErrConflict):
		respondError(w, http.StatusConflict, err.Error())
	default:
		respondError(w, http.StatusInternalServerError, fallback)
	}
}

func adminClaimsFromRequest(r *http.Request) (*service.TokenClaims, bool) {
	claims, ok := r.Context().Value(middleware.AdminKey).(*service.TokenClaims)
	return claims, ok && claims != nil
}

func recordAdminAudit(
	r *http.Request,
	audit *service.AuditService,
	action string,
	entityType string,
	entityID *int64,
	metadata map[string]any,
) {
	if audit == nil {
		return
	}

	claims, ok := adminClaimsFromRequest(r)
	if !ok {
		return
	}

	if err := audit.Record(r.Context(), claims.AdminID, claims.Email, action, entityType, entityID, metadata); err != nil {
		slog.Error(
			"failed to record admin audit log",
			"admin_id", claims.AdminID,
			"action", action,
			"entity_type", entityType,
			"error", err,
		)
	}
}
