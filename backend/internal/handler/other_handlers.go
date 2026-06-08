package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

// ─── Auth ─────────────────────────────────────────────────────────────────────

type AuthHandler struct {
	svc          *service.AuthService
	secureCookie bool
	maxAge       int
}

func NewAuthHandler(svc *service.AuthService, secureCookie bool, maxAge int) *AuthHandler {
	return &AuthHandler{svc: svc, secureCookie: secureCookie, maxAge: maxAge}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}

	token, err := h.svc.Login(r.Context(), body.Email, body.Password)
	if err != nil {
		slog.Warn("admin login failed", "email", strings.TrimSpace(body.Email), "remote_addr", r.RemoteAddr)
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	slog.Info("admin login succeeded", "email", strings.TrimSpace(body.Email), "remote_addr", r.RemoteAddr)
	http.SetCookie(w, &http.Cookie{Name: "admin_session", Value: token, Path: "/", HttpOnly: true, Secure: h.secureCookie, SameSite: http.SameSiteStrictMode, MaxAge: h.maxAge})
	respondOK(w, map[string]string{"status": "authenticated"})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "admin_session", Value: "", Path: "/", HttpOnly: true, Secure: h.secureCookie, SameSite: http.SameSiteStrictMode, MaxAge: -1})
	w.WriteHeader(http.StatusNoContent)
}

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
		"name":       updated.Name,
		"slug":       updated.Slug,
		"sort_order": updated.SortOrder,
	})
	respondOK(w, updated)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondServiceError(w, err, "failed to delete category")
		return
	}
	recordAdminAudit(r, h.audit, "category.delete", "category", &id, nil)
	w.WriteHeader(http.StatusNoContent)
}

// ─── Order ────────────────────────────────────────────────────────────────────

type OrderHandler struct {
	svc   *service.OrderService
	audit *service.AuditService
}

func NewOrderHandler(svc *service.OrderService, audit *service.AuditService) *OrderHandler {
	return &OrderHandler{svc: svc, audit: audit}
}

func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var o domain.Order
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	created, err := h.svc.Create(r.Context(), &o)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}
	respondCreated(w, created)
}

func (h *OrderHandler) List(w http.ResponseWriter, r *http.Request) {
	orders, err := h.svc.List(r.Context(), nil)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch orders")
		return
	}
	respondOK(w, orders)
}

func (h *OrderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	order, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "order not found")
		return
	}
	respondOK(w, order)
}

func (h *OrderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		Status domain.OrderStatus `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	oldOrder, _ := h.svc.GetByID(r.Context(), id)
	if err := h.svc.UpdateStatus(r.Context(), id, body.Status); err != nil {
		respondServiceError(w, err, "failed to update order status")
		return
	}
	metadata := map[string]any{
		"new_status": body.Status,
	}
	if oldOrder != nil {
		metadata["old_status"] = oldOrder.Status
		metadata["artwork_id"] = oldOrder.ArtworkID
	}
	recordAdminAudit(r, h.audit, "order.status_update", "order", &id, metadata)
	w.WriteHeader(http.StatusOK)
}

func (h *OrderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondServiceError(w, err, "failed to delete order")
		return
	}
	recordAdminAudit(r, h.audit, "order.delete", "order", &id, nil)

	w.WriteHeader(http.StatusNoContent)
}

// ─── Artist ───────────────────────────────────────────────────────────────────

type ArtistHandler struct {
	svc   *service.ArtistService
	audit *service.AuditService
}

func NewArtistHandler(svc *service.ArtistService, audit *service.AuditService) *ArtistHandler {
	return &ArtistHandler{svc: svc, audit: audit}
}

func (h *ArtistHandler) Get(w http.ResponseWriter, r *http.Request) {
	artist, err := h.svc.Get(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch artist")
		return
	}
	respondOK(w, artist)
}

func (h *ArtistHandler) UploadPhoto(w http.ResponseWriter, r *http.Request) {
	slot := chi.URLParam(r, "slot")
	if slot != "home" && slot != "about" {
		respondError(w, http.StatusBadRequest, "invalid photo slot")
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		respondError(w, http.StatusBadRequest, "image is too large")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		respondError(w, http.StatusBadRequest, "image file required")
		return
	}
	defer file.Close()

	updated, err := h.svc.UploadPhoto(r.Context(), slot, file, header)
	if err != nil {
		respondServiceError(w, err, "failed to upload artist photo")
		return
	}
	recordAdminAudit(r, h.audit, "artist.photo_upload", "artist", &updated.ID, map[string]any{
		"slot":     slot,
		"filename": header.Filename,
	})

	respondOK(w, updated)
}

func (h *ArtistHandler) Update(w http.ResponseWriter, r *http.Request) {
	var a domain.Artist
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	updated, err := h.svc.Update(r.Context(), &a)
	if err != nil {
		respondServiceError(w, err, "failed to update artist")
		return
	}
	recordAdminAudit(r, h.audit, "artist.update", "artist", &updated.ID, nil)
	respondOK(w, updated)
}
