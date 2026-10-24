import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import type { NewVehicle, VehicleDetails } from '../../api/adminVehicles';
import { CATEGORIES, CATEGORY_LABELS, type Category, type Vehicle } from '../../types';
import { Dialog, DialogActions } from '../Dialog';
import { FormAlert, SelectField, TextField } from '../form';

type Field = 'make' | 'model' | 'category' | 'price' | 'quantity';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const MAX_PRICE = 100_000_000; // same ceiling as the API

interface Props {
  /** Present when editing; absent when adding a new vehicle. */
  vehicle?: Vehicle;
  onClose(): void;
  /** Saves and resolves with nothing; rejects with an ApiError to show in the dialog. */
  onSubmit(values: NewVehicle | VehicleDetails): Promise<void>;
}

function validate(values: Values, includeQuantity: boolean): Errors {
  const errors: Errors = {};
  if (!values.make.trim()) errors.make = 'Enter the make';
  if (!values.model.trim()) errors.model = 'Enter the model';
  if (!values.category) errors.category = 'Choose a category';
  const price = Number(values.price);
  if (values.price.trim() === '' || !(price > 0)) errors.price = 'Price must be greater than 0';
  else if (price > MAX_PRICE) errors.price = 'Price is too high';
  if (includeQuantity && !/^\d+$/.test(values.quantity.trim())) {
    errors.quantity = 'Quantity must be a whole number (0 or more)';
  }
  return errors;
}

/** Add or edit form. Editing has no quantity: stock changes go through Restock. */
export function VehicleFormDialog({ vehicle, onClose, onSubmit }: Props) {
  const editing = Boolean(vehicle);
  const [values, setValues] = useState<Values>({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle ? String(vehicle.price) : '',
    quantity: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bind = (field: Field) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value })),
    error: errors[field],
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = validate(values, !editing);
    setErrors(next);
    if (Object.keys(next).length) return;

    const details: VehicleDetails = {
      make: values.make.trim(),
      model: values.model.trim(),
      category: values.category as Category,
      price: Number(values.price),
    };
    setBusy(true);
    setServerError(null);
    try {
      await onSubmit(editing ? details : { ...details, quantity: Number(values.quantity) });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Dialog title={vehicle ? `Edit ${vehicle.make} ${vehicle.model}` : 'Add vehicle'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <FormAlert>{serverError}</FormAlert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Make" placeholder="Toyota" {...bind('make')} />
          <TextField label="Model" placeholder="Supra" {...bind('model')} />
        </div>
        <SelectField label="Category" {...bind('category')}>
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Price (USD)" type="number" min={0} step="0.01" inputMode="decimal" {...bind('price')} />
          {!editing && (
            <TextField label="Quantity in stock" type="number" min={0} step={1} inputMode="numeric" {...bind('quantity')} />
          )}
        </div>
        <DialogActions
          onCancel={onClose}
          busy={busy}
          submitLabel={editing ? 'Save changes' : 'Add vehicle'}
          busyLabel="Saving…"
        />
      </form>
    </Dialog>
  );
}
