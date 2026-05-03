package respond_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/getmetraly/metraly/cmd/api/respond"
)

func TestJSON(t *testing.T) {
	w := httptest.NewRecorder()
	respond.JSON(w, http.StatusOK, map[string]string{"status": "ok"})

	res := w.Result()
	if res.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}
	if ct := res.Header.Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}
	body := w.Body.String()
	if !strings.Contains(body, `"status"`) {
		t.Fatalf("unexpected body: %s", body)
	}
}

func TestErrorResponse(t *testing.T) {
	w := httptest.NewRecorder()
	respond.Error(w, http.StatusNotFound, "NOT_FOUND", "dashboard not found")

	body := w.Body.String()
	if !strings.Contains(body, `"NOT_FOUND"`) {
		t.Fatalf("expected NOT_FOUND in body: %s", body)
	}
}
