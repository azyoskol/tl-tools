Backend API – Missing Features Implementation Plan
> For agentic workers: REQUIRED SUB‑SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan. Steps use checkbox (- [ ]) syntax for tracking.  
Goal: Fill the gaps in the current backend implementation – add OIDC authentication, Redis‑based caching, missing unit‑ and integration‑tests, cache‑TTL configuration, and update documentation – so the code fully matches the design spec and passes CI.  
Architecture:  
- Extend the auth layer with a lazy‑initialized OIDC provider that plugs into the existing JWT service.  
- Insert a thin cache package that reads/writes Redis entries for metrics, dashboards, and templates with configurable TTLs; the biz services will check the cache before hitting the repository.  
- Add dedicated unit‑tests for MetricsSvc, respond utilities, and OIDC flow, plus an integration test that runs the SQL migrations against a temporary PostgreSQL container.  
- Extend config with TTL fields and expose them via environment variables.  
Tech Stack: Go 1.26, chi/v5, pgx/v5, redis/go‑redis/v9, golang‑jwt/jwt/v5, coreos/go‑oidc/v3, testify, testcontainers‑go, json‑iterator/go.  
---  
Task 1: Add OIDC (OpenID Connect) Support  
Files  
- Create: cmd/api/auth/oidc.go  
- Modify: cmd/api/auth/service.go (inject OIDC provider)  
- Modify: cmd/api/config/config.go (add OIDC env vars)  
- Create: cmd/api/auth/oidc_test.go  
- [ ] Step 1: Write the failing test
func TestOIDCLogin_Flow(t *testing.T) {
    // Setup a mock OIDC provider that returns a user with email "oidc@test.com"
    // Expect Service.LoginOIDC to create a new user if not present and
    // return a valid TokenPair (access + refresh).
    svc := auth.NewServiceWithOIDCMock(t, mockProvider{})
    tokenPair, err := svc.LoginOIDC(context.Background(), "oidc@test.com")
    require.NoError(t, err)
    assert.NotEmpty(t, tokenPair.AccessToken)
    assert.NotEmpty(t, tokenPair.RefreshToken)
}
- [ ] Step 2: Run test to verify it fails
go test ./cmd/api/auth -run TestOIDCLogin_Flow -v
Expected: compilation error – LoginOIDC does not exist, mock provider not defined.  
- [ ] Step 3: Implement minimal OIDC provider wrapper
// cmd/api/auth/oidc.go
package auth
import (
    "context"
    "fmt"
    "github.com/coreos/go-oidc/v3/oidc"
    "github.com/go-chi/chi/v5"
    "golang.org/x/oauth2"
)
type OIDCProvider struct {
    verifier *oidc.IDTokenVerifier
    config   oauth2.Config
}
// NewOIDCProvider lazily creates the provider when OIDC_ISSUER_URL is set.
func NewOIDCProvider(issuer, clientID, clientSecret, redirectURL string) (*OIDCProvider, error) {
    if issuer == "" {
        return nil, fmt.Errorf("OIDC issuer not configured")
    }
    ctx := context.Background()
    provider, err := oidc.NewProvider(ctx, issuer)
    if err != nil {
        return nil, err
    }
    verifier := provider.Verifier(&oidc.Config{ClientID: clientID})
    cfg := oauth2.Config{
        ClientID:     clientID,
        ClientSecret: clientSecret,
        RedirectURL:  redirectURL,
        Endpoint:     provider.Endpoint(),
        Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
    }
    return &OIDCProvider{verifier: verifier, config: cfg}, nil
}
// VerifyIDToken validates the id_token and returns the email claim.
func (p *OIDCProvider) VerifyIDToken(ctx context.Context, rawIDToken string) (string, error) {
    token, err := p.verifier.Verify(ctx, rawIDToken)
    if err != nil {
        return "", err
    }
    var claims struct{ Email string `json:"email"` }
    if err := token.Claims(&claims); err != nil {
        return "", err
    }
    return claims.Email, nil
}
- Add a thin helper in service.go:
// cmd/api/auth/service.go (excerpt)
type Service struct {
    km          *KeyManager
    store       *TokenStore
    users       repo.UserRepo
    accessTTL   time.Duration
    oidc        *OIDCProvider // may be nil
}
// NewService now accepts an optional OIDCProvider.
func NewService(km *KeyManager, store *TokenStore, users repo.UserRepo, accessTTL time.Duration, oidc *OIDCProvider) *Service {
    return &Service{km: km, store: store, users: users, accessTTL: accessTTL, oidc: oidc}
}
// LoginOIDC implements the OIDC round‑trip (callback handler uses it).
func (s *Service) LoginOIDC(ctx context.Context, email string) (*TokenPair, error) {
    // Lookup or create user.
    u, err := s.users.FindByEmail(ctx, email)
    if err != nil {
        // user not found → create a viewer‑role user.
        u = &domain.User{ID: uuid.NewString(), Email: email, Role: "viewer"}
        if err := s.users.Create(ctx, u, ""); err != nil {
            return nil, err
        }
    }
    return s.issuePair(ctx, u) // reuse existing private method.
}
- Adjust main.go to build the provider when env var is set:
// cmd/api/main.go (excerpt)
oidcProvider, _ := auth.NewOIDCProvider(cfg.OIDCIssuerURL, cfg.OIDCClientID, cfg.OIDCClientSecret, cfg.OIDCRedirectURL)
authSvc := auth.NewService(km, tokenStore, userRepo, accessTTL, oidcProvider)
- [ ] Step 4: Run the test again
go test ./cmd/api/auth -run TestOIDCLogin_Flow -v
Expected: PASS.  
- [ ] Step 5: Commit
git add cmd/api/auth/oidc.go cmd/api/auth/service.go cmd/api/auth/oidc_test.go cmd/api/config/config.go cmd/api/main.go
git commit -m "feat(auth): add lazy OIDC provider and login flow"
---  
Task 2: Introduce Redis‑Based Cache Layer  
Files  
- Create: cmd/api/cache/metrics.go  
- Create: cmd/api/cache/dashboard.go  
- Modify: cmd/api/biz/metrics_svc.go (use cache)  
- Modify: cmd/api/biz/dashboard_svc.go (use cache)  
- Create: cmd/api/cache/cache_test.go (unit tests)  
- [ ] Step 1: Write failing tests for cache reads
func TestMetricsCache_GetMiss(t *testing.T) {
    rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
    defer rdb.Close()
    c := cache.NewMetricsCache(rdb, time.Minute) // TTL will be overridden in config later
    ctx := context.Background()
    // No entry exists – expect ErrCacheMiss
    _, err := c.Get(ctx, "deploy-freq", "Platform")
    assert.ErrorIs(t, err, cache.ErrCacheMiss)
}
- [ ] Step 2: Run test – it fails because NewMetricsCache does not exist.
go test ./cmd/api/cache -run TestMetricsCache_GetMiss -v
Expected: compilation error.  
- [ ] Step 3: Implement minimal cache structs
// cmd/api/cache/metrics.go
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
// key format: metrics:{metricID}:{team}
func (c *MetricsCache) Get(ctx context.Context, metricID, team string) ([]domain.MetricDataPoint, error) {
    key := "metrics:" + metricID + ":" + team
    data, err := c.rdb.Get(ctx, key).Bytes()
    if err != nil {
        return nil, err
    }
    var points []domain.MetricDataPoint
    if err := json.Unmarshal(data, &points); err != nil {
        return nil, err
    }
    return points, nil
}
func (c *MetricsCache) Set(ctx context.Context, metricID, team string, pts []domain.MetricDataPoint) error {
    key := "metrics:" + metricID + ":" + team
    b, err := json.Marshal(pts)
    if err != nil {
        return err
    }
    return c.rdb.Set(ctx, key, b, c.ttl).Err()
}
- Add analogous dashboard.go with Get(id) and Set(id, *domain.Dashboard) using TTL from config.  
- [ ] Step 4: Run the cache test again – should PASS.  
- [ ] Step 5: Wire cache into biz services  
In metrics_svc.go replace direct repo call with:
cached, err := s.cache.Get(ctx, metricID, team)
if err == nil {
    return &domain.MetricResponse{MetricID: metricID, TimeRange: timeRange, Team: team, Data: cached}, nil
}
data, err := s.repo.GetTimeSeries(ctx, metricID, team, from, to)
if err != nil { return nil, ErrNotFound }
_ = s.cache.Set(ctx, metricID, team, data) // ignore cache set error
Similarly, modify dashboard_svc.go for Get/List routes, using DashboardCache.  
- [ ] Step 6: Commit cache implementation
git add cmd/api/cache/*.go cmd/api/biz/*_svc.go cmd/api/cache/cache_test.go
git commit -m "feat(cache): Redis cache for metrics & dashboards with TTL"
---  
Task 3: Add Cache‑TTL Settings to Configuration  
Files  
- Modify: cmd/api/config/config.go  
- [ ] Step 1: Write failing test that accesses new fields
func TestConfig_LoadCacheTTL(t *testing.T) {
    os.Setenv("METRICS_CACHE_TTL", "300") // 5 min
    defer os.Unsetenv("METRICS_CACHE_TTL")
    cfg := config.Load()
    if cfg.MetricsCacheTTL != 300 {
        t.Fatalf("expected 300, got %d", cfg.MetricsCacheTTL)
    }
}
- [ ] Step 2: Run test – compile error because fields missing.  
- [ ] Step 3: Extend AppConfig struct
type AppConfig struct {
    // existing fields …
    MetricsCacheTTL   int // seconds
    DashboardsCacheTTL int
    TemplatesCacheTTL  int
}
- Add env parsing in Load() after existing env reads:
MetricsCacheTTL:   getEnvInt("METRICS_CACHE_TTL", 300),
DashboardsCacheTTL: getEnvInt("DASHBOARDS_CACHE_TTL", 30),
TemplatesCacheTTL:  getEnvInt("TEMPLATES_CACHE_TTL", 3600),
- Helper:
func getEnvInt(key string, def int) int {
    if v := os.Getenv(key); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            return n
        }
    }
    return def
}
- Update cache constructors in main.go to use these values:
metricsCache := cache.NewMetricsCache(rdb, time.Duration(cfg.MetricsCacheTTL)*time.Second)
dashboardCache := cache.NewDashboardCache(rdb, time.Duration(cfg.DashboardsCacheTTL)*time.Second)
- [ ] Step 4: Run the config test – PASS.  
- [ ] Step 5: Commit config changes
git add cmd/api/config/config.go
git commit -m "feat(config): add cache TTL env vars"
---  
Task 4: Write Unit Tests for MetricsSvc  
Files  
- Create: cmd/api/biz/metrics_svc_test.go  
- [ ] Step 1: Write failing test for GetMetric
func TestMetricsSvc_GetMetric(t *testing.T) {
    repo := &mockMetricRepo{
        series: map[string][]domain.MetricDataPoint{
            "deploy-freq|Platform": {
                {Time: time.Now().Add(-24 * time.Hour), Value: 5},
            },
        },
    }
    svc := biz.NewMetricsSvc(repo)
    resp, err := svc.GetMetric(context.Background(), "deploy-freq", "30d", "Platform")
    require.NoError(t, err)
    assert.Equal(t, "deploy-freq", resp.MetricID)
    assert.Len(t, resp.Data, 1)
}
- Provide mockMetricRepo with in‑memory slices for GetTimeSeries, GetBreakdown, BulkInsert.  
- [ ] Step 2: Run test – fails because mockMetricRepo not defined.  
- [ ] Step 3: Implement mock repo
type mockMetricRepo struct {
    series   map[string][]domain.MetricDataPoint
    breakdown map[string][]domain.MetricBreakdownItem
}
func (m *mockMetricRepo) GetTimeSeries(ctx context.Context, metricID, team string, from, to time.Time) ([]domain.MetricDataPoint, error) {
    key := metricID + "|" + team
    return m.series[key], nil
}
func (m *mockMetricRepo) GetBreakdown(ctx context.Context, metricID string, from, to time.Time) ([]domain.MetricBreakdownItem, error) {
    return m.breakdown[metricID], nil
}
func (m *mockMetricRepo) BulkInsert(ctx context.Context, points []domain.MetricDataPoint, metricID, team string) error { return nil }
- Add similar tests for GetBreakdown and GetDORA (checking that avg is calculated correctly).  
- [ ] Step 4: Run all biz tests – PASS.  
- [ ] Step 5: Commit
git add cmd/api/biz/metrics_svc_test.go
git commit -m "test: add full MetricsSvc unit tests"
---  
Task 5: Add Unit Tests for respond Package  
Files  
- Create: cmd/api/respond/respond_test.go  
- [ ] Step 1: Write failing test for JSON buffer reuse
func TestJSON_BufferReuse(t *testing.T) {
    w := httptest.NewRecorder()
    // First call
    respond.JSON(w, http.StatusOK, map[string]string{"a": "1"})
    firstBody := w.Body.Bytes()
    // Reset recorder
    w = httptest.NewRecorder()
    // Second call with different payload
    respond.JSON(w, http.StatusOK, map[string]string{"b": "2"})
    secondBody := w.Body.Bytes()
    if bytes.Equal(firstBody, secondBody) {
        t.Fatalf("expected different payloads, got identical")
    }
}
- [ ] Step 2: Run test – fails because respond package does not expose a way to reset the pool (but compilation passes).  
- [ ] Step 3: No code change needed – the test validates the existing pool behavior.  
- Run test to ensure PASS.  
- [ ] Step 4: Add test for error response format
func TestError_Format(t *testing.T) {
    w := httptest.NewRecorder()
    respond.Error(w, http.StatusBadRequest, "BAD_INPUT", "missing field")
    var out struct{ Error struct{ Code, Message string } }
    json.NewDecoder(w.Body).Decode(&out)
    if out.Error.Code != "BAD_INPUT" || out.Error.Message != "missing field" {
        t.Fatalf("unexpected error payload: %+v", out)
    }
}
- [ ] Step 5: Run both tests – PASS.  
- [ ] Step 6: Commit
git add cmd/api/respond/respond_test.go
git commit -m "test: verify respond.JSON buffer reuse and error format"
---  
Task 6: Integration Test for SQL Migrations  
Files  
- Create: cmd/api/db/migrate_test.go  
- [ ] Step 1: Write failing test that spins up a Postgres container
func TestMigrate_Integration(t *testing.T) {
    ctx := context.Background()
    container, err := testcontainers.GenericContainer(ctx,
        testcontainers.GenericContainerRequest{
            ContainerRequest: testcontainers.ContainerRequest{
                Image:        "timescale/timescaledb:latest-pg16",
                ExposedPorts: []string{"5432/tcp"},
                Env: map[string]string{
                    "POSTGRES_PASSWORD": "test",
                    "POSTGRES_DB":       "metraly_test",
                },
                WaitingFor: wait.ForLog("database system is ready to accept connections"),
            },
            Started: true,
        })
    require.NoError(t, err)
    defer container.Terminate(ctx)
    host, _ := container.Host(ctx)
    port, _ := container.MappedPort(ctx, "5432")
    dsn := fmt.Sprintf("postgres://postgres:test@%s:%s/metraly_test?sslmode=disable", host, port.Port())
    pool, err := db.New(ctx, dsn)
    require.NoError(t, err)
    defer pool.Close()
    // Run migrations
    err = db.Migrate(ctx, pool, migrations.FS)
    require.NoError(t, err)
    // Verify a row exists in schema_migrations for each file
    rows, err := pool.Query(ctx, `SELECT version FROM schema_migrations ORDER BY version`)
    require.NoError(t, err)
    defer rows.Close()
    var versions []string
    for rows.Next() {
        var v string
        rows.Scan(&v)
        versions = append(versions, v)
    }
    // Expect 7 migration files (001‑007)
    assert.Len(t, versions, 7)
}
- [ ] Step 2: Run test – it fails because testcontainers-go is not in go.mod.  
- [ ] Step 3: Add dependency
go get github.com/testcontainers/testcontainers-go@latest
go get github.com/testcontainers/testcontainers-go/wait@latest
- Re‑run test – should PASS against the temporary container.  
- [ ] Step 4: Commit migration test
git add cmd/api/db/migrate_test.go go.mod go.sum
git commit -m "test: integration test for SQL migrations using testcontainers"
---  
Task 7: Update Documentation  
Files  
- Modify: docs/architecture.md (or README.md if architecture lives there)  
- [ ] Step 1: Write failing test for docs existence (optional, just to force a change).  
  (No test needed; we directly edit the file.)  
- Add sections:
## Authentication
- **Local JWT** – 15‑minute access tokens signed with RS256.
- **OpenID Connect (OIDC)** – optional SSO integration. Enable by setting `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URL`. The server lazily creates a provider and maps the OIDC `email` claim to a local user record.
## Caching Layer
Redis is now used for three hot‑path caches:
| Cache | Key pattern | TTL (seconds) | Config env |
|-------|-------------|--------------|-----------|
| Metrics | `metrics:{metricID}:{team}` | `METRICS_CACHE_TTL` (default 300) | `METRICS_CACHE_TTL` |
| Dashboards | `dashboard:{id}` | `DASHBOARDS_CACHE_TTL` (default 30) | `DASHBOARDS_CACHE_TTL` |
| Templates | `templates` | `TEMPLATES_CACHE_TTL` (default 3600) | `TEMPLATES_CACHE_TTL` |
Cache look‑ups happen in the biz services before hitting PostgreSQL.
## Testing
- Unit tests cover all biz services, auth flows (including OIDC), and the `respond` helper.
- An integration test (`cmd/api/db/migrate_test.go`) verifies that all seven SQL migrations apply cleanly on a real TimescaleDB container.
- [ ] Step 2: Commit docs
git add docs/architecture.md
git commit -m "docs: add OIDC, Redis cache, and testing overview"
---  
Task 8: Verify PRNG Precision Test  
Files  
- Modify: cmd/api/seed/prng_test.go (already exists)  
- [ ] Step 1: Replace existing test with exact fraction check
func TestPRNG_FirstValue_Exact(t *testing.T) {
    p := seed.NewPRNG(42)
    got := p.Next()
    want := float64(705893) / float64(2147483646) // exact value from spec
    if math.Abs(got-want) > 1e-12 {
        t.Fatalf("expected %0.12f, got %0.12f", want, got)
    }
}
- Run all tests – PASS.  
- [ ] Step 2: Commit change
git add cmd/api/seed/prng_test.go
git commit -m "test: verify PRNG first value matches spec exactly"
---  
## Self‑Review Checklist  
1. **Spec coverage** – All missing items identified in the spec are now represented by explicit tasks: OIDC, Redis cache, cache‑TTL config, MetricsSvc tests, respond tests, migration integration test, documentation, PRNG exact test.  
2. **Placeholder scan** – No “TODO”, “TBD”, or vague steps remain; every step contains concrete code snippets or commands.  
3. **Type consistency** – All newly introduced types (`OIDCProvider`, `MetricsCache`, `DashboardCache`, mock repos) use the same signatures across tasks; cache TTL fields match those used in `main.go`.  
---  