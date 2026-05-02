// @ts-nocheck
import { useState, useEffect } from "react";
import { mockApi } from "../api/mockApi";
import type { Dashboard } from "../types/dashboard";
import type { WidgetDataItem } from "../types/api";

interface UseDashboardResult {
  dashboard: Dashboard | null;
  widgetData: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const DASHBOARD_IDS: Record<string, string> = {
  cto: "dash-cto",
  vp: "dash-vp",
  tl: "dash-tl",
  devops: "dash-devops",
  ic: "dash-ic",
  overview: "dash-overview",
};

export function useDashboard(dashboardId: string): UseDashboardResult {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!dashboardId) {
      setDashboard(null);
      setIsLoading(false);
      return;
    }

    const dashboardIdMapped = DASHBOARD_IDS[dashboardId];
if (!dashboardIdMapped) {
      setError(`Unknown dashboard: ${dashboardId}`);
      setIsLoading(false);
      setWidgetData({});
      setDashboard(null);
      return;
    }

    // Also reset when dashboardId becomes empty
    if (!dashboardId) {
      setDashboard(null);
      setWidgetData({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch dashboard
      const dash = await mockApi.getDashboard(dashboardIdMapped);
      setDashboard(dash);

      // Fetch widget data
      if (dash.widgets.length > 0) {
        const widgetRequests = dash.widgets.map((w) => ({
          instanceId: `${dashboardIdMapped}-${w.instanceId}`,
          widgetType: w.widgetType,
          config: w.config,
        }));

        const dataResponse = await mockApi.getDashboardData(
          dashboardIdMapped,
          widgetRequests,
        );

        // Map to record by scoped instanceId
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
  }, [dashboardId]);

  return {
    dashboard,
    widgetData,
    isLoading,
    error,
    refresh: fetchData,
  };
}

