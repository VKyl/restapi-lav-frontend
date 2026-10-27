import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi, useDocumentTitle } from '../hooks/useApi.js';
import Icon from '../components/Icon.jsx';
import Chip from '../components/Chip.jsx';
import DateTile from '../components/DateTile.jsx';
import { Loader } from '../components/States.jsx';
import { formatTime, isPast, relativeTime } from '../utils/format.js';

const PILLARS = [
  {
    to: '/artists',
    icon: 'book',
    title: 'Artist Wiki',
    text: 'Read, write and refine community articles about the artists you love.',
    cta: 'Browse artists',
  },
  {
    to: '/events',
    icon: 'calendar',
    title: 'Events',
    text: 'Gigs, jams, open mics and festivals. See what’s on, or post your own.',
    cta: 'See what’s on',
  },
  {
    to: '/musicians',
    icon: 'users',
    title: 'Find Band',
    text: 'Meet players near you who are looking for a band, by instrument and taste.',
    cta: 'Find musicians',
  },
];

export default function Home() {
  useDocumentTitle('');
  const events = useApi((signal) => api.events.list({ take: 50 }, { signal }), []);
  const artists = useApi((signal) => api.artists.list({ take: 12 }, { signal }), []);

  const upcoming = (events.data?.items || []).filter((e) => !isPast(e.date)).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="pill">
              <span className="pill-dot" /> The music community forum
            </span>
            <h1>
              Where artists, fans <br />
              and <span className="grad-text">bandmates</span> meet.
            </h1>
            <p className="lead">
              KMArtists is a forum built by music people. Write the definitive story of your favourite artist, find out
              what’s playing this weekend, and connect with musicians who want to play.
            </p>
            <div className="hero-actions">
              <Link to="/artists" className="btn btn-primary btn-lg">
                Explore the wiki <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/events" className="btn btn-ghost btn-lg">
                Upcoming events
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>{artists.data?.pagination?.total_records ?? '—'}</strong>
                <span>artist articles</span>
              </div>
              <div>
                <strong>{events.data?.pagination?.total_records ?? '—'}</strong>
                <span>events posted</span>
              </div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="vinyl">
              <div className="vinyl-label">
                <span>KM</span>
              </div>
            </div>
            <div className="hero-eq">
              {Array.from({ length: 24 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${(i * 137) % 900}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="pillars">
          {PILLARS.map((p) => (
            <Link key={p.to} to={p.to} className="pillar card card-hover">
              <span className="pillar-icon">
                <Icon name={p.icon} size={22} />
              </span>
              <h3>{p.title}</h3>
              <p className="muted">{p.text}</p>
              <span className="pillar-cta">
                {p.cta} <Icon name="arrowRight" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Coming up</h2>
          <Link to="/events" className="link-arrow">
            All events <Icon name="arrowRight" size={16} />
          </Link>
        </div>
        {events.loading && !events.data ? (
          <Loader label="Tuning up" />
        ) : events.error ? (
          <p className="muted">Events are unavailable right now.</p>
        ) : upcoming.length === 0 ? (
          <div className="card cta-card">
            <div>
              <h3>No upcoming events yet</h3>
              <p className="muted">Be the first to put something on the calendar.</p>
            </div>
            <Link to="/events/new" className="btn btn-primary">
              <Icon name="plus" size={16} /> Post an event
            </Link>
          </div>
        ) : (
          <div className="event-mini-grid">
            {upcoming.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`} className="card card-hover event-mini">
                <DateTile date={e.date} />
                <div className="event-mini-body">
                  <h3>{e.name}</h3>
                  <p className="meta">
                    <Icon name="pin" size={14} /> {e.location}
                  </p>
                  <p className="meta">
                    <Icon name="clock" size={14} /> {formatTime(e.date)} · {relativeTime(e.date)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>From the wiki</h2>
          <Link to="/artists" className="link-arrow">
            All artists <Icon name="arrowRight" size={16} />
          </Link>
        </div>
        {artists.loading && !artists.data ? (
          <Loader label="Pulling records" />
        ) : artists.error ? (
          <p className="muted">The wiki is unavailable right now.</p>
        ) : artists.data?.items?.length ? (
          <div className="artist-cloud">
            {artists.data.items.map((a) => (
              <Link key={a.id} to={`/artists/${a.id}`} className="cloud-item">
                <span className="cloud-name">{a.artist}</span>
                {a.genres?.[0] && <Chip size="sm">{a.genres[0]}</Chip>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="card cta-card">
            <div>
              <h3>The wiki is waiting for its first page</h3>
              <p className="muted">Pick an artist you know inside out and start writing.</p>
            </div>
            <Link to="/artists/new" className="btn btn-primary">
              <Icon name="plus" size={16} /> Write article
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
