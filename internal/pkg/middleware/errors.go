package middleware

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/getmetraly/metraly/internal/pkg/logger"
	"github.com/getmetraly/metraly/internal/pkg/middleware/apperrors"
)

func ErrorHandler(log logger.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			defer func() {
				if rec := recover(); rec != nil {
					log.Error("panic recovered: %v", rec)
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(apperrors.InternalError("internal server error"))
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

func WriteError(w http.ResponseWriter, err error) {
	var appErr *apperrors.AppError
	if errors.As(err, &appErr) {
		w.WriteHeader(appErr.Status)
		json.NewEncoder(w).Encode(appErr)
		return
	}

	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(apperrors.InternalError("internal server error"))
}