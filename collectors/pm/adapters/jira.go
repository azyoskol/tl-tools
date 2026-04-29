package adapters

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"
)

func FetchJiraIssues(ctx context.Context, teamID string, config map[string]string, saveEvent func(Event)) {
	url := config["url"]
	email := config["email"]
	apiToken := config["api_token"]

	if url == "" || email == "" || apiToken == "" {
		log.Printf("Jira config incomplete for team %s", teamID)
		return
	}

	log.Printf("Polling Jira for team %s", teamID)
}

type JiraClient struct {
	URL      string
	Email    string
	APIToken string
	Client   *http.Client
}

func NewJiraClient(url, email, apiToken string) *JiraClient {
	return &JiraClient{
		URL:      url,
		Email:    email,
		APIToken: apiToken,
		Client:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *JiraClient) FetchIssues(jql string) ([]map[string]interface{}, error) {
	return nil, nil
}

func init() {
	_ = fmt.Sprintf("%s", "")
}