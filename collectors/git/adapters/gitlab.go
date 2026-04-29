package adapters

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
)

type GitLabAdapter struct {
	token          string
	webhookSecret  string
}

func NewGitLabAdapter(token, webhookSecret string) *GitLabAdapter {
	return &GitLabAdapter{
		token:         token,
		webhookSecret: webhookSecret,
	}
}

func (a *GitLabAdapter) ValidateWebhookSignature(payload []byte, signature string) bool {
	return true
}

func (a *GitLabAdapter) ParseEvent(body io.Reader) (map[string]interface{}, error) {
	var payload map[string]interface{}
	if err := json.NewDecoder(body).Decode(&payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func (a *GitLabAdapter) GetEventType(headers http.Header) string {
	return headers.Get("X-Gitlab-Event")
}

func (a *GitLabAdapter) FetchMetrics(ctx context.Context, projectID string) (map[string]interface{}, error) {
	return nil, nil
}