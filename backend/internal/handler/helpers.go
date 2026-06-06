package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
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
