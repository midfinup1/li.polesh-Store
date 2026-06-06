package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
)

// rateLimiter is a per-IP fixed-window limiter implemented with the standard
// library only (no extra modules). It is sufficient for protecting low-volume,
// abuse-prone endpoints (login brute-force, order-form spam) on a single
// instance. For multi-instance deployments move this to a shared store (Redis).
type rateLimiter struct {
	mu       sync.Mutex
	window   time.Duration
	limit    int
	counters map[string]*windowCounter
}

type windowCounter struct {
	count   int
	resetAt time.Time
}

// RateLimit returns middleware allowing at most `limit` requests per `window`
// per client IP. Requests over the limit get HTTP 429 with Retry-After.
func RateLimit(limit int, window time.Duration) func(http.Handler) http.Handler {
	rl := &rateLimiter{
		window:   window,
		limit:    limit,
		counters: make(map[string]*windowCounter),
	}
	go rl.cleanupLoop()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			if retryAfter, ok := rl.allow(ip); !ok {
				w.Header().Set("Retry-After", retryAfter)
				writeJSONError(w, http.StatusTooManyRequests, "too many requests, please slow down")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (rl *rateLimiter) allow(ip string) (string, bool) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	c, exists := rl.counters[ip]
	if !exists || now.After(c.resetAt) {
		rl.counters[ip] = &windowCounter{count: 1, resetAt: now.Add(rl.window)}
		return "", true
	}

	if c.count >= rl.limit {
		secs := int(time.Until(c.resetAt).Seconds()) + 1
		return itoa(secs), false
	}

	c.count++
	return "", true
}

func (rl *rateLimiter) cleanupLoop() {
	ticker := time.NewTicker(rl.window)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		rl.mu.Lock()
		for ip, c := range rl.counters {
			if now.After(c.resetAt) {
				delete(rl.counters, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func clientIP(r *http.Request) string {
	// chi's RealIP middleware has already normalised RemoteAddr from
	// X-Forwarded-For / X-Real-IP when running behind Caddy.
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
