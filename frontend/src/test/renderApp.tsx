import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { AuthProvider } from '../auth/AuthContext';

/** Renders the whole app at a given URL, the way a user would land on it. */
export function renderApp(path = '/') {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
  return { user, ...utils };
}

export const SESSION_KEY = 'autovault.session';

export const asha = {
  id: 'u-1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  role: 'USER' as const,
  createdAt: '2026-10-24T10:00:00.000Z',
};

/** Pretends the user logged in earlier in this browser. */
export function storeSession(user = asha, token = 'stored-token') {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
}
