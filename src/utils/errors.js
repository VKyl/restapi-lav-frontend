// Helpers for mapping API/validation errors onto form inputs.
// The backend reports one problem at a time with a `field` path such as
// `body[2].title` or `genres[0]`.

// `prefix: true` also matches item paths, so `genres` catches `genres[3]`.
export function errorFor(error, path, { prefix = false } = {}) {
  if (!error?.field) return null;
  if (error.field === path) return error.message;
  if (prefix && error.field.startsWith(`${path}[`)) return error.message;
  return null;
}

export function focusField(field) {
  if (!field) return;
  const target = field.replace(/\[\d+\]$/, '');
  const el =
    document.querySelector(`[data-field="${CSS.escape(field)}"]`) ||
    document.querySelector(`[data-field="${CSS.escape(target)}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
  }
}

export function friendlyMessage(error) {
  if (!error) return '';
  if (error.status === 0) return error.message;
  if (error.status === 404) return 'We couldn’t find what you were looking for.';
  if (error.status >= 500) return 'The server hit a wrong note. Please try again in a moment.';
  return error.message || 'Something went wrong.';
}
