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

const screens: Record<string, React.FC> = {
  dashboard: DashboardScreen,
  cto: () => <RoleDashboardScreen initialRole="cto" />,
  vp: () => <RoleDashboardScreen initialRole="vp" />,
  tl: () => <RoleDashboardScreen initialRole="tl" />,
  devops: () => <RoleDashboardScreen initialRole="devops" />,
  ic: () => <RoleDashboardScreen initialRole="ic" />,
  metrics: MetricsScreen,
  wizard: DashboardWizardScreen,
  ai: AIScreen,
  plugins: PluginScreen,
  sources: WizardScreen,
  settings: PlaceholderScreen,
};

export const App: React.FC = () => {
  const [active, setActive] = useState('dashboard');
  const Screen = screens[active] || DashboardScreen;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar active={active} onNavigate={setActive} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Screen />
        </main>
      </div>
    </div>
  );
};

export default App;