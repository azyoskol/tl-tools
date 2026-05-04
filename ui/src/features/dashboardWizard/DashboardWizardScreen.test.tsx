import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardWizardScreen } from './DashboardWizardScreen';
import { useWizardStore } from './store/wizardStore';

// Mock ResizeObserver for react-grid-layout
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

describe('DashboardWizardScreen', () => {
  beforeEach(() => {
    useWizardStore.getState().setStep(0);
    useWizardStore.getState().setTemplate('blank');
  });

  it('renders template selection on step 0', () => {
    render(<DashboardWizardScreen />);
    expect(screen.getByText('Start from a template')).toBeInTheDocument();
    expect(screen.getByText('CTO')).toBeInTheDocument();
  });

  it('selects template and moves to step 1', () => {
    render(<DashboardWizardScreen />);
    fireEvent.click(screen.getByText('CTO'));
    const continueBtn = screen.getByText('Continue');
    fireEvent.click(continueBtn);
    expect(screen.getByText('Customize widgets')).toBeInTheDocument();
  });

  it('shows WidgetPalette and SelectedWidgetsList on step 1', () => {
    render(<DashboardWizardScreen />);
    fireEvent.click(screen.getByText('CTO'));
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText((content) => content.includes('Selected:'))).toBeInTheDocument();
  });
});
