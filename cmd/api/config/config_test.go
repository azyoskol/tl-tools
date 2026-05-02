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
