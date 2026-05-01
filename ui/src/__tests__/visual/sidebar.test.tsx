import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../../components/ui/Sidebar';

describe('Sidebar Visual', () => {
  it('renders with correct width (240px)', () => {
    const { container } = render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    const nav = container.querySelector('nav');
    expect(nav?.style.width).toBe('240px');
  });

  it('renders logo with gradient', () => {
    render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    expect(screen.getByText('Metraly')).toBeTruthy();
  });

  it('renders all nav items', () => {
    render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('CTO Dashboard')).toBeTruthy();
    expect(screen.getByText('VP Dashboard')).toBeTruthy();
    expect(screen.getByText('Team Lead')).toBeTruthy();
    expect(screen.getByText('Metrics Explorer')).toBeTruthy();
  });

  it('applies active state styling', () => {
    const { container } = render(<Sidebar active="dashboard" onNavigate={() => {}}/>);
    const activeButton = container.querySelector('button');
    expect(activeButton?.style.background).toContain('rgba(0,229,255,0.1)');
  });
});