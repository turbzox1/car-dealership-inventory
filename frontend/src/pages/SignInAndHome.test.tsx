import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, SESSION_KEY } from '../test/renderApp';

const admin = { ...asha, id: 'admin-1', name: 'Dana Admin', email: 'admin@dealership.com', role: 'ADMIN' as const };

describe('Single sign-in form', () => {
  it('has no customer/admin choice: the account decides', () => {
    renderApp('/login');

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument();
  });

  it('gives an admin account its admin features after a normal sign-in', async () => {
    server.use(http.post(apiUrl('/api/auth/login'), () => HttpResponse.json({ token: 'tok', user: admin })));
    const { user } = renderApp('/login');

    await user.type(screen.getByLabelText(/email/i), 'admin@dealership.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /^sign in/i }));

    expect(await screen.findByRole('link', { name: /all orders/i })).toBeInTheDocument();
  });
});

describe('Main navigation on narrow screens', () => {
  it('wraps its links instead of clipping them in a sideways-scrolling strip', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 't', user: admin }));
    renderApp('/');

    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
    expect(nav).not.toHaveClass('overflow-x-auto');
    expect(nav).toHaveClass('flex-wrap');
  });
});

describe('Home page headline', () => {
  it('explains what the site is before the inventory', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 't', user: asha }));
    renderApp('/');

    expect(await screen.findByRole('heading', { level: 1, name: /find the car that fits your life/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse inventory/i })).toHaveAttribute('href', '#inventory');
  });
});
