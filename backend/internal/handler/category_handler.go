package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

// ─── Category ─────────────────────────────────────────────────────────────────

type CategoryHandler struct {
	svc   *service.CategoryService
	audit *service.AuditService
}

func NewCategoryHandler(svc *service.CategoryService, audit *service.AuditService) *CategoryHandler {
	return &CategoryHandler{svc: svc, audit: audit}
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	cats, err := h.svc.List(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch categories")
		return
	}
	respondOK(w, cats)
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var c domain.Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	created, err := h.svc.Create(r.Context(), &c)
	if err != nil {
		respondServiceError(w, err, "failed to create category")
		return
	}
	recordAdminAudit(r, h.audit, "category.create", "category", &created.ID, map[string]any{
		"name": created.Name,
		"slug": created.Slug,
	})
	respondCreated(w, created)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	oldCategory, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondServiceError(w, err, "category not found")
		return
	}

	var c domain.Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	c.ID = id
	updated, err := h.svc.Update(r.Context(), &c)
	if err != nil {
		respondServiceError(w, err, "failed to update category")
		return
	}
	recordAdminAudit(r, h.audit, "category.update", "category", &updated.ID, map[string]any{
		"old": map[string]any{
			"name":       oldCategory.Name,
			"name_en":    oldCategory.NameEN,
			"slug":       oldCategory.Slug,
			"sort_order": oldCategory.SortOrder,
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

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	oldCategory, _ := h.svc.GetByID(r.Context(), id)

	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondServiceError(w, err, "failed to delete category")
		return
	}
	metadata := map[string]any{}
	if oldCategory != nil {
		metadata["old"] = oldCategory
	}
	recordAdminAudit(r, h.audit, "category.delete", "category", &id, metadata)
	w.WriteHeader(http.StatusNoContent)
}
