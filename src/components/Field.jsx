export default function Field({ label, hint, error, count, max, children, htmlFor }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <div className="field-head">
        {label && <label htmlFor={htmlFor}>{label}</label>}
        {max != null && count != null && (
          <span className={`counter ${count > max ? 'over' : ''}`}>
            {count.toLocaleString()} / {max.toLocaleString()}
          </span>
        )}
      </div>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
