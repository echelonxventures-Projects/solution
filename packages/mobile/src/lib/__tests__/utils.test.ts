import { formatCurrency, formatDate, formatTime } from '../utils';

describe('formatCurrency', () => {
  it('formats whole dollar amounts', () => {
    expect(formatCurrency(100)).toBe('$100.00');
  });

  it('formats fractional amounts', () => {
    expect(formatCurrency(99.5)).toBe('$99.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large amounts with thousands separators', () => {
    expect(formatCurrency(12500)).toBe('$12,500.00');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2026-03-15T10:00:00Z');
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/15/);
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2026-01-20T00:00:00Z'));
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/20/);
  });
});

describe('formatTime', () => {
  it('formats a timestamp into hours and minutes', () => {
    const result = formatTime('2026-03-15T14:30:00Z');
    // Locale/timezone dependent, but always renders as a clock time
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('returns a non-empty string for a valid date', () => {
    const result = formatTime('2026-03-15T09:05:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
