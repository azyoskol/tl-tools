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
