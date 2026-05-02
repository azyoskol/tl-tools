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
    OIDCIssuerURL    string
    OIDCClientID      string
    OIDCClientSecret  string
    OIDCRedirectURL  string
    SeedOnStart       bool
    SeedAdminEmail    string
    SeedAdminPassword string
}

func getEnv(key, def string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return def
}

func Load() AppConfig {
    return AppConfig{
        Port:              getEnv("PORT", "8000"),
        PostgresDSN:       getEnv("POSTGRES_DSN", "postgres://metraly:metraly@localhost:5432/metraly"),
        RedisHost:         getEnv("REDIS_HOST", "redis"),
        RedisPort:         getEnv("REDIS_PORT", "6379"),
        JWTPrivateKey:     getEnv("JWT_PRIVATE_KEY", ""),
        AccessTokenTTL:    getEnv("ACCESS_TOKEN_TTL", "900"),
        RefreshTokenTTL:   getEnv("REFRESH_TOKEN_TTL", "604800"),
        OIDCIssuerURL:    getEnv("OIDC_ISSUER_URL", ""),
        OIDCClientID:      getEnv("OIDC_CLIENT_ID", ""),
        OIDCClientSecret: getEnv("OIDC_CLIENT_SECRET", ""),
        OIDCRedirectURL:   getEnv("OIDC_REDIRECT_URL", ""),
        SeedOnStart:       getEnv("SEED_ON_START", "false") == "true",
        SeedAdminEmail:    getEnv("SEED_ADMIN_EMAIL", ""),
        SeedAdminPassword: getEnv("SEED_ADMIN_PASSWORD", ""),
    }
}
