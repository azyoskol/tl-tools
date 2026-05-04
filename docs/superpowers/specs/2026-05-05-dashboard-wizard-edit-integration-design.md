# Design: DashboardWizard Integration in Edit Mode

## Goal
Integrate `DashboardWizard` components into the `DashboardScreen` edit mode via a sidebar overlay to allow managing widgets and settings without leaving the dashboard view.

## Approach
Extract UI logic from `DashboardWizardScreen` (Steps 2 and 3) into reusable components: `WizardWidgetPicker` and `WizardSettings`. Render them inside a `WizardSidebar` using a Segmented Control for navigation.

## Architecture

1.  **`WizardWidgetPicker`**:
    *   Extracted from `DashboardWizardScreen` (Step 2).
    *   Props: `selectedWidgets`, `onToggleWidget`, `onToggleSize`, `onMoveWidget`.
    *   Renders category filters and widget cards.

2.  **`WizardSettings`**:
    *   Extracted from `DashboardWizardScreen` (Step 3).
    *   Props: `name`, `desc`, `timeRange`, `team`, `onChange`, `onDelete`.
    *   Includes "Danger Zone" with Delete button.

3.  **`WizardSidebar`**:
    *   Container: Fixed position, 400px width, right side, z-index overlay.
    *   Header: Segmented Control (`Widgets` | `Settings`).
    *   Content: Renders `WizardWidgetPicker` or `WizardSettings` based on selection.

4.  **`DashboardScreen`**:
    *   State: `isWizardSidebarOpen`.
    *   Interaction: "Edit Layout" button opens the sidebar.
    *   Background: `DraggableDashboardRenderer` remains interactive on the left.

## Data Flow

*   **Widgets**: `DashboardScreen` passes `localLayout` and handlers (`handleRemoveWidget`, `handleToggleSize`) to `WizardSidebar`.
*   **Settings**: `DashboardScreen` passes `dashboard.name`, `dashboard.id` etc. to `WizardSettings`.
*   **Save**: Existing "Apply" button in `DashboardScreen` calls `handleSaveLayout` which saves `localLayout` and updated settings via `mockApi.updateDashboard`.
*   **Delete**: "Delete Dashboard" button in `WizardSettings` calls `mockApi.deleteDashboard(id)`, then navigates to "overview".

## UX & Style

*   **Sidebar**: `position: fixed; right: 0; top: 0; height: 100%; width: 400px; background: var(--glass); border-left: 1px solid var(--border);`.
*   **Segmented Control**: Active state uses `var(--cyan)` gradient.
*   **Overlay**: The sidebar slides over the content; the background dashboard remains visible but slightly dimmed.
*   **Delete Button**: Red (`#FF5252`), located at the bottom of `WizardSettings` behind a "Danger Zone" separator.
