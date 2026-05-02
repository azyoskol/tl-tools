CREATE TABLE IF NOT EXISTS ai_insights (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    action     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
