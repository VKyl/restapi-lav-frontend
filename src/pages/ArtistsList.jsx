import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi, useDebounced, useDocumentTitle } from '../hooks/useApi.js';
import { useSearchState } from '../hooks/useSearchState.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import Chip from '../components/Chip.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorState, Loader } from '../components/States.jsx';
import { hueFor, plural } from '../utils/format.js';

const PAGE_SIZE = 12;

export default function ArtistsList() {
  useDocumentTitle('Artists');
  const { get, set, page, setPage } = useSearchState();
  const q = get('q');
  const genre = get('genre');

  const [qInput, setQInput] = useState(q);
  const dq = useDebounced(qInput);

  useEffect(() => setQInput(q), [q]);
  useEffect(() => set('q', dq), [dq, set]);

  const setGenre = (g) => set('genre', g);

  // Genres used in existing articles. If the URL holds one that isn't in the
  // list (e.g. a link from an artist page), keep it selectable.
  const genresReq = useApi((signal) => api.genres.list({ signal }), []);
  const genreOptions = genresReq.data?.items ?? [];
  const selectedGenre = genreOptions.find((g) => g.toLowerCase() === genre.trim().toLowerCase()) ?? genre.trim();
  const options = selectedGenre && !genreOptions.includes(selectedGenre) ? [selectedGenre, ...genreOptions] : genreOptions;

  const { data, error, loading, reload } = useApi(
    (signal) =>
      api.artists.list(
        { take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, search_query: q.trim(), genre: genre.trim() },
        { signal },
      ),
    [q, genre, page],
  );

  const filtered = Boolean(q.trim() || genre.trim());

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Artist Wiki"
        title="Artists"
        actions={
          <Link to="/artists/new" className="btn btn-primary">
            <Icon name="plus" size={16} /> Write article
          </Link>
        }
      >
        Community-written articles about artists and bands. Anyone can start a page or improve an existing one.
      </PageHeader>

      <div className="filters card">
        <label className="search-box">
          <Icon name="search" />
          <input
            type="search"
            placeholder="Search artists…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            aria-label="Search artists"
          />
        </label>
        <label className="search-box search-box-sm">
          <Icon name="music" />
          <select
            value={selectedGenre}
            onChange={(e) => setGenre(e.target.value)}
            aria-label="Filter by genre"
            disabled={genresReq.loading && !genresReq.data}
          >
            <option value="">{genresReq.error ? 'Genres unavailable' : 'All genres'}</option>
            {options.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      {genreOptions.length > 0 && (
        <div className="quick-genres">
          {genreOptions.map((g) => {
            const active = g === selectedGenre;
            return (
              <button
                key={g}
                className={`quick-genre ${active ? 'is-active' : ''}`}
                style={{ '--h': hueFor(g) }}
                aria-pressed={active}
                onClick={() => setGenre(active ? '' : g)}
              >
                {g}
              </button>
            );
          })}
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <Loader label="Pulling records" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="book"
          title={filtered ? 'No artists match' : 'No articles yet'}
          action={
            filtered ? (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setQInput('');
                  setGenre('');
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link to="/artists/new" className="btn btn-primary">
                Write the first one
              </Link>
            )
          }
        >
          {filtered ? 'Try another name or genre.' : 'Start the wiki with an artist you know well.'}
        </EmptyState>
      ) : (
        <>
          <p className="result-count muted">
            {plural(data.pagination.total_records, 'artist')}
            {loading && <span className="dot-pulse" />}
          </p>
          <div className={`artist-grid ${loading ? 'is-loading' : ''}`}>
            {data.items.map((a) => (
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
                    {a.genres.length > 3 && <span className="chip-more">+{a.genres.length - 3}</span>}
                  </div>
                </div>
                <Icon name="arrowRight" className="card-arrow" />
              </Link>
            ))}
          </div>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      )}
    </div>
  );
}
