import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import { TweaksProvider } from "./context/TweaksContext"; // убедитесь, что путь верный
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { DashboardScreen } from "./features/dashboard/DashboardScreen";
import { RoleDashboardScreen } from "./features/roleDashboards";
import { DashboardWizardScreen } from "./features/dashboardWizard/DashboardWizardScreen";
import { MetricsScreen } from "./features/metricsExplorer/MetricsScreen";
import { AIScreen } from "./features/aiAssistant/AIScreen";
import { PluginScreen } from "./features/marketplace/PluginScreen";
import { WizardScreen } from "./features/onboarding/WizardScreen";
import { PlaceholderScreen } from "./components/ui/PlaceholderScreen";

const routeConfig = {
  "/": ["Overview", "Last updated 2 min ago"],
  "/dash-cto": [
    "CTO Dashboard",
    "Strategic health, DORA trends, team velocity",
  ],
  "/dash-vp": ["VP Engineering", "Delivery health & team performance"],
  "/dash-tl": ["Tech Lead", "CI health, PR queue & sprint progress"],
  "/dash-devops": ["DevOps / SRE", "Deploy frequency, MTTR & incidents"],
  "/dash-ic": ["My Dashboard", "Personal metrics & sprint tasks"],
  "/dash-wizard": ["New Dashboard", "Build a custom dashboard"],
  "/metrics": ["Metrics Explorer", "DORA, CI/CD, PR & custom metrics"],
  "/ai": ["AI Assistant", "Private · On-premise inference"],
  "/plugins": ["Plugin Marketplace", "Browse & install integrations"],
  "/wizard": ["Connect Sources", "Onboarding wizard"],
  "/settings": ["Settings", "Platform configuration"],
};

// Обёртка для шапки и боковой панели
const AppLayout = ({ children }) => {
  const location = useLocation();
  const [title, subtitle] = routeConfig[location.pathname] || ["Metraly", ""];

  return (
    <TweaksProvider>
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} subtitle={subtitle} />
        {children}
      </div>
    </TweaksProvider>
  );
};

const App = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/dash-cto" element={<RoleDashboardScreen />} />
        <Route path="/dash-vp" element={<RoleDashboardScreen />} />
        <Route path="/dash-tl" element={<RoleDashboardScreen />} />
        <Route path="/dash-devops" element={<RoleDashboardScreen />} />
        <Route path="/dash-ic" element={<RoleDashboardScreen />} />
        <Route path="/dash-wizard" element={<DashboardWizardScreen />} />
        <Route path="/metrics" element={<MetricsScreen />} />
        <Route path="/ai" element={<AIScreen />} />
        <Route path="/plugins" element={<PluginScreen />} />
        <Route path="/wizard" element={<WizardScreen />} />
        <Route path="/settings" element={<PlaceholderScreen />} />
      </Routes>
    </AppLayout>
  );
};

export default App; // ← ВОТ ЭТО БЫЛО ПРОПУЩЕНО
