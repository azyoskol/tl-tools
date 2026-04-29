module github.com/azyoskol/tl-tools/collectors/git

go 1.21

require (
	github.com/ClickHouse/clickhouse-go/v2 v2.15.0
	github.com/azyoskol/tl-tools/collectors/shared v0.0.0-00010101000000-000000000000
	github.com/google/uuid v1.4.0
	github.com/prometheus/client_golang v1.18.0
	gopkg.in/yaml.v3 v3.0.1
)

replace github.com/azyoskol/tl-tools/collectors/shared => ../shared

require (
	github.com/ClickHouse/ch-go v0.58.2 // indirect
	github.com/andybalholm/brotli v1.0.6 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/go-faster/city v1.0.1 // indirect
	github.com/go-faster/errors v0.6.1 // indirect
	github.com/klauspost/compress v1.16.7 // indirect
	github.com/matttproud/golang_protobuf_extensions/v2 v2.0.0 // indirect
	github.com/paulmach/orb v0.10.0 // indirect
	github.com/pierrec/lz4/v4 v4.1.18 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/prometheus/client_model v0.5.0 // indirect
	github.com/prometheus/common v0.45.0 // indirect
	github.com/prometheus/procfs v0.12.0 // indirect
	github.com/segmentio/asm v1.2.0 // indirect
	github.com/shopspring/decimal v1.3.1 // indirect
	go.opentelemetry.io/otel v1.19.0 // indirect
	go.opentelemetry.io/otel/trace v1.19.0 // indirect
	golang.org/x/sys v0.15.0 // indirect
	google.golang.org/protobuf v1.31.0 // indirect
)
