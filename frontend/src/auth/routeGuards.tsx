import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/** Where to go after signing in: the page that sent the user to /login, or home. */
export type FromState = { from?: { pathname: string; search?: string } } | null;

/** Wraps pages that need a signed-in user; remembers the requested page for after login. */
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Keeps signed-in users out of the login and register pages. */
export function RedirectIfAuthenticated() {
  const { user } = useAuth();
  const from = (useLocation().state as FromState)?.from;
  if (user) return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;
  return <Outlet />;
}
