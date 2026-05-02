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
