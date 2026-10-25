import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, storeSession } from '../test/renderApp';

const admin = { ...asha, id: 'admin-1', name: 'Dana Admin', email: 'admin@dealership.com', role: 'ADMIN' as const };

const line = (vehicleId: string, make: string, model: string, quantity: number, unitPrice: number) => ({
  vehicleId, make, model, quantity, unitPrice, totalPrice: quantity * unitPrice,
});

// Midday UTC so the calendar date is the same in any test machine's timezone
const cartOrder = {
  id: 'aaaa1111-0000-0000-0000-000000000000', userId: 'u-1', createdAt: '2026-10-22T12:00:00.000Z',
  items: [line('v-civic', 'Honda', 'Civic', 2, 24650), line('v-crv', 'Honda', 'CR-V', 1, 32150)],
  total: 81450,
};
const singleOrder = {
  id: 'bbbb2222-0000-0000-0000-000000000000', userId: 'u-1', createdAt: '2026-10-20T12:00:00.000Z',
  items: [line('v-golf', 'Volkswagen', 'Golf', 1, 23900)],
  total: 23900,
};
const bobOrder = {
  ...singleOrder, id: 'cccc3333-0000-0000-0000-000000000000', userId: 'u-2',
  customer: { name: 'Bob Stone', email: 'bob@example.com' },
};

const order = (number: string) => screen.getByRole('article', { name: new RegExp(`order #${number}`, 'i') });

describe('My orders', () => {
  it('groups each order with its lines, date and total', async () => {
    let auth: string | null = null;
    server.use(
      http.get(apiUrl('/api/orders/me'), ({ request }) => {
        auth = request.headers.get('Authorization');
        return HttpResponse.json([cartOrder, singleOrder]);
      }),
    );
    storeSession();
    renderApp('/orders');

    expect(await screen.findByRole('heading', { name: /my orders/i })).toBeInTheDocument();
    const cart = await screen.findByRole('article', { name: /order #AAAA1111/i });
    expect(within(cart).getByText(/oct 22, 2026/i)).toBeInTheDocument();
    expect(within(cart).getByText(/2 vehicles/i)).toBeInTheDocument();
    expect(within(cart).getByText('$81,450')).toBeInTheDocument();
    const civicRow = within(cart).getByRole('row', { name: /honda civic/i });
    expect(within(civicRow).getByText('2')).toBeInTheDocument();
    expect(within(civicRow).getByText('$49,300')).toBeInTheDocument();
    expect(within(order('BBBB2222')).getByRole('row', { name: /volkswagen golf/i })).toBeInTheDocument();
    expect(screen.getByText(/2 orders · \$105,350 spent/i)).toBeInTheDocument();
    expect(auth).toBe('Bearer stored-token');
  });

  it('points to the showroom when there are no orders yet', async () => {
    server.use(http.get(apiUrl('/api/orders/me'), () => HttpResponse.json([])));
    storeSession();
    const { user } = renderApp('/orders');

    expect(await screen.findByText(/haven't bought anything yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /browse the showroom/i }));

    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
  });

  it('shows an error with retry when loading fails', async () => {
    let attempts = 0;
    server.use(
      http.get(apiUrl('/api/orders/me'), () =>
        ++attempts === 1 ? HttpResponse.json({ error: 'boom' }, { status: 500 }) : HttpResponse.json([singleOrder]),
      ),
    );
    storeSession();
    const { user } = renderApp('/orders');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load your orders/i);
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByRole('article', { name: /order #BBBB2222/i })).toBeInTheDocument();
  });

  it('is reachable from the header navigation', async () => {
    server.use(http.get(apiUrl('/api/orders/me'), () => HttpResponse.json([singleOrder])));
    storeSession();
    const { user } = renderApp('/');

    await user.click(await screen.findByRole('link', { name: /my orders/i }));

    expect(await screen.findByRole('heading', { name: /my orders/i })).toBeInTheDocument();
  });
});

describe('All orders (admin)', () => {
  const ashaCart = { ...cartOrder, customer: { name: 'Asha Rao', email: 'asha@example.com' } };

  it('shows every order with its customer, plus revenue and units sold', async () => {
    server.use(http.get(apiUrl('/api/orders'), () => HttpResponse.json([ashaCart, bobOrder])));
    storeSession(admin);
    renderApp('/admin/orders');

    expect(await screen.findByRole('heading', { name: /all orders/i })).toBeInTheDocument();
    const bob = await screen.findByRole('article', { name: /order #CCCC3333/i });
    expect(within(bob).getByText('Bob Stone')).toBeInTheDocument();
    expect(within(bob).getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('$105,350')).toBeInTheDocument(); // revenue 81,450 + 23,900
    expect(screen.getByText(/4 units sold/i)).toBeInTheDocument();
  });

  it('filters orders by customer or vehicle as the admin types', async () => {
    server.use(http.get(apiUrl('/api/orders'), () => HttpResponse.json([ashaCart, bobOrder])));
    storeSession(admin);
    const { user } = renderApp('/admin/orders');
    await screen.findByRole('article', { name: /order #CCCC3333/i });

    await user.type(screen.getByRole('searchbox', { name: /search orders/i }), 'cr-v');

    expect(order('AAAA1111')).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: /order #CCCC3333/i })).not.toBeInTheDocument();
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
    server.use(http.get(apiUrl('/api/orders'), () => HttpResponse.json({ error: 'Admin access required' }, { status: 403 })));
    storeSession(admin);
    renderApp('/admin/orders');

    expect(await screen.findByRole('alert')).toHaveTextContent('Admin access required');
  });
});
