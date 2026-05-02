# Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Go backend in `cmd/api/` that replaces all mock data from `ui_new/src/api/mockApi.ts`, preserving 100% API contract compatibility so the frontend requires zero changes.

**Architecture:** 3-layer: Handler (HTTP shell only) → Biz (business logic + cache + errgroup) → Repo (pgx SQL, no ORM). Auth in its own package (JWT RS256 + optional OIDC). Seed system replicates all mockApi data using Park-Miller PRNG with seed=42.

**Tech Stack:** Go 1.26, chi/v5, pgx/v5 (PostgreSQL 16 + TimescaleDB), go-redis/v9, golang-jwt/jwt/v5, go-oidc/v3, json-iterator/go, zerolog, validator/v10, bcrypt.

---

## Task 1: Add Missing Go Dependencies

**Files:**
- Modify: `go.mod`

**Step 1:** Add pgx, jwt, jsoniter, oidc, oauth2

```bash
cd /home/zubarev/sources/metraly
go get github.com/jackc/pgx/v5@latest
go get github.com/golang-jwt/jwt/v5@latest
go get github.com/json-iterator/go@latest
go get github.com/coreos/go-oidc/v3/oidc@latest
go get golang.org/x/oauth2@latest
```

## Step 2: Verify go.mod has all 5 new entries

bash
```
grep -E "pgx|golang-jwt|json-iterator|go-oidc|oauth2" go.mod

Expected: 5 lines matching those packages.
```
Step 3: Commit

bash

git add go.mod go.sum
git commit -m "chore: add pgx, jwt, jsoniter, go-oidc dependencies"

Task 2: Add PostgreSQL + TimescaleDB to docker-compose

Files:

    Modify: docker-compose.yaml

    Modify: Makefile (add seed target)

    Step 1: Add postgres service to docker-compose.yaml

Add the following service block after the redis service:
yaml

  postgres:
    image: timescale/timescaledb:latest-pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: metraly
      POSTGRES_PASSWORD: metraly
      POSTGRES_DB: metraly
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U metraly"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - metraly

Also add postgres_data: under the volumes: section.

Update the api service depends_on to include:
yaml

      postgres:
        condition: service_healthy

    Step 2: Add seed target to Makefile

Open Makefile and append:
makefile

seed:
	go run ./cmd/api --seed

    Step 3: Verify docker-compose parses

bash

docker compose config --quiet

Expected: no errors.

    Step 4: Commit

bash

git add docker-compose.yaml Makefile
git commit -m "chore: add timescaledb postgres service to docker-compose"

Task 3: config/ Package

Files:

    Create: cmd/api/config/config.go

    Create: cmd/api/config/config_test.go

    Step 1: Write the failing test

Create cmd/api/config/config_test.go:
go

package config_test

import (
	"os"
	"testing"

	"github.com/getmetraly/metraly/cmd/api/config"
)

func TestLoad_defaults(t *testing.T) {
	os.Unsetenv("PORT")
	os.Unsetenv("POSTGRES_DSN")
	os.Unsetenv("REDIS_HOST")

	cfg := config.Load()

	if cfg.Port != "8000" {
		t.Fatalf("expected port 8000, got %s", cfg.Port)
	}
	if cfg.PostgresDSN == "" {
		t.Fatal("expected non-empty postgres DSN")
	}
	if cfg.RedisHost != "redis" {
		t.Fatalf("expected redis host 'redis', got %s", cfg.RedisHost)
	}
}

func TestLoad_fromEnv(t *testing.T) {
	os.Setenv("PORT", "9090")
	os.Setenv("SEED_ADMIN_EMAIL", "admin@test.com")
	defer os.Unsetenv("PORT")
	defer os.Unsetenv("SEED_ADMIN_EMAIL")

	cfg := config.Load()

	if cfg.Port != "9090" {
		t.Fatalf("expected 9090, got %s", cfg.Port)
	}
	if cfg.SeedAdminEmail != "admin@test.com" {
		t.Fatalf("expected admin@test.com, got %s", cfg.SeedAdminEmail)
	}
}

    Step 2: Run test to verify it fails

bash

go test ./cmd/api/config/...

Expected: FAIL — package not found.

    Step 3: Create cmd/api/config/config.go

go

package config

import "os"

type AppConfig struct {
	Port              string
	PostgresDSN       string
	RedisHost         string
	RedisPort         string
	JWTPrivateKey     string
	AccessTokenTTL    string
	RefreshTokenTTL   string
	OIDCIssuerURL     string
	OIDCClientID      string
	OIDCClientSecret  string
	OIDCRedirectURL   string
	SeedOnStart       bool
	SeedAdminEmail    string
	SeedAdminPassword string
}

func Load() AppConfig {
	return AppConfig{
		Port:              getEnv("PORT", "8000"),
		PostgresDSN:       getEnv("POSTGRES_DSN", "postgres://metraly:metraly@localhost:5432/metraly?sslmode=disable"),
		RedisHost:         getEnv("REDIS_HOST", "redis"),
		RedisPort:         getEnv("REDIS_PORT", "6379"),
		JWTPrivateKey:     getEnv("JWT_PRIVATE_KEY", ""),
		AccessTokenTTL:    getEnv("ACCESS_TOKEN_TTL", "900"),
		RefreshTokenTTL:   getEnv("REFRESH_TOKEN_TTL", "604800"),
		OIDCIssuerURL:     getEnv("OIDC_ISSUER_URL", ""),
		OIDCClientID:      getEnv("OIDC_CLIENT_ID", ""),
		OIDCClientSecret:  getEnv("OIDC_CLIENT_SECRET", ""),
		OIDCRedirectURL:   getEnv("OIDC_REDIRECT_URL", ""),
		SeedOnStart:       getEnv("SEED_ON_START", "false") == "true",
		SeedAdminEmail:    getEnv("SEED_ADMIN_EMAIL", ""),
		SeedAdminPassword: getEnv("SEED_ADMIN_PASSWORD", ""),
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

    Step 4: Run test to verify it passes

bash

go test ./cmd/api/config/...

Expected: PASS.

    Step 5: Commit

bash

git add cmd/api/config/
git commit -m "feat: add config package with env-based AppConfig"

Task 4: SQL Migrations (7 files)

Files:

    Create: cmd/api/migrations/001_create_users.sql

    Create: cmd/api/migrations/002_create_dashboards.sql

    Create: cmd/api/migrations/003_create_metric_data_points.sql

    Create: cmd/api/migrations/004_create_plugins.sql

    Create: cmd/api/migrations/005_create_ai_insights.sql

    Create: cmd/api/migrations/006_create_activity_events.sql

    Create: cmd/api/migrations/007_create_refresh_tokens.sql

    Create: cmd/api/migrations/embed.go

    Step 1: Create 001_create_users.sql

sql

CREATE TYPE app_role AS ENUM ('admin', 'editor', 'viewer', 'team-lead');

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    avatar        TEXT NOT NULL DEFAULT '',
    app_role      app_role NOT NULL DEFAULT 'viewer',
    password_hash TEXT,
    oidc_sub      TEXT UNIQUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

    Step 2: Create 002_create_dashboards.sql

sql

CREATE TABLE IF NOT EXISTS dashboards (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    description    TEXT NOT NULL DEFAULT '',
    icon           TEXT NOT NULL DEFAULT '',
    owner_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public      BOOLEAN NOT NULL DEFAULT false,
    share_token    TEXT,
    widgets        JSONB NOT NULL DEFAULT '[]',
    layout         JSONB NOT NULL DEFAULT '[]',
    version        INTEGER NOT NULL DEFAULT 1,
    forked_from_id TEXT REFERENCES dashboards(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_templates (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon        TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT '',
    widgets     JSONB NOT NULL DEFAULT '[]',
    layout      JSONB NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

    Step 3: Create 003_create_metric_data_points.sql

sql

CREATE TABLE IF NOT EXISTS metric_data_points (
    time      TIMESTAMPTZ NOT NULL,
    metric_id TEXT NOT NULL,
    team      TEXT NOT NULL,
    value     DOUBLE PRECISION NOT NULL
);

SELECT create_hypertable('metric_data_points', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_metric_data_points_metric_team_time
    ON metric_data_points (metric_id, team, time DESC);

    Step 4: Create 004_create_plugins.sql

sql

CREATE TABLE IF NOT EXISTS plugins (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon        TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT '',
    installed   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

    Step 5: Create 005_create_ai_insights.sql

sql

CREATE TABLE IF NOT EXISTS ai_insights (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    action     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

    Step 6: Create 006_create_activity_events.sql

sql

CREATE TYPE activity_type AS ENUM ('deploy', 'alert', 'review', 'merge');

CREATE TABLE IF NOT EXISTS activity_events (
    id          TEXT PRIMARY KEY,
    type        activity_type NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_name   TEXT NOT NULL DEFAULT '',
    user_avatar TEXT NOT NULL DEFAULT ''
);

    Step 7: Create 007_create_refresh_tokens.sql

sql

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_hash  TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

    Step 8: Create embed.go

go

package migrations

import "embed"

//go:embed *.sql
var FS embed.FS

    Step 9: Commit

bash

git add cmd/api/migrations/
git commit -m "feat: add 7 SQL migration files with timescaledb hypertable"

Task 5: db/ Package (Pool + Migration Runner)

Files:

    Create: cmd/api/db/db.go

    Create: cmd/api/db/migrate.go

    Step 1: Create cmd/api/db/db.go

go

package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func New(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

    Step 2: Create cmd/api/db/migrate.go

go

package db

import (
	"context"
	"fmt"
	"io/fs"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Migrate(ctx context.Context, pool *pgxpool.Pool, migrations fs.FS) error {
	_, err := pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`)
	if err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	entries, err := fs.ReadDir(migrations, ".")
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, name := range files {
		version := strings.TrimSuffix(name, ".sql")

		var exists bool
		err := pool.QueryRow(ctx,
			"SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)", version,
		).Scan(&exists)
		if err != nil {
			return fmt.Errorf("check migration %s: %w", version, err)
		}
		if exists {
			continue
		}

		sql, err := fs.ReadFile(migrations, name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}

		if _, err := pool.Exec(ctx, string(sql)); err != nil {
			return fmt.Errorf("apply migration %s: %w", name, err)
		}

		if _, err := pool.Exec(ctx,
			"INSERT INTO schema_migrations(version) VALUES($1)", version,
		); err != nil {
			return fmt.Errorf("record migration %s: %w", name, err)
		}
	}
	return nil
}

    Step 3: Commit

bash

git add cmd/api/db/
git commit -m "feat: add db package with pgxpool and migration runner"

Task 6: domain/ Structs

Files:

    Create: cmd/api/domain/user.go

    Create: cmd/api/domain/dashboard.go

    Create: cmd/api/domain/metrics.go

    Create: cmd/api/domain/plugins.go

    Create: cmd/api/domain/activity.go

    Step 1: Create cmd/api/domain/user.go

go

package domain

type User struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Avatar string `json:"avatar"`
	Role   string `json:"role"`
}

    Step 2: Create cmd/api/domain/dashboard.go

go

package domain

import (
	"encoding/json"
	"time"
)

type WidgetInstance struct {
	InstanceID string          `json:"instanceId"`
	WidgetType string          `json:"widgetType"`
	Config     json.RawMessage `json:"config"`
}

type WidgetLayout struct {
	InstanceID string `json:"instanceId"`
	X          int    `json:"x"`
	Y          int    `json:"y"`
	W          int    `json:"w"`
	H          int    `json:"h"`
}

type Dashboard struct {
	ID           string           `json:"id"`
	Name         string           `json:"name"`
	Description  string           `json:"description"`
	Icon         string           `json:"icon"`
	OwnerID      string           `json:"ownerId"`
	IsPublic     bool             `json:"isPublic"`
	ShareToken   *string          `json:"shareToken,omitempty"`
	Widgets      []WidgetInstance `json:"widgets"`
	Layout       []WidgetLayout   `json:"layout"`
	Version      int              `json:"version"`
	ForkedFromID *string          `json:"forkedFromId,omitempty"`
	CreatedAt    time.Time        `json:"createdAt"`
	UpdatedAt    time.Time        `json:"updatedAt"`
}

type DashboardTemplate struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Icon        string           `json:"icon"`
	Category    string           `json:"category"`
	Widgets     []WidgetInstance `json:"widgets"`
	Layout      []WidgetLayout   `json:"layout"`
}

type CreateDashboardInput struct {
	Name        string           `json:"name" validate:"required"`
	Description string           `json:"description"`
	Icon        string           `json:"icon"`
	Widgets     []WidgetInstance `json:"widgets"`
	Layout      []WidgetLayout   `json:"layout"`
}

type UpdateDashboardInput struct {
	Name        string           `json:"name" validate:"required"`
	Description string           `json:"description"`
	Icon        string           `json:"icon"`
	Widgets     []WidgetInstance `json:"widgets"`
	Layout      []WidgetLayout   `json:"layout"`
	Version     int              `json:"version" validate:"required"`
}

type UpdateLayoutInput struct {
	Layout  []WidgetLayout `json:"layout"`
	Version int            `json:"version" validate:"required"`
}

type UpdateShareInput struct {
	IsPublic bool `json:"isPublic"`
}

    Step 3: Create cmd/api/domain/metrics.go

    Note: encoding/json is required in imports because WidgetDataRequest uses json.RawMessage.

go

package domain

import (
	"encoding/json"
	"time"
)

type MetricDataPoint struct {
	Time  time.Time `json:"time"`
	Value float64   `json:"value"`
}

type MetricResponse struct {
	MetricID  string            `json:"metricId"`
	TimeRange string            `json:"timeRange"`
	Team      string            `json:"team"`
	Data      []MetricDataPoint `json:"data"`
}

type MetricBreakdownItem struct {
	Team  string  `json:"team"`
	Value float64 `json:"value"`
}

type DORAMetrics struct {
	DeployFrequency   float64 `json:"deployFrequency"`
	LeadTime          float64 `json:"leadTime"`
	ChangeFailureRate float64 `json:"changeFailureRate"`
	MTTR              float64 `json:"mttr"`
}

type WidgetDataRequest struct {
	WidgetType string          `json:"widgetType"`
	Config     json.RawMessage `json:"config"`
	TimeRange  string          `json:"timeRange"`
	Team       string          `json:"team"`
	Repo       string          `json:"repo"`
}

    Step 4: Create cmd/api/domain/plugins.go

go

package domain

type Plugin struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Category    string `json:"category"`
	Installed   bool   `json:"installed"`
}

type AIInsight struct {
	ID     string  `json:"id"`
	Title  string  `json:"title"`
	Body   string  `json:"body"`
	Action *string `json:"action,omitempty"`
}

    Step 5: Create cmd/api/domain/activity.go

go

package domain

import "time"

type ActivityUser struct {
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

type ActivityEvent struct {
	ID          string       `json:"id"`
	Type        string       `json:"type"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Timestamp   time.Time    `json:"timestamp"`
	User        ActivityUser `json:"user"`
}

    Step 6: Commit

bash

git add cmd/api/domain/
git commit -m "feat: add domain structs for all API entities"

Task 7: respond/ Package

Files:

    Create: cmd/api/respond/respond.go

    Create: cmd/api/respond/respond_test.go

    Step 1: Write the failing test

go

package respond_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/getmetraly/metraly/cmd/api/respond"
)

func TestJSON(t *testing.T) {
	w := httptest.NewRecorder()
	respond.JSON(w, http.StatusOK, map[string]string{"status": "ok"})

	res := w.Result()
	if res.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}
	if ct := res.Header.Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}
	body := w.Body.String()
	if !strings.Contains(body, `"status"`) {
		t.Fatalf("unexpected body: %s", body)
	}
}

func TestErrorResponse(t *testing.T) {
	w := httptest.NewRecorder()
	respond.Error(w, http.StatusNotFound, "NOT_FOUND", "dashboard not found")

	body := w.Body.String()
	if !strings.Contains(body, `"NOT_FOUND"`) {
		t.Fatalf("expected NOT_FOUND in body: %s", body)
	}
}

    Step 2: Run test to verify it fails

bash

go test ./cmd/api/respond/...

Expected: FAIL — package not found.

    Step 3: Create cmd/api/respond/respond.go

go

package respond

import (
	"bytes"
	"net/http"
	"sync"

	jsoniter "github.com/json-iterator/go"
)

var json = jsoniter.ConfigCompatibleWithStandardLibrary

var bufPool = sync.Pool{New: func() any { return new(bytes.Buffer) }}

type errorBody struct {
	Error errorDetail `json:"error"`
}

type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func JSON(w http.ResponseWriter, status int, v any) {
	buf := bufPool.Get().(*bytes.Buffer)
	buf.Reset()
	defer bufPool.Put(buf)

	if err := json.NewEncoder(buf).Encode(v); err != nil {
		http.Error(w, `{"error":{"code":"INTERNAL_ERROR","message":"encoding error"}}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(buf.Bytes())
}

func Error(w http.ResponseWriter, status int, code, message string) {
	JSON(w, status, errorBody{Error: errorDetail{Code: code, Message: message}})
}

    Step 4: Run test to verify it passes

bash

go test ./cmd/api/respond/...

Expected: PASS.

    Step 5: Commit

bash

git add cmd/api/respond/
git commit -m "feat: add respond package with sync.Pool buffer and jsoniter"

Task 8: biz/errors.go

Files:

    Create: cmd/api/biz/errors.go

    Step 1: Create cmd/api/biz/errors.go

go

package biz

import "errors"

var (
	ErrNotFound     = errors.New("not found")
	ErrConflict     = errors.New("version conflict")
	ErrForbidden    = errors.New("forbidden")
	ErrValidation   = errors.New("validation error")
	ErrUnauthorized = errors.New("unauthorized")
)

    Step 2: Commit

bash

git add cmd/api/biz/errors.go
git commit -m "feat: add typed biz errors"

Task 9: repo/ Interfaces and pgx Implementations

Files:

    Create: cmd/api/repo/user_repo.go

    Create: cmd/api/repo/dashboard_repo.go

    Create: cmd/api/repo/metric_repo.go

    Create: cmd/api/repo/plugin_repo.go

    Create: cmd/api/repo/activity_repo.go

    Step 1: Create cmd/api/repo/user_repo.go

go

package repo

import (
	"context"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo interface {
	FindByID(ctx context.Context, id string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByOIDCSub(ctx context.Context, sub string) (*domain.User, error)
	Create(ctx context.Context, u *domain.User, passwordHash string) error
	GetPasswordHash(ctx context.Context, email string) (userID, hash string, err error)
}

type pgUserRepo struct{ pool *pgxpool.Pool }

func NewUserRepo(pool *pgxpool.Pool) UserRepo { return &pgUserRepo{pool} }

func (r *pgUserRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	u := &domain.User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, email, avatar, app_role FROM users WHERE id=$1`, id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Avatar, &u.Role)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *pgUserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	u := &domain.User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, email, avatar, app_role FROM users WHERE email=$1`, email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Avatar, &u.Role)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *pgUserRepo) FindByOIDCSub(ctx context.Context, sub string) (*domain.User, error) {
	u := &domain.User{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, email, avatar, app_role FROM users WHERE oidc_sub=$1`, sub,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Avatar, &u.Role)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *pgUserRepo) Create(ctx context.Context, u *domain.User, passwordHash string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO users(id, name, email, avatar, app_role, password_hash)
		 VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING`,
		u.ID, u.Name, u.Email, u.Avatar, u.Role, passwordHash,
	)
	return err
}

func (r *pgUserRepo) GetPasswordHash(ctx context.Context, email string) (string, string, error) {
	var userID, hash string
	err := r.pool.QueryRow(ctx,
		`SELECT id, password_hash FROM users WHERE email=$1`, email,
	).Scan(&userID, &hash)
	return userID, hash, err
}

    Step 2: Create cmd/api/repo/dashboard_repo.go

go

package repo

import (
	"context"
	"encoding/json"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardRepo interface {
	List(ctx context.Context, userID string) ([]*domain.Dashboard, error)
	GetByID(ctx context.Context, id string) (*domain.Dashboard, error)
	Create(ctx context.Context, d *domain.Dashboard) error
	Update(ctx context.Context, d *domain.Dashboard) (bool, error)
	UpdateLayout(ctx context.Context, id string, layout []domain.WidgetLayout, version int) (bool, error)
	UpdateShare(ctx context.Context, id string, isPublic bool, shareToken *string) error
	ListTemplates(ctx context.Context) ([]*domain.DashboardTemplate, error)
}

type pgDashboardRepo struct{ pool *pgxpool.Pool }

func NewDashboardRepo(pool *pgxpool.Pool) DashboardRepo { return &pgDashboardRepo{pool} }

func (r *pgDashboardRepo) List(ctx context.Context, userID string) ([]*domain.Dashboard, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, icon, owner_id, is_public, share_token,
		        widgets, layout, version, forked_from_id, created_at, updated_at
		 FROM dashboards WHERE owner_id=$1 OR is_public=true ORDER BY updated_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Dashboard
	for rows.Next() {
		d := &domain.Dashboard{}
		var widgetsJSON, layoutJSON []byte
		err := rows.Scan(&d.ID, &d.Name, &d.Description, &d.Icon, &d.OwnerID, &d.IsPublic,
			&d.ShareToken, &widgetsJSON, &layoutJSON, &d.Version, &d.ForkedFromID, &d.CreatedAt, &d.UpdatedAt)
		if err != nil {
			return nil, err
		}
		json.Unmarshal(widgetsJSON, &d.Widgets)
		json.Unmarshal(layoutJSON, &d.Layout)
		result = append(result, d)
	}
	return result, rows.Err()
}

func (r *pgDashboardRepo) GetByID(ctx context.Context, id string) (*domain.Dashboard, error) {
	d := &domain.Dashboard{}
	var widgetsJSON, layoutJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, description, icon, owner_id, is_public, share_token,
		        widgets, layout, version, forked_from_id, created_at, updated_at
		 FROM dashboards WHERE id=$1`, id,
	).Scan(&d.ID, &d.Name, &d.Description, &d.Icon, &d.OwnerID, &d.IsPublic,
		&d.ShareToken, &widgetsJSON, &layoutJSON, &d.Version, &d.ForkedFromID, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(widgetsJSON, &d.Widgets)
	json.Unmarshal(layoutJSON, &d.Layout)
	return d, nil
}

func (r *pgDashboardRepo) Create(ctx context.Context, d *domain.Dashboard) error {
	widgetsJSON, _ := json.Marshal(d.Widgets)
	layoutJSON, _ := json.Marshal(d.Layout)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO dashboards(id, name, description, icon, owner_id, is_public, widgets, layout, forked_from_id)
		 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		d.ID, d.Name, d.Description, d.Icon, d.OwnerID, d.IsPublic,
		widgetsJSON, layoutJSON, d.ForkedFromID,
	)
	return err
}

func (r *pgDashboardRepo) Update(ctx context.Context, d *domain.Dashboard) (bool, error) {
	widgetsJSON, _ := json.Marshal(d.Widgets)
	layoutJSON, _ := json.Marshal(d.Layout)
	tag, err := r.pool.Exec(ctx,
		`UPDATE dashboards SET name=$1, description=$2, icon=$3, widgets=$4, layout=$5,
		        version=version+1, updated_at=NOW()
		 WHERE id=$6 AND version=$7`,
		d.Name, d.Description, d.Icon, widgetsJSON, layoutJSON, d.ID, d.Version,
	)
	return tag.RowsAffected() == 1, err
}

func (r *pgDashboardRepo) UpdateLayout(ctx context.Context, id string, layout []domain.WidgetLayout, version int) (bool, error) {
	layoutJSON, _ := json.Marshal(layout)
	tag, err := r.pool.Exec(ctx,
		`UPDATE dashboards SET layout=$1, version=version+1, updated_at=NOW() WHERE id=$2 AND version=$3`,
		layoutJSON, id, version,
	)
	return tag.RowsAffected() == 1, err
}

func (r *pgDashboardRepo) UpdateShare(ctx context.Context, id string, isPublic bool, shareToken *string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE dashboards SET is_public=$1, share_token=$2, updated_at=NOW() WHERE id=$3`,
		isPublic, shareToken, id,
	)
	return err
}

func (r *pgDashboardRepo) ListTemplates(ctx context.Context) ([]*domain.DashboardTemplate, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, icon, category, widgets, layout FROM dashboard_templates ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.DashboardTemplate
	for rows.Next() {
		t := &domain.DashboardTemplate{}
		var widgetsJSON, layoutJSON []byte
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.Icon, &t.Category, &widgetsJSON, &layoutJSON); err != nil {
			return nil, err
		}
		json.Unmarshal(widgetsJSON, &t.Widgets)
		json.Unmarshal(layoutJSON, &t.Layout)
		result = append(result, t)
	}
	return result, rows.Err()
}

    Step 3: Create cmd/api/repo/metric_repo.go

    Note: Use pgx.CopyFromRows (from github.com/jackc/pgx/v5) — not pgxpool.CopyFromRows which does not exist. Also add "github.com/jackc/pgx/v5" to imports alongside pgxpool.

go

package repo

import (
	"context"
	"sync"
	"time"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MetricRepo interface {
	GetTimeSeries(ctx context.Context, metricID, team string, from, to time.Time) ([]domain.MetricDataPoint, error)
	GetBreakdown(ctx context.Context, metricID string, from, to time.Time) ([]domain.MetricBreakdownItem, error)
	BulkInsert(ctx context.Context, points []domain.MetricDataPoint, metricID, team string) error
}

var pointsPool = sync.Pool{New: func() any {
	s := make([]domain.MetricDataPoint, 0, 14)
	return &s
}}

type pgMetricRepo struct{ pool *pgxpool.Pool }

func NewMetricRepo(pool *pgxpool.Pool) MetricRepo { return &pgMetricRepo{pool} }

func (r *pgMetricRepo) GetTimeSeries(ctx context.Context, metricID, team string, from, to time.Time) ([]domain.MetricDataPoint, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT time_bucket('1 day', time) AS bucket, AVG(value)
		 FROM metric_data_points
		 WHERE metric_id=$1 AND team=$2 AND time BETWEEN $3 AND $4
		 GROUP BY bucket ORDER BY bucket`, metricID, team, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ptr := pointsPool.Get().(*[]domain.MetricDataPoint)
	result := (*ptr)[:0]
	for rows.Next() {
		var p domain.MetricDataPoint
		if err := rows.Scan(&p.Time, &p.Value); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	out := make([]domain.MetricDataPoint, len(result))
	copy(out, result)
	*ptr = result
	pointsPool.Put(ptr)
	return out, rows.Err()
}

func (r *pgMetricRepo) GetBreakdown(ctx context.Context, metricID string, from, to time.Time) ([]domain.MetricBreakdownItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT team, AVG(value) FROM metric_data_points
		 WHERE metric_id=$1 AND time BETWEEN $2 AND $3
		 GROUP BY team ORDER BY team`, metricID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []domain.MetricBreakdownItem
	for rows.Next() {
		var item domain.MetricBreakdownItem
		if err := rows.Scan(&item.Team, &item.Value); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, rows.Err()
}

func (r *pgMetricRepo) BulkInsert(ctx context.Context, points []domain.MetricDataPoint, metricID, team string) error {
	rows := make([][]any, len(points))
	for i, p := range points {
		rows[i] = []any{p.Time, metricID, team, p.Value}
	}
	_, err := r.pool.CopyFrom(ctx,
		pgx.Identifier{"metric_data_points"},
		[]string{"time", "metric_id", "team", "value"},
		pgx.CopyFromRows(rows),
	)
	return err
}

    Step 4: Create cmd/api/repo/plugin_repo.go

go

package repo

import (
	"context"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PluginRepo interface {
	List(ctx context.Context) ([]*domain.Plugin, error)
	Install(ctx context.Context, id string) error
	BulkInsert(ctx context.Context, plugins []*domain.Plugin) error
}

type AIInsightRepo interface {
	List(ctx context.Context) ([]*domain.AIInsight, error)
	BulkInsert(ctx context.Context, insights []*domain.AIInsight) error
}

type pgPluginRepo struct{ pool *pgxpool.Pool }
type pgAIInsightRepo struct{ pool *pgxpool.Pool }

func NewPluginRepo(pool *pgxpool.Pool) PluginRepo       { return &pgPluginRepo{pool} }
func NewAIInsightRepo(pool *pgxpool.Pool) AIInsightRepo { return &pgAIInsightRepo{pool} }

func (r *pgPluginRepo) List(ctx context.Context) ([]*domain.Plugin, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, icon, category, installed FROM plugins ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*domain.Plugin
	for rows.Next() {
		p := &domain.Plugin{}
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Icon, &p.Category, &p.Installed); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *pgPluginRepo) Install(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE plugins SET installed=true WHERE id=$1`, id)
	return err
}

func (r *pgPluginRepo) BulkInsert(ctx context.Context, plugins []*domain.Plugin) error {
	for _, p := range plugins {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO plugins(id, name, description, icon, category, installed)
			 VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
			p.ID, p.Name, p.Description, p.Icon, p.Category, p.Installed)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *pgAIInsightRepo) List(ctx context.Context) ([]*domain.AIInsight, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, title, body, action FROM ai_insights ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*domain.AIInsight
	for rows.Next() {
		ins := &domain.AIInsight{}
		if err := rows.Scan(&ins.ID, &ins.Title, &ins.Body, &ins.Action); err != nil {
			return nil, err
		}
		result = append(result, ins)
	}
	return result, rows.Err()
}

func (r *pgAIInsightRepo) BulkInsert(ctx context.Context, insights []*domain.AIInsight) error {
	for _, ins := range insights {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO ai_insights(id, title, body, action) VALUES($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
			ins.ID, ins.Title, ins.Body, ins.Action)
		if err != nil {
			return err
		}
	}
	return nil
}

    Step 5: Create cmd/api/repo/activity_repo.go

go

package repo

import (
	"context"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ActivityRepo interface {
	List(ctx context.Context, limit int) ([]*domain.ActivityEvent, error)
	BulkInsert(ctx context.Context, events []*domain.ActivityEvent) error
}

type pgActivityRepo struct{ pool *pgxpool.Pool }

func NewActivityRepo(pool *pgxpool.Pool) ActivityRepo { return &pgActivityRepo{pool} }

func (r *pgActivityRepo) List(ctx context.Context, limit int) ([]*domain.ActivityEvent, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, type, title, description, timestamp, user_name, user_avatar
		 FROM activity_events ORDER BY timestamp DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []*domain.ActivityEvent
	for rows.Next() {
		e := &domain.ActivityEvent{}
		if err := rows.Scan(&e.ID, &e.Type, &e.Title, &e.Description,
			&e.Timestamp, &e.User.Name, &e.User.Avatar); err != nil {
			return nil, err
		}
		result = append(result, e)
	}
	return result, rows.Err()
}

func (r *pgActivityRepo) BulkInsert(ctx context.Context, events []*domain.ActivityEvent) error {
	for _, e := range events {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO activity_events(id, type, title, description, timestamp, user_name, user_avatar)
			 VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
			e.ID, e.Type, e.Title, e.Description, e.Timestamp, e.User.Name, e.User.Avatar)
		if err != nil {
			return err
		}
	}
	return nil
}

    Step 6: Commit

bash

git add cmd/api/repo/
git commit -m "feat: add repo interfaces and pgx implementations"

Task 10: auth/ — JWT KeyManager

Files:

    Create: cmd/api/auth/jwt.go

    Create: cmd/api/auth/jwt_test.go

    Step 1: Write the failing test

go

package auth_test

import (
	"testing"
	"time"

	"github.com/getmetraly/metraly/cmd/api/auth"
)

func TestJWTRoundTrip(t *testing.T) {
	km, err := auth.NewKeyManager("")
	if err != nil {
		t.Fatal(err)
	}

	claims := auth.Claims{
		Sub:   "user-123",
		Email: "user@example.com",
		Role:  "admin",
	}
	token, err := km.Sign(claims, 15*time.Minute)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	got, err := km.Validate(token)
	if err != nil {
		t.Fatalf("validate: %v", err)
	}
	if got.Sub != "user-123" {
		t.Errorf("expected sub user-123, got %s", got.Sub)
	}
	if got.Email != "user@example.com" {
		t.Errorf("expected email user@example.com, got %s", got.Email)
	}
}

    Step 2: Run test to verify it fails

bash

go test ./cmd/api/auth/...

Expected: FAIL.

    Step 3: Create cmd/api/auth/jwt.go

go

package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
)

type Claims struct {
	Sub   string
	Email string
	Role  string
}

type jwtClaims struct {
	jwt.RegisteredClaims
	Email string `json:"email"`
	Role  string `json:"role"`
}

type KeyManager struct {
	private *rsa.PrivateKey
}

func NewKeyManager(pemKey string) (*KeyManager, error) {
	if pemKey == "" {
		log.Warn().Msg("JWT_PRIVATE_KEY not set — generating RSA-2048 key, tokens invalidated on restart")
		key, err := rsa.GenerateKey(rand.Reader, 2048)
		if err != nil {
			return nil, fmt.Errorf("generate rsa key: %w", err)
		}
		return &KeyManager{private: key}, nil
	}

	block, _ := pem.Decode([]byte(pemKey))
	if block == nil {
		return nil, fmt.Errorf("invalid PEM block")
	}
	key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}
	return &KeyManager{private: key}, nil
}

func (km *KeyManager) Sign(c Claims, ttl time.Duration) (string, error) {
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwtClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   c.Sub,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
		Email: c.Email,
		Role:  c.Role,
	})
	return token.SignedString(km.private)
}

func (km *KeyManager) Validate(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwtClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return &km.private.PublicKey, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*jwtClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return &Claims{Sub: claims.Subject, Email: claims.Email, Role: claims.Role}, nil
}

    Step 4: Run test to verify it passes

bash

go test ./cmd/api/auth/...

Expected: PASS.

    Step 5: Commit

bash

git add cmd/api/auth/
git commit -m "feat: add JWT KeyManager with RS256 sign/validate"

Task 11: auth/ — authService + redisTokenStore

Files:

    Create: cmd/api/auth/token_store.go

    Create: cmd/api/auth/service.go

    Step 1: Create cmd/api/auth/token_store.go

    Note: Use hash.Hash interface (not *sha256.Hash which doesn't exist as a concrete type). Import "hash" alongside "crypto/sha256".

go

package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"hash"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

var hashPool = sync.Pool{New: func() any { return sha256.New() }}

type TokenStore struct {
	rdb *redis.Client
	ttl time.Duration
}

func NewTokenStore(rdb *redis.Client, ttl time.Duration) *TokenStore {
	return &TokenStore{rdb: rdb, ttl: ttl}
}

func (s *TokenStore) Issue(ctx context.Context, userID string) (raw string, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	raw = base64.RawURLEncoding.EncodeToString(b)
	hash := s.hash(raw)
	return raw, s.rdb.Set(ctx, "refresh:"+hash, userID, s.ttl).Err()
}

func (s *TokenStore) Consume(ctx context.Context, raw string) (userID string, err error) {
	hash := s.hash(raw)
	key := "refresh:" + hash
	userID, err = s.rdb.Get(ctx, key).Result()
	if err != nil {
		return "", err
	}
	return userID, s.rdb.Del(ctx, key).Err()
}

func (s *TokenStore) hash(raw string) string {
	h := hashPool.Get().(hash.Hash)
	h.Reset()
	h.Write([]byte(raw))
	result := hex.EncodeToString(h.Sum(nil))
	hashPool.Put(h)
	return result
}

    Step 2: Create cmd/api/auth/service.go

    Note: Add "crypto/rand" to imports (used by newID()).

go

package auth

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"time"

	"github.com/getmetraly/metraly/cmd/api/biz"
	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/repo"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type TokenPair struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"`
	User         *domain.User `json:"user"`
}

type Service struct {
	km        *KeyManager
	store     *TokenStore
	users     repo.UserRepo
	accessTTL time.Duration
}

func NewService(km *KeyManager, store *TokenStore, users repo.UserRepo, accessTTL time.Duration) *Service {
	return &Service{km: km, store: store, users: users, accessTTL: accessTTL}
}

func (s *Service) Login(ctx context.Context, email, password string) (*TokenPair, error) {
	userID, hash, err := s.users.GetPasswordHash(ctx, email)
	if err != nil {
		return nil, biz.ErrUnauthorized
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return nil, biz.ErrUnauthorized
	}
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}
	return s.issuePair(ctx, user)
}

func (s *Service) Refresh(ctx context.Context, rawToken string) (string, int, error) {
	userID, err := s.store.Consume(ctx, rawToken)
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "", 0, biz.ErrUnauthorized
		}
		return "", 0, fmt.Errorf("consume token: %w", err)
	}
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return "", 0, biz.ErrUnauthorized
	}
	access, err := s.km.Sign(Claims{Sub: user.ID, Email: user.Email, Role: user.Role}, s.accessTTL)
	if err != nil {
		return "", 0, fmt.Errorf("sign: %w", err)
	}
	return access, int(s.accessTTL.Seconds()), nil
}

func (s *Service) Logout(ctx context.Context, rawToken string) error {
	_, err := s.store.Consume(ctx, rawToken)
	if errors.Is(err, redis.Nil) {
		return nil
	}
	return err
}

func (s *Service) FindOrCreateOIDCUser(ctx context.Context, sub, email, name string) (*TokenPair, error) {
	user, err := s.users.FindByOIDCSub(ctx, sub)
	if err != nil {
		user, err = s.users.FindByEmail(ctx, email)
		if err != nil {
			user = &domain.User{ID: newID(), Name: name, Email: email, Role: "viewer"}
			if err := s.users.Create(ctx, user, ""); err != nil {
				return nil, fmt.Errorf("create oidc user: %w", err)
			}
		}
	}
	return s.issuePair(ctx, user)
}

func (s *Service) issuePair(ctx context.Context, user *domain.User) (*TokenPair, error) {
	access, err := s.km.Sign(Claims{Sub: user.ID, Email: user.Email, Role: user.Role}, s.accessTTL)
	if err != nil {
		return nil, fmt.Errorf("sign: %w", err)
	}
	refresh, err := s.store.Issue(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("issue refresh: %w", err)
	}
	return &TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int(s.accessTTL.Seconds()),
		User:         user,
	}, nil
}

func newID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}

    Step 3: Commit

bash

git add cmd/api/auth/
git commit -m "feat: add auth service with login, refresh, logout, OIDC find-or-create"

Task 12: middleware/

Files:

    Create: cmd/api/middleware/auth.go

    Create: cmd/api/middleware/logger.go

    Step 1: Create cmd/api/middleware/auth.go

go

package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/getmetraly/metraly/cmd/api/auth"
	"github.com/getmetraly/metraly/cmd/api/respond"
)

type contextKey string

const claimsKey contextKey = "claims"

func RequireAuth(km *auth.KeyManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				respond.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing token")
				return
			}
			claims, err := km.Validate(strings.TrimPrefix(header, "Bearer "))
			if err != nil {
				respond.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid token")
				return
			}
			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(claimsKey).(*auth.Claims)
			if !ok || !allowed[claims.Role] {
				respond.Error(w, http.StatusForbidden, "FORBIDDEN", "insufficient role")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func ClaimsFrom(ctx context.Context) *auth.Claims {
	c, _ := ctx.Value(claimsKey).(*auth.Claims)
	return c
}

    Step 2: Create cmd/api/middleware/logger.go

go

package middleware

import (
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
)

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: 200}
		next.ServeHTTP(rw, r)
		log.Info().
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Int("status", rw.status).
			Dur("latency", time.Since(start)).
			Msg("request")
	})
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

    Step 3: Commit

bash

git add cmd/api/middleware/
git commit -m "feat: add RequireAuth, RequireRole, and Logger middleware"

Task 13: seed/ — PRNG

Files:

    Create: cmd/api/seed/prng.go

    Create: cmd/api/seed/prng_test.go

    Step 1: Write the failing test

go

package seed_test

import (
	"math"
	"testing"

	"github.com/getmetraly/metraly/cmd/api/seed"
)

func TestPRNG_firstValue(t *testing.T) {
	p := seed.NewPRNG(42)
	got := p.Next()
	// 42 * 16807 = 705894; 705894 % 2147483647 = 705894; (705894-1)/2147483646
	want := float64(705893) / float64(2147483646)
	if math.Abs(got-want) > 1e-12 {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

func TestPRNG_firstFive(t *testing.T) {
	p := seed.NewPRNG(42)
	values := make([]float64, 5)
	for i := range values {
		values[i] = p.Next()
	}
	if values[0] >= values[1] || values[0] == 0 {
		t.Fatal("PRNG sequence looks wrong")
	}
}

    Step 2: Run test to verify it fails

bash

go test ./cmd/api/seed/...

Expected: FAIL.

    Step 3: Create cmd/api/seed/prng.go

go

package seed

type PRNG struct{ state int64 }

func NewPRNG(seed int64) *PRNG { return &PRNG{state: seed} }

func (p *PRNG) Next() float64 {
	p.state = (p.state * 16807) % 2147483647
	return float64(p.state-1) / 2147483646.0
}

func (p *PRNG) Intn(n int) int {
	return int(p.Next() * float64(n))
}

func (p *PRNG) Float64Between(min, max float64) float64 {
	return min + p.Next()*(max-min)
}

    Step 4: Run test to verify it passes

bash

go test ./cmd/api/seed/...

Expected: PASS.

    Step 5: Commit

bash

git add cmd/api/seed/prng.go cmd/api/seed/prng_test.go
git commit -m "feat: add Park-Miller PRNG matching mockApi.ts seed=42"

Task 14: seed/ — Runner and Data

Files:

    Create: cmd/api/seed/runner.go

    Create: cmd/api/seed/data.go

    Step 1: Create cmd/api/seed/data.go

This file defines the static seed data matching mockApi.ts lines 1159–1262 and 396–424.
go

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

    Step 2: Create cmd/api/seed/runner.go

go

package seed

import (
	"context"
	"fmt"
	"time"

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
	if err := r.seedMetrics(ctx); err != nil {
		return fmt.Errorf("seed metrics: %w", err)
	}
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

func (r *Runner) seedMetrics(ctx context.Context) error {
	prng := NewPRNG(42)
	now := time.Now().UTC().Truncate(24 * time.Hour)

	for _, metricID := range metricIDs {
		for _, team := range teams {
			points := make([]domain.MetricDataPoint, 14)
			for i := 0; i < 14; i++ {
				points[i] = domain.MetricDataPoint{
					Time:  now.AddDate(0, 0, -(13 - i)),
					Value: prng.Float64Between(10, 100),
				}
			}
			if err := r.metrics.BulkInsert(ctx, points, metricID, team); err != nil {
				return fmt.Errorf("insert %s/%s: %w", metricID, team, err)
			}
		}
	}
	return nil
}

    Step 3: Commit

bash

git add cmd/api/seed/
git commit -m "feat: add seed runner with 980 metric data points and static seed data"

Task 15: biz/ Services

Files:

    Create: cmd/api/biz/dashboard_svc.go

    Create: cmd/api/biz/metrics_svc.go

    Create: cmd/api/biz/misc_svc.go

    Step 1: Create cmd/api/biz/dashboard_svc.go

go

package biz

import (
	"context"
	"fmt"
	"time"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/repo"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/sync/errgroup"
)

type DashboardSvc struct {
	repo    repo.DashboardRepo
	metrics repo.MetricRepo
	rdb     *redis.Client
}

func NewDashboardSvc(r repo.DashboardRepo, m repo.MetricRepo, rdb *redis.Client) *DashboardSvc {
	return &DashboardSvc{repo: r, metrics: m, rdb: rdb}
}

func (s *DashboardSvc) List(ctx context.Context, userID string) ([]*domain.Dashboard, error) {
	return s.repo.List(ctx, userID)
}

func (s *DashboardSvc) Get(ctx context.Context, id string) (*domain.Dashboard, error) {
	d, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	return d, nil
}

func (s *DashboardSvc) Create(ctx context.Context, userID string, in domain.CreateDashboardInput) (*domain.Dashboard, error) {
	d := &domain.Dashboard{
		ID:          uuid.NewString(),
		Name:        in.Name,
		Description: in.Description,
		Icon:        in.Icon,
		OwnerID:     userID,
		Widgets:     in.Widgets,
		Layout:      in.Layout,
	}
	if d.Widgets == nil {
		d.Widgets = []domain.WidgetInstance{}
	}
	if d.Layout == nil {
		d.Layout = []domain.WidgetLayout{}
	}
	return d, s.repo.Create(ctx, d)
}

func (s *DashboardSvc) Update(ctx context.Context, id, userID string, in domain.UpdateDashboardInput) (*domain.Dashboard, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	if existing.OwnerID != userID {
		return nil, ErrForbidden
	}
	d := &domain.Dashboard{
		ID: id, Name: in.Name, Description: in.Description, Icon: in.Icon,
		Widgets: in.Widgets, Layout: in.Layout, Version: in.Version,
	}
	ok, err := s.repo.Update(ctx, d)
	if err != nil {
		return nil, fmt.Errorf("update: %w", err)
	}
	if !ok {
		return nil, ErrConflict
	}
	return s.repo.GetByID(ctx, id)
}

func (s *DashboardSvc) UpdateLayout(ctx context.Context, id, userID string, in domain.UpdateLayoutInput) (*domain.Dashboard, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	if existing.OwnerID != userID {
		return nil, ErrForbidden
	}
	ok, err := s.repo.UpdateLayout(ctx, id, in.Layout, in.Version)
	if err != nil {
		return nil, fmt.Errorf("update layout: %w", err)
	}
	if !ok {
		return nil, ErrConflict
	}
	return s.repo.GetByID(ctx, id)
}

func (s *DashboardSvc) UpdateShare(ctx context.Context, id, userID string, in domain.UpdateShareInput) (*domain.Dashboard, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	if existing.OwnerID != userID {
		return nil, ErrForbidden
	}
	var shareToken *string
	if in.IsPublic {
		t := uuid.NewString()
		shareToken = &t
	}
	return existing, s.repo.UpdateShare(ctx, id, in.IsPublic, shareToken)
}

func (s *DashboardSvc) Fork(ctx context.Context, id, userID string) (*domain.Dashboard, error) {
	src, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}
	forkedID := id
	d := &domain.Dashboard{
		ID:           uuid.NewString(),
		Name:         src.Name + " (fork)",
		Description:  src.Description,
		Icon:         src.Icon,
		OwnerID:      userID,
		Widgets:      src.Widgets,
		Layout:       src.Layout,
		ForkedFromID: &forkedID,
	}
	return d, s.repo.Create(ctx, d)
}

func (s *DashboardSvc) GetData(ctx context.Context, id, timeRange, team, repo_ string) (map[string]any, error) {
	d, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrNotFound
	}

	from, to := parseTimeRange(timeRange)
	g, gctx := errgroup.WithContext(ctx)
	results := make(map[string]any, len(d.Widgets))

	for _, w := range d.Widgets {
		w := w
		g.Go(func() error {
			data, err := s.metrics.GetTimeSeries(gctx, w.InstanceID, team, from, to)
			if err != nil {
				return nil // widget data failure is non-fatal
			}
			results[w.InstanceID] = data
			return nil
		})
	}
	_ = g.Wait()
	return results, nil
}

func parseTimeRange(tr string) (time.Time, time.Time) {
	to := time.Now()
	days := 30
	switch tr {
	case "7d":
		days = 7
	case "14d":
		days = 14
	case "90d":
		days = 90
	}
	return to.AddDate(0, 0, -days), to
}

    Step 2: Create cmd/api/biz/metrics_svc.go

go

package biz

import (
	"context"
	"sync"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/repo"
	"golang.org/x/sync/errgroup"
)

type MetricsSvc struct {
	repo repo.MetricRepo
}

func NewMetricsSvc(r repo.MetricRepo) *MetricsSvc { return &MetricsSvc{repo: r} }

func (s *MetricsSvc) GetMetric(ctx context.Context, metricID, timeRange, team string) (*domain.MetricResponse, error) {
	from, to := parseTimeRange(timeRange)
	data, err := s.repo.GetTimeSeries(ctx, metricID, team, from, to)
	if err != nil {
		return nil, ErrNotFound
	}
	return &domain.MetricResponse{MetricID: metricID, TimeRange: timeRange, Team: team, Data: data}, nil
}

func (s *MetricsSvc) GetBreakdown(ctx context.Context, metricID, timeRange string) ([]domain.MetricBreakdownItem, error) {
	from, to := parseTimeRange(timeRange)
	return s.repo.GetBreakdown(ctx, metricID, from, to)
}

func (s *MetricsSvc) GetDORA(ctx context.Context, timeRange string) (*domain.DORAMetrics, error) {
	from, to := parseTimeRange(timeRange)
	var (
		deployFreq, leadTime, cfr, mttr []domain.MetricDataPoint
		mu                               sync.Mutex
		result                           domain.DORAMetrics
	)

	g, gctx := errgroup.WithContext(ctx)

	fetch := func(metricID string, dest *[]domain.MetricDataPoint) {
		g.Go(func() error {
			data, err := s.repo.GetTimeSeries(gctx, metricID, "all", from, to)
			if err != nil {
				return nil
			}
			mu.Lock()
			*dest = data
			mu.Unlock()
			return nil
		})
	}

	fetch("deploy-freq", &deployFreq)
	fetch("lead-time", &leadTime)
	fetch("cfr", &cfr)
	fetch("mttr", &mttr)

	if err := g.Wait(); err != nil {
		return nil, err
	}

	result.DeployFrequency = avg(deployFreq)
	result.LeadTime = avg(leadTime)
	result.ChangeFailureRate = avg(cfr)
	result.MTTR = avg(mttr)

	return &result, nil
}

func avg(pts []domain.MetricDataPoint) float64 {
	if len(pts) == 0 {
		return 0
	}
	sum := 0.0
	for _, p := range pts {
		sum += p.Value
	}
	return sum / float64(len(pts))
}

    Step 3: Create cmd/api/biz/misc_svc.go

go

package biz

import (
	"context"

	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/repo"
)

type MiscSvc struct {
	plugins   repo.PluginRepo
	insights  repo.AIInsightRepo
	activity  repo.ActivityRepo
	dashboard repo.DashboardRepo
}

func NewMiscSvc(p repo.PluginRepo, i repo.AIInsightRepo, a repo.ActivityRepo, d repo.DashboardRepo) *MiscSvc {
	return &MiscSvc{plugins: p, insights: i, activity: a, dashboard: d}
}

func (s *MiscSvc) GetPlugins(ctx context.Context) ([]*domain.Plugin, error) {
	return s.plugins.List(ctx)
}

func (s *MiscSvc) InstallPlugin(ctx context.Context, id string) error {
	return s.plugins.Install(ctx, id)
}

func (s *MiscSvc) GetInsights(ctx context.Context) ([]*domain.AIInsight, error) {
	return s.insights.List(ctx)
}

func (s *MiscSvc) GetActivity(ctx context.Context) ([]*domain.ActivityEvent, error) {
	return s.activity.List(ctx, 20)
}

func (s *MiscSvc) GetTemplates(ctx context.Context) ([]*domain.DashboardTemplate, error) {
	return s.dashboard.ListTemplates(ctx)
}

func (s *MiscSvc) AIChat(_ context.Context, message string) (string, error) {
	return "AI chat is not yet implemented. Your message: " + message, nil
}

    Step 4: Commit

bash

git add cmd/api/biz/
git commit -m "feat: add dashboard, metrics, and misc biz services"

Task 16: handlers/ — All Endpoints

Files:

    Create: cmd/api/handlers/auth.go

    Create: cmd/api/handlers/dashboards.go

    Create: cmd/api/handlers/metrics.go

    Create: cmd/api/handlers/misc.go

    Step 1: Create cmd/api/handlers/auth.go

go

package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/cmd/api/auth"
	"github.com/getmetraly/metraly/cmd/api/respond"
)

type AuthHandler struct{ svc *auth.Service }

func NewAuthHandler(svc *auth.Service) *AuthHandler { return &AuthHandler{svc} }

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return
	}
	pair, err := h.svc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		respond.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid credentials")
		return
	}
	respond.JSON(w, http.StatusOK, pair)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respond.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid body")
		return
	}
	access, expiresIn, err := h.svc.Refresh(r.Context(), req.RefreshToken)
	if err != nil {
		respond.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid refresh token")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]any{"access_token": access, "expires_in": expiresIn})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	h.svc.Logout(r.Context(), req.RefreshToken)
	w.WriteHeader(http.StatusNoContent)
}

    Step 2: Create cmd/api/handlers/dashboards.go

go

package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/cmd/api/biz"
	"github.com/getmetraly/metraly/cmd/api/domain"
	"github.com/getmetraly/metraly/cmd/api/middleware"
	"github.com/getmetraly/metraly/cmd/api/respond"
	"github.com/go-chi/chi/v5"
)

type DashboardHandler struct{ svc *biz.DashboardSvc }

func NewDashboardHandler(svc *biz.DashboardSvc) *DashboardHandler { return &DashboardHandler{svc} }

func (h *DashboardHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	dashboards, err := h.svc.List(r.Context(), claims.Sub)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list dashboards")
		return
	}
	respond.JSON(w, http.StatusOK, dashboards)
}

func (h *DashboardHandler) Get(w http.ResponseWriter, r *http.Request) {
	d, err := h.svc.Get(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		respond.Error(w, http.StatusNotFound, "NOT_FOUND", "dashboard not found")
		return
	}
	respond.JSON(w, http.StatusOK, d)
}

func (h *DashboardHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	var in domain.CreateDashboardInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respond.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid body")
		return
	}
	d, err := h.svc.Create(r.Context(), claims.Sub, in)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create")
		return
	}
	respond.JSON(w, http.StatusCreated, d)
}

func (h *DashboardHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	var in domain.UpdateDashboardInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respond.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid body")
		return
	}
	d, err := h.svc.Update(r.Context(), chi.URLParam(r, "id"), claims.Sub, in)
	switch err {
	case nil:
		respond.JSON(w, http.StatusOK, d)
	case biz.ErrConflict:
		respond.Error(w, http.StatusConflict, "VERSION_CONFLICT", "version conflict")
	case biz.ErrForbidden:
		respond.Error(w, http.StatusForbidden, "FORBIDDEN", "not owner")
	default:
		respond.Error(w, http.StatusNotFound, "NOT_FOUND", "dashboard not found")
	}
}

func (h *DashboardHandler) UpdateLayout(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	var in domain.UpdateLayoutInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		respond.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid body")
		return
	}
	d, err := h.svc.UpdateLayout(r.Context(), chi.URLParam(r, "id"), claims.Sub, in)
	switch err {
	case nil:
		respond.JSON(w, http.StatusOK, d)
	case biz.ErrConflict:
		respond.Error(w, http.StatusConflict, "VERSION_CONFLICT", "version conflict")
	default:
		respond.Error(w, http.StatusNotFound, "NOT_FOUND", "not found")
	}
}

func (h *DashboardHandler) UpdateShare(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	var in domain.UpdateShareInput
	json.NewDecoder(r.Body).Decode(&in)
	d, err := h.svc.UpdateShare(r.Context(), chi.URLParam(r, "id"), claims.Sub, in)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, d)
}

func (h *DashboardHandler) Fork(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	d, err := h.svc.Fork(r.Context(), chi.URLParam(r, "id"), claims.Sub)
	if err != nil {
		respond.Error(w, http.StatusNotFound, "NOT_FOUND", "dashboard not found")
		return
	}
	respond.JSON(w, http.StatusCreated, d)
}

func (h *DashboardHandler) GetData(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	data, err := h.svc.GetData(r.Context(), chi.URLParam(r, "id"),
		q.Get("timeRange"), q.Get("team"), q.Get("repo"))
	if err != nil {
		respond.Error(w, http.StatusNotFound, "NOT_FOUND", "dashboard not found")
		return
	}
	respond.JSON(w, http.StatusOK, data)
}

    Step 3: Create cmd/api/handlers/metrics.go

go

package handlers

import (
	"net/http"

	"github.com/getmetraly/metraly/cmd/api/biz"
	"github.com/getmetraly/metraly/cmd/api/respond"
	"github.com/go-chi/chi/v5"
)

type MetricsHandler struct{ svc *biz.MetricsSvc }

func NewMetricsHandler(svc *biz.MetricsSvc) *MetricsHandler { return &MetricsHandler{svc} }

func (h *MetricsHandler) GetMetric(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	data, err := h.svc.GetMetric(r.Context(), chi.URLParam(r, "metricId"),
		q.Get("timeRange"), q.Get("team"))
	if err != nil {
		respond.Error(w, http.StatusNotFound, "NOT_FOUND", "metric not found")
		return
	}
	respond.JSON(w, http.StatusOK, data)
}

func (h *MetricsHandler) GetBreakdown(w http.ResponseWriter, r *http.Request) {
	data, err := h.svc.GetBreakdown(r.Context(), chi.URLParam(r, "metricId"), r.URL.Query().Get("timeRange"))
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, data)
}

func (h *MetricsHandler) GetDORA(w http.ResponseWriter, r *http.Request) {
	data, err := h.svc.GetDORA(r.Context(), r.URL.Query().Get("timeRange"))
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, data)
}

    Step 4: Create cmd/api/handlers/misc.go

go

package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/getmetraly/metraly/cmd/api/biz"
	"github.com/getmetraly/metraly/cmd/api/middleware"
	"github.com/getmetraly/metraly/cmd/api/repo"
	"github.com/getmetraly/metraly/cmd/api/respond"
	"github.com/go-chi/chi/v5"
)

type MiscHandler struct {
	svc   *biz.MiscSvc
	users repo.UserRepo
}

func NewMiscHandler(svc *biz.MiscSvc, users repo.UserRepo) *MiscHandler {
	return &MiscHandler{svc, users}
}

func (h *MiscHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFrom(r.Context())
	user, err := h.users.FindByID(r.Context(), claims.Sub)
	if err != nil {
		respond.Error(w, http.StatusNotFound, "NOT_FOUND", "user not found")
		return
	}
	respond.JSON(w, http.StatusOK, user)
}

func (h *MiscHandler) GetActivity(w http.ResponseWriter, r *http.Request) {
	events, err := h.svc.GetActivity(r.Context())
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, events)
}

func (h *MiscHandler) GetTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.svc.GetTemplates(r.Context())
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, templates)
}

func (h *MiscHandler) GetPlugins(w http.ResponseWriter, r *http.Request) {
	plugins, err := h.svc.GetPlugins(r.Context())
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, plugins)
}

func (h *MiscHandler) InstallPlugin(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.InstallPlugin(r.Context(), chi.URLParam(r, "id")); err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]bool{"installed": true})
}

func (h *MiscHandler) ConnectSource(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]bool{"connected": true})
}

func (h *MiscHandler) GetInsights(w http.ResponseWriter, r *http.Request) {
	insights, err := h.svc.GetInsights(r.Context())
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, insights)
}

func (h *MiscHandler) AIChat(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Message string `json:"message"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	reply, err := h.svc.AIChat(r.Context(), req.Message)
	if err != nil {
		respond.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "failed")
		return
	}
	respond.JSON(w, http.StatusOK, map[string]string{"reply": reply})
}

func (h *MiscHandler) WidgetData(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, map[string]any{"data": []any{}})
}

    Step 5: Commit

bash

git add cmd/api/handlers/
git commit -m "feat: add all HTTP handlers for auth, dashboards, metrics, misc"

Task 17: main.go — Wiring and Graceful Shutdown

Files:

    Modify: cmd/api/main.go

    Step 1: Rewrite cmd/api/main.go

go

package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/getmetraly/metraly/cmd/api/auth"
	"github.com/getmetraly/metraly/cmd/api/biz"
	"github.com/getmetraly/metraly/cmd/api/config"
	"github.com/getmetraly/metraly/cmd/api/db"
	"github.com/getmetraly/metraly/cmd/api/handlers"
	"github.com/getmetraly/metraly/cmd/api/middleware"
	"github.com/getmetraly/metraly/cmd/api/migrations"
	"github.com/getmetraly/metraly/cmd/api/repo"
	"github.com/getmetraly/metraly/cmd/api/respond"
	"github.com/getmetraly/metraly/cmd/api/seed"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	seedFlag := flag.Bool("seed", false, "run seed and exit")
	flag.Parse()

	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := db.New(ctx, cfg.PostgresDSN)
	if err != nil {
		log.Fatal().Err(err).Msg("connect to postgres")
	}
	defer pool.Close()

	if err := db.Migrate(context.Background(), pool, migrations.FS); err != nil {
		log.Fatal().Err(err).Msg("migrate")
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
	})

	// Repos
	userRepo := repo.NewUserRepo(pool)
	dashRepo := repo.NewDashboardRepo(pool)
	metricRepo := repo.NewMetricRepo(pool)
	pluginRepo := repo.NewPluginRepo(pool)
	insightRepo := repo.NewAIInsightRepo(pool)
	activityRepo := repo.NewActivityRepo(pool)

	if *seedFlag || cfg.SeedOnStart {
		runner := seed.NewRunner(userRepo, pluginRepo, insightRepo, activityRepo, metricRepo)
		if err := runner.Run(context.Background(), cfg.SeedAdminEmail, cfg.SeedAdminPassword); err != nil {
			log.Fatal().Err(err).Msg("seed failed")
		}
		log.Info().Msg("seed complete")
		if *seedFlag {
			return
		}
	}

	// Auth
	km, err := auth.NewKeyManager(cfg.JWTPrivateKey)
	if err != nil {
		log.Fatal().Err(err).Msg("init key manager")
	}
	accessTTL := parseTTL(cfg.AccessTokenTTL, 900)
	refreshTTL := parseTTL(cfg.RefreshTokenTTL, 604800)
	tokenStore := auth.NewTokenStore(rdb, refreshTTL)
	authSvc := auth.NewService(km, tokenStore, userRepo, accessTTL)

	// Biz
	dashSvc := biz.NewDashboardSvc(dashRepo, metricRepo, rdb)
	metricsSvc := biz.NewMetricsSvc(metricRepo)
	miscSvc := biz.NewMiscSvc(pluginRepo, insightRepo, activityRepo, dashRepo)

	// Handlers
	authH := handlers.NewAuthHandler(authSvc)
	dashH := handlers.NewDashboardHandler(dashSvc)
	metricsH := handlers.NewMetricsHandler(metricsSvc)
	miscH := handlers.NewMiscHandler(miscSvc, userRepo)

	r := chi.NewRouter()
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.Logger)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		respond.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Route("/api/v1", func(r chi.Router) {
		// Public auth routes
		r.Post("/auth/login", authH.Login)
		r.Post("/auth/refresh", authH.Refresh)
		r.Post("/auth/logout", authH.Logout)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth(km))

			r.Get("/me", miscH.Me)
			r.Get("/activity", miscH.GetActivity)
			r.Get("/templates", miscH.GetTemplates)
			r.Get("/plugins", miscH.GetPlugins)
			r.Post("/plugins/{id}/install", miscH.InstallPlugin)
			r.Post("/sources/connect", miscH.ConnectSource)
			r.Get("/ai/insights", miscH.GetInsights)
			r.Post("/ai/chat", miscH.AIChat)
			r.Post("/widgets/data", miscH.WidgetData)

			r.Get("/metrics/{metricId}", metricsH.GetMetric)
			r.Get("/metrics/{metricId}/breakdown", metricsH.GetBreakdown)
			r.Get("/dora", metricsH.GetDORA)

			r.Get("/dashboards", dashH.List)
			r.Post("/dashboards", dashH.Create)
			r.Get("/dashboards/{id}", dashH.Get)
			r.Put("/dashboards/{id}", dashH.Update)
			r.Post("/dashboards/{id}/fork", dashH.Fork)
			r.Put("/dashboards/{id}/layout", dashH.UpdateLayout)
			r.Put("/dashboards/{id}/share", dashH.UpdateShare)
			r.Post("/dashboards/{id}/data", dashH.GetData)
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info().Str("port", cfg.Port).Msg("server starting")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutCtx, shutCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutCancel()
	if err := srv.Shutdown(shutCtx); err != nil {
		log.Error().Err(err).Msg("shutdown error")
	}
	log.Info().Msg("server stopped")
}

func parseTTL(s string, def int) time.Duration {
	n, err := strconv.Atoi(s)
	if err != nil {
		return time.Duration(def) * time.Second
	}
	return time.Duration(n) * time.Second
}

    Step 2: Build to verify it compiles

bash

go build ./cmd/api/...

Expected: no errors.

    Step 3: Commit

bash

git add cmd/api/main.go
git commit -m "feat: wire up main.go with chi router, all routes, graceful shutdown"

Task 18: Unit Tests

Files:

    Create: cmd/api/biz/dashboard_svc_test.go

    Create: cmd/api/biz/metrics_svc_test.go

    Step 1: Create cmd/api/biz/dashboard_svc_test.go

go

package biz_test

import (
	"context"
	"testing"

	"github.com/getmetraly/metraly/cmd/api/biz"
	"github.com/getmetraly/metraly/cmd/api/domain"
)

type mockDashRepo struct {
	dashboards map[string]*domain.Dashboard
	updateOK   bool
}

func (m *mockDashRepo) List(_ context.Context, _ string) ([]*domain.Dashboard, error) {
	var result []*domain.Dashboard
	for _, d := range m.dashboards {
		result = append(result, d)
	}
	return result, nil
}

func (m *mockDashRepo) GetByID(_ context.Context, id string) (*domain.Dashboard, error) {
	d, ok := m.dashboards[id]
	if !ok {
		return nil, biz.ErrNotFound
	}
	return d, nil
}

func (m *mockDashRepo) Create(_ context.Context, d *domain.Dashboard) error {
	m.dashboards[d.ID] = d
	return nil
}

func (m *mockDashRepo) Update(_ context.Context, _ *domain.Dashboard) (bool, error) {
	return m.updateOK, nil
}

func (m *mockDashRepo) UpdateLayout(_ context.Context, _ string, _ []domain.WidgetLayout, _ int) (bool, error) {
	return m.updateOK, nil
}

func (m *mockDashRepo) UpdateShare(_ context.Context, _ string, _ bool, _ *string) error {
	return nil
}

func (m *mockDashRepo) ListTemplates(_ context.Context) ([]*domain.DashboardTemplate, error) {
	return nil, nil
}

func TestDashboardSvc_Update_VersionConflict(t *testing.T) {
	repo := &mockDashRepo{
		dashboards: map[string]*domain.Dashboard{
			"d1": {ID: "d1", OwnerID: "user-1", Version: 2},
		},
		updateOK: false,
	}
	svc := biz.NewDashboardSvc(repo, nil, nil)

	_, err := svc.Update(context.Background(), "d1", "user-1", domain.UpdateDashboardInput{
		Name: "Updated", Version: 1,
	})
	if err != biz.ErrConflict {
		t.Fatalf("expected ErrConflict, got %v", err)
	}
}

func TestDashboardSvc_Update_Forbidden(t *testing.T) {
	repo := &mockDashRepo{
		dashboards: map[string]*domain.Dashboard{
			"d1": {ID: "d1", OwnerID: "user-1", Version: 1},
		},
		updateOK: true,
	}
	svc := biz.NewDashboardSvc(repo, nil, nil)

	_, err := svc.Update(context.Background(), "d1", "user-2", domain.UpdateDashboardInput{
		Name: "Updated", Version: 1,
	})
	if err != biz.ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

    Step 2: Run biz tests

bash

go test ./cmd/api/biz/... -v

Expected: PASS.

    Step 3: Run all tests

bash

go test ./cmd/api/...

Expected: PASS (all packages including config, auth, respond, seed, biz).

    Step 4: Commit

bash

git add cmd/api/biz/dashboard_svc_test.go
git commit -m "test: add biz unit tests for version conflict and forbidden paths"

    Note: cmd/api/biz/metrics_svc_test.go is listed in the file plan but no test body was provided. Implement tests for MetricsSvc (GetMetric, GetBreakdown, GetDORA) using a mock MetricRepo following the same pattern as the dashboard tests.

Self-Review Checklist

    All 20 mockApi methods have corresponding endpoints

    PRNG first value verified: NewPRNG(42).Next() = 705893/2147483646 ≈ 0.000328775

    Refresh token rotation: Consume deletes old token atomically before issuing new access token

    Dashboard version conflict → 409 via UPDATE WHERE version=$N, 0 rows → ErrConflict

    WidgetInstance.Config is json.RawMessage — no union type explosion

    go:embed *.sql in cmd/api/migrations/embed.go (no .. paths)

    sync.Pool[hash.Hash] in token store for SHA-256 hot path

    errgroup for parallel widget data fetch and 4 DORA metrics

    sync.Pool[bytes.Buffer] in respond package

    SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD required for seed runner