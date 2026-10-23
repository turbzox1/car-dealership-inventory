export const CATEGORIES = ['SEDAN', 'SUV', 'TRUCK', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'VAN', 'EV'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: Category;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewVehicle {
  make: string;
  model: string;
  category: Category;
  price: number;
  quantity: number;
}

/** Editable details. Stock changes go through purchase/restock, not here. */
export type VehicleUpdate = Partial<Omit<NewVehicle, 'quantity'>>;

/** All filters optional and combinable; make/model match partially, ignoring case. */
export interface VehicleSearch {
  make?: string;
  model?: string;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
}
