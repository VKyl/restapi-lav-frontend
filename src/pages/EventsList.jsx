import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi, useDebounced, useDocumentTitle } from '../hooks/useApi.js';
import { useSearchState } from '../hooks/useSearchState.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import DateTile from '../components/DateTile.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorState, Loader } from '../components/States.jsx';
import { formatTime, isPast, monthLabel, plural, relativeTime } from '../utils/format.js';

const PAGE_SIZE = 10;

function groupByMonth(items) {
  const groups = [];
  for (const item of items) {
    const label = monthLabel(item.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export default function EventsList() {
  useDocumentTitle('Events');
  const { get, set, page, setPage } = useSearchState();
  const q = get('q');
  const location = get('location');
  const date = get('date');

  const [qInput, setQInput] = useState(q);
  const [locInput, setLocInput] = useState(location);
  const dq = useDebounced(qInput);
  const dl = useDebounced(locInput);

  useEffect(() => setQInput(q), [q]);
  useEffect(() => setLocInput(location), [location]);
  useEffect(() => set('q', dq), [dq, set]);
  useEffect(() => set('location', dl), [dl, set]);

  const { data, error, loading, reload } = useApi(
    (signal) =>
      api.events.list(
        { take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, search_query: q.trim(), location: location.trim(), date },
        { signal },
      ),
    [q, location, date, page],
  );

  const filtered = Boolean(q.trim() || location.trim() || date);
  const clear = () => {
    setQInput('');
    setLocInput('');
    set('date', '');
  };

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Events"
        title="What’s on"
        actions={
          <Link to="/events/new" className="btn btn-primary">
            <Icon name="plus" size={16} /> Post an event
          </Link>
        }
      >
        Concerts, jams, open mics and festivals posted by the community.
      </PageHeader>

      <div className="filters card">
        <label className="search-box">
          <Icon name="search" />
          <input type="search" placeholder="Search events…" value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="Search events" />
        </label>
        <label className="search-box search-box-sm">
          <Icon name="pin" />
          <input type="search" placeholder="Location" value={locInput} onChange={(e) => setLocInput(e.target.value)} aria-label="Filter by location" />
        </label>
        <label className="search-box search-box-sm">
          <Icon name="calendar" />
          <input type="date" value={date} onChange={(e) => set('date', e.target.value)} aria-label="Filter by date" />
        </label>
        {filtered && (
          <button className="btn btn-ghost btn-sm" onClick={clear}>
            Clear
          </button>
        )}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <Loader label="Checking the calendar" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={filtered ? 'No events match' : 'The calendar is empty'}
          action={
            filtered ? (
              <button className="btn btn-ghost" onClick={clear}>
                Clear filters
              </button>
            ) : (
              <Link to="/events/new" className="btn btn-primary">
                Post the first event
              </Link>
            )
          }
        >
          {filtered ? 'Try a different search, place or day.' : 'Got a gig coming up? Let people know.'}
        </EmptyState>
      ) : (
        <>
          <p className="result-count muted">
            {plural(data.pagination.total_records, 'event')}
            {loading && <span className="dot-pulse" />}
          </p>
          <div className={`event-groups ${loading ? 'is-loading' : ''}`}>
            {groupByMonth(data.items).map((group) => (
              <section key={group.label} className="event-group">
                <h2 className="month-label">{group.label}</h2>
                <div className="event-list">
                  {group.items.map((e) => {
                    const past = isPast(e.date);
                    return (
                      <Link key={e.id} to={`/events/${e.id}`} className={`event-row card card-hover ${past ? 'is-past' : ''}`}>
                        <DateTile date={e.date} past={past} />
                        <div className="event-row-body">
                          <h3>{e.name}</h3>
                          <div className="event-row-meta">
                            <span>
                              <Icon name="clock" size={14} /> {formatTime(e.date)}
                            </span>
                            <span>
                              <Icon name="pin" size={14} /> {e.location}
                            </span>
                          </div>
                        </div>
                        <span className={`badge ${past ? 'badge-muted' : 'badge-live'}`}>{past ? 'Past' : relativeTime(e.date)}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      )}
    </div>
  );
}
