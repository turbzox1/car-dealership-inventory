import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { asha, renderApp, SESSION_KEY } from '../test/renderApp';

type Form = { name: string; email: string; password: string; confirm: string };
const valid: Form = { name: 'Asha Rao', email: 'asha@example.com', password: 'secret123', confirm: 'secret123' };

async function fillAndSubmit(user: ReturnType<typeof renderApp>['user'], form: Partial<Form>) {
  if (form.name) await user.type(screen.getByLabelText(/full name/i), form.name);
  if (form.email) await user.type(screen.getByLabelText(/email/i), form.email);
  if (form.password) await user.type(screen.getByLabelText(/^password$/i), form.password);
  if (form.confirm) await user.type(screen.getByLabelText(/confirm password/i), form.confirm);
  await user.click(screen.getByRole('button', { name: /create account/i }));
}

describe('Register page', () => {
  it('creates the account, signs the user in and lands on the dashboard', async () => {
    const requests: unknown[] = [];
    server.use(
      http.post(apiUrl('/api/auth/register'), async ({ request }) => {
        requests.push(await request.json());
        return HttpResponse.json({ user: asha }, { status: 201 });
      }),
      http.post(apiUrl('/api/auth/login'), () => HttpResponse.json({ token: 'tok-new', user: asha })),
    );
    const { user } = renderApp('/register');

    await fillAndSubmit(user, valid);

    expect(await screen.findByRole('heading', { name: /welcome, asha/i })).toBeInTheDocument();
    // The confirmation field is a client-side check only and is not sent
    expect(requests).toEqual([{ name: 'Asha Rao', email: 'asha@example.com', password: 'secret123' }]);
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!).token).toBe('tok-new');
  });

  it.each([
    ['a short password', { ...valid, password: 'short', confirm: 'short' }, /at least 8 characters/i],
    ['mismatched passwords', { ...valid, confirm: 'different1' }, /passwords do not match/i],
    ['an invalid email', { ...valid, email: 'not-an-email' }, /valid email/i],
    ['a missing name', { ...valid, name: '' }, /enter your name/i],
  ])('blocks %s before calling the API', async (_case, form, message) => {
    let called = false;
    server.use(http.post(apiUrl('/api/auth/register'), () => {
      called = true;
      return HttpResponse.json({});
    }));
    const { user } = renderApp('/register');

    await fillAndSubmit(user, form);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('shows the server message when the email is already registered', async () => {
    server.use(
      http.post(apiUrl('/api/auth/register'), () =>
        HttpResponse.json({ error: 'Email is already registered' }, { status: 409 }),
      ),
    );
    const { user } = renderApp('/register');

    await fillAndSubmit(user, valid);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
