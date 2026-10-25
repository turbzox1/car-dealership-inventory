import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { checkout, orderNumber } from '../api/orders';
import { useApi } from '../api/useApi';
import { useCart } from '../cart/useCart';
import { AppHeader } from '../components/AppHeader';
import { SiteFooter } from '../components/SiteFooter';
import { FormAlert } from '../components/form';
import { EmptyState } from '../components/PageStates';
import { SketchCar } from '../components/SketchCar';
import { buttonGhost, buttonOutline, buttonPrimary } from '../components/styles';
import { formatPrice } from '../format';
import type { CartItem, Order } from '../types';

const linkClass =
  'font-semibold text-ink-900 underline decoration-accent-400 decoration-2 underline-offset-4 transition-colors hover:decoration-accent-600';

const stepButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-ink-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent';

function CartLine({ item }: { item: CartItem }) {
  const { setQuantity, remove } = useCart();
  const name = `${item.make} ${item.model}`;
  return (
    <li aria-label={name} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-5 first:pt-0 last:pb-0">
      <div className="w-24 shrink-0 bg-slate-100/70 px-2 py-2">
        <SketchCar withScene={false} wash="var(--color-accent-300)" className="h-10 w-auto" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{item.make}</p>
        <p className="display text-xl text-ink-900">{item.model}</p>
        <p className="mt-0.5 text-sm text-slate-500">{formatPrice(item.price)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease quantity of ${name}`}
          onClick={() => setQuantity(item.vehicleId, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className={stepButton}
        >
          −
        </button>
        <span className="w-6 text-center font-mono text-sm text-ink-900">{item.quantity}</span>
        <button
          type="button"
          aria-label={`Increase quantity of ${name}`}
          onClick={() => setQuantity(item.vehicleId, item.quantity + 1)}
          disabled={item.quantity >= item.stock}
          className={stepButton}
        >
          +
        </button>
      </div>
      <p className="display w-28 text-right text-lg text-ink-900">{formatPrice(item.price * item.quantity)}</p>
      <button type="button" aria-label={`Remove ${name}`} onClick={() => remove(item.vehicleId)} className={`${buttonGhost} px-3`}>
        Remove
      </button>
    </li>
  );
}

function Confirmation({ order }: { order: Order }) {
  return (
    <section className="rise mx-auto max-w-xl border border-slate-200 bg-card px-8 py-12 text-center">
      <span className="eyebrow">Order placed</span>
      <h1 className="display mt-5 text-4xl text-ink-900">Order confirmed</h1>
      <p className="mt-3 text-slate-500">
        Order <span className="font-mono text-ink-900">#{orderNumber(order.id)}</span> · total{' '}
        <span className="font-semibold text-ink-900">{formatPrice(order.total)}</span>
      </p>
      <SketchCar className="mx-auto mt-6 w-64" />
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/orders" className={buttonPrimary}>
          View my orders
        </Link>
        <Link to="/" className={buttonOutline}>
          Continue shopping
        </Link>
      </div>
    </section>
  );
}

export function CartPage() {
  const call = useApi();
  const cart = useCart();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Order | null>(null);

  async function handleConfirm() {
    setPlacing(true);
    setError(null);
    try {
      const { order } = await checkout(call, cart.items);
      cart.clear();
      setConfirmed(order);
    } catch (err) {
      // All or nothing: the cart is untouched, so the user can adjust and retry
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="page flex-1 py-10 sm:py-14">
        {confirmed ? (
          <Confirmation order={confirmed} />
        ) : (
          <>
            <span className="eyebrow">Checkout</span>
            <h1 className="display mt-4 text-4xl text-ink-900 sm:text-5xl">Your cart</h1>

            {cart.items.length === 0 ? (
              <div className="mt-8">
                <EmptyState title="Your cart is empty">
                  <Link to="/" className={linkClass}>
                    Browse the showroom
                  </Link>
                </EmptyState>
              </div>
            ) : (
              <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
                <ul className="divide-y divide-slate-200 border border-slate-200 bg-card p-6">
                  {cart.items.map((item) => (
                    <CartLine key={item.vehicleId} item={item} />
                  ))}
                </ul>

                <aside className="border border-slate-200 bg-card p-6 lg:sticky lg:top-24">
                  <h2 className="display text-xl text-ink-900">Summary</h2>
                  <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-slate-200 pt-4">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="display text-2xl text-ink-900">{formatPrice(cart.subtotal)}</span>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-slate-500">
                    {cart.count} {cart.count === 1 ? 'unit' : 'units'} · stock is checked when you confirm
                  </p>
                  {error && (
                    <div className="mt-4">
                      <FormAlert>{error}</FormAlert>
                    </div>
                  )}
                  <button type="button" onClick={handleConfirm} disabled={placing} className={`${buttonPrimary} mt-5 w-full`}>
                    {placing && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" aria-hidden="true" />
                    )}
                    {placing ? 'Placing order…' : 'Confirm order'}
                  </button>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Everything is bought together, or nothing is.
                  </p>
                </aside>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
