import { screen, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, SESSION_KEY } from '../test/renderApp';

function mockLogin(response: () => Response | Promise<Response>) {
  let calls = 0;
  server.use(
    http.post(apiUrl('/api/auth/login'), () => {
      calls++;
      return response();
    }),
  );
  return { calls: () => calls };
}

async function fillAndSubmit(user: ReturnType<typeof renderApp>['user'], email: string, password: string) {
  if (email) await user.type(screen.getByLabelText(/email/i), email);
  if (password) await user.type(screen.getByLabelText(/^password$/i), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('Login page', () => {
  it('signs in, stores the session and lands on the dashboard', async () => {
    mockLogin(() => HttpResponse.json({ token: 'tok-1', user: asha }));
    const { user } = renderApp('/login');

    await fillAndSubmit(user, 'asha@example.com', 'secret123');

    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!)).toEqual({ token: 'tok-1', user: asha });
  });

  it('validates required fields without calling the API', async () => {
    const api = mockLogin(() => HttpResponse.json({}));
    const { user } = renderApp('/login');

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
    expect(api.calls()).toBe(0);
  });

  it('shows the server message for wrong credentials and stays on the page', async () => {
    mockLogin(() => HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 }));
    const { user } = renderApp('/login');

    await fillAndSubmit(user, 'asha@example.com', 'wrong-pass');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('explains when too many attempts were made', async () => {
    mockLogin(() => HttpResponse.json({ error: 'Too many attempts, please try again later' }, { status: 429 }));
    const { user } = renderApp('/login');

    await fillAndSubmit(user, 'asha@example.com', 'secret123');

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many attempts/i);
  });

  it('disables the button while signing in to prevent double submits', async () => {
    mockLogin(async () => {
      await delay(100);
      return HttpResponse.json({ token: 'tok-1', user: asha });
    });
    const { user } = renderApp('/login');

    await fillAndSubmit(user, 'asha@example.com', 'secret123');

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    await screen.findByRole('heading', { name: /welcome/i });
  });

  it('links to registration', async () => {
    const { user } = renderApp('/login');

    await user.click(screen.getByRole('link', { name: /create an account/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument());
  });
});
