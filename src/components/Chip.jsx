import { Link } from 'react-router-dom';
import { hueFor } from '../utils/format.js';

export default function Chip({ children, to, size = 'md', onRemove }) {
  const style = { '--h': hueFor(String(children)) };
  const cls = `chip chip-${size}`;
  if (to) {
    return (
      <Link to={to} className={`${cls} chip-link`} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <span className={cls} style={style}>
      {children}
      {onRemove && (
        <button type="button" className="chip-x" onClick={onRemove} aria-label={`Remove ${children}`}>
          ×
        </button>
      )}
    </span>
  );
}
