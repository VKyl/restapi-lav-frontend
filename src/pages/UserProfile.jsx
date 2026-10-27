import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi, useDocumentTitle } from '../hooks/useApi.js';
import Icon from '../components/Icon.jsx';
import Chip from '../components/Chip.jsx';
import Avatar from '../components/Avatar.jsx';
import { EmptyState, ErrorState, Loader } from '../components/States.jsx';
import { ComingSoon } from './FindBand.jsx';
import { hueFor } from '../utils/format.js';

export default function UserProfile() {
  const { id } = useParams();
  const user = useApi((signal) => api.users.get(id, { signal }), [id]);
  const articles = useApi((signal) => api.users.articles(id, { take: 50 }, { signal }), [id]);
  useDocumentTitle(user.data?.name || 'Profile');

  if (user.loading && !user.data) return <div className="container page"><Loader /></div>;
  if (user.error) {
    return (
      <div className="container page">
        {user.error.status === 404 || user.error.status === 405 ? (
          <ComingSoon what="Musician profiles" />
        ) : (
          <ErrorState error={user.error} onRetry={user.reload} />
        )}
      </div>
    );
  }

  const u = user.data;
  return (
    <div className="container page">
      <section className="profile-hero card" style={{ '--h': hueFor(u.name) }}>
        <div className="profile-banner" aria-hidden="true" />
        <div className="profile-main">
          <Avatar name={u.name} size={104} />
          <div className="profile-text">
            <h1>{u.name}</h1>
            <div className="profile-meta">
              <span>
                <Icon name="pin" size={15} /> {u.location || 'Location not set'}
              </span>
              {u.looking_for_band && (
                <span className="badge badge-live">
                  <span className="pill-dot" /> Looking for a band
                </span>
              )}
            </div>
          </div>
          <Link to={`/users/${id}/edit`} className="btn btn-ghost">
            <Icon name="edit" size={16} /> Edit profile
          </Link>
        </div>
      </section>

      <div className="profile-grid">
        <div className="card side-card">
          <h4>
            <Icon name="music" size={16} /> Instruments
          </h4>
          {u.instruments?.length ? (
            <div className="chips">
              {u.instruments.map((i) => (
                <Chip key={i}>{i}</Chip>
              ))}
            </div>
          ) : (
            <p className="muted small">No instruments listed.</p>
          )}
        </div>
        <div className="card side-card">
          <h4>
            <Icon name="heart" size={16} /> Favourite bands
          </h4>
          {u.favorite_bands?.length ? (
            <ul className="fav-list">
              {u.favorite_bands.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : (
            <p className="muted small">No favourites yet.</p>
          )}
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Articles by {u.name}</h2>
        </div>
        {articles.loading && !articles.data ? (
          <Loader inline />
        ) : articles.error ? (
          <p className="muted">Articles couldn’t be loaded.</p>
        ) : articles.data.items.length === 0 ? (
          <EmptyState icon="book" title="No articles yet">
            {u.name} hasn’t written or edited any artist pages.
          </EmptyState>
        ) : (
          <div className="artist-grid">
            {articles.data.items.map((a) => (
              <Link key={a.id} to={`/artists/${a.id}`} className="artist-card card card-hover">
                <span className="monogram" style={{ '--h': hueFor(a.artist) }}>
                  {[...a.artist.trim()][0]?.toUpperCase()}
                </span>
                <div className="artist-card-body">
                  <h3>{a.artist}</h3>
                  <div className="chips">
                    {a.genres.slice(0, 3).map((g) => (
                      <Chip key={g} size="sm">
                        {g}
                      </Chip>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
