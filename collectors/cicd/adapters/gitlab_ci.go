package adapters

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

func FetchGitLabCIPipelines(ctx context.Context, teamID string, config map[string]string, saveFn func(Event)) {
	log.Printf("Polling GitLab CI for team %s", teamID)

	token := config["token"]
	projects := config["projects"]
	if token == "" || projects == "" {
		log.Printf("Missing token or projects config for GitLab CI")
		return
	}

	baseURL := config["url"]
	if baseURL == "" {
		baseURL = "https://gitlab.com"
	}

	for _, project := range strings.Split(projects, ",") {
		project = strings.TrimSpace(project)
		fetchPipelines(ctx, teamID, baseURL, project, token, saveFn)
	}
}

func fetchPipelines(ctx context.Context, teamID, baseURL, project, token string, saveFn func(Event)) {
	url := fmt.Sprintf("%s/api/v4/projects/%s/pipelines?per_page=10", baseURL, strings.TrimPrefix(project, "/"))

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		log.Printf("Failed to create request: %v", err)
		return
	}

	req.Header.Set("PRIVATE-TOKEN", token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to fetch pipelines: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("GitLab API error: %d %s", resp.StatusCode, string(body))
		return
	}

	var pipelines []struct {
		ID         int       `json:"id"`
		Status     string    `json:"status"`
		Ref        string    `json:"ref"`
		SHA        string    `json:"sha"`
		WebURL     string    `json:"web_url"`
		CreatedAt  time.Time `json:"created_at"`
		UpdatedAt  time.Time `json:"updated_at"`
		Source     string    `json:"source"`
		Duration   *int     `json:"duration"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&pipelines); err != nil {
		log.Printf("Failed to decode response: %v", err)
		return
	}

	for _, p := range pipelines {
		occurredAt := p.CreatedAt
		if occurredAt.IsZero() {
			occurredAt = time.Now()
		}

		payload := map[string]interface{}{
			"pipeline_id": p.ID,
			"status":      p.Status,
			"ref":         p.Ref,
			"sha":         p.SHA,
			"url":         p.WebURL,
			"source":      p.Source,
			"duration":   p.Duration,
		}

		event := Event{
			ID:         uuid.New().String(),
			SourceType: "cicd",
			EventType:  "gitlab_ci_pipeline_" + p.Status,
			TeamID:     teamID,
			Payload:   mustMarshal(payload),
			OccurredAt: occurredAt,
		}

		saveFn(event)
	}
}