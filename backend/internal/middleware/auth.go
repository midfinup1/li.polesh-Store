package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
)

type contextKey string

const AdminKey contextKey = "admin"

type Auth struct{ authSvc *service.AuthService }

func NewAuth(authSvc *service.AuthService) *Auth { return &Auth{authSvc: authSvc} }

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(`{"error":"` + message + `"}`))
}

func (m *Auth) Require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := ""
		if header := r.Header.Get("Authorization"); strings.HasPrefix(header, "Bearer ") {
			token = strings.TrimPrefix(header, "Bearer ")
		}
		if token == "" {
			if cookie, err := r.Cookie("admin_session"); err == nil {
				token = cookie.Value
			}
		}
		if token == "" {
			writeJSONError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		claims, err := m.authSvc.ValidateToken(token)
		if err != nil {
			writeJSONError(w, http.StatusUnauthorized, "invalid token")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), AdminKey, claims)))
	})
}
