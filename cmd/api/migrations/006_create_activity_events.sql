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
