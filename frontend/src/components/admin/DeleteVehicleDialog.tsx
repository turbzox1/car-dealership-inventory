import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import type { Vehicle } from '../../types';
import { Dialog, DialogActions } from '../Dialog';
import { FormAlert } from '../form';

interface Props {
  vehicle: Vehicle;
  onClose(): void;
  onConfirm(): Promise<void>;
}

/** Confirmation for the soft delete; makes clear that order history survives. */
export function DeleteVehicleDialog({ vehicle, onClose, onConfirm }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setServerError(null);
    try {
      await onConfirm();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Dialog title={`Delete ${vehicle.make} ${vehicle.model}?`} onClose={onClose} tone="danger">
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <FormAlert>{serverError}</FormAlert>}
        <p className="text-sm text-slate-600">
          It will be removed from the showroom and can no longer be bought or restocked. Past orders are kept, so
          customers' purchase history stays complete.
        </p>
        <DialogActions onCancel={onClose} busy={busy} submitLabel="Delete" busyLabel="Deleting…" tone="danger" />
      </form>
    </Dialog>
  );
}
