import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useDocumentTitle } from '../hooks/useApi.js';
import Icon from '../components/Icon.jsx';
import Field from '../components/Field.jsx';
import TagInput from '../components/TagInput.jsx';
import { useToast } from '../components/Toast.jsx';
import { ErrorState, FormError, Loader } from '../components/States.jsx';
import { ComingSoon } from './FindBand.jsx';
import { errorFor, focusField } from '../utils/errors.js';

const INSTRUMENTS = ['vocals', 'guitar', 'bass', 'drums', 'keys', 'violin', 'saxophone', 'DJ'];

export default function ProfileForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Edit profile');

  useEffect(() => {
    const ctrl = new AbortController();
    api.users
      .get(id, { signal: ctrl.signal })
      .then((u) =>
        setForm({
          name: u.name || '',
          location: u.location || '',
          instruments: u.instruments || [],
          favorite_bands: u.favorite_bands || [],
          looking_for_band: Boolean(u.looking_for_band),
        }),
      )
      .catch((err) => err.name !== 'AbortError' && setLoadError(err));
    return () => ctrl.abort();
  }, [id]);

  useEffect(() => {
    if (error?.field) focusField(error.field);
  }, [error]);

  const patch = (p) => setForm((f) => ({ ...f, ...p }));

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError({ field: 'name', message: 'Your nickname can’t be empty.' });
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.users.update(id, { ...form, name: form.name.trim(), location: form.location.trim() });
      toast('Profile saved');
      navigate(`/users/${id}`);
    } catch (err) {
      if (err.status === 409 && !err.field) {
        err.field = 'name';
        err.message = err.message || 'That nickname is already taken.';
      }
      setError(err);
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <div className="container page">
        {loadError.status === 404 || loadError.status === 405 ? <ComingSoon what="Profile editing" /> : <ErrorState error={loadError} />}
      </div>
    );
  }
  if (!form) return <div className="container page"><Loader /></div>;

  return (
    <div className="container page page-narrow">
      <Link to={`/users/${id}`} className="back-link">
        <Icon name="arrowLeft" size={16} /> Back to profile
      </Link>
      <header className="form-header">
        <span className="eyebrow">Your profile</span>
        <h1>Edit profile</h1>
        <p className="lead">Tell other musicians what you play and what you’re into.</p>
      </header>
      <form className="form" onSubmit={onSubmit} noValidate>
        <FormError error={error} />
        <div className="card form-card">
          <Field label="Nickname" htmlFor="name" error={errorFor(error, 'name')} hint="Must be unique across KMArtists.">
            <input id="name" data-field="name" className="input input-lg" value={form.name} maxLength={100} onChange={(e) => patch({ name: e.target.value })} />
          </Field>
          <Field label="Location" htmlFor="location" error={errorFor(error, 'location')} hint="Where you’re available to play.">
            <input id="location" data-field="location" className="input" value={form.location} placeholder="City, region" onChange={(e) => patch({ location: e.target.value })} />
          </Field>
          <Field label="Instruments" error={errorFor(error, 'instruments', { prefix: true })}>
            <TagInput field="instruments" value={form.instruments} onChange={(instruments) => patch({ instruments })} suggestions={INSTRUMENTS} placeholder="guitar, vocals…" />
          </Field>
          <Field label="Favourite bands" error={errorFor(error, 'favorite_bands', { prefix: true })}>
            <TagInput field="favorite_bands" value={form.favorite_bands} onChange={(favorite_bands) => patch({ favorite_bands })} max={20} maxLength={200} placeholder="Radiohead, Fleetwood Mac…" />
          </Field>
          <label className="toggle-row">
            <input type="checkbox" className="toggle" checked={form.looking_for_band} onChange={(e) => patch({ looking_for_band: e.target.checked })} />
            <span>
              <strong>I want to find a band</strong>
              <span className="muted small">Show me on the Find Band page.</span>
            </span>
          </label>
        </div>
        <div className="form-actions">
          <Link to={`/users/${id}`} className="btn btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
