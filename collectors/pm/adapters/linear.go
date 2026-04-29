package adapters

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"
)

func FetchLinearIssues(ctx context.Context, teamID string, config map[string]string, saveEvent func(Event)) {
	apiKey := config["api_key"]

	if apiKey == "" {
		log.Printf("Linear config incomplete for team %s", teamID)
		return
	}

	log.Printf("Polling Linear for team %s", teamID)
}

type LinearClient struct {
	APIKey string
	Client *http.Client
}

func NewLinearClient(apiKey string) *LinearClient {
	return &LinearClient{
		APIKey: apiKey,
		Client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *LinearClient) FetchIssues() ([]map[string]interface{}, error) {
	return nil, nil
}

func init() {
	_ = fmt.Sprintf("%s", "")
}