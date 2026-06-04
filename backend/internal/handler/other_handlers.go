package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/midfinup1/li.polesh-Store/backend/internal/domain"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

// ─── Auth ─────────────────────────────────────────────────────────────────────

type AuthHandler struct {
	svc          *service.AuthService
	secureCookie bool
}

func NewAuthHandler(svc *service.AuthService, secureCookie bool) *AuthHandler {
	return &AuthHandler{svc: svc, secureCookie: secureCookie}
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
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "admin_session", Value: token, Path: "/", HttpOnly: true, Secure: h.secureCookie, SameSite: http.SameSiteStrictMode, MaxAge: 12 * 60 * 60})
	respondOK(w, map[string]string{"status": "authenticated"})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "admin_session", Value: "", Path: "/", HttpOnly: true, Secure: h.secureCookie, SameSite: http.SameSiteStrictMode, MaxAge: -1})
	w.WriteHeader(http.StatusNoContent)
}

// ─── Category ─────────────────────────────────────────────────────────────────

type CategoryHandler struct{ svc *service.CategoryService }

func NewCategoryHandler(svc *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc}
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
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
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
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondOK(w, updated)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ─── Order ────────────────────────────────────────────────────────────────────

type OrderHandler struct{ svc *service.OrderService }

func NewOrderHandler(svc *service.OrderService) *OrderHandler { return &OrderHandler{svc: svc} }

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
	if err := h.svc.UpdateStatus(r.Context(), id, body.Status); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusOK)
}

// ─── Artist ───────────────────────────────────────────────────────────────────

type ArtistHandler struct{ svc *service.ArtistService }

func NewArtistHandler(svc *service.ArtistService) *ArtistHandler { return &ArtistHandler{svc: svc} }

func (h *ArtistHandler) Get(w http.ResponseWriter, r *http.Request) {
	artist, err := h.svc.Get(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch artist")
		return
	}
	respondOK(w, artist)
}

func (h *ArtistHandler) Update(w http.ResponseWriter, r *http.Request) {
	var a domain.Artist
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	updated, err := h.svc.Update(r.Context(), &a)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondOK(w, updated)
}
