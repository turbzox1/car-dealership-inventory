export type Role = 'USER' | 'ADMIN';

/** User as returned by the API (never includes credentials). */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export const CATEGORIES = ['SEDAN', 'SUV', 'TRUCK', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'VAN', 'EV'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  TRUCK: 'Truck',
  HATCHBACK: 'Hatchback',
  COUPE: 'Coupe',
  CONVERTIBLE: 'Convertible',
  VAN: 'Van',
  EV: 'Electric',
};

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: Category;
  price: number;
  quantity: number;
}

/** Search filters as typed by the user; empty strings mean "not set". */
export interface VehicleFilters {
  make: string;
  model: string;
  category: Category | '';
  minPrice: string;
  maxPrice: string;
}

/** A line of an order; make, model and price are as they were at the time of sale. */
export interface OrderItem {
  vehicleId: string;
  make: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** A checkout: a cart with several lines, or a single Purchase click. */
export interface Order {
  id: string;
  userId: string;
  createdAt: string;
  total: number;
  items: OrderItem[];
  /** Only in the admin listing. */
  customer?: { name: string; email: string };
}

/** A cart line, with a snapshot of the vehicle so the cart renders without a request. */
export interface CartItem {
  vehicleId: string;
  make: string;
  model: string;
  category: Category;
  price: number;
  /** Stock when last seen; caps the quantity (the server re-checks at checkout). */
  stock: number;
  quantity: number;
}

export interface Session {
  token: string;
  user: User;
}
