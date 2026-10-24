import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { stockLabel } from '../../format';
import type { Vehicle } from '../../types';
import { Dialog, DialogActions } from '../Dialog';
import { FormAlert, TextField } from '../form';

const MAX_RESTOCK = 1000; // same limit as the API

interface Props {
  vehicle: Vehicle;
  onClose(): void;
  onSubmit(amount: number): Promise<void>;
}

export function RestockDialog({ vehicle, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const units = Number(amount);
    if (!/^\d+$/.test(amount.trim()) || units < 1 || units > MAX_RESTOCK) {
      setError(`Enter a whole number greater than 0 (up to ${MAX_RESTOCK})`);
      return;
    }
    setError(undefined);
    setBusy(true);
    setServerError(null);
    try {
      await onSubmit(units);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Dialog title={`Restock ${vehicle.make} ${vehicle.model}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && <FormAlert>{serverError}</FormAlert>}
        <p className="text-sm text-slate-600">
          Currently: <span className="font-medium text-slate-900">{stockLabel(vehicle.quantity)}</span>
        </p>
        <TextField
          label="Units to add"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error}
        />
        <DialogActions onCancel={onClose} busy={busy} submitLabel="Restock" busyLabel="Restocking…" />
      </form>
    </Dialog>
  );
}
