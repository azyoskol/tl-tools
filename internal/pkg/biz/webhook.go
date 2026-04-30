package biz

import (
	"context"
	"encoding/json"
)

type WebhookService struct {
	db DatabaseExec
}

type DatabaseExec interface {
	Exec(ctx context.Context, query string, args ...any) error
}

type WebhookRequest struct {
	Source    string         `json:"source"`
	EventType string         `json:"event_type"`
	TeamID    string         `json:"team_id"`
	Payload   map[string]any `json:"payload"`
}

type WebhookResponse struct {
	Status    string `json:"status"`
	EventType string `json:"received"`
}

func NewWebhookService(db DatabaseExec) *WebhookService {
	return &WebhookService{db: db}
}

func (s *WebhookService) Receive(ctx context.Context, req WebhookRequest) (WebhookResponse, error) {
	if req.TeamID == "" {
		req.TeamID = "550e8400-e29b-41d4-a716-446655440000"
	}

	payloadJSON, _ := json.Marshal(req.Payload)

	query := "INSERT INTO events (team_id, source_type, event_type, payload, occurred_at) VALUES (?, ?, ?, ?, now())"
	if err := s.db.Exec(ctx, query, req.TeamID, req.Source, req.EventType, string(payloadJSON)); err != nil {
		return WebhookResponse{}, err
	}

	return WebhookResponse{
		Status:    "ok",
		EventType: req.EventType,
	}, nil
}