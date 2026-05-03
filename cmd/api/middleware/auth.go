package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/getmetraly/metraly/cmd/api/auth"
	"github.com/getmetraly/metraly/cmd/api/respond"
)

type contextKey string

const ClaimsKey contextKey = "claims"

func RequireAuth(km *auth.KeyManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Auth-Checked", "true")
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				respond.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing token")
				return
			}
			claims, err := km.Validate(strings.TrimPrefix(header, "Bearer "))
			if err != nil {
				respond.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid token")
				return
			}
			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(ClaimsKey).(*auth.Claims)
			if !ok || !allowed[claims.Role] {
				respond.Error(w, http.StatusForbidden, "FORBIDDEN", "insufficient role")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func ClaimsFrom(ctx context.Context) *auth.Claims {
	c, _ := ctx.Value(ClaimsKey).(*auth.Claims)
	return c
}
