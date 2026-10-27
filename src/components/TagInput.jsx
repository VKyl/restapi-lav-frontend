import { useState } from 'react';
import Chip from './Chip.jsx';

// Chip-style list input. Enter or comma adds a tag, Backspace on an empty
// input removes the last one. Duplicates are ignored (case-insensitive).
export default function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  max = 10,
  maxLength = 50,
  suggestions = [],
  field,
  invalid = false,
}) {
  const [draft, setDraft] = useState('');
  const full = value.length >= max;

  function add(raw) {
    const tag = raw.trim().slice(0, maxLength);
    if (!tag || full) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
      setDraft('');
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

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
            if (draft.trim()) {
              add(draft);
              setDraft('');
            }
          }}
        />
      </div>
      {unused.length > 0 && !full && (
        <div className="suggestions">
          {unused.slice(0, 8).map((s) => (
            <button key={s} type="button" className="suggestion" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
