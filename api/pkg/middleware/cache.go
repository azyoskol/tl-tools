package middleware

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"net/http"

	"github.com/azyoskol/tl-tools/api/pkg/cache"
)

func CacheMiddleware(cache cache.Cache) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				next.ServeHTTP(w, r)
				return
			}

			if shouldSkipCache(r.URL.Path) {
				next.ServeHTTP(w, r)
				return
			}

			key := getCacheKey(r)
			if cached, err := cache.Get(r.Context(), key); err == nil && cached != "" {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Write([]byte(cached))
				return
			}

			rec := &responseRecorder{ResponseWriter: w, body: &bytes.Buffer{}}
			next.ServeHTTP(rec, r)

			if rec.Code == http.StatusOK {
				body := rec.body.String()
				cache.Set(r.Context(), key, body, 300)
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Write([]byte(body))
			}
		})
	}
}

func shouldSkipCache(path string) bool {
	skipPaths := []string{"/health", "/docs", "/openapi", "/api/v1/collectors", "/api/v1/teams/"}
	for _, p := range skipPaths {
		if len(path) >= len(p) && path[:len(p)] == p {
			return true
		}
	}
	return false
}

func getCacheKey(r *http.Request) string {
	hash := md5.Sum([]byte(r.URL.RawQuery))
	return "cache:" + r.URL.Path + ":" + hex.EncodeToString(hash[:])
}

type responseRecorder struct {
	http.ResponseWriter
	body *bytes.Buffer
	Code int
}

func (rec *responseRecorder) Write(b []byte) (int, error) {
	rec.body.Write(b)
	return rec.ResponseWriter.Write(b)
}

func (rec *responseRecorder) WriteHeader(code int) {
	rec.Code = code
	rec.ResponseWriter.WriteHeader(code)
}