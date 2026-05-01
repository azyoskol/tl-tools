🎯 Полная система шаблонов дашбордов

📁 Архитектура хранения (Гибридный подход)

// ClickHouse для оперативных данных
CREATE TABLE dashboard_templates (
    id String PRIMARY KEY,
    name String,
    description String,
    version String,
    category String,
    metadata String, -- JSON метаданные
    structure String, -- JSON структура
    config String,   -- YAML конфигурация
    created_at DateTime,
    updated_at DateTime,
    created_by String,
    is_public Boolean DEFAULT false,
    tags Array(String)
);

// Файловое хранилище для бэкапов
/templates/
  ├── prebuilt/
  │   ├── cto-overview.v1.yaml
  │   ├── sprint-board.v1.yaml
  │   └── team-lead.v1.yaml
  ├── user/
  │   ├── user-id/
  │   │   ├── my-dashboard.v1.yaml
  │   │   └── shared-dashboard.v2.yaml
  └── versions/
      ├── template-id/
      │   ├── v1.yaml
      │   └── v2.yaml

🌐 API архитектура (WebSocket + REST)

// REST API для CRUD операций

interface TemplateRESTAPI {
  // Базовые операции
  GET    /api/v1/templates              -- список шаблонов
  POST   /api/v1/templates              -- создать шаблон
  GET    /api/v1/templates/{id}         -- получить шаблон
  PUT    /api/v1/templates/{id}         -- обновить шаблон
  DELETE /api/v1/templates/{id}         -- удалить шаблон

  // Версионирование
  GET    /api/v1/templates/{id}/versions -- история версий
  POST   /api/v1/templates/{id}/restore -- восстановить версию

  // Поиск и фильтрация
  GET    /api/v1/templates/search      -- поиск шаблонов
  GET    /api/v1/templates/category/{category} -- шаблоны по категории

  // Шеринг
  POST   /api/v1/templates/{id}/share  -- поделиться шаблоном
  GET    /api/v1/templates/shared      -- доступные шаблоны
}

// WebSocket для реального времени
interface TemplateWebSocketAPI {
  // Подписка на обновления шаблонов
  'template:subscribe' -> { templateId: string }

  // Обновления шаблонов в реальном времени
  'template:updated' -> {
    templateId: string,
    version: string,
    updated_by: string
  }

  // Версионирование
  'template:version_created' -> {
    templateId: string,
    version: string,
    changes: string
  }
}

🎨 Система виджетов и метрик (Полная кастомизация)

// Регистр виджетов
interface WidgetRegistry {
  // Предопределенные виджеты
  widgets: {
    'metric-card': MetricCardWidget,
    'line-chart': LineChartWidget,
    'bar-chart': BarChartWidget,
    'table': TableWidget,
    'heatmap': HeatmapWidget,
    'gauge': GaugeWidget
  }

  // Пользовательские виджеты
  customWidgets: {
    [widgetName: string]: {
      component: React.ComponentType<WidgetProps>,
      configSchema: WidgetConfigSchema,
      dataSchema: WidgetDataSchema
    }
  }
}
// Конфигурация виджета
interface WidgetConfig {
  id: string
  type: string
  title: string
  position: { x: number, y: number, width: number, height: number }
  data: {
    source: string
    metric: string
    filters: Record<string, any>
    options: Record<string, any>
  }
  styling: {
    theme: 'light' | 'dark'
    colors: string[]
    fonts: Record<string, string>
  }
  interactions: {
    drilldown: boolean
    export: boolean
    refresh: number
  }
}

📋 Полная модель данных шаблона

interface DashboardTemplate {
  id: string
  version: string
  metadata: {
    name: string
    description: string
    category: 'prebuilt' | 'role' | 'project' | 'custom'
    role?: 'cto' | 'vp' | 'tl' | 'devops' | 'developer'
    project_type?: 'frontend' | 'backend' | 'mobile' | 'devops'
    tags: string[]
    author: string
    created_at: string
    updated_at: string
    version_history: TemplateVersion[]
  }

  // Структура дашборда
  structure: {
    layout: {
      type: 'grid' | 'flex' | 'custom'
      columns: number
      gap: number
      responsive: boolean
    }
    widgets: WidgetInstance[]
    filters: Filter[]
    time_range: TimeRange
  }

  // Источники данных
  data_sources: {
    git: GitDataSource
    cicd: CICDDataSource
    pm: PMDataSource
    custom: CustomDataSource[]
  }

  // Метрики и расчеты
  metrics: {
    predefined: PredefinedMetric[]
    custom: CustomMetric[]
    calculations: Calculation[]
    aggregations: Aggregation[]
  }

  // Бизнес-логика
  rules: {
    validations: ValidationRule[]
    transformations: TransformationRule[]
    calculations: BusinessCalculation[]
  }

  // Уведомления
  alerts: {
    conditions: AlertCondition[]
    notifications: NotificationConfig[]
    escalation: EscalationRule[]
  }

  // Права доступа
  permissions: {
    view: string[]
    edit: string[]
    share: string[]
    delete: string[]
  }
}

🔧 Система создания шаблонов

// Конструктор шаблонов
interface TemplateBuilder {
  // Визуальный конструктор
  startFromTemplate(templateId: string): Promise<TemplateEditor>
  createBlank(): Promise<TemplateEditor>

  // Операции в редакторе
  addWidget(widgetType: string): Promise<WidgetInstance>
  removeWidget(widgetId: string): Promise<void>
  configureWidget(widgetId: string, config: WidgetConfig): Promise<void>
  reorderWidgets(layout: LayoutConfig): Promise<void>

  // Настройки
  setFilters(filters: Filter[]): Promise<void>
  setTimeRange(range: TimeRange): Promise<void>
  setPermissions(permissions: Permission[]): Promise<void>

  // Сохранение
  saveTemplate(name: string, description: string): Promise<Template>
  duplicateTemplate(id: string): Promise<Template>
  exportTemplate(format: 'yaml' | 'json'): Promise<string>
  importTemplate(config: string): Promise<Template>
}
📊 Примеры преднастроенных шаблонов

# CTO Overview Template

id: cto-overview
version: "1.0"
metadata:
  name: "CTO Executive Dashboard"
  description: "Comprehensive engineering metrics for CTO level"
  category: "role"
  role: "cto"
  tags: ["executive", "overview", "kpi"]

structure:
  layout:
    type: "grid"
    columns: 4
    gap: 16
  widgets:
    - id: dora-metrics
      type: "dora-overview"
      position: { x: 0, y: 0, width: 2, height: 2 }
      config:
        metrics: ["deploy-freq", "lead-time", "mttr", "change-fail"]
        time_range: "30d"
    - id: team-performance
      type: "performance-grid"
      position: { x: 2, y: 0, width: 2, height: 2 }
      config:
        teams: ["platform", "mobile", "backend"]
        metrics: ["velocity", "quality", "delivery"]

data_sources:
  git: { enabled: true, repositories: ["*"] }
  cicd: { enabled: true, pipelines: ["*"] }
  pm: { enabled: true, projects: ["*"] }

alerts:
  conditions:
    - id: "deploy-slowdown"
      type: "metric_threshold"
      metric: "deploy-freq"
      threshold: 0.1
      severity: "warning"
🔄 Процесс работы с шаблонами

1. Выбор шаблона - пользователь выбирает из преднастроенных шаблонов
2. Копирование и кастомизация - копирует шаблон и настраивает под себя
3. Сохранение - сохраняет как новый шаблон или обновляет существующий
4. Шеринг - делится шаблонами с командой
5. Версионирование - история изменений отката версий
🎯 Ключевые преимущества

- Гибкость - от простых карточек до сложных аналитических дашбордов
- Масштабируемость - легко добавлять новые типы виджетов и метрик
- Управление версиями - полный контроль над изменениями
- Коллаборация - совместное создание и редактирование шаблонов
- Производительность - WebSocket для реального времени + REST для операций
Как вам такая система? Готов перейти к детализации конкретных компонентов?
