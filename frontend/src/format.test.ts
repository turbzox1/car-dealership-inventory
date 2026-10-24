import { describe, expect, it } from 'vitest';
import { formatPrice, stockLabel } from './format';

describe('formatPrice', () => {
  it.each([
    [24650, '$24,650'],
    [18500.5, '$18,500.50'],
    [19999.99, '$19,999.99'],
    [0.5, '$0.50'],
  ])('formats %p as %p', (amount, expected) => {
    expect(formatPrice(amount)).toBe(expected);
  });
});

describe('stockLabel', () => {
  it.each([
    [0, 'Out of stock'],
    [1, 'Only 1 left'],
    [7, '7 in stock'],
  ])('describes %p units as %p', (quantity, expected) => {
    expect(stockLabel(quantity)).toBe(expected);
  });
});
