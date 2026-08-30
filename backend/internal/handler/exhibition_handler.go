package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

type ExhibitionHandler struct {
	svc   *service.ExhibitionService
	audit *service.AuditService
}

func NewExhibitionHandler(svc *service.ExhibitionService, audit *service.AuditService) *ExhibitionHandler {
	return &ExhibitionHandler{svc: svc, audit: audit}
}

func (h *ExhibitionHandler) List(w http.ResponseWriter, r *http.Request) {
	series, err := h.svc.List(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch series")
		return
	}

	respondOK(w, series)
}

func (h *ExhibitionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var series domain.Exhibition
	if err := decodeJSONBody(w, r, &series, maxAdminJSONBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	created, err := h.svc.Create(r.Context(), &series)
	if err != nil {
		respondServiceError(w, err, "failed to create series")
		return
	}

	recordAdminAudit(r, h.audit, "series.create", "series", &created.ID, map[string]any{
		"name": created.Name,
		"slug": created.Slug,
	})
	respondCreated(w, created)
}

func (h *ExhibitionHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	oldExhibition, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondServiceError(w, err, "series not found")
		return
	}

	var series domain.Exhibition
	if err := decodeJSONBody(w, r, &series, maxAdminJSONBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	series.ID = id

	updated, err := h.svc.Update(r.Context(), &series)
	if err != nil {
		respondServiceError(w, err, "failed to update series")
		return
	}

	recordAdminAudit(r, h.audit, "series.update", "series", &updated.ID, map[string]any{
		"old": map[string]any{
			"name":       oldExhibition.Name,
			"name_en":    oldExhibition.NameEN,
			"slug":       oldExhibition.Slug,
			"sort_order": oldExhibition.SortOrder,
		},
		"new": map[string]any{
			"name":       updated.Name,
			"name_en":    updated.NameEN,
			"slug":       updated.Slug,
			"sort_order": updated.SortOrder,
		},
	})
	respondOK(w, updated)
}

func (h *ExhibitionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	oldExhibition, _ := h.svc.GetByID(r.Context(), id)

	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondServiceError(w, err, "failed to delete series")
		return
	}

	metadata := map[string]any{}
	if oldExhibition != nil {
		metadata["old"] = oldExhibition
	}
	recordAdminAudit(r, h.audit, "series.delete", "series", &id, metadata)
	w.WriteHeader(http.StatusNoContent)
}

func (h *ExhibitionHandler) Reorder(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDs []int64 `json:"series_ids"`
	}
	if err := decodeJSONBody(w, r, &body, maxAdminJSONBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if err := h.svc.Reorder(r.Context(), body.IDs); err != nil {
		respondServiceError(w, err, "failed to reorder series")
		return
	}
	recordAdminAudit(r, h.audit, "series.reorder", "series", nil, map[string]any{"series_ids": body.IDs})
	w.WriteHeader(http.StatusNoContent)
}
