# Metraly Infrastructure Optimization & License Alignment Design
Date: 2026-05-03
Status: Approved

## Overview
Optimize existing Docker Compose setup, clean stale ClickHouse references, add portable Helm charts and multi-cloud Terraform configs, and enforce GNU AGPLv3 license across all project artifacts.

## Section 1: Docker Compose Optimization + ClickHouse Cleanup + Infra Structure

### New Directory Structure (Centralized `infra/`)
```
infra/
  docker/                # All Docker configs (moved from root)
    compose.yaml         # Optimized docker-compose (renamed for clarity)
  helm/                  # Portable multi-platform Helm charts
  terraform/             # Multi-cloud Terraform modules
```
`compose.yaml` references existing Dockerfiles via adjusted contexts (`../../` for API, `../../ui` for UI).

### Docker Compose Optimizations
1. **Remove custom network**: Delete `metraly` network block, use default bridge (identical behavior, less config)
2. **Healthchecks**:
   - Redis: `redis-cli ping`
   - Postgres: `pg_isready -U metraly`
   - API: `curl -f http://localhost:8000/health`
   - UI: `curl -f http://localhost:80/health`
3. **Health-based depends_on**: Update all `depends_on` to use `condition: service_healthy` instead of `service_started`
4. **Resource limits**: Add CPU/memory caps to all services (Postgres: 1CPU/1GB mem, Redis: 0.5CPU/512MB mem, API: 0.5CPU/512MB mem, UI: 0.25CPU/256MB mem)
5. **Service profiles**:
   - Default profile: Redis, Postgres, API
   - `ui` profile: Enable UI service
   - `collectors` profile: Reserved for future collector services

### ClickHouse Cleanup (Docs/Makefile Only)
Keep collector ClickHouse code for future re-addition, only remove stale references in non-collector files:
1. **Makefile**:
   - Remove `CLICKHOUSE_HOST`/`CLICKHOUSE_PORT` from `run` target
   - Delete ClickHouse wait loop in `docker-up`
   - Remove entire `docker-test-data` target
   - Update `help` to remove `docker-test-data` entry
2. **README.md**: Remove all ClickHouse references (lines 18, 58, 79, 83, 113)
3. **CLAUDE.md**: Update `make docker-up` comment to remove ClickHouse mention
4. **Backend API spec** (`docs/superpowers/specs/2026-05-02-backend-api-design.md`): Update line 240 to remove ClickHouse compose reference

## Section 2: Helm Charts (Portable Multi-Platform)

### Structure
```
infra/helm/metraly/
  Chart.yaml          # Metadata, version, appVersion
  values.yaml         # Default values with cloud/feature toggles
  templates/
    _helpers.tpl      # Standard Helm helpers
    api-deployment.yaml
    ui-deployment.yaml  # Disabled by default (ui.enabled=false)
    collector-deployment.yaml  # Disabled by default (collectors.enabled=false)
    postgres-statefulset.yaml  # Disabled if postgres.managed=true
    redis-statefulset.yaml     # Disabled if redis.managed=true
    service.yaml
    ingress.yaml       # Toggle via ingress.enabled, supports nginx/traefik/cloud LB
    configmap.yaml
    secret.yaml        # Uses existing env vars from values
    pvc.yaml           # For local storage when not using managed services
```

### Portable Features (values.yaml toggles)
- `cloud.provider`: aws | gcp | azure | local (default: local)
- `postgres.managed`: true → skip self-hosted Postgres, use external endpoint
- `redis.managed`: true → skip self-hosted Redis, use external endpoint
- `ui.enabled`: matches compose `ui` profile
- `collectors.enabled`: matches compose `collectors` profile (future use)
- `ingress.className`: nginx | traefik | gke-lb | aws-lb (auto-sets based on cloud.provider)

### Defaults
Target local minikube/kind for dev, no managed services, UI/collectors disabled.

## Section 3: Terraform (Multi-Cloud Portable)

### Structure
```
infra/terraform/
  modules/
    kubernetes/       # EKS/GKE/AKS cluster module
      main.tf         # Conditional resource creation based on cloud.provider
      variables.tf
      outputs.tf
    postgres/         # RDS/Cloud SQL/Azure DB for PostgreSQL
    redis/            # ElastiCache/Memorystore/Azure Cache
    networking/       # VPC/VNet, subnets, security groups
  environments/
    dev/
      main.tf         # Calls modules with dev tfvars
      terraform.tfvars
    prod/
      main.tf
      terraform.tfvars
  providers.tf        # AWS/GCP/Azure providers (conditional)
  variables.tf        # Global vars: cloud.provider, region, cluster_name
```

### Multi-Cloud Toggle (variables.tf)
```hcl
variable "cloud_provider" {
  type = string
  validation {
    condition = contains(["aws", "gcp", "azure"], var.cloud_provider)
  }
}
```

### Module Behavior
- `cloud_provider = "aws"` → creates EKS, RDS PostgreSQL, ElastiCache Redis
- `cloud_provider = "gcp"` → creates GKE, Cloud SQL PostgreSQL, Memorystore Redis
- `cloud_provider = "azure"` → creates AKS, Azure DB for PostgreSQL, Azure Cache
- Each module outputs connection endpoints for Helm chart values

### Key Resources per Provider
- **AWS**: `aws_eks_cluster`, `aws_db_instance` (PostgreSQL), `aws_elasticache_cluster`
- **GCP**: `google_container_cluster`, `google_sql_database_instance`, `google_redis_instance`
- **Azure**: `azurerm_kubernetes_cluster`, `azurerm_postgresql_server`, `azurerm_redis_cache`

## Section 4: Documentation Updates + GNU AGPLv3 License

### License Enforcement (GNU AGPLv3)
1. **Add LICENSE file** at project root with full GNU AGPLv3 text
2. **Add license header** to all Go files (`.go`) in `cmd/`, `internal/`, `collectors/`:
   ```go
   // SPDX-License-Identifier: AGPL-3.0-or-later
   // Metraly - Team Engineering Metrics API
   // Copyright (C) 2026 Metraly Contributors
   ```
3. **Add license badge** to README.md: `[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)`
4. **Fix Swagger license**: Update `cmd/api/main.go:5` from `// @license MIT` to `// @license AGPL-3.0-or-later`. If generated Swagger files exist in `docs/swagger/` (swagger.yaml/json), regenerate via `swag init -g cmd/api/main.go` or manually update the `license` field.

### Documentation Updates
1. **README.md**:
   - Remove all ClickHouse references (lines 18, 58, 79, 83, 113)
   - Update architecture section to reflect TimescaleDB + Redis only
   - Add `infra/` section documenting Helm/Terraform usage
   - Add license badge
2. **CLAUDE.md**: Update `make docker-up` comment to remove ClickHouse
3. **Makefile**: Remove ClickHouse env vars, test data target, wait loop as described in Section 1
4. **Backend API spec** (`docs/superpowers/specs/2026-05-02-backend-api-design.md`): Update line 240 to remove ClickHouse compose reference
5. **Add `infra/README.md`**: Document compose profiles, Helm values, Terraform tfvars usage

### Files to Update/Create
- New: `LICENSE`, `infra/README.md`, `infra/docker/compose.yaml`, `infra/helm/`, `infra/terraform/`
- Update: `README.md`, `CLAUDE.md`, `Makefile`, `cmd/api/main.go`, all `*.go` files (license header), `docs/superpowers/specs/2026-05-02-backend-api-design.md`

## Success Criteria
1. Docker Compose has healthchecks, resource limits, no custom network, health-based depends_on, service profiles
2. No stale ClickHouse references in docs/Makefile/CLAUDE.md (collector code untouched)
3. Portable Helm charts with cloud toggles deploy to minikube/EKS/GKE/AKS
4. Multi-cloud Terraform modules create provider-appropriate resources
5. All Go files have AGPLv3 license headers, Swagger license is AGPLv3, LICENSE file present

## Out of Scope
- Implementation of collector Helm charts/Terraform configs (future work when collectors are re-added)
- Migration of existing collector ClickHouse code (kept for future use)
- CI/CD pipelines for infra deployment (separate future spec)
