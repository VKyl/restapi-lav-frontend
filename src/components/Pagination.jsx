import Icon from './Icon.jsx';

function pageList(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.total_pages <= 1) return null;
  const { current_page: current, total_pages: total } = pagination;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={current <= 1} onClick={() => onChange(current - 1)} aria-label="Previous page">
        <Icon name="chevronLeft" />
      </button>
      {pageList(current, total).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="page-gap">…</span>
        ) : (
          <button
            key={p}
            className={`page-btn ${p === current ? 'is-active' : ''}`}
            aria-current={p === current ? 'page' : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button className="page-btn" disabled={current >= total} onClick={() => onChange(current + 1)} aria-label="Next page">
        <Icon name="chevronRight" />
      </button>
    </nav>
  );
}
