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

func FetchGitHubActions(ctx context.Context, teamID string, config map[string]string, saveFn func(Event)) {
	log.Printf("Polling GitHub Actions for team %s", teamID)

	token := config["token"]
	repos := config["repos"]
	if token == "" || repos == "" {
		log.Printf("Missing token or repos config for GitHub Actions")
		return
	}

	owner := config["owner"]
	if owner == "" {
		log.Printf("Missing owner config for GitHub Actions")
		return
	}

	for _, repo := range strings.Split(repos, ",") {
		repo = strings.TrimSpace(repo)
		fetchWorkflowRuns(ctx, teamID, owner, repo, token, saveFn)
	}
}

func fetchWorkflowRuns(ctx context.Context, teamID, owner, repo, token string, saveFn func(Event)) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/actions/runs?per_page=10", owner, repo)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		log.Printf("Failed to create request: %v", err)
		return
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("Failed to fetch workflow runs: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("GitHub API error: %d %s", resp.StatusCode, string(body))
		return
	}

	var result struct {
		WorkflowRuns []struct {
			ID             int       `json:"id"`
			Name           string    `json:"name"`
			Status         string    `json:"status"`
			Conclusion     string    `json:"conclusion"`
			HeadBranch     string    `json:"head_branch"`
			HeadSha        string    `json:"head_sha"`
			RunStartedAt   time.Time `json:"run_started_at"`
			RunNumber      int       `json:"run_number"`
			Event          string    `json:"event"`
			URL            string    `json:"html_url"`
			WorkflowID     int       `json:"workflow_id"`
		} `json:"workflow_runs"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("Failed to decode response: %v", err)
		return
	}

	for _, run := range result.WorkflowRuns {
		occurredAt := run.RunStartedAt
		if occurredAt.IsZero() {
			occurredAt = time.Now()
		}

		eventType := fmt.Sprintf("workflow_run_%s", run.Status)
		if run.Conclusion != "" {
			eventType = fmt.Sprintf("workflow_run_%s", run.Conclusion)
		}

		payload := map[string]interface{}{
			"workflow_id":   run.WorkflowID,
			"workflow_name": run.Name,
			"run_number":   run.RunNumber,
			"status":       run.Status,
			"conclusion":   run.Conclusion,
			"branch":       run.HeadBranch,
			"sha":          run.HeadSha,
			"event":        run.Event,
			"url":          run.URL,
		}

		event := Event{
			ID:         uuid.New().String(),
			SourceType: "cicd",
			EventType:  eventType,
			TeamID:     teamID,
			Payload:   mustMarshal(payload),
			OccurredAt: occurredAt,
		}

		saveFn(event)
	}
}