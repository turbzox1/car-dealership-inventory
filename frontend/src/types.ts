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

export interface Session {
  token: string;
  user: User;
}
