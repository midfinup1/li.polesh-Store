package middleware

import (
	"context"
	"github.com/midfinup1/li.polesh-Store/backend/internal/service"
	"net/http"
	"strings"
)

type contextKey string

const AdminKey contextKey = "admin"

type Auth struct{ authSvc *service.AuthService }

func NewAuth(authSvc *service.AuthService) *Auth { return &Auth{authSvc: authSvc} }
func (m *Auth) Require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
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
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		claims, err := m.authSvc.ValidateToken(token)
		if err != nil {
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), AdminKey, claims)))
	})
}
