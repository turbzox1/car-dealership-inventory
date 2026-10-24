import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, storeSession } from '../test/renderApp';

const admin = { ...asha, id: 'admin-1', name: 'Dana Admin', email: 'admin@dealership.com', role: 'ADMIN' as const };
const civic = { id: 'v-civic', make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24650, quantity: 3 };
const golf = { id: 'v-golf', make: 'Volkswagen', model: 'Golf', category: 'HATCHBACK', price: 23900, quantity: 0 };

const card = (name: RegExp) => screen.getByRole('article', { name });
const dialog = () => screen.getByRole('dialog');

async function renderAs(user: typeof asha | typeof admin) {
  server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([civic, golf])));
  storeSession(user);
  const utils = renderApp('/');
  await screen.findByRole('article', { name: /civic/i });
  return utils;
}

/** Records the JSON bodies sent to an endpoint and answers with `respond`. */
function capture(method: 'post' | 'put' | 'delete', path: string, respond: () => Response) {
  const bodies: unknown[] = [];
  server.use(
    http[method](apiUrl(path), async ({ request }) => {
      bodies.push(method === 'delete' ? null : await request.json());
      return respond();
    }),
  );
  return bodies;
}

describe('Admin controls visibility', () => {
  it('are hidden from regular users', async () => {
    await renderAs(asha);

    expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument();
    expect(within(card(/civic/i)).queryByRole('button', { name: /edit|restock|delete/i })).not.toBeInTheDocument();
  });

  it('are shown to admins on every card', async () => {
    await renderAs(admin);

    expect(screen.getByRole('button', { name: /add vehicle/i })).toBeInTheDocument();
    for (const action of [/edit honda civic/i, /restock honda civic/i, /delete honda civic/i]) {
      expect(within(card(/civic/i)).getByRole('button', { name: action })).toBeInTheDocument();
    }
  });
});

describe('Adding a vehicle', () => {
  it('creates the vehicle with typed values and shows it in the grid', async () => {
    const supra = { id: 'v-supra', make: 'Toyota', model: 'Supra', category: 'COUPE', price: 56250.5, quantity: 2 };
    const bodies = capture('post', '/api/vehicles', () => HttpResponse.json(supra, { status: 201 }));
    const { user } = await renderAs(admin);

    await user.click(screen.getByRole('button', { name: /add vehicle/i }));
    const form = within(dialog());
    await user.type(form.getByLabelText(/make/i), 'Toyota');
    await user.type(form.getByLabelText(/model/i), 'Supra');
    await user.selectOptions(form.getByLabelText(/category/i), 'COUPE');
    await user.type(form.getByLabelText(/price/i), '56250.50');
    await user.type(form.getByLabelText(/quantity/i), '2');
    await user.click(form.getByRole('button', { name: /add vehicle/i }));

    expect(await screen.findByRole('article', { name: /toyota supra/i })).toBeInTheDocument();
    expect(bodies).toEqual([{ make: 'Toyota', model: 'Supra', category: 'COUPE', price: 56250.5, quantity: 2 }]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: /notification/i })).toHaveTextContent(/added toyota supra/i);
  });

  it('checks the form before sending anything', async () => {
    const bodies = capture('post', '/api/vehicles', () => HttpResponse.json({}, { status: 201 }));
    const { user } = await renderAs(admin);

    await user.click(screen.getByRole('button', { name: /add vehicle/i }));
    const form = within(dialog());
    await user.type(form.getByLabelText(/price/i), '0');
    await user.type(form.getByLabelText(/quantity/i), '1.5');
    await user.click(form.getByRole('button', { name: /add vehicle/i }));

    expect(form.getByText(/enter the make/i)).toBeInTheDocument();
    expect(form.getByText(/enter the model/i)).toBeInTheDocument();
    expect(form.getByText(/choose a category/i)).toBeInTheDocument();
    expect(form.getByText(/price must be greater than 0/i)).toBeInTheDocument();
    expect(form.getByText(/whole number/i)).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('shows a server error inside the dialog and keeps it open', async () => {
    // Valid by the client's rules; the server still rejects it (e.g. a rule the client doesn't know)
    capture('post', '/api/vehicles', () => HttpResponse.json({ error: 'model: Already in catalogue' }, { status: 400 }));
    const { user } = await renderAs(admin);

    await user.click(screen.getByRole('button', { name: /add vehicle/i }));
    const form = within(dialog());
    await user.type(form.getByLabelText(/make/i), 'Toyota');
    await user.type(form.getByLabelText(/model/i), 'Supra');
    await user.selectOptions(form.getByLabelText(/category/i), 'COUPE');
    await user.type(form.getByLabelText(/price/i), '30000');
    await user.type(form.getByLabelText(/quantity/i), '1');
    await user.click(form.getByRole('button', { name: /add vehicle/i }));

    expect(await form.findByRole('alert')).toHaveTextContent('model: Already in catalogue');
    expect(dialog()).toBeInTheDocument();
  });

  it('closes with Cancel or Escape without saving', async () => {
    const { user } = await renderAs(admin);

    await user.click(screen.getByRole('button', { name: /add vehicle/i }));
    await user.click(within(dialog()).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add vehicle/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Editing a vehicle', () => {
  it('opens pre-filled, sends the details without quantity, and updates the card', async () => {
    const bodies = capture('put', '/api/vehicles/v-civic', () => HttpResponse.json({ ...civic, price: 22500 }));
    const { user } = await renderAs(admin);

    await user.click(within(card(/civic/i)).getByRole('button', { name: /edit honda civic/i }));
    const form = within(dialog());
    expect(form.getByLabelText(/make/i)).toHaveValue('Honda');
    expect(form.getByLabelText(/model/i)).toHaveValue('Civic');
    expect(form.queryByLabelText(/quantity/i)).not.toBeInTheDocument();

    await user.clear(form.getByLabelText(/price/i));
    await user.type(form.getByLabelText(/price/i), '22500');
    await user.click(form.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(within(card(/civic/i)).getByText('$22,500')).toBeInTheDocument());
    expect(bodies).toEqual([{ make: 'Honda', model: 'Civic', category: 'SEDAN', price: 22500 }]);
  });
});

describe('Restocking', () => {
  it('adds units and updates the stock shown, even for a sold-out vehicle', async () => {
    const bodies = capture('post', '/api/vehicles/v-golf/restock', () => HttpResponse.json({ ...golf, quantity: 5 }));
    const { user } = await renderAs(admin);

    await user.click(within(card(/golf/i)).getByRole('button', { name: /restock volkswagen golf/i }));
    await user.type(within(dialog()).getByLabelText(/units to add/i), '5');
    await user.click(within(dialog()).getByRole('button', { name: /^restock$/i }));

    await waitFor(() => expect(within(card(/golf/i)).getByText(/5 in stock/i)).toBeInTheDocument());
    expect(within(card(/golf/i)).getByRole('button', { name: /^purchase$/i })).toBeEnabled();
    expect(bodies).toEqual([{ amount: 5 }]);
  });

  it('rejects a non-positive or fractional amount', async () => {
    const bodies = capture('post', '/api/vehicles/v-civic/restock', () => HttpResponse.json(civic));
    const { user } = await renderAs(admin);

    await user.click(within(card(/civic/i)).getByRole('button', { name: /restock honda civic/i }));
    await user.type(within(dialog()).getByLabelText(/units to add/i), '0');
    await user.click(within(dialog()).getByRole('button', { name: /^restock$/i }));

    expect(within(dialog()).getByText(/whole number greater than 0/i)).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });
});

describe('Deleting', () => {
  it('asks for confirmation, explains history is kept, then removes the card', async () => {
    const calls = capture('delete', '/api/vehicles/v-civic', () => new HttpResponse(null, { status: 204 }));
    const { user } = await renderAs(admin);

    await user.click(within(card(/civic/i)).getByRole('button', { name: /delete honda civic/i }));
    expect(dialog()).toHaveTextContent(/past orders are kept/i);
    await user.click(within(dialog()).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(screen.queryByRole('article', { name: /civic/i })).not.toBeInTheDocument());
    expect(calls).toHaveLength(1);
  });

  it('does nothing when cancelled', async () => {
    const calls = capture('delete', '/api/vehicles/v-civic', () => new HttpResponse(null, { status: 204 }));
    const { user } = await renderAs(admin);

    await user.click(within(card(/civic/i)).getByRole('button', { name: /delete honda civic/i }));
    await user.click(within(dialog()).getByRole('button', { name: /cancel/i }));

    expect(card(/civic/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });
});

describe('Lost admin rights', () => {
  it('shows the API message when an action is forbidden', async () => {
    capture('delete', '/api/vehicles/v-civic', () => HttpResponse.json({ error: 'Admin access required' }, { status: 403 }));
    const { user } = await renderAs(admin);

    await user.click(within(card(/civic/i)).getByRole('button', { name: /delete honda civic/i }));
    await user.click(within(dialog()).getByRole('button', { name: /^delete$/i }));

    expect(await within(dialog()).findByRole('alert')).toHaveTextContent('Admin access required');
    expect(card(/civic/i)).toBeInTheDocument();
  });
});
