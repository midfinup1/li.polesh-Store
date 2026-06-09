package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

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
