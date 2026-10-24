import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, storeSession } from '../test/renderApp';

const admin = { ...asha, id: 'admin-1', name: 'Dana Admin', email: 'admin@dealership.com', role: 'ADMIN' as const };

// Midday UTC so the calendar date is the same in any test machine's timezone
const civicOrder = {
  id: 'p-1', userId: 'u-1', vehicleId: 'v-civic', make: 'Honda', model: 'Civic',
  quantity: 2, unitPrice: 24650, totalPrice: 49300, purchasedAt: '2026-10-20T12:00:00.000Z',
};
const crvOrder = {
  id: 'p-2', userId: 'u-1', vehicleId: 'v-crv', make: 'Honda', model: 'CR-V',
  quantity: 1, unitPrice: 32150, totalPrice: 32150, purchasedAt: '2026-10-22T12:00:00.000Z',
};
const bobOrder = {
  id: 'p-3', userId: 'u-2', vehicleId: 'v-golf', make: 'Volkswagen', model: 'Golf',
  quantity: 1, unitPrice: 23900, totalPrice: 23900, purchasedAt: '2026-10-23T12:00:00.000Z',
  customer: { name: 'Bob Stone', email: 'bob@example.com' },
};

const row = (name: RegExp) => screen.getByRole('row', { name });

describe('My orders', () => {
  it("lists the user's purchases with quantities, prices, dates and a total", async () => {
    let auth: string | null = null;
    server.use(
      http.get(apiUrl('/api/purchases/me'), ({ request }) => {
        auth = request.headers.get('Authorization');
        return HttpResponse.json([crvOrder, civicOrder]);
      }),
    );
    storeSession();
    renderApp('/orders');

    expect(await screen.findByRole('heading', { name: /my orders/i })).toBeInTheDocument();
    const civic = await screen.findByRole('row', { name: /honda civic/i });
    expect(within(civic).getByText('2')).toBeInTheDocument();
    expect(within(civic).getByText('$24,650')).toBeInTheDocument();
    expect(within(civic).getByText('$49,300')).toBeInTheDocument();
    expect(within(civic).getByText(/oct 20, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/2 orders · \$81,450 spent/i)).toBeInTheDocument();
    expect(auth).toBe('Bearer stored-token');
  });

  it('points to the showroom when there are no orders yet', async () => {
    server.use(http.get(apiUrl('/api/purchases/me'), () => HttpResponse.json([])));
    storeSession();
    const { user } = renderApp('/orders');

    expect(await screen.findByText(/haven't bought anything yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /browse the showroom/i }));

    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
  });

  it('shows an error with retry when loading fails', async () => {
    let attempts = 0;
    server.use(
      http.get(apiUrl('/api/purchases/me'), () =>
        ++attempts === 1 ? HttpResponse.json({ error: 'boom' }, { status: 500 }) : HttpResponse.json([civicOrder]),
      ),
    );
    storeSession();
    const { user } = renderApp('/orders');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load your orders/i);
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByRole('row', { name: /honda civic/i })).toBeInTheDocument();
  });

  it('is reachable from the header navigation', async () => {
    server.use(http.get(apiUrl('/api/purchases/me'), () => HttpResponse.json([civicOrder])));
    storeSession();
    const { user } = renderApp('/');

    await user.click(await screen.findByRole('link', { name: /my orders/i }));

    expect(await screen.findByRole('heading', { name: /my orders/i })).toBeInTheDocument();
  });
});

describe('All orders (admin)', () => {
  it('shows every purchase with the customer, plus revenue and units sold', async () => {
    const ashaWithCustomer = { ...civicOrder, customer: { name: 'Asha Rao', email: 'asha@example.com' } };
    server.use(http.get(apiUrl('/api/purchases'), () => HttpResponse.json([bobOrder, ashaWithCustomer])));
    storeSession(admin);
    renderApp('/admin/orders');

    expect(await screen.findByRole('heading', { name: /all orders/i })).toBeInTheDocument();
    const bob = await screen.findByRole('row', { name: /volkswagen golf/i });
    expect(within(bob).getByText('Bob Stone')).toBeInTheDocument();
    expect(within(bob).getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText(/\$73,200/)).toBeInTheDocument(); // revenue 23,900 + 49,300
    expect(screen.getByText(/3 units sold/i)).toBeInTheDocument();
  });

  it('filters by customer or vehicle as the admin types', async () => {
    const ashaWithCustomer = { ...civicOrder, customer: { name: 'Asha Rao', email: 'asha@example.com' } };
    server.use(http.get(apiUrl('/api/purchases'), () => HttpResponse.json([bobOrder, ashaWithCustomer])));
    storeSession(admin);
    const { user } = renderApp('/admin/orders');
    await screen.findByRole('row', { name: /volkswagen golf/i });

    await user.type(screen.getByRole('searchbox', { name: /search orders/i }), 'bob@');

    expect(row(/volkswagen golf/i)).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /honda civic/i })).not.toBeInTheDocument();
  });

  it('is linked in the header for admins only', async () => {
    storeSession(admin);
    renderApp('/');
    expect(await screen.findByRole('link', { name: /all orders/i })).toBeInTheDocument();
  });

  it('sends regular users back to the showroom and hides the link', async () => {
    storeSession();
    renderApp('/admin/orders');

    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /all orders/i })).not.toBeInTheDocument();
  });

  it('shows the API message if admin rights were removed', async () => {
    server.use(http.get(apiUrl('/api/purchases'), () => HttpResponse.json({ error: 'Admin access required' }, { status: 403 })));
    storeSession(admin);
    renderApp('/admin/orders');

    expect(await screen.findByRole('alert')).toHaveTextContent('Admin access required');
  });
});
