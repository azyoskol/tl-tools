CREATE TABLE IF NOT EXISTS metric_data_points (
    time      TIMESTAMPTZ NOT NULL,
    metric_id TEXT NOT NULL,
    team      TEXT NOT NULL,
    value     DOUBLE PRECISION NOT NULL
);

SELECT create_hypertable('metric_data_points', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_metric_data_points_metric_team_time
    ON metric_data_points (metric_id, team, time DESC);
