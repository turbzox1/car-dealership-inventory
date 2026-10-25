import { createContext, useContext } from 'react';
import type { CartItem, Vehicle } from '../types';

export interface CartContextValue {
  items: CartItem[];
  /** Total units across all lines. */
  count: number;
  subtotal: number;
  quantityOf(vehicleId: string): number;
  /** Adds one unit; returns false when the vehicle is sold out or all its stock is already in the cart. */
  add(vehicle: Vehicle): boolean;
  setQuantity(vehicleId: string, quantity: number): void;
  remove(vehicleId: string): void;
  clear(): void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
