# DashboardWizard – Technical Specification

*All content below is intended for developers who need a complete understanding of the current implementation of the Dashboard Wizard UI. It covers the component hierarchy, state model, user‑interaction flow, and the key functions that drive the wizard.*

---

## 1. High‑level Overview

The Dashboard Wizard guides a user through three sequential steps to create a new dashboard:

1. **Template selection** – choose a pre‑built layout (CTO, VP Engineering, …) or start with a blank canvas.  
2. **Widget customization** – add, remove, reorder and resize widgets from a library.  
3. **Dashboard settings** – set name, description, default time‑range and team scope, then persist the result.

The wizard lives in `ui/src/features/dashboardWizard/DashboardWizardScreen.tsx`.  
Its UI consists of two panels:

| Panel | Responsibility |
|------|-----------------|
| **Left panel** | Step navigation, step‑specific controls, widget list, and settings form. |
| **Right panel** | Live preview of the dashboard (`PreviewPanel`). |

---

## 2. Component Tree

```
DashboardWizardScreen
│
├─ StepDot                ← renders a step indicator dot
│
├─ MiniWidget*            ← (unused in current version – kept for future extensions)
│
├─ PreviewPanel           ← receives template, widgets, sizes, name
│
└─ (internal JSX)        ← left‑panel layout (steps + content)
```

*`MiniWidget` is exported from `components/dashboardWizard/components/MiniWidget.tsx` but is not rendered by the current wizard screen.*

---

## 3. Type Definitions

```ts
interface Template {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
}

interface Widget {
  cat: string;   // category (e.g. "DORA", "CI/CD")
  id: string;
  icon: string;
  label: string;
  desc: string;
}

interface StepProps {
  n: number;       // step number (1‑based)
  label: string;   // step title
  active: boolean; // is the step currently selected?
  done: boolean;   // has the step been completed?
}

interface WizardProps {
  onSave?: (data: unknown) => void;
  onCancel?: () => void;
}
```

---

## 4. Constants

| Constant | Purpose |
|----------|---------|
| `TEMPLATES` | Array of 6 built‑in dashboard templates (CTO, VP Engineering, Tech Lead, DevOps/SRE, My Dashboard, Blank Canvas). |
| `WIDGET_LIBRARY` | Master list of all available widgets, each belonging to a category (`cat`). |
| `TEMPLATE_WIDGETS` | Mapping from a template ID to the default set of widget IDs that should be pre‑selected when the template is chosen. |
| `CATS` | Category filter options shown in step 2 (`All`, `DORA`, `CI/CD`, …). |

---

## 5. State Model

| State Variable | Type | Default | Mutated by |
|----------------|------|---------|------------|
| `step` | `number` | `0` | navigation buttons (`Back` / `Continue`) |
| `selectedTemplate` | `Template \| null` | `null` | `chooseTemplate` |
| `widgets` | `string[]` (widget IDs) | `[]` | `toggleWidget`, `moveWidget`, `setWidgets` (clear) |
| `widgetSizes` | `Record<string, string>` (`'lg' | 'sm'`) | `{}` | `chooseTemplate` (initial sizing), `toggleSize` |
| `widgetCat` | `string` | `'All'` | category filter buttons |
| `name` | `string` | `''` | text input in step 3, also set automatically on template selection |
| `desc` | `string` | `''` | description input in step 3 |
| `timeRange` | `string` | `'30d'` | time‑range button group |
| `team` | `string` | `'All teams'` | team `<select>` control |

All state lives inside the `DashboardWizardScreen` component via `useState`. No external stores or context are used.

---

## 6. Step Navigation

```ts
const steps = ['Template', 'Widgets', 'Settings'];
```

The UI renders `StepDot` for each step. Navigation logic:

```tsx
<button onClick={() => step === 0 ? onCancel?.() : setStep(s => s - 1)}>Back / Cancel</button>
<button
  onClick={() =>
    step === steps.length - 1
      ? onSave?.({ name, widgets, widgetSizes, timeRange, team, description: desc })
      : setStep(s => s + 1)
  }
  disabled={!canContinue}
>
  {step === steps.length - 1 ? 'Save Dashboard' : 'Continue'}
</button>
```

`canContinue` is computed per‑step:

```ts
const canContinue = [
  !!selectedTemplate,               // step 0: a template must be chosen
  widgets.length > 0,               // step 1: at least one widget selected
  name.trim().length > 0,           // step 2: dashboard must have a name
][step];
```

---

## 7. Core Interaction Functions

### 7.1 `chooseTemplate`

```ts
const chooseTemplate = (tmpl: Template) => {
  setSelectedTemplate(tmpl);
  const ws = TEMPLATE_WIDGETS[tmpl.id as keyof typeof TEMPLATE_WIDGETS] || [];
  setWidgets(ws);

  const sizes: Record<string, string> = {};
  ws.forEach(id => {
    // Large widgets for certain IDs, otherwise small
    sizes[id] = (id === 'dora-overview' || id === 'team-heatmap' ||
                id === 'pr-queue' || id === 'failing-builds' ||
                id === 'ai-summary') ? 'lg' : 'sm';
  });
  setWidgetSizes(sizes);

  // Auto‑populate a sensible name if the user hasn't typed one yet
  if (!name) setName(tmpl.id === 'blank' ? 'My Dashboard' : `${tmpl.label} Dashboard`);
};
```
*Effects:* sets the selected template, pre‑populates `widgets` and initial `widgetSizes`, and optionally sets a default dashboard name.

### 7.2 `toggleWidget`

```ts
const toggleWidget = (id: string) => {
  setWidgets(prev => {
    if (prev.includes(id)) {
      // Removing a widget – also delete its size entry
      const newSizes = { ...widgetSizes };
      delete newSizes[id];
      setWidgetSizes(newSizes);
      return prev.filter(x => x !== id);
    }
    // Adding a widget – start with a small size
    setWidgetSizes(s => ({ ...s, [id]: 'sm' }));
    return [...prev, id];
  });
};
```
*Effects:* adds a widget to the selected list (default size `sm`) or removes it and clears its size entry.

### 7.3 `moveWidget`

```ts
const moveWidget = (idx: number, dir: number) => {
  setWidgets(prev => {
    const arr = [...prev];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= arr.length) return arr;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    return arr;
  });
};
```
*Current UI:* Arrow buttons (`▲` / `▼`) call `moveWidget` with `dir = -1` or `+1`. This provides **keyboard‑style vertical reordering** (no drag‑and‑drop yet).

### 7.4 `toggleSize`

```ts
const toggleSize = (id: string) => {
  setWidgetSizes(prev => ({
    ...prev,
    [id]: prev[id] === 'lg' ? 'sm' : 'lg',
  }));
};
```
*Effect:* switches a widget between **Half** (`sm`) and **Full** (`lg`) width, influencing the preview layout.

---

## 8. UI Render Details

### 8.1 Step 0 – Template Selection
- Renders a list of `TEMPLATES`.  
- Each button shows the template’s icon, label, and description.  
- The selected template is highlighted (border & background tinted with `tmpl.color`).  
- Clicking a button invokes `chooseTemplate(tmpl)`.

### 8.2 Step 1 – Widget Customization
- **Category filter** (`CATS`) – clicking a category updates `widgetCat`.  
- **Widget list** – filtered by `widgetCat`. Each row contains:
  - Icon (colored per category).  
  - Label & description.  
  - A circular check indicator when selected.  
  - Click toggles the widget via `toggleWidget`.
- **Size toggle** is not present in this step; size is changed later in step 2.

### 8.3 Step 2 – Dashboard Settings
- **Name**, **Description**, **Time‑range**, and **Team** fields – all bound to their respective state variables.  
- **Widget layout management** – displays the current `widgets` order with:
  - Up/Down arrows (`moveWidget`).  
  - Widget icon + label.  
  - “Half / Full” button (`toggleSize`).  
  - Delete (`x`) button (inline `setWidgets(p => p.filter(x => x !== id))`).  
- The **preview panel** on the right (`<PreviewPanel .../>`) receives the live data (`template`, `widgets`, `widgetSizes`, `name`) and re‑renders instantly when any state changes.

---

## 9. PreviewPanel Integration

`PreviewPanel` resides in `ui/src/features/dashboardWizard/components/PreviewPanel.tsx`. It expects the following props:

| Prop | Type | Description |
|------|------|-------------|
| `template` | `Template \| null` | The selected template (used for header image / default name). |
| `widgets` | `string[]` | Ordered list of widget IDs to render in the preview. |
| `widgetSizes` | `Record<string, string>` | Size mapping (`'lg'` → full‑width, `'sm'` → half‑width). |
| `name` | `string` | Dashboard title shown in the preview header. |

The panel re‑creates the final dashboard layout using the same CSS‑grid logic found in `DashboardRenderer`, so the wizard preview is a **pixel‑accurate** representation of the eventual dashboard.

---

## 10. Mermaid Diagram – Wizard Flow & Data Flow

```mermaid
flowchart TD
    A[Start – Render DashboardWizardScreen] --> B[Step 0: Template]
    B -->|chooseTemplate| C[State: selectedTemplate, widgets, widgetSizes, name]
    C --> D[Step 1: Widgets]
    D -->|toggleWidget| E[State: widgets, widgetSizes]
    E -->|moveWidget| F[State: widgets order]
    F -->|toggleSize| G[State: widgetSizes]
    G --> H[Step 2: Settings]
    H -->|update name/desc/time/team| I[State: name, desc, timeRange, team]
    I --> J[PreviewPanel receives (template, widgets, widgetSizes, name)]
    J --> K[Live preview updates]
    K --> L[User clicks Save → onSave(data) emitted]
```

---

## 11. Extensibility & Known Limitations

| Area | Current Implementation | Suggested Future Work |
|------|------------------------|-----------------------|
| **Re‑ordering** | Arrow buttons (`moveWidget`) perform vertical swaps. | Replace with a true drag‑and‑drop library (e.g., `dnd-kit`) to allow arbitrary rearrangement with mouse/touch. |
| **Sizing** | Binary `"lg"` / `"sm"` sizes toggled via a button. | Expose a richer size selector (e.g., width percentages, per‑widget aspect ratio). |
| **State Management** | Local `useState` only; no persistence across page reloads. | Move to a context/provider or Redux slice if the wizard must survive navigation away from the page. |
| **Accessibility** | No ARIA roles/labels on buttons or interactive list items. | Add `role="button"` with proper `aria‑pressed` and keyboard navigation (Enter/Space). |
| **Testing** | No dedicated unit tests for the wizard component. | Add component tests (React Testing Library) covering: template selection, widget toggle, move & size actions, and final payload shape. |
| **Internationalisation** | All UI strings are hard‑coded English/Russian. | Extract strings to an i18n solution (e.g., `react-intl`). |

---

## 12. Summary

The Dashboard Wizard is a **single‑component, state‑driven stepper** that lets a user assemble a dashboard from a predefined template and a curated widget library. Its current feature set includes:

- Template‑based pre‑population of widgets.  
- Category‑filtered widget add/remove UI.  
- Simple vertical re‑ordering via arrow buttons.  
- Half/Full size toggling per widget.  
- Live preview that mirrors `DashboardRenderer` output.

All behaviours are driven by pure React state (`useState`), making the component easy to reason about and modify. The code is fully type‑annotated (TypeScript) and follows the project’s existing styling conventions (CSS custom properties, `var(--…)`).

When you are ready to extend the wizard (e.g., add drag‑and‑drop, deeper accessibility, or unit tests), the sections marked **Extensibility & Known Limitations** outline the minimal integration points.

---

*End of `docs/DashboardWizard.md`*