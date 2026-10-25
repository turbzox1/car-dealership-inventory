import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, SESSION_KEY } from '../test/renderApp';

const admin = { ...asha, id: 'admin-1', name: 'Dana Admin', email: 'admin@dealership.com', role: 'ADMIN' as const };

function mockLoginAs(user: typeof asha | typeof admin) {
  server.use(http.post(apiUrl('/api/auth/login'), () => HttpResponse.json({ token: 'tok', user })));
}

async function signIn(userEvent: ReturnType<typeof renderApp>['user'], email: string) {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/^password$/i), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: /^sign in/i }));
}

describe('Sign in as Customer or Admin', () => {
  it('offers both options, with Customer selected by default', () => {
    renderApp('/login');

    const group = screen.getByRole('radiogroup', { name: /sign in as/i });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /customer/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /admin/i })).not.toBeChecked();
  });

  it('signs an admin in through the Admin option', async () => {
    mockLoginAs(admin);
    const { user } = renderApp('/login');

    await user.click(screen.getByRole('radio', { name: /admin/i }));
    await signIn(user, 'admin@dealership.com');

    expect(await screen.findByRole('link', { name: /all orders/i })).toBeInTheDocument();
  });

  it('refuses the Admin option for a customer account and stays signed out', async () => {
    mockLoginAs(asha);
    const { user } = renderApp('/login');

    await user.click(screen.getByRole('radio', { name: /admin/i }));
    await signIn(user, 'asha@example.com');

    expect(await screen.findByRole('alert')).toHaveTextContent(/doesn't have admin access/i);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('only offers registration to customers', async () => {
    const { user } = renderApp('/login');
    expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /admin/i }));

    expect(screen.queryByRole('link', { name: /create an account/i })).not.toBeInTheDocument();
    expect(screen.getByText(/admin accounts are created by the dealership/i)).toBeInTheDocument();
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
