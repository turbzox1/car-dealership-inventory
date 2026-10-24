import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, SESSION_KEY, storeSession } from '../test/renderApp';

const admin = { ...asha, role: 'ADMIN' as const };
const storedUser = () => JSON.parse(localStorage.getItem(SESSION_KEY)!).user;

function mockMe(respond: () => Response) {
  let auth: string | null = null;
  server.use(
    http.get(apiUrl('/api/auth/me'), ({ request }) => {
      auth = request.headers.get('Authorization');
      return respond();
    }),
  );
  return { auth: () => auth };
}

describe('Refreshing the stored user on load', () => {
  it('hides admin features when the account was demoted since sign-in', async () => {
    const me = mockMe(() => HttpResponse.json({ user: asha }));
    storeSession(admin);
    renderApp('/');

    await waitFor(() => expect(screen.queryByRole('link', { name: /all orders/i })).not.toBeInTheDocument());
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(storedUser().role).toBe('USER');
    expect(me.auth()).toBe('Bearer stored-token');
  });

  it('shows admin features when the account was promoted since sign-in', async () => {
    mockMe(() => HttpResponse.json({ user: admin }));
    storeSession(asha);
    renderApp('/');

    expect(await screen.findByRole('link', { name: /all orders/i })).toBeInTheDocument();
    expect(storedUser().role).toBe('ADMIN');
  });

  it('signs out when the session is no longer valid', async () => {
    mockMe(() => HttpResponse.json({ error: 'Account no longer exists' }, { status: 401 }));
    storeSession(asha);
    renderApp('/');

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('keeps the saved session if the check fails for another reason (e.g. offline)', async () => {
    let checked = false;
    server.use(
      http.get(apiUrl('/api/auth/me'), () => {
        checked = true;
        return HttpResponse.error();
      }),
    );
    storeSession(asha);
    renderApp('/');

    await waitFor(() => expect(checked).toBe(true));
    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
    expect(storedUser()).toEqual(asha);
  });

  it('does not call the API when nobody is signed in', async () => {
    let checked = false;
    server.use(
      http.get(apiUrl('/api/auth/me'), () => {
        checked = true;
        return HttpResponse.json({});
      }),
    );
    renderApp('/login');

    await screen.findByRole('heading', { name: /sign in/i });
    expect(checked).toBe(false);
  });
});
