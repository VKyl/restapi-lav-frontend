import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// Filters and page number live in the URL so results are shareable and
// survive back/forward navigation. `set` is stable and skips navigation
// when the value hasn't changed, so it is safe to call from effects.
export function useSearchState() {
  const [params, setParams] = useSearchParams();
  const ref = useRef({ params, setParams });
  ref.current = { params, setParams };

  const get = (key) => params.get(key) || '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const set = useCallback((key, value) => {
    const { params: current, setParams: update } = ref.current;
    if ((current.get(key) || '') === (value || '')) return;
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    update(next, { replace: key !== 'page' });
  }, []);

  const setPage = useCallback(
    (p) => {
      set('page', p > 1 ? String(p) : '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [set],
  );

  return { get, set, page, setPage };
}
