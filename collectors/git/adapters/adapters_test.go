// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package adapters

import (
	"encoding/json"
	"testing"
)

func TestGitHubTransform(t *testing.T) {
	payload := map[string]interface{}{
		"action": "opened",
		"pull_request": map[string]interface{}{
			"id":   123,
			"user": map[string]interface{}{"login": "testuser"},
		},
	}

	data, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("Failed to marshal payload: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("Failed to unmarshal payload: %v", err)
	}

	if parsed["action"] != "opened" {
		t.Errorf("expected action 'opened', got '%v'", parsed["action"])
	}

	pr, ok := parsed["pull_request"].(map[string]interface{})
	if !ok {
		t.Fatal("pull_request not found in payload")
	}

	if pr["id"] != float64(123) {
		t.Errorf("expected pr id 123, got %v", pr["id"])
	}

	user, ok := pr["user"].(map[string]interface{})
	if !ok {
		t.Fatal("user not found in pull_request")
	}

	if user["login"] != "testuser" {
		t.Errorf("expected login 'testuser', got '%v'", user["login"])
	}
}

func TestGitLabTransform(t *testing.T) {
	payload := map[string]interface{}{
		"object_kind": "merge_request",
		"user":        map[string]interface{}{"username": "testuser"},
		"object_attributes": map[string]interface{}{
			"id":    456,
			"state": "opened",
		},
	}

	data, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("Failed to marshal payload: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("Failed to unmarshal payload: %v", err)
	}

	if parsed["object_kind"] != "merge_request" {
		t.Errorf("expected object_kind 'merge_request', got '%v'", parsed["object_kind"])
	}

	user, ok := parsed["user"].(map[string]interface{})
	if !ok {
		t.Fatal("user not found in payload")
	}

	if user["username"] != "testuser" {
		t.Errorf("expected username 'testuser', got '%v'", user["username"])
	}
}
