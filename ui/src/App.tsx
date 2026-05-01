import React, { useState } from 'react';
import { Sidebar } from './components/ui/Sidebar';
import { Topbar } from './components/ui/Topbar';
import { DashboardScreen } from './screens/DashboardScreen';
import { RoleDashboardScreen } from './screens/RoleDashboardScreen';
import { MetricsScreen } from './screens/MetricsScreen';
import { DashboardWizardScreen } from './screens/DashboardWizardScreen';
import { AIScreen } from './screens/AIScreen';
import { PluginScreen } from './screens/PluginScreen';
import { WizardScreen } from './screens/WizardScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';

const titles: Record<string, [string, string]> = {
  dashboard:  ['Overview',           'Last updated 2 min ago'],
  cto:        ['CTO Dashboard',      'Strategic health, DORA trends, team velocity'],
  vp:         ['VP Engineering',     'Delivery health & team performance'],
  tl:         ['Tech Lead',          'CI health, PR queue & sprint progress'],
  devops:     ['DevOps / SRE',       'Deploy frequency, MTTR & incidents'],
  ic:         ['My Dashboard',       'Personal metrics & sprint tasks'],
  wizard:     ['New Dashboard',      'Build a custom dashboard'],
  metrics:    ['Metrics Explorer',   'DORA, CI/CD, PR & custom metrics'],
  ai:         ['AI Assistant',       'Private · On-premise inference'],
  plugins:    ['Plugin Marketplace', 'Browse & install integrations'],
  sources:    ['Connect Sources',    'Onboarding wizard'],
  settings:   ['Settings',           'Platform configuration'],
};

export const App: React.FC = () => {
  const [active, setActive] = useState('dashboard');
  const [title, subtitle] = titles[active] || ['Metraly', ''];

  const renderScreen = () => {
    switch (active) {
      case 'dashboard': return <DashboardScreen />;
      case 'cto':       return <RoleDashboardScreen initialRole="cto" onNewDashboard={() => setActive('wizard')} />;
      case 'vp':        return <RoleDashboardScreen initialRole="vp" onNewDashboard={() => setActive('wizard')} />;
      case 'tl':        return <RoleDashboardScreen initialRole="tl" onNewDashboard={() => setActive('wizard')} />;
      case 'devops':    return <RoleDashboardScreen initialRole="devops" onNewDashboard={() => setActive('wizard')} />;
      case 'ic':        return <RoleDashboardScreen initialRole="ic" onNewDashboard={() => setActive('wizard')} />;
      case 'wizard':    return <DashboardWizardScreen onSave={() => setActive('dashboard')} onCancel={() => setActive('dashboard')} />;
      case 'metrics':   return <MetricsScreen />;
      case 'ai':        return <AIScreen />;
      case 'plugins':   return <PluginScreen />;
      case 'sources':   return <WizardScreen />;
      default:          return <PlaceholderScreen name={title} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar active={active} onNavigate={setActive} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar title={title} subtitle={subtitle} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {renderScreen()}
        </main>
      </div>
    </div>
  );
};

export default App;
