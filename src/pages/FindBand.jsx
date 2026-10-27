import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi, useDebounced, useDocumentTitle } from '../hooks/useApi.js';
import { useSearchState } from '../hooks/useSearchState.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import Chip from '../components/Chip.jsx';
import Avatar from '../components/Avatar.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorState, Loader } from '../components/States.jsx';
import { plural } from '../utils/format.js';

const PAGE_SIZE = 12;

export function ComingSoon({ what }) {
  return (
    <EmptyState icon="users" title="Warming up backstage">
      {what} isn’t live on the server yet. Once the musicians API is ready, this page will fill up automatically.
    </EmptyState>
  );
}

export default function FindBand() {
  useDocumentTitle('Find Band');
  const { get, set, page, setPage } = useSearchState();
  const location = get('location');
  const [locInput, setLocInput] = useState(location);
  const dl = useDebounced(locInput);
  useEffect(() => setLocInput(location), [location]);
  useEffect(() => set('location', dl), [dl, set]);

  const { data, error, loading, reload } = useApi(
    (signal) => api.users.musicians({ take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, location: location.trim() }, { signal }),
    [location, page],
  );

  return (
    <div className="container page">
      <PageHeader eyebrow="Find Band" title="Musicians looking to play">
        Everyone here ticked “I want to find a band”. Browse by location, then open a profile to see more.
      </PageHeader>

      <div className="filters card">
        <label className="search-box">
          <Icon name="pin" />
          <input type="search" placeholder="Where do you want to play?" value={locInput} onChange={(e) => setLocInput(e.target.value)} aria-label="Filter by location" />
        </label>
      </div>

      {error ? (
        error.status === 404 || error.status === 405 || error.status === 501 ? (
          <ComingSoon what="Find Band" />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )
      ) : !data ? (
        <Loader label="Finding players" />
      ) : data.items.length === 0 ? (
        <EmptyState icon="users" title="No musicians here yet">
          {location ? 'Nobody is looking for a band in that area yet. Try a nearby city.' : 'Nobody has raised their hand yet.'}
        </EmptyState>
      ) : (
        <>
          <p className="result-count muted">
            {plural(data.pagination.total_records, 'musician')}
            {loading && <span className="dot-pulse" />}
          </p>
          <div className={`musician-grid ${loading ? 'is-loading' : ''}`}>
            {data.items.map((m) => (
              <Link key={m.id} to={`/users/${m.id}`} className="musician-card card card-hover">
                <div className="musician-head">
                  <Avatar name={m.name} size={56} />
                  <div>
                    <h3>{m.name}</h3>
                    <p className="meta">
                      <Icon name="pin" size={14} /> {m.location || 'Anywhere'}
                    </p>
                  </div>
                </div>
                {m.instruments?.length > 0 && (
                  <div className="musician-block">
                    <span className="label">Plays</span>
                    <div className="chips">
                      {m.instruments.map((i) => (
                        <Chip key={i} size="sm">
                          {i}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {m.favorite_bands?.length > 0 && (
                  <div className="musician-block">
                    <span className="label">Into</span>
                    <p className="fav-bands">{m.favorite_bands.slice(0, 4).join(' · ')}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      )}
    </div>
  );
}
