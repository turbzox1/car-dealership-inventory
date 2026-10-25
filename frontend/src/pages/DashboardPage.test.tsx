import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { renderApp, SESSION_KEY, storeSession } from '../test/renderApp';

const civic = { id: 'v-civic', make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24650, quantity: 3 };
const crv = { id: 'v-crv', make: 'Honda', model: 'CR-V', category: 'SUV', price: 32150, quantity: 1 };
const golf = { id: 'v-golf', make: 'Volkswagen', model: 'Golf', category: 'HATCHBACK', price: 23900, quantity: 0 };
const catalogue = [civic, crv, golf];

/** Serves the list and search endpoints and records every query string sent to search. */
function mockCatalogue(vehicles = catalogue) {
  const searches: URLSearchParams[] = [];
  let listAuth: string | null = null;
  server.use(
    http.get(apiUrl('/api/vehicles'), ({ request }) => {
      listAuth = request.headers.get('Authorization');
      return HttpResponse.json(vehicles);
    }),
    http.get(apiUrl('/api/vehicles/search'), ({ request }) => {
      const params = new URL(request.url).searchParams;
      searches.push(params);
      const make = params.get('make')?.toLowerCase();
      const category = params.get('category');
      return HttpResponse.json(
        vehicles.filter((v) => (!make || v.make.toLowerCase().includes(make)) && (!category || v.category === category)),
      );
    }),
  );
  return { searches, listAuth: () => listAuth };
}

const card = (model: string) => screen.getByRole('article', { name: new RegExp(model, 'i') });

async function renderDashboard() {
  storeSession();
  const utils = renderApp('/');
  await screen.findByRole('article', { name: /civic/i });
  return utils;
}

describe('Dashboard: vehicle list', () => {
  it('shows every vehicle with category, price and stock, using the session token', async () => {
    const api = mockCatalogue();
    await renderDashboard();

    const civicCard = card('civic');
    expect(within(civicCard).getByText('Honda')).toBeInTheDocument();
    expect(within(civicCard).getByText('Sedan')).toBeInTheDocument();
    expect(within(civicCard).getByText('$24,650')).toBeInTheDocument();
    expect(within(civicCard).getByText(/3 in stock/i)).toBeInTheDocument();
    expect(within(card('cr-v')).getByText(/only 1 left/i)).toBeInTheDocument();
    expect(within(card('golf')).getByText(/out of stock/i)).toBeInTheDocument();
    expect(api.listAuth()).toBe('Bearer stored-token');
  });

  it('shows a loading state first', async () => {
    server.use(
      http.get(apiUrl('/api/vehicles'), async () => {
        await delay(50);
        return HttpResponse.json(catalogue);
      }),
    );
    storeSession();
    renderApp('/');

    expect(screen.getByRole('status', { name: /loading vehicles/i })).toBeInTheDocument();
    await screen.findByRole('article', { name: /civic/i });
  });

  it('shows an error with a retry button when loading fails', async () => {
    let attempts = 0;
    server.use(
      http.get(apiUrl('/api/vehicles'), () => {
        attempts++;
        return attempts === 1
          ? HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
          : HttpResponse.json(catalogue);
      }),
    );
    storeSession();
    const { user } = renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load vehicles/i);
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByRole('article', { name: /civic/i })).toBeInTheDocument();
  });

  it('shows an empty state when the showroom has no vehicles', async () => {
    mockCatalogue([]);
    storeSession();
    renderApp('/');

    expect(await screen.findByText(/no vehicles yet/i)).toBeInTheDocument();
  });

  it('signs the user out when the session has expired', async () => {
    server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json({ error: 'Invalid or expired token' }, { status: 401 })));
    storeSession();
    renderApp('/');

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

describe('Dashboard: purchasing', () => {
  it('disables Purchase only for out-of-stock vehicles', async () => {
    mockCatalogue();
    await renderDashboard();

    expect(within(card('golf')).getByRole('button', { name: /purchase/i })).toBeDisabled();
    expect(within(card('civic')).getByRole('button', { name: /purchase/i })).toBeEnabled();
  });

  it('buys one unit, updates the stock shown and confirms the purchase', async () => {
    mockCatalogue();
    let purchaseAuth: string | null = null;
    server.use(
      http.post(apiUrl('/api/vehicles/v-crv/purchase'), ({ request }) => {
        purchaseAuth = request.headers.get('Authorization');
        return HttpResponse.json(
          { purchase: { id: 'p-1', quantity: 1, totalPrice: 32150 }, vehicle: { ...crv, quantity: 0 } },
          { status: 201 },
        );
      }),
    );
    const { user } = await renderDashboard();

    await user.click(within(card('cr-v')).getByRole('button', { name: /purchase/i }));

    expect(await screen.findByRole('status', { name: /notification/i })).toHaveTextContent(/you bought a honda cr-v/i);
    expect(within(card('cr-v')).getByText(/out of stock/i)).toBeInTheDocument();
    expect(within(card('cr-v')).getByRole('button', { name: /purchase/i })).toBeDisabled();
    expect(purchaseAuth).toBe('Bearer stored-token');
  });

  it('prevents a double purchase while the request is in flight', async () => {
    mockCatalogue();
    let calls = 0;
    // The response is held until the test releases it, so the "in flight" window
    // doesn't depend on how fast the machine is
    let release!: () => void;
    const responded = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post(apiUrl('/api/vehicles/v-civic/purchase'), async () => {
        calls++;
        await responded;
        return HttpResponse.json({ purchase: { id: 'p' }, vehicle: { ...civic, quantity: 2 } }, { status: 201 });
      }),
    );
    const { user } = await renderDashboard();
    const button = within(card('civic')).getByRole('button', { name: /purchase/i });

    await user.click(button);
    await user.click(button);

    expect(within(card('civic')).getByRole('button', { name: /buying/i })).toBeDisabled();
    release();
    await within(card('civic')).findByText(/2 in stock/i);
    expect(calls).toBe(1);
  });

  it('explains a sold-out conflict and refreshes the stock', async () => {
    let listCalls = 0;
    server.use(
      http.get(apiUrl('/api/vehicles'), () => {
        listCalls++;
        // Someone else bought the last CR-V between loading the page and clicking
        return HttpResponse.json(listCalls === 1 ? catalogue : [civic, { ...crv, quantity: 0 }, golf]);
      }),
      http.post(apiUrl('/api/vehicles/v-crv/purchase'), () =>
        HttpResponse.json({ error: 'Not enough stock for this purchase' }, { status: 409 }),
      ),
    );
    const { user } = await renderDashboard();

    await user.click(within(card('cr-v')).getByRole('button', { name: /purchase/i }));

    expect(await screen.findByRole('status', { name: /notification/i })).toHaveTextContent(/not enough stock/i);
    await waitFor(() => expect(within(card('cr-v')).getByRole('button', { name: /purchase/i })).toBeDisabled());
  });
});

describe('Dashboard: search and filters', () => {
  it('searches by make as the user types', async () => {
    const api = mockCatalogue();
    const { user } = await renderDashboard();

    await user.type(screen.getByLabelText(/make/i), 'volks');

    await waitFor(() => expect(screen.queryByRole('article', { name: /civic/i })).not.toBeInTheDocument());
    expect(card('golf')).toBeInTheDocument();
    expect(api.searches.at(-1)?.get('make')).toBe('volks');
  });

  it('filters by category', async () => {
    const api = mockCatalogue();
    const { user } = await renderDashboard();

    await user.selectOptions(screen.getByLabelText(/category/i), 'SUV');

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    expect(card('cr-v')).toBeInTheDocument();
    expect(api.searches.at(-1)?.get('category')).toBe('SUV');
  });

  it('sends a price range', async () => {
    const api = mockCatalogue();
    const { user } = await renderDashboard();

    await user.type(screen.getByLabelText(/min price/i), '20000');
    await user.type(screen.getByLabelText(/max price/i), '30000');

    await waitFor(() => {
      const last = api.searches.at(-1);
      expect(last?.get('minPrice')).toBe('20000');
      expect(last?.get('maxPrice')).toBe('30000');
    });
  });

  it('flags a minimum above the maximum without searching', async () => {
    const api = mockCatalogue();
    const { user } = await renderDashboard();

    await user.type(screen.getByLabelText(/min price/i), '50000');
    await user.type(screen.getByLabelText(/max price/i), '1000');

    expect(await screen.findByText(/min price can't be above max price/i)).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 400));
    expect(api.searches.some((p) => p.get('minPrice') === '50000' && p.get('maxPrice') === '1000')).toBe(false);
  });

  it('shows a no-results message and clears filters back to the full list', async () => {
    mockCatalogue();
    const { user } = await renderDashboard();

    await user.type(screen.getByLabelText(/make/i), 'ferrari');
    expect(await screen.findByText(/no vehicles match/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3));
    expect(screen.getByLabelText(/make/i)).toHaveValue('');
  });
});
