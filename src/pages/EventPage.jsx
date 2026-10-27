import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi, useDocumentTitle } from '../hooks/useApi.js';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import DateTile from '../components/DateTile.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toast.jsx';
import { ErrorState, Loader } from '../components/States.jsx';
import { formatDate, formatTime, isPast, relativeTime } from '../utils/format.js';
import { friendlyMessage } from '../utils/errors.js';

export default function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useApi((signal) => api.events.get(id, { signal }), [id]);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useDocumentTitle(data?.name || 'Event');

  async function onDelete() {
    setDeleting(true);
    try {
      await api.events.remove(id);
      toast('Event deleted');
      navigate('/events');
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

  const past = isPast(data.date);

  return (
    <div className="container page">
      <BackLink />
      <section className={`event-hero card ${past ? 'is-past' : ''}`}>
        <div className="event-hero-glow" aria-hidden="true" />
        <DateTile date={data.date} past={past} large />
        <div className="event-hero-text">
          <span className={`badge ${past ? 'badge-muted' : 'badge-live'}`}>{past ? 'This event has ended' : `Starts ${relativeTime(data.date)}`}</span>
          <h1>{data.name}</h1>
          <div className="event-facts">
            <span>
              <Icon name="calendar" size={16} /> {formatDate(data.date, { weekday: 'long', month: 'long' })}
            </span>
            <span>
              <Icon name="clock" size={16} /> {formatTime(data.date)}
            </span>
            <span>
              <Icon name="pin" size={16} /> {data.location}
            </span>
          </div>
        </div>
        <div className="event-hero-actions">
          {!past && (
            <Link to={`/events/${id}/edit`} className="btn btn-primary">
              <Icon name="edit" size={16} /> Edit
            </Link>
          )}
          <button className="btn btn-ghost btn-icon-danger" onClick={() => setConfirm(true)} aria-label="Delete event">
            <Icon name="trash" size={16} />
          </button>
        </div>
      </section>

      <div className="event-layout">
        <article className="card event-description">
          <h2>About this event</h2>
          {data.description
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </article>
        <aside className="event-side">
          <div className="card side-card">
            <h4>
              <Icon name="mail" size={16} /> Contact
            </h4>
            <p className="contact-info">{data.contact_info}</p>
          </div>
          <div className="card side-card">
            <h4>Posted by</h4>
            <Link to={`/users/${data.creator.id}`} className="contributor">
              <Avatar name={data.creator.name} size={36} />
              <span>{data.creator.name}</span>
            </Link>
            <p className="muted small">
              Posted {formatDate(data.created_at)}
              {data.updated_at !== data.created_at && ` · updated ${relativeTime(data.updated_at)}`}
            </p>
          </div>
        </aside>
      </div>

      <ConfirmDialog open={confirm} title="Delete this event?" busy={deleting} onClose={() => setConfirm(false)} onConfirm={onDelete}>
        <strong>{data.name}</strong> will be removed from the calendar for everyone.
      </ConfirmDialog>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/events" className="back-link">
      <Icon name="arrowLeft" size={16} /> All events
    </Link>
  );
}
