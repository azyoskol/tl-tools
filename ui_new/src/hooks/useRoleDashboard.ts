// @ts-nocheck
import { useState, useEffect } from "react";
import { mockApi } from "../api/mockApi";
import type { Dashboard } from "../types/dashboard";
import type { WidgetDataItem } from "../types/api";

interface UseRoleDashboardResult {
  dashboard: Dashboard | null;
  widgetData: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const ROLE_DASHBOARD_IDS: Record<string, string> = {
  cto: "dash-cto",
  vp: "dash-vp",
  tl: "dash-tl",
  devops: "dash-devops",
  ic: "dash-ic",
  overview: "dash-overview",
};

export function useRoleDashboard(roleId: string): UseRoleDashboardResult {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!roleId || roleId === "overview") {
      setDashboard(null);
      setIsLoading(false);
      return;
    }

    const dashboardId = ROLE_DASHBOARD_IDS[roleId];
    if (!dashboardId) {
      setError(`Unknown role: ${roleId}`);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch dashboard
      const dash = await mockApi.getDashboard(dashboardId);
      setDashboard(dash);

      // Fetch widget data
      if (dash.widgets.length > 0) {
        const widgetRequests = dash.widgets.map((w) => ({
          instanceId: w.instanceId,
          widgetType: w.widgetType,
          config: w.config,
        }));

        const dataResponse = await mockApi.getDashboardData(
          dashboardId,
          widgetRequests,
        );

        // Map to record by instanceId
        const dataMap: Record<string, any> = {};
        dataResponse.widgets.forEach((item: WidgetDataItem) => {
          dataMap[item.instanceId] = item.data;
        });
        setWidgetData(dataMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleId]);

  return {
    dashboard,
    widgetData,
    isLoading,
    error,
    refresh: fetchData,
  };
}

