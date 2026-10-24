import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiUrl, server } from '../test/server';
import { ApiError, apiRequest } from './client';

describe('apiRequest', () => {
  it('returns the parsed JSON body', async () => {
    server.use(http.get(apiUrl('/api/health'), () => HttpResponse.json({ status: 'ok' })));

    await expect(apiRequest('/api/health')).resolves.toEqual({ status: 'ok' });
  });

  it('sends a JSON body and the Bearer token when given', async () => {
    let seen: { auth: string | null; type: string | null; body: unknown } | undefined;
    server.use(
      http.post(apiUrl('/api/things'), async ({ request }) => {
        seen = {
          auth: request.headers.get('Authorization'),
          type: request.headers.get('Content-Type'),
          body: await request.json(),
        };
        return HttpResponse.json({ ok: true }, { status: 201 });
      }),
    );

    await apiRequest('/api/things', { method: 'POST', body: { a: 1 }, token: 'tok-123' });

    expect(seen).toEqual({ auth: 'Bearer tok-123', type: 'application/json', body: { a: 1 } });
  });

  it("throws ApiError with the server's status and message", async () => {
    server.use(
      http.post(apiUrl('/api/auth/login'), () =>
        HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 }),
      ),
    );

    const error = await apiRequest('/api/auth/login', { method: 'POST', body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: 'Invalid email or password' });
  });

  it('handles 204 No Content', async () => {
    server.use(http.delete(apiUrl('/api/vehicles/1'), () => new HttpResponse(null, { status: 204 })));

    await expect(apiRequest('/api/vehicles/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('turns a network failure into a friendly ApiError with status 0', async () => {
    server.use(http.get(apiUrl('/api/health'), () => HttpResponse.error()));

    const error = (await apiRequest('/api/health').catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/can't reach the server/i);
  });

  it('falls back to a generic message when an error response has no JSON body', async () => {
    server.use(http.get(apiUrl('/api/health'), () => new HttpResponse('Bad gateway', { status: 502 })));

    const error = (await apiRequest('/api/health').catch((e: unknown) => e)) as ApiError;

    expect(error).toMatchObject({ status: 502, message: expect.stringMatching(/something went wrong/i) });
  });
});
