import { useState } from 'react';
import Chip from './Chip.jsx';

// Chip-style list input. Enter or comma adds a tag, Backspace on an empty
// input removes the last one. Duplicates are ignored (case-insensitive).
// With `options`, only values from that list can be added: typing filters
// the list and Enter adds the best match.
export default function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  max = 10,
  maxLength = 50,
  suggestions = [],
  options,
  field,
  invalid = false,
}) {
  const [draft, setDraft] = useState('');
  const full = value.length >= max;
  const restricted = Array.isArray(options);
  const has = (list, s) => list.some((v) => v.toLowerCase() === s.toLowerCase());

  // Restricted mode: the option matching the draft, exact match first.
  function resolve(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return null;
    const pool = options.filter((o) => !has(value, o));
    return pool.find((o) => o.toLowerCase() === q) ?? pool.find((o) => o.toLowerCase().startsWith(q)) ?? null;
  }

  function add(raw) {
    const tag = restricted ? resolve(raw) : raw.trim().slice(0, maxLength);
    if (!tag || full) return false;
    if (has(value, tag)) return false;
    onChange([...value, tag]);
    return true;
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (add(draft) || !restricted) setDraft('');
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const q = draft.trim().toLowerCase();
  const shown = restricted
    ? (q
        ? options.filter((o) => o.toLowerCase().includes(q))
        : [...suggestions.filter((s) => has(options, s)), ...options.filter((o) => !has(suggestions, o))]
      ).filter((o) => !has(value, o))
    : suggestions.filter((s) => !has(value, s));
  const noMatch = restricted && q && shown.length === 0;

  return (
    <div>
      <div className={`tag-input ${invalid ? 'is-invalid' : ''}`} onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
        {value.map((tag, i) => (
          <Chip key={tag} onRemove={() => onChange(value.filter((_, j) => j !== i))}>
            {tag}
          </Chip>
        ))}
        <input
          data-field={field}
          value={draft}
          maxLength={maxLength}
          disabled={full}
          placeholder={full ? `Maximum of ${max}` : value.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value.replace(',', ''))}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (!draft.trim()) return;
            // In restricted mode keep an unmatched draft so the user can fix it.
            if (add(draft) || !restricted) setDraft('');
          }}
        />
      </div>
      {noMatch && <p className="muted small tag-input-hint">No match for “{draft.trim()}”. Pick one from the list.</p>}
      {shown.length > 0 && !full && (
        <div className="suggestions">
          {shown.slice(0, restricted && q ? 12 : 8).map((s) => (
            <button
              key={s}
              type="button"
              className="suggestion"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (add(s)) setDraft('');
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
