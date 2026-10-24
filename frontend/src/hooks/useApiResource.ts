import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { useApi, type ApiCall } from '../api/useApi';

export type Resource<T> =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | null }
  | { status: 'ready'; data: T };

/**
 * Loads data once per mount (and on reload()) with the signed-in user's
 * token. Responses that arrive after unmount are ignored.
 */
export function useApiResource<T>(fetcher: (call: ApiCall) => Promise<T>): [Resource<T>, () => void] {
  const call = useApi();
  const [reloadKey, setReloadKey] = useState(0);
  const [resource, setResource] = useState<Resource<T>>({ status: 'loading' });

  useEffect(() => {
    let stale = false;
    fetcher(call).then(
      (data) => !stale && setResource({ status: 'ready', data }),
      (err) => !stale && setResource({ status: 'error', error: err instanceof ApiError ? err : null }),
    );
    return () => {
      stale = true;
    };
  }, [call, fetcher, reloadKey]);

  const reload = useCallback(() => {
    setResource({ status: 'loading' });
    setReloadKey((k) => k + 1);
  }, []);

  return [resource, reload];
}
