// @ts-nocheck
import { useState, useEffect, useRef } from "react";
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

  const dashboardIdRef = useRef(dashboardId);

  useEffect(() => {
    dashboardIdRef.current = dashboardId;
  }, [dashboardId]);

  useEffect(() => {
    const requestId = dashboardIdRef.current;

    setDashboard(null);
    setWidgetData({});
    setIsLoading(true);
    setError(null);

    const dashboardIdMapped = DASHBOARD_IDS[requestId];
    if (!dashboardIdMapped) {
      setError(`Unknown dashboard: ${requestId}`);
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const dash = await mockApi.getDashboard(dashboardIdMapped);
        if (dashboardIdRef.current !== requestId) return;
        setDashboard(dash);

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

          if (dashboardIdRef.current !== requestId) return;

          const dataMap: Record<string, any> = {};
          dataResponse.widgets.forEach((item: WidgetDataItem) => {
            dataMap[item.instanceId] = item.data;
          });
          setWidgetData(dataMap);
        }
      } catch (err) {
        if (dashboardIdRef.current === requestId) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (dashboardIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }

    fetchData();
  }, [dashboardId]);

  const refresh = () => {
    setDashboard(null);
    setWidgetData({});
    setIsLoading(true);
    setError(null);

    const requestId = dashboardId;
    const dashboardIdMapped = DASHBOARD_IDS[dashboardId];
    if (!dashboardIdMapped) {
      setError(`Unknown dashboard: ${dashboardId}`);
      setIsLoading(false);
      return;
    }

    async function fetchRefresh() {
      try {
        const dash = await mockApi.getDashboard(dashboardIdMapped);
        if (dashboardIdRef.current !== requestId) return;
        setDashboard(dash);

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

          if (dashboardIdRef.current !== requestId) return;

          const dataMap: Record<string, any> = {};
          dataResponse.widgets.forEach((item: WidgetDataItem) => {
            dataMap[item.instanceId] = item.data;
          });
          setWidgetData(dataMap);
        }
      } catch (err) {
        if (dashboardIdRef.current === requestId) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (dashboardIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }

    fetchRefresh();
  };

  return {
    dashboard,
    widgetData,
    isLoading,
    error,
    refresh,
  };
}

