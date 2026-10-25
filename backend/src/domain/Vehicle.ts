export const CATEGORIES = ['SEDAN', 'SUV', 'TRUCK', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'VAN', 'EV'] as const;
export type Category = (typeof CATEGORIES)[number];

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSIONS = ['Automatic', 'Manual'] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

/** A freely licensed photo, with what its license requires us to show. */
export interface VehicleImage {
  url: string;
  thumbUrl: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  sourceUrl: string;
}

/** Basic details for the vehicle page; any of them may be unknown. */
export interface VehicleDetails {
  year: number | null;
  fuelType: FuelType | null;
  transmission: Transmission | null;
  seats: number | null;
  description: string | null;
}

export interface Vehicle extends VehicleDetails {
  id: string;
  make: string;
  model: string;
  category: Category;
  price: number;
  quantity: number;
  images: VehicleImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewVehicle extends Partial<VehicleDetails> {
  make: string;
  model: string;
  category: Category;
  price: number;
  quantity: number;
}

/** Editable fields. Stock changes go through purchase/restock; photos come from the curated seed. */
export type VehicleUpdate = Partial<Omit<NewVehicle, 'quantity'>>;

/** All filters optional and combinable; make/model match partially, ignoring case. */
export interface VehicleSearch {
  make?: string;
  model?: string;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
}
