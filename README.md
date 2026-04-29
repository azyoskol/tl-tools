# Team Dashboard

Developer productivity dashboard for multiple teams. Отслеживайте эффективность работы команды в реальном времени.

## Возможности

### Метрики и графики

| График | Источник | Для чего |
|--------|----------|----------|
| **Commits per day** | GitHub/GitLab | Активность разработки, паттерны работы |
| **PRs opened/merged** | GitHub/GitLab | Скорость код-ревью, bottleneck |
| **PR merge time** | GitHub/GitLab | Время от создания до merge |
| **Cycle time** | Jira/Linear | Время от старта до завершения задачи |
| **Velocity** | Jira/Linear | Скорость команды в спринтах |
| **CI/CD success rate** | GitHub Actions/GitLab CI | Стабильность сборок |
| **CI duration** | GitHub Actions/GitLab CI | Скорость CI/CD |
| **Blocked tasks** | Jira/Linear | Заблокированные задачи |
| **WIP count** | Jira/Linear | Задачи в работе (контекст-свитчинг) |
| **CPU/Memory** | Prometheus | Ресурсы приложений |

### Attention Items (Инсайты)

Автоматические алерты, которые привлекают внимание к проблемам:

- ⚠️ PRs waiting for review > 2 days
- ⚠️ Tasks blocked > 1 day
- ⚠️ Tasks overdue > 3 days
- ⚠️ CI failures in last hour
- ⚠️ Large PRs (>1000 lines)

### Страницы Dashboard

1. **Overview** — главная страница с ключевыми метриками
   - Карточки: PRs awaiting, Blocked tasks, CI failures
   - График активности за 7 дней
   - Attention items

2. **Activity** — детальные графики по источникам
   - Git: commits, PRs, reviews
   - PM: tasks, blockers
   - CI/CD: pipelines, failures

3. **Velocity** — ретроспектива
   - Cycle time distribution
   - Velocity per sprint
   - Lead time trends

4. **Insights** — рекомендации
   - Rule-based alerts
   - Тренды продуктивности

### Мульти-команда

- Селектор команды вверху страницы
- Отдельные данные для каждой команды
- Company-wide view для менеджеров

## Data Flow

```
GitHub/GitLab ──┐
Jira/Linear  ───┼──> Go Collectors ──> ClickHouse ──> FastAPI ──> React UI
CI/CD        ───┤                      (Materialized Views)
Prometheus   ───┘
```

### Архитектура

- **Collectors (Go)**: 4 сервиса для сбора данных из разных источников
  - `git-collector` — GitHub, GitLab (commits, PRs, MRs)
  - `pm-collector` — Jira, Linear (tasks, sprints)
  - `cicd-collector` — GitHub Actions, GitLab CI, Jenkins
  - `metrics-collector` — Prometheus, DataDog

- **Storage**: ClickHouse с материализованными представлениями
- **API**: FastAPI (Python)
- **UI**: React + Recharts

## Quick Start

### Docker Compose (рекомендуется)

```bash
# Клонировать и запустить
git clone https://github.com/azyoskol/tl-tools.git
cd tl-tools
docker-compose up -d

# Доступ
# UI:         http://localhost:3000
# API:        http://localhost:8000
# ClickHouse: http://localhost:8123
```

### Загрузка тестовых данных

```bash
# Создать таблицы
docker exec -i clickhouse clickhouse-client < clickhouse/schema.sql

# Загрузить моковые данные
docker exec -i clickhouse clickhouse-client < clickhouse/mock_data.sql
```

## Конфигурация

### Collector config.yaml

Каждый collector настраивается через `config.yaml`:

```yaml
clickhouse:
  host: "clickhouse"
  port: 9000

teams:
  - id: "550e8400-..."
    name: "Platform Team"
    sources:
      - type: "github"
        config:
          token: "${GITHUB_TOKEN}"
```

### Переменные окружения

| Переменная | Описание |
|------------|----------|
| `CLICKHOUSE_HOST` | Хост ClickHouse |
| `CLICKHOUSE_PORT` | Порт ClickHouse (по умолчанию 9000) |
| `GITHUB_TOKEN` | Токен GitHub API |
| `GITLAB_TOKEN` | Токен GitLab API |
| `JIRA_URL` | URL Jira |
| `JIRA_EMAIL` | Email Jira |
| `JIRA_TOKEN` | API токен Jira |
| `LINEAR_API_KEY` | API ключ Linear |
| `PROMETHEUS_URL` | URL Prometheus |

## Development

### Prerequisites

- Go 1.21+
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose

### Запуск отдельно

```bash
# ClickHouse
docker run -d -p 9000:9000 clickhouse/clickhouse-server:23.8

# API
cd api
pip install -r requirements.txt
uvicorn main:app --reload

# UI
cd ui
npm install
npm run dev
```

### Тесты

```bash
# Python API
cd api && pytest

# Go collectors
cd collectors/git && go test ./...
```

## Deployment

### Kubernetes (Helm)

```bash
# Установка
helm install team-dashboard ./helm/team-dashboard -f values-prod.yaml

# Обновление
helm upgrade team-dashboard ./helm/team-dashboard -f values-prod.yaml
```

### Docker

```bash
# Собрать образы
docker-compose build

# Запустить
docker-compose up -d
```

## Roadmap

- [x] Cycle 1: MVP (базовые метрики)
- [ ] Cycle 2: Reliability (б error handling, больше адаптеров)
- [ ] Cycle 3: UI/UX (детальные графики, velocity)
- [ ] Cycle 4: Advanced (management API, фильтры)
- [ ] Cycle 5: Performance (оптимизация запросов)
- [ ] Cycle 6: Enterprise (SSO, RBAC)

## License

MIT