import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, storeSession } from '../test/renderApp';

const civic = { id: 'v-civic', make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24650, quantity: 3 };
const crv = { id: 'v-crv', make: 'Honda', model: 'CR-V', category: 'SUV', price: 32150, quantity: 1 };
const golf = { id: 'v-golf', make: 'Volkswagen', model: 'Golf', category: 'HATCHBACK', price: 23900, quantity: 0 };

const cartKey = (userId = asha.id) => `autovault.cart.${userId}`;
const card = (name: RegExp) => screen.getByRole('article', { name });
// The header's cart link (the footer has a text link to the cart too)
const cartLink = () => within(screen.getByRole('banner')).getByRole('link', { name: /cart/i });

function storeCart(items: { vehicleId: string; quantity: number }[], userId = asha.id) {
  const byId = { [civic.id]: civic, [crv.id]: crv, [golf.id]: golf };
  localStorage.setItem(
    cartKey(userId),
    JSON.stringify(
      items.map(({ vehicleId, quantity }) => {
        const v = byId[vehicleId];
        return { vehicleId, make: v.make, model: v.model, category: v.category, price: v.price, stock: v.quantity, quantity };
      }),
    ),
  );
}

async function openShowroom() {
  server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([civic, crv, golf])));
  storeSession();
  const utils = renderApp('/');
  await screen.findByRole('article', { name: /civic/i });
  return utils;
}

describe('Adding to the cart', () => {
  it('adds a car, updates the header count and keeps the cart after a reload', async () => {
    const { user, unmount } = await openShowroom();

    await user.click(within(card(/civic/i)).getByRole('button', { name: /add to cart/i }));
    await user.click(within(card(/civic/i)).getByRole('button', { name: /add to cart/i }));

    expect(cartLink()).toHaveAccessibleName(/cart, 2 items/i);
    expect(screen.getByRole('status', { name: /notification/i })).toHaveTextContent(/added honda civic to your cart/i);

    unmount();
    renderApp('/');
    expect(await within(await screen.findByRole('banner')).findByRole('link', { name: /cart, 2 items/i })).toBeInTheDocument();
  });

  it('never puts more in the cart than is in stock', async () => {
    const { user } = await openShowroom();

    await user.click(within(card(/cr-v/i)).getByRole('button', { name: /add to cart/i }));

    expect(within(card(/cr-v/i)).getByRole('button', { name: /all in cart/i })).toBeDisabled();
    expect(within(card(/golf/i)).getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });

  it('keeps carts separate per account', async () => {
    storeCart([{ vehicleId: civic.id, quantity: 2 }], 'someone-else');

    await openShowroom();

    expect(cartLink()).toHaveAccessibleName(/cart, empty/i);
  });
});

describe('Cart page', () => {
  it('lists items with line totals and a subtotal, and adjusts quantities within stock', async () => {
    storeCart([{ vehicleId: civic.id, quantity: 1 }, { vehicleId: crv.id, quantity: 1 }]);
    storeSession();
    const { user } = renderApp('/cart');

    expect(await screen.findByRole('heading', { name: /your cart/i })).toBeInTheDocument();
    const civicLine = screen.getByRole('listitem', { name: /honda civic/i });
    expect(screen.getByText(/subtotal/i).closest('div')).toHaveTextContent('$56,800');

    await user.click(within(civicLine).getByRole('button', { name: /increase quantity/i }));
    await user.click(within(civicLine).getByRole('button', { name: /increase quantity/i }));
    expect(within(civicLine).getByText('3')).toBeInTheDocument();
    expect(within(civicLine).getByRole('button', { name: /increase quantity/i })).toBeDisabled(); // stock is 3
    expect(screen.getByText(/subtotal/i).closest('div')).toHaveTextContent('$106,100');

    await user.click(within(screen.getByRole('listitem', { name: /honda cr-v/i })).getByRole('button', { name: /remove/i }));
    expect(screen.queryByRole('listitem', { name: /cr-v/i })).not.toBeInTheDocument();
    expect(cartLink()).toHaveAccessibleName(/cart, 3 items/i);
  });

  it('confirms the order: sends every line, shows the order and empties the cart', async () => {
    let sent: unknown;
    let auth: string | null = null;
    server.use(
      http.post(apiUrl('/api/orders'), async ({ request }) => {
        sent = await request.json();
        auth = request.headers.get('Authorization');
        await delay(30);
        return HttpResponse.json(
          {
            order: { id: 'a1b2c3d4-0000-0000-0000-000000000000', total: 81450, createdAt: '2026-10-24T12:00:00.000Z', items: [] },
            vehicles: [],
          },
          { status: 201 },
        );
      }),
    );
    storeCart([{ vehicleId: civic.id, quantity: 2 }, { vehicleId: crv.id, quantity: 1 }]);
    storeSession();
    const { user } = renderApp('/cart');

    await user.click(await screen.findByRole('button', { name: /confirm order/i }));
    expect(screen.getByRole('button', { name: /placing order/i })).toBeDisabled();

    expect(await screen.findByRole('heading', { name: /order confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(/#A1B2C3D4/)).toBeInTheDocument();
    expect(screen.getByText('$81,450')).toBeInTheDocument();
    expect(sent).toEqual({ items: [{ vehicleId: civic.id, quantity: 2 }, { vehicleId: crv.id, quantity: 1 }] });
    expect(auth).toBe('Bearer stored-token');
    expect(cartLink()).toHaveAccessibleName(/cart, empty/i);
    expect(localStorage.getItem(cartKey())).toBe('[]');
    expect(screen.getByRole('link', { name: /view my orders/i })).toHaveAttribute('href', '/orders');
  });

  it('keeps the cart and explains when stock ran out before checkout', async () => {
    server.use(
      http.post(apiUrl('/api/orders'), () =>
        HttpResponse.json({ error: 'Not enough stock for Honda Civic (1 left)' }, { status: 409 }),
      ),
    );
    storeCart([{ vehicleId: civic.id, quantity: 2 }]);
    storeSession();
    const { user } = renderApp('/cart');

    await user.click(await screen.findByRole('button', { name: /confirm order/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Not enough stock for Honda Civic (1 left)');
    await waitFor(() => expect(screen.getByRole('listitem', { name: /honda civic/i })).toBeInTheDocument());
    expect(cartLink()).toHaveAccessibleName(/cart, 2 items/i);
  });

  it('shows an empty state that links back to the showroom', async () => {
    storeSession();
    const { user } = renderApp('/cart');

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /browse the showroom/i }));

    expect(await screen.findByRole('heading', { name: /welcome/i })).toBeInTheDocument();
  });
});
