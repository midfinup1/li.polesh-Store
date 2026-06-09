package middleware

import (
	"net/http"
	"net/url"
	"strings"
)

func RequireSafeOrigin(allowedOrigins []string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		origin = strings.TrimRight(strings.TrimSpace(origin), "/")
		if origin != "" && origin != "*" {
			allowed[origin] = struct{}{}
		}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
				next.ServeHTTP(w, r)
				return
			}

			origin := strings.TrimRight(strings.TrimSpace(r.Header.Get("Origin")), "/")
			if origin == "" {
				origin = originFromReferer(r.Header.Get("Referer"))
			}

			if origin == "" || isAllowedOrigin(origin, r.Host, allowed) {
				next.ServeHTTP(w, r)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			_, _ = w.Write([]byte(`{"error":"forbidden origin"}`))
		})
	}
}

func originFromReferer(rawReferer string) string {
	if rawReferer == "" {
		return ""
	}

	parsed, err := url.Parse(rawReferer)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return ""
	}

	return parsed.Scheme + "://" + parsed.Host
}

func isAllowedOrigin(origin string, requestHost string, allowed map[string]struct{}) bool {
	if _, ok := allowed[origin]; ok {
		return true
	}

	parsed, err := url.Parse(origin)
	if err != nil {
		return false
	}

	return parsed.Host == requestHost
}
