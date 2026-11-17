import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/utils';

/** Small helper for load-on-mount data with loading/error/retry state. */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    factory()
      .then((result) => setData(result))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, retry: () => setNonce((n) => n + 1), setData };
}
