package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

type AnalyticsHandler struct {
	svc *service.AnalyticsService
}

func NewAnalyticsHandler(svc *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

func (h *AnalyticsHandler) Track(w http.ResponseWriter, r *http.Request) {
	var input domain.AnalyticsTrackInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	if err := h.svc.Track(r.Context(), input, r.UserAgent(), r.Referer()); err != nil {
		slog.Error("failed to track analytics event", "error", err)
		respondServiceError(w, err, "failed to track analytics event")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AnalyticsHandler) Summary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.svc.Summary(r.Context())
	if err != nil {
		slog.Error("failed to fetch analytics", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to fetch analytics")
		return
	}

	respondOK(w, summary)
}