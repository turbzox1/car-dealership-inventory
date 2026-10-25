import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { renderApp, storeSession } from '../test/renderApp';

const photo = (n: number) => ({
  url: `https://thumb.wikimedia.org/rav4-${n}-1280.jpg`,
  thumbUrl: `https://thumb.wikimedia.org/rav4-${n}-500.jpg`,
  title: `Toyota RAV4 photo ${n}`,
  author: `Photographer ${n}`,
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  sourceUrl: `https://commons.wikimedia.org/wiki/File:RAV4_${n}.jpg`,
});

const rav4 = {
  id: 'v-rav4', make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31275, quantity: 6,
  year: 2025, fuelType: 'Hybrid', transmission: 'Automatic', seats: 5,
  description: 'The best-selling SUV in America.',
  images: [photo(1), photo(2), photo(3)],
};

function mockVehicle(vehicle: object = rav4) {
  server.use(
    http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([vehicle])),
    http.get(apiUrl('/api/vehicles/:id'), ({ params }) =>
      params.id === (vehicle as { id: string }).id
        ? HttpResponse.json(vehicle)
        : HttpResponse.json({ error: 'Vehicle not found' }, { status: 404 }),
    ),
  );
}

describe('Vehicle detail page', () => {
  it('opens from the showroom card', async () => {
    mockVehicle();
    storeSession();
    const { user } = renderApp('/');

    const card = await screen.findByRole('article', { name: /toyota rav4/i });
    await user.click(within(card).getByRole('link', { name: /toyota rav4/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /toyota rav4/i })).toBeInTheDocument();
  });

  it('shows price, stock, basic details and the description', async () => {
    mockVehicle();
    storeSession();
    renderApp('/vehicles/v-rav4');

    expect(await screen.findByRole('heading', { level: 1, name: /toyota rav4/i })).toBeInTheDocument();
    expect(screen.getByText('$31,275')).toBeInTheDocument();
    expect(screen.getByText(/6 in stock/i)).toBeInTheDocument();
    const specs = screen.getByRole('list', { name: /details/i });
    for (const value of ['2025', 'Hybrid', 'Automatic', '5 seats', 'SUV']) {
      expect(within(specs).getByText(value)).toBeInTheDocument();
    }
    expect(screen.getByText('The best-selling SUV in America.')).toBeInTheDocument();
  });

  it('shows a photo gallery with credits, and switches photos from the thumbnails', async () => {
    mockVehicle();
    storeSession();
    const { user } = renderApp('/vehicles/v-rav4');

    const main = await screen.findByRole('img', { name: 'Toyota RAV4 photo 1' });
    expect(main).toHaveAttribute('src', photo(1).url);
    const credit = screen.getByRole('link', { name: /photographer 1/i });
    expect(credit).toHaveAttribute('href', photo(1).sourceUrl);
    expect(screen.getByText(/CC BY-SA 4.0/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show photo 2/i }));

    expect(screen.getByRole('img', { name: 'Toyota RAV4 photo 2' })).toHaveAttribute('src', photo(2).url);
    expect(screen.getByRole('link', { name: /photographer 2/i })).toBeInTheDocument();
  });

  it('can add the car to the cart', async () => {
    mockVehicle();
    storeSession();
    const { user } = renderApp('/vehicles/v-rav4');

    await user.click(await screen.findByRole('button', { name: /add to cart/i }));

    expect(screen.getByRole('link', { name: /cart, 1 item/i })).toBeInTheDocument();
  });

  it('falls back to the illustration when a car has no photos', async () => {
    mockVehicle({ ...rav4, images: [], description: null, year: null });
    storeSession();
    renderApp('/vehicles/v-rav4');

    await screen.findByRole('heading', { level: 1, name: /toyota rav4/i });
    expect(screen.queryByRole('img', { name: /toyota rav4/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show photo/i })).not.toBeInTheDocument();
  });

  it('explains when the vehicle does not exist and links back', async () => {
    mockVehicle();
    storeSession();
    const { user } = renderApp('/vehicles/nope');

    expect(await screen.findByText(/vehicle not found/i)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /back to inventory/i }));

    expect(await screen.findByRole('heading', { name: /welcome/i })).toBeInTheDocument();
  });
});
