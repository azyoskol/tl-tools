import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { RoleDashboardScreen  } from './features/roleDashboards';
import { DashboardWizardScreen } from './features/dashboardWizard/DashboardWizardScreen';
import { MetricsScreen } from './features/metricsExplorer/MetricsScreen';
import { AIScreen } from './features/aiAssistant/AIScreen';
import { PluginScreen } from './features/marketplace/PluginScreen';
import { WizardScreen } from './features/onboarding/WizardScreen';
import { PlaceholderScreen } from './components/ui/PlaceholderScreen';
import { TweaksPanel } from './components/layout/TweaksPanel';
import { TweaksProvider } from './context/TweaksContext';

const titles = {
  dashboard: ['Overview', 'Last updated 2 min ago'],
  'dash-cto': ['CTO Dashboard', 'Strategic health, DORA trends, team velocity'],
  'dash-vp': ['VP Engineering', 'Delivery health & team performance'],
  'dash-tl': ['Tech Lead', 'CI health, PR queue & sprint progress'],
  'dash-devops': ['DevOps / SRE', 'Deploy frequency, MTTR & incidents'],
  'dash-ic': ['My Dashboard', 'Personal metrics & sprint tasks'],
  'dash-wizard': ['New Dashboard', 'Build a custom dashboard'],
  metrics: ['Metrics Explorer', 'DORA, CI/CD, PR & custom metrics'],
  ai: ['AI Assistant', 'Private · On-premise inference'],
  plugins: ['Plugin Marketplace', 'Browse & install integrations'],
  wizard: ['Connect Sources', 'Onboarding wizard'],
  settings: ['Settings', 'Platform configuration'],
};

const App = () => {
  const [active, setActive] = useState('dashboard');
  const [title, subtitle] = titles[active] || ['Metraly', ''];
  const renderScreen = () => {
    switch (active) {
      case 'dashboard': return <DashboardScreen />;
      case 'dash-cto':
          return (
            <RoleDashboardScreen
              initialRole="cto"
              onNewDashboard={() => setActive('dash-wizard')}
              onNavigate={setActive}
            />
          );
      case 'dash-vp':
          return (
            <RoleDashboardScreen
              initialRole="vp"
              onNewDashboard={() => setActive('dash-wizard')}
              onNavigate={setActive}
            />
          );
      case 'dash-tl':
          return (
            <RoleDashboardScreen
              initialRole="tl"
              onNewDashboard={() => setActive('dash-wizard')}
              onNavigate={setActive}
            />
          );
      case 'dash-devops':
          return (
            <RoleDashboardScreen
              initialRole="devops"
              onNewDashboard={() => setActive('dash-wizard')}
              onNavigate={setActive}
            />
          );
      case 'dash-ic':
          return (
            <RoleDashboardScreen
              initialRole="ic"
              onNewDashboard={() => setActive('dash-wizard')}
              onNavigate={setActive}
            />
          );
      case 'dash-wizard': return <DashboardWizardScreen onSave={() => setActive('dashboard')} onCancel={() => setActive('dashboard')} />;
      case 'metrics': return <MetricsScreen />;
      case 'ai': return <AIScreen />;
      case 'plugins': return <PluginScreen />;
      case 'wizard': return <WizardScreen />;
      default: return <PlaceholderScreen name={title} />;
    }
  };
  return (
    <TweaksProvider>
      <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
        <Sidebar active={active} onNav={setActive} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Topbar title={title} subtitle={subtitle} />
          {renderScreen()}
        </div>
        <TweaksPanel />
      </div>
    </TweaksProvider>
  );
};
export default App;