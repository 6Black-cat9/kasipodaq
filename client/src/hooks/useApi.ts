import { useCallback, useEffect, useState } from 'react';
import { errorMessage, getData } from '../api/client';
export function useApi<T>(url: string | null, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(Boolean(url)),
    [error, setError] = useState(''),
    [version, setVersion] = useState(0);
  const paramsKey = JSON.stringify(params || {});
  useEffect(() => {
    let active = true;
    if (!url) {
      setData(null);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    getData<T>(url, JSON.parse(paramsKey))
      .then((value) => {
        if (active) setData(value);
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [url, paramsKey, version]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { data, loading, error, reload };
}
