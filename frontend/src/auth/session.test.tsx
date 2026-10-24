import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, SESSION_KEY, storeSession } from '../test/renderApp';

describe('Session handling', () => {
  it('sends signed-out visitors of a protected page to the login page', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('returns the user to the page they wanted after signing in', async () => {
    server.use(http.post(apiUrl('/api/auth/login'), () => HttpResponse.json({ token: 't', user: asha })));
    const { user } = renderApp('/');

    await user.type(await screen.findByLabelText(/email/i), 'asha@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
  });

  it('restores a saved session after a page reload', async () => {
    storeSession();

    renderApp('/');

    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
  });

  it('ignores a corrupted saved session', async () => {
    localStorage.setItem(SESSION_KEY, '{not json');

    renderApp('/');

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('redirects a signed-in user away from the login page', async () => {
    storeSession();

    renderApp('/login');

    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
  });

  it('signs out: clears the session and returns to the login page', async () => {
    storeSession();
    const { user } = renderApp('/');

    await user.click(await screen.findByRole('button', { name: /sign out/i }));

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
