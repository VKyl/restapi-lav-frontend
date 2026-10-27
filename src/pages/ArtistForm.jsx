import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useDocumentTitle } from '../hooks/useApi.js';
import Icon from '../components/Icon.jsx';
import Field from '../components/Field.jsx';
import TagInput from '../components/TagInput.jsx';
import { useToast } from '../components/Toast.jsx';
import { ErrorState, FormError, Loader } from '../components/States.jsx';
import { errorFor, focusField } from '../utils/errors.js';
import { POPULAR_GENRES } from './ArtistsList.jsx';

const LIMITS = { artist: 200, genres: 10, genre: 50, sections: 50, title: 200, content: 20000 };

let keySeq = 0;
const newSection = (title = '', content = '') => ({ key: ++keySeq, title, content });

function validate({ isEdit, artist, genres, sections }) {
  if (!isEdit) {
    if (!artist.trim()) return { field: 'artist', message: 'Give the artist a name.' };
    if (artist.length > LIMITS.artist) return { field: 'artist', message: `Keep it under ${LIMITS.artist} characters.` };
  }
  if (genres.length === 0) return { field: 'genres', message: 'Add at least one genre.' };
  if (sections.length === 0) return { field: 'body', message: 'Add at least one section.' };
  const seen = new Set();
  for (let i = 0; i < sections.length; i++) {
    const { title, content } = sections[i];
    if (!title.trim()) return { field: `body[${i}].title`, message: 'This section needs a title.' };
    const key = title.trim().toLowerCase();
    if (seen.has(key)) return { field: `body[${i}].title`, message: 'Section titles must be unique.' };
    seen.add(key);
    if (!content.trim()) return { field: `body[${i}].content`, message: 'Write something for this section.' };
  }
  return null;
}

export default function ArtistForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [artist, setArtist] = useState('');
  const [genres, setGenres] = useState([]);
  const [sections, setSections] = useState(() => [newSection('Biography')]);
  const [loadState, setLoadState] = useState({ loading: isEdit, error: null });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const lastAdded = useRef(null);

  useDocumentTitle(isEdit ? `Edit ${artist || 'article'}` : 'New article');

  useEffect(() => {
    if (!isEdit) return;
    const ctrl = new AbortController();
    api.artists
      .get(id, { signal: ctrl.signal })
      .then((a) => {
        setArtist(a.artist);
        setGenres(a.genres);
        setSections(a.body.map((s) => newSection(s.title, s.content)));
        setLoadState({ loading: false, error: null });
      })
      .catch((err) => err.name !== 'AbortError' && setLoadState({ loading: false, error: err }));
    return () => ctrl.abort();
  }, [id, isEdit]);

  useEffect(() => {
    if (error?.field) focusField(error.field);
  }, [error]);

  useEffect(() => {
    if (lastAdded.current) {
      focusField(`body[${lastAdded.current}].title`);
      lastAdded.current = null;
    }
  }, [sections.length]);

  const updateSection = (i, patch) => setSections((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const removeSection = (i) => setSections((s) => s.filter((_, j) => j !== i));
  const moveSection = (i, dir) =>
    setSections((s) => {
      const next = [...s];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  const addSection = () => {
    lastAdded.current = sections.length;
    setSections((s) => [...s, newSection()]);
  };

  async function onSubmit(e) {
    e.preventDefault();
    const problem = validate({ isEdit, artist, genres, sections });
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    const body = sections.map((s) => ({ title: s.title.trim(), content: s.content.trim() }));
    try {
      if (isEdit) {
        await api.artists.update(id, { genres, body });
        toast('Article updated');
        navigate(`/artists/${id}`);
      } else {
        const res = await api.artists.create({ artist: artist.trim(), genres, body });
        toast(`Published “${artist.trim()}”`);
        navigate(`/artists/${res.id}`);
      }
    } catch (err) {
      if (err.status === 409 && !err.field) err.field = 'artist';
      setError(err);
      setSaving(false);
    }
  }

  if (loadState.loading) return <div className="container page"><Loader /></div>;
  if (loadState.error) return <div className="container page"><ErrorState error={loadState.error} /></div>;

  const cancelTo = isEdit ? `/artists/${id}` : '/artists';

  return (
    <div className="container page page-narrow">
      <Link to={cancelTo} className="back-link">
        <Icon name="arrowLeft" size={16} /> {isEdit ? 'Back to article' : 'All artists'}
      </Link>
      <header className="form-header">
        <span className="eyebrow">{isEdit ? 'Editing article' : 'New article'}</span>
        <h1>{isEdit ? artist : 'Write about an artist'}</h1>
        <p className="lead">
          {isEdit
            ? 'Update the genres or improve any section. Your name will be added to the contributors.'
            : 'Split the story into sections, like Biography, Discography or Legacy. You can reorder them any time.'}
        </p>
      </header>

      <form onSubmit={onSubmit} className="form" noValidate>
        <FormError error={error} />

        <div className="card form-card">
          {!isEdit && (
            <Field label="Artist or band name" error={errorFor(error, 'artist')} count={artist.length} max={LIMITS.artist} htmlFor="artist">
              <input
                id="artist"
                data-field="artist"
                className="input input-lg"
                value={artist}
                maxLength={LIMITS.artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Nina Simone"
                autoFocus
              />
            </Field>
          )}
          <Field
            label="Genres"
            error={errorFor(error, 'genres', { prefix: true })}
            hint={`Press Enter to add. Up to ${LIMITS.genres} genres.`}
            count={genres.length}
            max={LIMITS.genres}
          >
            <TagInput
              field="genres"
              value={genres}
              onChange={setGenres}
              max={LIMITS.genres}
              maxLength={LIMITS.genre}
              placeholder="jazz, soul, blues…"
              suggestions={POPULAR_GENRES}
              invalid={Boolean(errorFor(error, 'genres', { prefix: true }))}
            />
          </Field>
        </div>

        <div className="sections-head">
          <h2>Sections</h2>
          <span className="muted small">
            {sections.length} / {LIMITS.sections}
          </span>
        </div>
        {errorFor(error, 'body') && <p className="field-error">{errorFor(error, 'body')}</p>}

        <div className="section-editors">
          {sections.map((s, i) => {
            const titleErr = errorFor(error, `body[${i}].title`);
            const contentErr = errorFor(error, `body[${i}].content`) || errorFor(error, `body[${i}]`);
            return (
              <div key={s.key} className="card section-editor">
                <div className="section-editor-head">
                  <span className="section-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="section-tools">
                    <button type="button" className="icon-btn" disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label="Move section up">
                      <Icon name="arrowUp" size={16} />
                    </button>
                    <button type="button" className="icon-btn" disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)} aria-label="Move section down">
                      <Icon name="arrowDown" size={16} />
                    </button>
                    <button type="button" className="icon-btn icon-btn-danger" disabled={sections.length === 1} onClick={() => removeSection(i)} aria-label="Remove section">
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
                <Field error={titleErr} count={s.title.length} max={LIMITS.title}>
                  <input
                    data-field={`body[${i}].title`}
                    className="input input-title"
                    value={s.title}
                    maxLength={LIMITS.title}
                    onChange={(e) => updateSection(i, { title: e.target.value })}
                    placeholder="Section title"
                  />
                </Field>
                <Field error={contentErr} count={s.content.length} max={LIMITS.content} hint="Leave a blank line between paragraphs.">
                  <textarea
                    data-field={`body[${i}].content`}
                    className="input textarea"
                    rows={7}
                    value={s.content}
                    maxLength={LIMITS.content}
                    onChange={(e) => updateSection(i, { content: e.target.value })}
                    placeholder="Tell the story…"
                  />
                </Field>
              </div>
            );
          })}
        </div>

        <button type="button" className="add-section" onClick={addSection} disabled={sections.length >= LIMITS.sections}>
          <Icon name="plus" size={18} /> Add section
        </button>

        <div className="form-actions sticky-actions">
          <Link to={cancelTo} className="btn btn-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Publish article'}
          </button>
        </div>
      </form>
    </div>
  );
}
