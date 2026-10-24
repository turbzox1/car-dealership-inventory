const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** "$24,650" for whole dollars, "$24,650.50" when there are cents. */
export function formatPrice(amount: number): string {
  return priceFormat.format(amount);
}

export function stockLabel(quantity: number): string {
  if (quantity === 0) return 'Out of stock';
  if (quantity === 1) return 'Only 1 left';
  return `${quantity} in stock`;
}
