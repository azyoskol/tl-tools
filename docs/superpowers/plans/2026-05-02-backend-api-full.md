# Backend API – Full Implementation Plan

> **For agentic workers:** REQUIRED SUB‑SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task‑by‑task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill every gap between the current codebase and the design spec, add optional enhancements (template cache, RBAC verification, graceful‑shutdown test, CI pipeline) and achieve 100 % test coverage.

**Architecture:** 3‑layer clean architecture – Handler (HTTP shell) → Biz (business logic, per‑operation Redis cache, errgroup) → Repo (pgx SQL, no ORM). Auth lives in its own package, now supporting both local JWT and optional OIDC. Seed system reproduces all mock data deterministically using a Park‑Miller PRNG with seed = 42.

**Tech Stack:** Go 1.26, chi/v5, pgx/v5 (PostgreSQL 16 + TimescaleDB), go‑redis/v9, golang‑jwt/jwt/v5, coreos/go‑oidc/v3, json‑iterator/go, zerolog, validator/v10, bcrypt, testify, testcontainers‑go, Docker.

---

## Task 1: Add OIDC (OpenID Connect) Support

**Files**
- `cmd/api/auth/oidc.go` (new)
- `cmd/api/auth/service.go` (modify)
- `cmd/api/config/config.go` (modify)
- `cmd/api/auth/oidc_test.go` (new)
- `cmd/api/main.go` (modify)

### Steps
- [ ] **Step 1: Write the failing OIDC unit test**
  ```go
  package auth_test

  import (
      "context"
      "testing"

      "github.com/getmetraly/metraly/cmd/api/auth"
      "github.com/go-redis/redis/v9"
      "github.com/stretchr/testify/assert"
      "github.com/stretchr/testify/require"
  )

  func TestOIDCLogin_Flow(t *testing.T) {
      // Build a mock OIDC provider that always returns the email "oidc@test.com".
      mockProvider := auth.NewMockOIDCProvider("oidc.test.com", "client-id", "client-secret", "http://localhost/oidc/callback")
      km, _ := auth.NewKeyManager("")
      store := auth.NewTokenStore(redis.NewClient(&redis.Options{Addr: "localhost:6379"}), time.Hour*24*7)

      svc := auth.NewService(km, store, mockUserRepo{}, time.Minute*15, mockProvider)

      pair, err := svc.LoginOIDC(context.Background(), "oidc@test.com")
      require.NoError(t, err)
      assert.NotEmpty(t, pair.AccessToken)
      assert.NotEmpty(t, pair.RefreshToken)
  }
  ```
- [ ] **Step 2: Run the test to confirm it fails**
  ```bash
  go test ./cmd/api/auth -run TestOIDCLogin_Flow -v
  ```
  Expected: compilation error – `LoginOIDC` not defined, `NewMockOIDCProvider` missing.
- [ ] **Step 3: Implement `oidc.go`**
  ```go
  package auth

  import (
      "context"
      "fmt"

      "github.com/coreos/go-oidc/v3/oidc"
      "golang.org/x/oauth2"
  )

  // OIDCProvider lazily wraps an OpenID Connect provider.
  type OIDCProvider struct {
      verifier *oidc.IDTokenVerifier
      config   oauth2.Config
  }

  // NewOIDCProvider creates a provider when OIDC env vars are set.
  func NewOIDCProvider(issuer, clientID, clientSecret, redirectURL string) (*OIDCProvider, error) {
      if issuer == "" {
          return nil, fmt.Errorf("OIDC issuer not configured")
      }
      ctx := context.Background()
      prov, err := oidc.NewProvider(ctx, issuer)
      if err != nil {
          return nil, err
      }
      verifier := prov.Verifier(&oidc.Config{ClientID: clientID})
      cfg := oauth2.Config{
          ClientID:     clientID,
          ClientSecret: clientSecret,
          RedirectURL:  redirectURL,
          Endpoint:     prov.Endpoint(),
          Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
      }
      return &OIDCProvider{verifier: verifier, config: cfg}, nil
  }

  // VerifyIDToken validates the id_token and extracts the email claim.
  func (p *OIDCProvider) VerifyIDToken(ctx context.Context, raw string) (string, error) {
      idt, err := p.verifier.Verify(ctx, raw)
      if err != nil {
          return "", err
      }
      var claims struct{ Email string `json:"email"` }
      if err := idt.Claims(&claims); err != nil {
          return "", err
      }
      return claims.Email, nil
  }
  ```
- [ ] **Step 4: Add mock provider for tests** (in `auth/oidc_test.go` before the test)
  ```go
  // NewMockOIDCProvider returns a deterministic provider used only in unit tests.
  func NewMockOIDCProvider(issuer, clientID, clientSecret, redirectURL string) *OIDCProvider {
      // No network calls – use a dummy verifier that returns a fixed email.
      verifier := &mockVerifier{}
      cfg := oauth2.Config{ClientID: clientID, ClientSecret: clientSecret, RedirectURL: redirectURL}
      return &OIDCProvider{verifier: verifier, config: cfg}
  }

  type mockVerifier struct{}
  func (m *mockVerifier) Verify(ctx context.Context, raw string) (*oidc.IDToken, error) {
      // Return a token whose claims contain a static email.
      return &oidc.IDToken{Claims: map[string]interface{}{"email": "oidc@test.com"}}, nil
  }
  ```
- [ ] **Step 5: Extend `auth/service.go`** – add a field and constructor overload, plus `LoginOIDC` method.
  ```go
  type Service struct {
      km        *KeyManager
      store     *TokenStore
      users     repo.UserRepo
      accessTTL time.Duration
      oidc      *OIDCProvider // optional, may be nil
  }

  func NewService(km *KeyManager, store *TokenStore, users repo.UserRepo,
      accessTTL time.Duration, oidc *OIDCProvider) *Service {
      return &Service{km: km, store: store, users: users, accessTTL: accessTTL, oidc: oidc}
  }

  // LoginOIDC creates or finds a user based on the verified email and issues a token pair.
  func (s *Service) LoginOIDC(ctx context.Context, email string) (*TokenPair, error) {
      u, err := s.users.FindByEmail(ctx, email)
      if err != nil {
          // Not found → create a viewer‑role user.
          u = &domain.User{ID: uuid.NewString(), Email: email, Role: "viewer"}
          if err := s.users.Create(ctx, u, ""); err != nil {
              return nil, err
          }
      }
      return s.issuePair(ctx, u)
  }
  ```
- [ ] **Step 6: Update `config/config.go` – add OIDC env fields and parsing.**
  ```go
  type AppConfig struct {
      // existing fields …
      OIDCIssuerURL    string
      OIDCClientID     string
      OIDCClientSecret string
      OIDCRedirectURL  string
  }

  func Load() AppConfig {
      return AppConfig{
          // existing loads …
          OIDCIssuerURL:    getEnv("OIDC_ISSUER_URL", ""),
          OIDCClientID:     getEnv("OIDC_CLIENT_ID", ""),
          OIDCClientSecret: getEnv("OIDC_CLIENT_SECRET", ""),
          OIDCRedirectURL:  getEnv("OIDC_REDIRECT_URL", ""),
      }
  }
  ```
- [ ] **Step 7: Wire provider in `cmd/api/main.go`**
  ```go
  cfg := config.Load()
  oidcProvider, _ := auth.NewOIDCProvider(cfg.OIDCIssuerURL, cfg.OIDCClientID,
      cfg.OIDCClientSecret, cfg.OIDCRedirectURL)

  authSvc := auth.NewService(km, tokenStore, userRepo, time.Duration(cfg.AccessTokenTTL)*time.Second, oidcProvider)
  ```
- [ ] **Step 8: Run the OIDC test again – should PASS.**
  ```bash
  go test ./cmd/api/auth -run TestOIDCLogin_Flow -v
  ```
- [ ] **Step 9: Commit OIDC changes**
  ```bash
  git add cmd/api/auth/oidc.go cmd/api/auth/service.go cmd/api/auth/oidc_test.go \
      cmd/api/config/config.go cmd/api/main.go
  git commit -m "feat(auth): add lazy OIDC provider and login flow"
  ```

---

## Task 2: Introduce Redis‑Based Cache Layer

**Files**
- `cmd/api/cache/metrics.go` (new)
- `cmd/api/cache/dashboard.go` (new)
- `cmd/api/cache/template.go` (new)
- `cmd/api/biz/metrics_svc.go` (modify)
- `cmd/api/biz/dashboard_svc.go` (modify)
- `cmd/api/main.go` (modify)
- `cmd/api/cache/cache_test.go` (new)

### Steps
- [ ] **Step 1: Write failing cache‑miss test**
  ```go
  package cache_test

  import (
      "context"
      "testing"
      "time"

      "github.com/go-redis/redis/v9"
      "github.com/getmetraly/metraly/cmd/api/cache"
      "github.com/getmetraly/metraly/cmd/api/domain"
      "github.com/stretchr/testify/assert"
  )

  func TestMetricsCache_GetMiss(t *testing.T) {
      rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
      defer rdb.Close()
      c := cache.NewMetricsCache(rdb, time.Minute*5)

      _, err := c.Get(context.Background(), "deploy-freq", "Platform")
      assert.ErrorIs(t, err, cache.ErrCacheMiss)
  }
  ```
- [ ] **Step 2: Run the test – expect failure (cache type not defined).**
  ```bash
  go test ./cmd/api/cache -run TestMetricsCache_GetMiss -v
  ```
- [ ] **Step 3: Implement `cache/metrics.go`**
  ```go
  package cache

  import (
      "context"
      "encoding/json"
      "time"

      "github.com/go-redis/redis/v9"
      "github.com/getmetraly/metraly/cmd/api/domain"
  )

  var ErrCacheMiss = redis.Nil

  type MetricsCache struct {
      rdb *redis.Client
      ttl time.Duration
  }

  func NewMetricsCache(rdb *redis.Client, ttl time.Duration) *MetricsCache {
      return &MetricsCache{rdb: rdb, ttl: ttl}
  }

  func (c *MetricsCache) key(metricID, team string) string { return "metrics:" + metricID + ":" + team }

  func (c *MetricsCache) Get(ctx context.Context, metricID, team string) ([]domain.MetricDataPoint, error) {
      data, err := c.rdb.Get(ctx, c.key(metricID, team)).Bytes()
      if err != nil {
          return nil, err
      }
      var pts []domain.MetricDataPoint
      if err := json.Unmarshal(data, &pts); err != nil {
          return nil, err
      }
      return pts, nil
  }

  func (c *MetricsCache) Set(ctx context.Context, metricID, team string, pts []domain.MetricDataPoint) error {
      b, err := json.Marshal(pts)
      if err != nil {
          return err
      }
      return c.rdb.Set(ctx, c.key(metricID, team), b, c.ttl).Err()
  }
  ```
- [ ] **Step 4: Implement `cache/dashboard.go`** (similar pattern, key `dashboard:{id}`)
  ```go
  package cache

  import (
      "context"
      "encoding/json"
      "time"

      "github.com/go-redis/redis/v9"
      "github.com/getmetraly/metraly/cmd/api/domain"
  )

  type DashboardCache struct {
      rdb *redis.Client
      ttl time.Duration
  }

  func NewDashboardCache(rdb *redis.Client, ttl time.Duration) *DashboardCache {
      return &DashboardCache{rdb: rdb, ttl: ttl}
  }

  func (c *DashboardCache) key(id string) string { return "dashboard:" + id }

  func (c *DashboardCache) Get(ctx context.Context, id string) (*domain.Dashboard, error) {
      data, err := c.rdb.Get(ctx, c.key(id)).Bytes()
      if err != nil {
          return nil, err
      }
      var d domain.Dashboard
      if err := json.Unmarshal(data, &d); err != nil {
          return nil, err
      }
      return &d, nil
  }

  func (c *DashboardCache) Set(ctx context.Context, d *domain.Dashboard) error {
      b, err := json.Marshal(d)
      if err != nil {
          return err
      }
      return c.rdb.Set(ctx, c.key(d.ID), b, c.ttl).Err()
  }
  ```
- [ ] **Step 5: Implement `cache/template.go`** (static list of templates)
  ```go
  package cache

  import (
      "context"
      "encoding/json"
      "time"

      "github.com/go-redis/redis/v9"
      "github.com/getmetraly/metraly/cmd/api/domain"
  )

  type TemplateCache struct {
      rdb *redis.Client
      ttl time.Duration
  }

  func NewTemplateCache(rdb *redis.Client, ttl time.Duration) *TemplateCache {
      return &TemplateCache{rdb: rdb, ttl: ttl}
  }

  func (c *TemplateCache) key() string { return "templates" }

  func (c *TemplateCache) Get(ctx context.Context) ([]*domain.DashboardTemplate, error) {
      data, err := c.rdb.Get(ctx, c.key()).Bytes()
      if err != nil {
          return nil, err
      }
      var t []*domain.DashboardTemplate
      if err := json.Unmarshal(data, &t); err != nil {
          return nil, err
      }
      return t, nil
  }

  func (c *TemplateCache) Set(ctx context.Context, t []*domain.DashboardTemplate) error {
      b, err := json.Marshal(t)
      if err != nil {
          return err
      }
      return c.rdb.Set(ctx, c.key(), b, c.ttl).Err()
  }
  ```
- [ ] **Step 6: Wire caches into `biz/metrics_svc.go`** – cache lookup first, fallback to repo, then populate cache.
  ```go
  type MetricsSvc struct {
      repo  repo.MetricRepo
      cache *cache.MetricsCache
  }

  func NewMetricsSvc(r repo.MetricRepo, c *cache.MetricsCache) *MetricsSvc { return &MetricsSvc{repo: r, cache: c} }

  func (s *MetricsSvc) GetMetric(ctx context.Context, metricID, timeRange, team string) (*domain.MetricResponse, error) {
      if pts, err := s.cache.Get(ctx, metricID, team); err == nil {
          return &domain.MetricResponse{MetricID: metricID, TimeRange: timeRange, Team: team, Data: pts}, nil
      }
      from, to := parseRange(timeRange)
      pts, err := s.repo.GetTimeSeries(ctx, metricID, team, from, to)
      if err != nil { return nil, err }
      _ = s.cache.Set(ctx, metricID, team, pts)
      return &domain.MetricResponse{MetricID: metricID, TimeRange: timeRange, Team: team, Data: pts}, nil
  }
  ```
- [ ] **Step 7: Wire caches into `biz/dashboard_svc.go`** (similar pattern).
  ```go
  type DashboardSvc struct {
      repo  repo.DashboardRepo
      cache *cache.DashboardCache
  }

  func NewDashboardSvc(r repo.DashboardRepo, c *cache.DashboardCache) *DashboardSvc { return &DashboardSvc{repo: r, cache: c} }

  func (s *DashboardSvc) GetByID(ctx context.Context, id string) (*domain.Dashboard, error) {
      if d, err := s.cache.Get(ctx, id); err == nil {
          return d, nil
      }
      d, err := s.repo.GetByID(ctx, id)
      if err != nil { return nil, err }
      _ = s.cache.Set(ctx, d)
      return d, nil
  }
  ```
- [ ] **Step 8: Add cache constructors in `cmd/api/main.go`** after Redis client creation.
  ```go
  metricsCache   := cache.NewMetricsCache(rdb, time.Duration(cfg.MetricsCacheTTL)*time.Second)
  dashboardCache := cache.NewDashboardCache(rdb, time.Duration(cfg.DashboardsCacheTTL)*time.Second)
  templateCache  := cache.NewTemplateCache(rdb, time.Duration(cfg.TemplatesCacheTTL)*time.Second)

  metricsSvc   := biz.NewMetricsSvc(metricRepo, metricsCache)
  dashboardSvc := biz.NewDashboardSvc(dashboardRepo, dashboardCache)
  templateSvc   := biz.NewTemplateSvc(pluginRepo, templateCache) // will be added later
  ```
- [ ] **Step 9: Run all cache‑related unit tests**
  ```bash
  go test ./cmd/api/cache -v
  ```
- [ ] **Step 10: Commit cache implementation**
  ```bash
  git add cmd/api/cache/*.go cmd/api/biz/metrics_svc.go cmd/api/biz/dashboard_svc.go \
      cmd/api/main.go cmd/api/cache/cache_test.go
  git commit -m "feat(cache): add Redis caches for metrics, dashboards, templates and integrate into services"
  ```

---

## Task 3: Add Cache‑TTL Settings to Configuration

**Files**
- `cmd/api/config/config.go` (modify)
- `cmd/api/config/config_test.go` (add/modify)
- `cmd/api/main.go` (ensure TTL values are used)

### Steps
- [ ] **Step 1: Write failing TTL test**
  ```go
  package config_test

  import (
      "os"
      "testing"

      "github.com/getmetraly/metraly/cmd/api/config"
  )

  func TestLoad_CacheTTLs(t *testing.T) {
      os.Setenv("METRICS_CACHE_TTL", "300")
      os.Setenv("DASHBOARDS_CACHE_TTL", "30")
      os.Setenv("TEMPLATES_CACHE_TTL", "3600")
      defer func() {
          os.Unsetenv("METRICS_CACHE_TTL")
          os.Unsetenv("DASHBOARDS_CACHE_TTL")
          os.Unsetenv("TEMPLATES_CACHE_TTL")
      }()

      cfg := config.Load()
      if cfg.MetricsCacheTTL != 300 || cfg.DashboardsCacheTTL != 30 || cfg.TemplatesCacheTTL != 3600 {
          t.Fatalf("TTL parsing failed: %+v", cfg)
      }
  }
  ```
- [ ] **Step 2: Run test – expect compile error (fields missing).**
  ```bash
  go test ./cmd/api/config -run TestLoad_CacheTTLs -v
  ```
- [ ] **Step 3: Extend `AppConfig` struct** (already partially done in Task 1, ensure all three fields are present).
  ```go
  type AppConfig struct {
      // existing fields …
      MetricsCacheTTL    int
      DashboardsCacheTTL int
      TemplatesCacheTTL  int
  }
  ```
- [ ] **Step 4: Add helper `getEnvInt`** near the bottom of `config.go`.
  ```go
  func getEnvInt(key string, def int) int {
      if v := os.Getenv(key); v != "" {
          if n, err := strconv.Atoi(v); err == nil {
              return n
          }
      }
      return def
  }
  ```
- [ ] **Step 5: Populate TTL fields in `Load()`** (as shown in Task 1).
- [ ] **Step 6: Run the TTL test again – should PASS.**
  ```bash
  go test ./cmd/api/config -run TestLoad_CacheTTLs -v
  ```
- [ ] **Step 7: Commit config changes**
  ```bash
  git add cmd/api/config/config.go cmd/api/config/config_test.go
  git commit -m "feat(config): add cache TTL env vars and parsing helper"
  ```

---

## Task 4: Unit Tests for Metrics Service (including cache behavior)

**Files**
- `cmd/api/biz/metrics_svc_test.go` (new)

### Steps
- [ ] **Step 1: Write failing test for cache hit**
  ```go
  package biz_test

  import (
      "context"
      "testing"
      "time"

      "github.com/getmetraly/metraly/cmd/api/biz"
      "github.com/getmetraly/metraly/cmd/api/cache"
      "github.com/getmetraly/metraly/cmd/api/domain"
      "github.com/go-redis/redis/v9"
      "github.com/stretchr/testify/assert"
      "github.com/stretchr/testify/require"
  )

  type mockMetricRepo struct{ series map[string][]domain.MetricDataPoint }
  func (m *mockMetricRepo) GetTimeSeries(ctx context.Context, metricID, team string, from, to time.Time) ([]domain.MetricDataPoint, error) {
      return m.series[metricID+"|"+team], nil
  }
  func (m *mockMetricRepo) GetBreakdown(context.Context, string, time.Time, time.Time) ([]domain.MetricBreakdownItem, error) { return nil, nil }
  func (m *mockMetricRepo) BulkInsert(context.Context, []domain.MetricDataPoint, string, string) error { return nil }

  func TestMetricsSvc_CacheHit(t *testing.T) {
      rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
      defer rdb.Close()
      c := cache.NewMetricsCache(rdb, time.Minute*5)

      pts := []domain.MetricDataPoint{{Time: time.Now(), Value: 42}}
      require.NoError(t, c.Set(context.Background(), "deploy-freq", "Platform", pts))

      svc := biz.NewMetricsSvc(&mockMetricRepo{}, c)

      resp, err := svc.GetMetric(context.Background(), "deploy-freq", "30d", "Platform")
      require.NoError(t, err)
      assert.Equal(t, pts, resp.Data)
  }
  ```
- [ ] **Step 2: Run the test – fails because `NewMetricsSvc` signature changed (needs cache).**
- [ ] **Step 3: Adjust `biz/metrics_svc.go` constructor (already done in Task 2).**
- [ ] **Step 4: Run the test again – should PASS.**
- [ ] **Step 5: Add a cache‑miss test (no pre‑populate, verify repo called).**
- [ ] **Step 6: Commit test file**
  ```bash
  git add cmd/api/biz/metrics_svc_test.go
  git commit -m "test: metrics service with cache hit & miss scenarios"
  ```

---

## Task 5: Unit Tests for Dashboard Service (cache and optimistic locking)

**Files**
- `cmd/api/biz/dashboard_svc_test.go` (new)

### Steps
- [ ] **Step 1: Write failing test for dashboard cache hit** (similar to metrics test).
- [ ] **Step 2: Write failing test for version‑conflict error handling** – mock repo `Update` returns `false, nil` and verify `biz.ErrConflict` bubbles up.
- [ ] **Step 3: Run tests – failures related to constructor signature – fix as in Task 2.
- [ ] **Step 4: Ensure tests PASS.
- [ ] **Step 5: Commit**
  ```bash
  git add cmd/api/biz/dashboard_svc_test.go
  git commit -m "test: dashboard service cache & version‑conflict handling"
  ```

---

## Task 6: Unit Tests for Auth Service (JWT & OIDC)

**Files**
- `cmd/api/auth/service_test.go` (new)

### Steps
- [ ] **Step 1: Write test for JWT round‑trip (already present in base plan).**
- [ ] **Step 2: Write test for OIDC `LoginOIDC` flow using the mock provider from Task 1.**
- [ ] **Step 3: Write test for refresh token rotation (consume then issue new).**
- [ ] **Step 4: Write test for logout – token should be removed from Redis.**
- [ ] **Step 5: Run all auth tests – ensure they PASS.**
- [ ] **Step 6: Commit**
  ```bash
  git add cmd/api/auth/service_test.go
  git commit -m "test: auth service JWT, OIDC login, refresh, logout"
  ```

---

## Task 7: Integration Test for SQL Migrations (already partially defined)

**Files**
- `cmd/api/db/migrate_test.go` (new – content from missing‑features plan)

### Steps
- [ ] **Step 1: Write the integration test (already drafted).**
- [ ] **Step 2: Add `testcontainers-go` dependencies to `go.mod`** (already in missing‑features plan).
- [ ] **Step 3: Run the test – ensures 7 migration rows exist.**
- [ ] **Step 4: Commit**
  ```bash
  git add cmd/api/db/migrate_test.go go.mod go.sum
  git commit -m "test: integration test for SQL migrations using testcontainers"
  ```

---

## Task 8: Add Template Cache Implementation & Wiring

**Files**
- `cmd/api/cache/template.go` (created in Task 2)
- `cmd/api/biz/template_svc.go` (new)
- `cmd/api/biz/template_svc_test.go` (new)
- `cmd/api/handlers/templates.go` (modify to use the service)
- `cmd/api/main.go` (wire the service)

### Steps
- [ ] **Step 1: Write failing test for template cache miss** (similar to metrics test).
- [ ] **Step 2: Run test – fails because `TemplateSvc` not yet implemented.
- [ ] **Step 3: Implement `biz/template_svc.go`**
  ```go
  package biz

  import (
      "context"

      "github.com/getmetraly/metraly/cmd/api/cache"
      "github.com/getmetraly/metraly/cmd/api/domain"
      "github.com/getmetraly/metraly/cmd/api/repo"
  )

  type TemplateSvc struct {
      repo  repo.PluginRepo // reuse existing repo for static data
      cache *cache.TemplateCache
  }

  func NewTemplateSvc(r repo.PluginRepo, c *cache.TemplateCache) *TemplateSvc { return &TemplateSvc{repo: r, cache: c} }

  func (s *TemplateSvc) List(ctx context.Context) ([]*domain.DashboardTemplate, error) {
      if t, err := s.cache.Get(ctx); err == nil {
          return t, nil
      }
      t, err := s.repo.ListTemplates(ctx)
      if err != nil {
          return nil, err
      }
      _ = s.cache.Set(ctx, t)
      return t, nil
  }
  ```
- [ ] **Step 4: Wire `TemplateSvc` into `main.go`** and expose the `/templates` handler using it.
- [ ] **Step 5: Run template‑cache tests – PASS.**
- [ ] **Step 6: Commit**
  ```bash
  git add cmd/api/cache/template.go cmd/api/biz/template_svc.go \
      cmd/api/handlers/templates.go cmd/api/biz/template_svc_test.go
  git commit -m "feat: add template cache and service"
  ```

---

## Task 9: Verify All Protected Routes Use Auth Middleware

**Files**
- `cmd/api/router_inspection_test.go` (new)
- `cmd/api/middleware/auth.go` (modify – add diagnostic header under test build tag)

### Steps
- [ ] **Step 1: Write test that builds the router (as in `main.go`) and asserts each protected path returns the `X-Auth-Checked: true` header set by the middleware.**
  ```go
  package api_test

  import (
      "net/http/httptest"
      "testing"

      "github.com/getmetraly/metraly/cmd/api"
      "github.com/stretchr/testify/assert"
  )

  func TestProtectedRoutesHaveMiddleware(t *testing.T) {
      r := api.NewRouter() // function that builds chi router with all handlers
      protected := []string{ "/api/v1/me", "/api/v1/activity", "/api/v1/dashboards", "/api/v1/metrics/{metricId}" }
      for _, p := range protected {
          w := httptest.NewRecorder()
          r.ServeHTTP(w, httptest.NewRequest("GET", p, nil))
          assert.Equal(t, "true", w.Header().Get("X-Auth-Checked"), "middleware missing on %s", p)
      }
  }
  ```
- [ ] **Step 2: Modify `middleware/auth.go` to set a diagnostic header only in tests (build tag `!prod`).**
  ```go
  // +build !prod

  func RequireAuth(km *auth.KeyManager) func(http.Handler) http.Handler {
      return func(next http.Handler) http.Handler {
          return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
              // existing auth logic …
              w.Header().Set("X-Auth-Checked", "true")
              next.ServeHTTP(w, r)
          })
      }
  }
  ```
- [ ] **Step 3: Run the inspection test – should PASS if every protected route is wrapped.**
- [ ] **Step 4: Commit**
  ```bash
  git add cmd/api/router_inspection_test.go cmd/api/middleware/auth.go
  git commit -m "test: verify auth middleware applied to all protected endpoints"
  ```

---

## Task 10: Graceful‑Shutdown Test

**Files**
- `cmd/api/main_test.go` (new)

### Steps
- [ ] **Step 1: Write test that starts the server in a goroutine, sends `os.Interrupt`, and ensures the server exits without panic and that DB/Redis connections are closed.**
  ```go
  package api_test

  import (
      "context"
      "net/http"
      "os"
      "syscall"
      "testing"
      "time"

      "github.com/getmetraly/metraly/cmd/api"
  )

  func TestGracefulShutdown(t *testing.T) {
      srv := api.NewServer() // returns *http.Server
      go func() { _ = srv.ListenAndServe() }()

      // give the server a moment to start
      time.Sleep(100 * time.Millisecond)

      // simulate SIGINT
      p, _ := os.FindProcess(os.Getpid())
      _ = p.Signal(syscall.SIGINT)

      // wait for shutdown (server should respect context cancellation)
      select {
      case <-srv.ShutdownChan():
          // success
      case <-time.After(2 * time.Second):
          t.Fatal("server did not shut down gracefully")
      }
  }
  ```
- [ ] **Step 2: Run the test – initially fails because graceful‑shutdown logic not implemented.**
- [ ] **Step 3: Add signal handling and shutdown logic to `cmd/api/main.go` (listen for `os.Interrupt`, call `srv.Shutdown`).**
- [ ] **Step 4: Run the test again – should PASS.**
- [ ] **Step 5: Commit**
  ```bash
  git add cmd/api/main.go cmd/api/main_test.go
  git commit -m "test: ensure graceful shutdown on interrupt"
  ```

---

## Task 11: Optional CI Pipeline (GitHub Actions)

**Files**
- `.github/workflows/ci.yml` (new)

### Steps
- [ ] **Step 1: Write CI workflow (basic lint + test + integration test).**
  ```yaml
  name: CI

  on:
    push:
      branches: [ main ]
    pull_request:
      branches: [ main ]

  jobs:
    build:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: timescale/timescaledb:latest-pg16
          env:
            POSTGRES_PASSWORD: metraly
            POSTGRES_DB: metraly
          ports: [5432:5432]
          options: >-
            --health-cmd="pg_isready -U metraly"
            --health-interval=10s
            --health-timeout=5s
            --health-retries=5
        redis:
          image: redis:7
          ports: [6379:6379]
          options: --health-cmd="redis-cli ping"
      steps:
        - uses: actions/checkout@v3
        - name: Set up Go
          uses: actions/setup-go@v5
          with:
            go-version: '1.26'
        - name: Cache Go modules
          uses: actions/cache@v3
          with:
            path: |
              ~/.modcache
              ~/go/pkg/mod
            key: ${{ runner.os }}-go-${{ hashFiles('go.sum') }}
        - name: Install dependencies
          run: go mod download
        - name: Lint
          run: make lint
        - name: Unit & Integration Tests
          env:
            POSTGRES_DSN: postgres://metraly:metraly@localhost:5432/metraly?sslmode=disable
            REDIS_HOST: localhost
            REDIS_PORT: 6379
          run: make test
  ```
- [ ] **Step 2: (Optional) Run workflow locally with `act` to verify syntax.
- [ ] **Step 3: Commit CI file**
  ```bash
  git add .github/workflows/ci.yml
  git commit -m "ci: add GitHub Actions workflow with lint, unit and integration tests"
  ```

*This task is optional; you may skip it if CI is not desired now.*

---

## Task 12: Update Documentation

**Files**
- `docs/architecture.md` (modify)

### Steps
- [ ] **Step 1: Add sections for OIDC, Redis cache, testing overview, and template cache.**
- [ ] **Step 2: Verify diff shows changes.**
- [ ] **Step 3: Commit**
  ```bash
  git add docs/architecture.md
  git commit -m "docs: add OIDC, Redis cache, and testing overview"
  ```

---

## Task 13: Self‑Review Checklist (non‑code)

After completing the above tasks, run the self‑review checklist described in the `writing-plans` skill:
1. **Spec coverage** – confirm every section of `docs/superpowers/specs/2026-05-02-backend-api-design.md` maps to a task.
2. **Placeholder scan** – ensure no “TODO”, “TBD”, etc.
3. **Type consistency** – verify signatures across files match.
4. **Run full test suite** – `make test` (unit + integration). All must pass.
5. **Run linters** – `make lint` and address any warnings.

If any gap appears, add a quick task to fix it before declaring the implementation complete.

---

## Execution Handoff

**Plan saved to** `docs/superpowers/plans/2026-05-02-backend-api-full.md`.

Two execution options:

1. **Subagent‑Driven (recommended)** – I will dispatch a fresh subagent for each task, review results, and iterate quickly.
2. **Inline Execution** – I will execute all tasks in this session using the `executing-plans` skill, with checkpoints after each major group.

**Which approach would you like to use?**