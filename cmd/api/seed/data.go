// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package seed

import (
	"github.com/getmetraly/metraly/cmd/api/domain"
)

var seedPlugins = []*domain.Plugin{
	{ID: "github", Name: "GitHub", Description: "Connect GitHub repositories for PR and commit metrics", Icon: "github", Category: "Source Control", Installed: true},
	{ID: "jira", Name: "Jira", Description: "Sync sprints, epics, and issue velocity from Jira", Icon: "jira", Category: "Project Management", Installed: true},
	{ID: "datadog", Name: "Datadog", Description: "Pull infrastructure and APM metrics from Datadog", Icon: "datadog", Category: "Observability", Installed: false},
	{ID: "pagerduty", Name: "PagerDuty", Description: "Import incident data and MTTR from PagerDuty", Icon: "pagerduty", Category: "Incident Management", Installed: false},
	{ID: "linear", Name: "Linear", Description: "Track engineering velocity and cycle time from Linear", Icon: "linear", Category: "Project Management", Installed: false},
	{ID: "slack", Name: "Slack", Description: "Send metric alerts and digest reports to Slack channels", Icon: "slack", Category: "Communication", Installed: false},
}

var actionPtr = func(s string) *string { return &s }

var seedInsights = []*domain.AIInsight{
	{
		ID:     "insight-1",
		Title:  "Deploy frequency dropped 40% this week",
		Body:   "The Platform team has deployed 3 times this week compared to the 4-week average of 5.1. No clear blocker identified — consider a team retrospective.",
		Action: actionPtr("View deploy history"),
	},
	{
		ID:     "insight-2",
		Title:  "PR review bottleneck on backend services",
		Body:   "Average PR review time for backend-api increased from 4.2h to 11.8h over the past 7 days. 3 PRs have been waiting over 48 hours.",
		Action: actionPtr("View PR queue"),
	},
	{
		ID:    "insight-3",
		Title: "CI reliability improving",
		Body:  "Build success rate improved from 87% to 94% over the past 14 days after the flaky test fixes merged last Tuesday.",
	},
}
