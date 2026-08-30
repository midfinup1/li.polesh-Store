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
	exhibitions, err := h.svc.List(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch exhibitions")
		return
	}

	respondOK(w, exhibitions)
}

func (h *ExhibitionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var exhibition domain.Exhibition
	if err := decodeJSONBody(w, r, &exhibition, maxAdminJSONBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	created, err := h.svc.Create(r.Context(), &exhibition)
	if err != nil {
		respondServiceError(w, err, "failed to create exhibition")
		return
	}

	recordAdminAudit(r, h.audit, "exhibition.create", "exhibition", &created.ID, map[string]any{
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
		respondServiceError(w, err, "exhibition not found")
		return
	}

	var exhibition domain.Exhibition
	if err := decodeJSONBody(w, r, &exhibition, maxAdminJSONBodyBytes); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	exhibition.ID = id

	updated, err := h.svc.Update(r.Context(), &exhibition)
	if err != nil {
		respondServiceError(w, err, "failed to update exhibition")
		return
	}

	recordAdminAudit(r, h.audit, "exhibition.update", "exhibition", &updated.ID, map[string]any{
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
		respondServiceError(w, err, "failed to delete exhibition")
		return
	}

	metadata := map[string]any{}
	if oldExhibition != nil {
		metadata["old"] = oldExhibition
	}
	recordAdminAudit(r, h.audit, "exhibition.delete", "exhibition", &id, metadata)
	w.WriteHeader(http.StatusNoContent)
}
