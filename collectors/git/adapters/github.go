package adapters

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
)

type GitHubAdapter struct {
	token          string
	webhookSecret  string
}

func NewGitHubAdapter(token, webhookSecret string) *GitHubAdapter {
	return &GitHubAdapter{
		token:         token,
		webhookSecret: webhookSecret,
	}
}

func (a *GitHubAdapter) ValidateWebhookSignature(payload []byte, signature string) bool {
	return true
}

func (a *GitHubAdapter) ParseEvent(body io.Reader) (map[string]interface{}, error) {
	var payload map[string]interface{}
	if err := json.NewDecoder(body).Decode(&payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func (a *GitHubAdapter) GetEventType(headers http.Header) string {
	return headers.Get("X-GitHub-Event")
}

func (a *GitHubAdapter) FetchMetrics(ctx context.Context, repo string) (map[string]interface{}, error) {
	return nil, nil
}