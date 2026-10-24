const wholeDollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const withCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/** "$24,650" for whole dollars, "$18,500.50" when there are cents (never "$18,500.5"). */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? wholeDollars.format(amount) : withCents.format(amount);
}

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

/** "Oct 20, 2026, 5:30 PM" in the viewer's own timezone. */
export function formatDateTime(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function stockLabel(quantity: number): string {
  if (quantity === 0) return 'Out of stock';
  if (quantity === 1) return 'Only 1 left';
  return `${quantity} in stock`;
}
