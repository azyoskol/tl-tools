package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/getmetraly/metraly/internal/pkg/biz"
)

func TestWebhook_returns400_onInvalidJSON(t *testing.T) {
	h := NewWebhookHandler(&mockWebhookService{})
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/collectors", strings.NewReader("not json"))
	h.Receive(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestWebhook_returns200_onValidPayload(t *testing.T) {
	h := NewWebhookHandler(&mockWebhookService{})
	body, _ := json.Marshal(biz.WebhookRequest{
		Source:    "git",
		EventType: "pr_opened",
		TeamID:    "team-1",
		Payload:   map[string]any{"pr_id": 42},
	})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/collectors", bytes.NewReader(body))
	h.Receive(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]string
	json.NewDecoder(rec.Body).Decode(&resp)
	if resp["status"] != "ok" {
		t.Errorf("expected status ok, got %q", resp["status"])
	}
	if resp["received"] != "pr_opened" {
		t.Errorf("expected received=pr_opened, got %q", resp["received"])
	}
}

func TestWebhook_setsDefaultTeamID_whenEmpty(t *testing.T) {
	h := NewWebhookHandler(&mockWebhookService{})
	body, _ := json.Marshal(biz.WebhookRequest{
		Source:    "git",
		EventType: "pr_opened",
		TeamID:    "",
	})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/collectors", bytes.NewReader(body))
	h.Receive(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 even with empty team_id, got %d", rec.Code)
	}
}
