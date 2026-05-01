import { describe, it, expect } from 'vitest';

describe('CSS Design Tokens', () => {
  it('matches design tokens from prototype', () => {
    const styles = getComputedStyle(document.documentElement);
    
    expect(styles.getPropertyValue('--bg').trim()).toBe('#0B0F19');
    expect(styles.getPropertyValue('--glass').trim()).toBe('#131825');
    expect(styles.getPropertyValue('--glass2').trim()).toBe('#1a2235');
    expect(styles.getPropertyValue('--border').trim()).toBe('rgba(255, 255, 255, 0.07)');
    expect(styles.getPropertyValue('--cyan').trim()).toBe('#00E5FF');
    expect(styles.getPropertyValue('--purple').trim()).toBe('#B44CFF');
    expect(styles.getPropertyValue('--success').trim()).toBe('#00C853');
    expect(styles.getPropertyValue('--warning').trim()).toBe('#FF9F00');
    expect(styles.getPropertyValue('--error').trim()).toBe('#FF1744');
  });

  it('has correct font families defined', () => {
    const styles = getComputedStyle(document.documentElement);
    
    expect(styles.getPropertyValue('--font-head').trim()).toContain('Space Grotesk');
    expect(styles.getPropertyValue('--font-body').trim()).toContain('Inter');
    expect(styles.getPropertyValue('--font-mono').trim()).toContain('JetBrains Mono');
  });
});