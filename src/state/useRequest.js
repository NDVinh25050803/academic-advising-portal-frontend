import { useCallback, useEffect, useState } from 'react';

// Runs an async API call and tracks loading / error / data. `deps` re-run it.
export function useRequest(fn, deps) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const run = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ loading: false, error: null, data }))
      .catch((error) => alive && setState({ loading: false, error, data: null }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => run(), [run]);
  return { ...state, retry: run };
}
