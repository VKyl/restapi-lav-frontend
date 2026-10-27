import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi, useDocumentTitle } from '../hooks/useApi.js';
import Icon from '../components/Icon.jsx';
import Chip from '../components/Chip.jsx';
import Avatar from '../components/Avatar.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toast.jsx';
import { ErrorState, Loader } from '../components/States.jsx';
import { formatDate, hueFor, plural, relativeTime } from '../utils/format.js';
import { friendlyMessage } from '../utils/errors.js';

function Paragraphs({ text }) {
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p, i) => <p key={i}>{p}</p>);
}

export default function ArtistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useApi((signal) => api.artists.get(id, { signal }), [id]);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useDocumentTitle(data?.artist || 'Artist');

  async function onDelete() {
    setDeleting(true);
    try {
      await api.artists.remove(id);
      toast(`Deleted the article about ${data.artist}`);
      navigate('/artists');
    } catch (err) {
      toast(friendlyMessage(err), 'error');
      setDeleting(false);
      setConfirm(false);
    }
  }

  if (loading && !data) return <div className="container page"><Loader /></div>;
  if (error) {
    return (
      <div className="container page">
        <BackLink />
        <ErrorState error={error} onRetry={error.status !== 404 ? reload : undefined} />
      </div>
    );
  }

  return (
    <div className="page">
      <section className="artist-hero" style={{ '--h': hueFor(data.artist) }}>
        <div className="container">
          <BackLink />
          <div className="artist-hero-inner">
            <span className="monogram monogram-xl" style={{ '--h': hueFor(data.artist) }}>
              {[...data.artist.trim()][0]?.toUpperCase()}
            </span>
            <div className="artist-hero-text">
              <span className="eyebrow">Artist article</span>
              <h1>{data.artist}</h1>
              <div className="chips">
                {data.genres.map((g) => (
                  <Chip key={g} to={`/artists?genre=${encodeURIComponent(g)}`}>
                    {g}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="artist-hero-actions">
              <Link to={`/artists/${id}/edit`} className="btn btn-primary">
                <Icon name="edit" size={16} /> Edit
              </Link>
              <button className="btn btn-ghost btn-icon-danger" onClick={() => setConfirm(true)} aria-label="Delete article">
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container article-layout">
        <aside className="toc">
          <div className="toc-inner">
            <span className="toc-title">Contents</span>
            <ol>
              {data.body.map((s, i) => (
                <li key={i}>
                  <a href={`#section-${i}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="article-body">
          {data.body.map((section, i) => (
            <section key={i} id={`section-${i}`} className="article-section">
              <h2>
                <span className="section-num">{String(i + 1).padStart(2, '0')}</span>
                {section.title}
              </h2>
              <Paragraphs text={section.content} />
            </section>
          ))}
        </article>

        <aside className="article-side">
          <div className="card side-card">
            <h4>About this page</h4>
            <dl className="meta-list">
              <div>
                <dt>Created</dt>
                <dd>{formatDate(data.created_at)}</dd>
              </div>
              <div>
                <dt>Last edited</dt>
                <dd title={formatDate(data.updated_at)}>{relativeTime(data.updated_at)}</dd>
              </div>
              <div>
                <dt>Sections</dt>
                <dd>{data.body.length}</dd>
              </div>
            </dl>
          </div>
          <div className="card side-card">
            <h4>{plural(data.contributors.length, 'Contributor')}</h4>
            <ul className="contributors">
              {data.contributors.map((c) => (
                <li key={c.id}>
                  <Link to={`/users/${c.id}`} className="contributor">
                    <Avatar name={c.name} size={32} />
                    <span>{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to={`/artists/${id}/edit`} className="btn btn-ghost btn-block btn-sm">
              <Icon name="edit" size={14} /> Improve this article
            </Link>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete this article?"
        busy={deleting}
        onClose={() => setConfirm(false)}
        onConfirm={onDelete}
      >
        The article about <strong>{data.artist}</strong> and all its sections will be removed for everyone. This can’t be undone.
      </ConfirmDialog>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/artists" className="back-link">
      <Icon name="arrowLeft" size={16} /> All artists
    </Link>
  );
}
