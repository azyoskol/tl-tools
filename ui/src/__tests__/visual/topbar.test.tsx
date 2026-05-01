import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Topbar } from '../../components/ui/Topbar';

describe('Topbar Visual', () => {
  it('renders with correct height (60px)', () => {
    const { container } = render(<Topbar/>);
    const header = container.querySelector('header');
    expect(header?.style.height).toBe('60px');
  });

  it('renders search input with placeholder', () => {
    render(<Topbar/>);
    const input = document.querySelector('input');
    expect(input?.placeholder).toBe('Search metrics, teams...');
  });

  it('renders notification button', () => {
    render(<Topbar/>);
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('has glass background styling', () => {
    const { container } = render(<Topbar/>);
    const header = container.querySelector('header');
    expect(header?.style.background).toBe('var(--glass)');
  });
});