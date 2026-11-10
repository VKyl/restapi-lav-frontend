import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { friendlyMessage } from '../utils/errors.js';

export function Loader({ label = 'Loading', inline = false }) {
  return (
    <div className={`loader ${inline ? 'loader-inline' : ''}`} role="status" aria-live="polite">
      <span className="eq" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </span>
      <span className="loader-label">{label}…</span>
    </div>
  );
}

export function EmptyState({ icon = 'music', title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went off-key' }) {
  return (
    <div className="empty empty-error">
      <div className="empty-icon">
        <Icon name="alert" size={28} />
      </div>
      <h3>{error?.status === 404 ? 'Not found' : title}</h3>
      <p>{friendlyMessage(error)}</p>
      {onRetry && (
        <div className="empty-action">
          <button className="btn btn-ghost" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// Shown when a signed-in user opens something only someone else may change.
export function NotAllowed({ children, backTo, backLabel }) {
  return (
    <EmptyState
      icon="alert"
      title="You can’t edit this"
      action={
        <Link to={backTo} className="btn btn-ghost">
          {backLabel}
        </Link>
      }
    >
      {children}
    </EmptyState>
  );
}

export function FormError({ error }) {
  if (!error) return null;
  return (
    <div className="form-error" role="alert">
      <Icon name="alert" size={18} />
      <span>{error.status >= 500 || [0, 401, 403].includes(error.status) ? friendlyMessage(error) : error.message}</span>
    </div>
  );
}
