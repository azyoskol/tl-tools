// SPDX-License-Identifier: AGPL-3.0-or-later
// Metraly - Team Engineering Metrics API
// Copyright (C) 2026 Metraly Contributors

package seed

import (
	"context"
	"fmt"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/repo"
	"golang.org/x/crypto/bcrypt"
)

var teams = []string{"Platform", "Frontend", "Backend", "Mobile", "Data"}
var metricIDs = []string{
	"deploy-freq", "lead-time", "cfr", "mttr",
	"ci-pass", "ci-duration", "ci-queue",
	"pr-cycle", "pr-review", "pr-merge",
	"velocity", "throughput", "health-score", "sprint-burndown",
}

type Runner struct {
	users    repo.UserRepo
	plugins  repo.PluginRepo
	insights repo.AIInsightRepo
	activity repo.ActivityRepo
	metrics  repo.MetricRepo
}

func NewRunner(
	users repo.UserRepo,
	plugins repo.PluginRepo,
	insights repo.AIInsightRepo,
	activity repo.ActivityRepo,
	metrics repo.MetricRepo,
) *Runner {
	return &Runner{users, plugins, insights, activity, metrics}
}

func (r *Runner) Run(ctx context.Context, adminEmail, adminPassword string) error {
	if err := r.seedAdmin(ctx, adminEmail, adminPassword); err != nil {
		return fmt.Errorf("seed admin: %w", err)
	}
	if err := r.plugins.BulkInsert(ctx, seedPlugins); err != nil {
		return fmt.Errorf("seed plugins: %w", err)
	}
	if err := r.insights.BulkInsert(ctx, seedInsights); err != nil {
		return fmt.Errorf("seed insights: %w", err)
	}
	// TODO: implement seedMetrics if needed
	return nil
}

func (r *Runner) seedAdmin(ctx context.Context, email, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user := &domain.User{
		ID:     "admin-seed",
		Name:   "Admin",
		Email:  email,
		Avatar: "",
		Role:   "admin",
	}
	return r.users.Create(ctx, user, string(hash))
}
