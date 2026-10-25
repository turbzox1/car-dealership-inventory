import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';
import type { CartItem, Vehicle } from '../types';
import { CartContext, type CartContextValue } from './useCart';

/** Each account has its own cart in this browser. */
const storageKey = (userId: string) => `autovault.cart.${userId}`;

function readCart(userId: string): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]');
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return []; // Corrupted or blocked storage: start with an empty cart
  }
}

/**
 * Browser-side cart. Nothing is reserved on the server: stock is only
 * guaranteed at checkout, which buys the whole cart or nothing.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Keyed by account, so signing in as someone else starts from their own cart
  return (
    <AccountCart key={user?.id ?? 'signed-out'} userId={user?.id ?? null}>
      {children}
    </AccountCart>
  );
}

function AccountCart({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => (userId ? readCart(userId) : []));

  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(items));
    } catch {
      // Storage unavailable: the cart still works until reload
    }
  }, [userId, items]);

  const add = useCallback(
    (vehicle: Vehicle) => {
      const current = items.find((i) => i.vehicleId === vehicle.id)?.quantity ?? 0;
      if (current >= vehicle.quantity) return false;
      setItems((list) => {
        const snapshot = {
          vehicleId: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          category: vehicle.category,
          price: vehicle.price,
          stock: vehicle.quantity,
        };
        const existing = list.find((i) => i.vehicleId === vehicle.id);
        return existing
          ? list.map((i) => (i.vehicleId === vehicle.id ? { ...i, ...snapshot, quantity: i.quantity + 1 } : i))
          : [...list, { ...snapshot, quantity: 1 }];
      });
      return true;
    },
    [items],
  );

  const setQuantity = useCallback((vehicleId: string, quantity: number) => {
    setItems((list) =>
      list.map((i) => (i.vehicleId === vehicleId ? { ...i, quantity: Math.min(Math.max(1, quantity), i.stock) } : i)),
    );
  }, []);

  const remove = useCallback((vehicleId: string) => {
    setItems((list) => list.filter((i) => i.vehicleId !== vehicleId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      quantityOf: (vehicleId) => items.find((i) => i.vehicleId === vehicleId)?.quantity ?? 0,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
