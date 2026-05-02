package db

import (
    "context"
    "fmt"
    "io/fs"
    "sort"
    "strings"

    "github.com/jackc/pgx/v5/pgxpool"
)

// Migrate runs the SQL migration files embedded in the migrations package.
// The migrations argument should be an fs.FS containing the .sql files (e.g., migrations.FS).
func Migrate(ctx context.Context, pool *pgxpool.Pool, migrations fs.FS) error {
    // Ensure the schema_migrations table exists.
    _, err := pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`)
    if err != nil {
        return fmt.Errorf("create schema_migrations: %w", err)
    }

    // List migration files.
    entries, err := fs.ReadDir(migrations, ".")
    if err != nil {
        return fmt.Errorf("read migrations dir: %w", err)
    }
    var files []string
    for _, e := range entries {
        if e.IsDir() {
            continue
        }
        name := e.Name()
        if strings.HasSuffix(name, ".sql") {
            files = append(files, name)
        }
    }
    sort.Strings(files)

    // Apply migrations in order.
    for _, name := range files {
        version := strings.TrimSuffix(name, ".sql")
        // Check if already applied.
        var exists bool
        err = pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)", version).Scan(&exists)
        if err != nil {
            return fmt.Errorf("check migration %s: %w", version, err)
        }
        if exists {
            continue
        }
        // Read migration SQL.
        sqlBytes, err := fs.ReadFile(migrations, name)
        if err != nil {
            return fmt.Errorf("read migration %s: %w", name, err)
        }
        // Execute migration.
        if _, err = pool.Exec(ctx, string(sqlBytes)); err != nil {
            return fmt.Errorf("apply migration %s: %w", name, err)
        }
        // Record migration.
        if _, err = pool.Exec(ctx, "INSERT INTO schema_migrations(version) VALUES($1)", version); err != nil {
            return fmt.Errorf("record migration %s: %w", version, err)
        }
    }
    return nil
}
