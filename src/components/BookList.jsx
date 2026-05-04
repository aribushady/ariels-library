import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import StarRating from './StarRating';
import bannerImg from '../assets/banner.png';

const GENRES = [
  'Action', 'Adventure', 'Anthology', 'Classic', 'Coming of Age', 'Contemporary', 'Crime', 'Drama', 'Dystopian',
  'Epistolary', 'Fantasy', 'Fiction', 'Folklore', 'Gothic', 'Heist', 'Historical Fiction', 'Horror', 'Humor', 'Literary',
  'Magical Realism', 'Mystery', 'Noir', 'Poetry', 'Political Intrigue', 'Postmodern',
  'Psychological Thriller', 'Retelling', 'Romance', 'Science Fiction', 'Southern Gothic',
  'Surrealism', 'Suspense', 'Thriller', 'Tie-In Fiction', 'Weird Fiction', 'Western', 'Young Adult',
];

async function exportLibrary(books) {
  const zip = new JSZip();
  const coversFolder = zip.folder('covers');

  const headers = ['Title', 'Author', 'Pages', 'Section', 'Genres', 'Series', 'Series #', 'Rating', 'Status', 'For Donation', 'Cover'];
  const rows = [];

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const genres = (b.genres || (b.genre ? [b.genre] : [])).join('; ');
    const status = b.inProgress ? 'In Progress' : b.read ? 'Read' : b.dnf ? 'DNF' : 'Not Started';
    let coverFilename = '';

    if (b.coverImage) {
      const ext = b.coverImage.type?.split('/')?.[1] || 'jpg';
      coverFilename = `cover-${i + 1}.${ext}`;
      const buffer = await b.coverImage.arrayBuffer();
      coversFolder.file(coverFilename, buffer);
    }

    rows.push([
      b.title || '',
      b.author || '',
      b.pages || '',
      b.section || 'fiction',
      genres,
      b.series || '',
      b.seriesNumber ?? '',
      b.rating || '',
      status,
      b.forDonation ? 'Yes' : 'No',
      coverFilename ? `covers/${coverFilename}` : '',
    ]);
  }

  const escape = (val) => {
    const s = String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  zip.file('library.csv', csv);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ariels-library-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BookList({ books, onSelect, onAdd, onImport }) {
  const [coverUrls, setCoverUrls] = useState({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [showImportInput, setShowImportInput] = useState(false);
  const [filterGenre, setFilterGenre] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDonation, setFilterDonation] = useState('all');
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [activeSection, setActiveSection] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  const hasActiveFilters = filterGenre || filterStatus !== 'all' || filterDonation !== 'all' || filterMinRating > 0;

  function clearFilters() {
    setFilterGenre('');
    setFilterStatus('all');
    setFilterDonation('all');
    setFilterMinRating(0);
  }

  const filtered = books.filter((book) => {
    if (activeSection !== 'all') {
      const bookSection = book.section || 'fiction';
      if (bookSection !== activeSection) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!book.title?.toLowerCase().includes(q) && !book.author?.toLowerCase().includes(q)) return false;
    }
    const bookGenres = book.genres || (book.genre ? [book.genre] : []);
    if (filterGenre && !bookGenres.includes(filterGenre)) return false;
    if (filterStatus === 'read' && !book.read) return false;
    if (filterStatus === 'inProgress' && !book.inProgress) return false;
    if (filterStatus === 'dnf' && !book.dnf) return false;
    if (filterStatus === 'notStarted' && (book.read || book.inProgress || book.dnf)) return false;
    if (filterDonation === 'yes' && !book.forDonation) return false;
    if (filterDonation === 'no' && book.forDonation) return false;
    if (filterMinRating > 0 && (book.rating || 0) < filterMinRating) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'author': {
        const lastA = (a.author || '').trim().split(/\s+/).pop().toLowerCase();
        const lastB = (b.author || '').trim().split(/\s+/).pop().toLowerCase();
        return lastA.localeCompare(lastB);
      }
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'genre':
        return ((a.genres || [])[0] || a.genre || '').localeCompare((b.genres || [])[0] || b.genre || '');
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'status': {
        const order = (book) => book.inProgress ? 3 : book.read ? 2 : book.dnf ? 1 : 0;
        return order(b) - order(a);
      }
      case 'donation':
        return (b.forDonation ? 1 : 0) - (a.forDonation ? 1 : 0);
      default:
        return b.createdAt - a.createdAt;
    }
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, sortBy, filterGenre, filterStatus, filterDonation, filterMinRating, activeSection]);

  useEffect(() => {
    const urls = {};
    books.forEach((book) => {
      if (book.coverImage) {
        urls[book.id] = URL.createObjectURL(book.coverImage);
      }
    });
    setCoverUrls(urls);
    return () => Object.values(urls).forEach(URL.revokeObjectURL);
  }, [books]);

  return (
    <div className="view">
      <header className="view-header banner-header">
        <img src={bannerImg} alt="" className="banner-img" />
        <h1>Ariel's Library</h1>
        {books.length > 0 && (
          <button className="export-btn" onClick={() => exportLibrary(books)}>
            Export
          </button>
        )}
        {showImportInput ? (
          <label className="export-btn import-btn">
            Choose File
            <input
              type="file"
              accept=".zip"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.target.value = '';
                setShowImportInput(false);
              }}
              hidden
            />
          </label>
        ) : (
          <button className="export-btn import-btn" onClick={() => setShowImportInput(true)}>
            Import
          </button>
        )}
      </header>

      {books.length > 0 && (
        <>
          <div className="section-tabs">
            {[['all', 'All'], ['fiction', 'Fiction'], ['nonfiction', 'Nonfiction']].map(([val, label]) => (
              <button
                key={val}
                className={`section-tab ${activeSection === val ? 'section-tab-active' : ''}`}
                onClick={() => setActiveSection(val)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="search-sort-bar">
            <input
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="recent">Recent</option>
              <option value="author">Author</option>
              <option value="title">Title</option>
              <option value="genre">Genre</option>
              <option value="rating">Rating</option>
              <option value="status">Status</option>
              <option value="donation">Donation</option>
            </select>
            <button
              className={`filter-toggle ${hasActiveFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
            </button>
          </div>

          {showFilters && (
            <div className="filter-panel">
              <div className="filter-row">
                <span className="filter-label">Genre</span>
                <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                  <option value="">All</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="filter-row">
                <span className="filter-label">Status</span>
                <div className="filter-chips">
                  {[
                    ['all', 'All'],
                    ['read', 'Read'],
                    ['inProgress', 'Reading'],
                    ['dnf', 'DNF'],
                    ['notStarted', 'Not Started'],
                  ].map(([val, label]) => (
                    <button key={val} className={`chip ${filterStatus === val ? 'chip-active' : ''}`} onClick={() => setFilterStatus(val)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row">
                <span className="filter-label">Donation</span>
                <div className="filter-chips">
                  {['all', 'yes', 'no'].map((v) => (
                    <button key={v} className={`chip ${filterDonation === v ? 'chip-active' : ''}`} onClick={() => setFilterDonation(v)}>
                      {v === 'all' ? 'All' : v === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row">
                <span className="filter-label">Min Rating</span>
                <div className="filter-chips">
                  {[0, 1, 2, 3, 4, 5].map((v) => (
                    <button key={v} className={`chip ${filterMinRating === v ? 'chip-active' : ''}`} onClick={() => setFilterMinRating(v)}>
                      {v === 0 ? 'Any' : `${v}+`}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button className="clear-filters" onClick={clearFilters}>Clear Filters</button>
              )}
            </div>
          )}
        </>
      )}

      {books.length === 0 ? (
        <div className="empty-state">
          <p>No books yet</p>
          <p>Tap + to add your first book</p>
        </div>
      ) : paged.length === 0 && sorted.length === 0 ? (
        <div className="empty-state">
          <p>No books match</p>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="book-grid">
          {paged.map((book) => (
            <button key={book.id} className="book-card" onClick={() => onSelect(book)}>
              {coverUrls[book.id] ? (
                <img src={coverUrls[book.id]} alt={book.title} className="card-cover" />
              ) : (
                <div className="card-cover-placeholder">{book.title.charAt(0)}</div>
              )}
              <div className="card-info">
                <span className="card-title">{book.title}</span>
                <span className="card-author">{book.author}</span>
                {book.series && (
                  <span className="card-series">{book.series}{book.seriesNumber != null ? ` #${book.seriesNumber}` : ''}</span>
                )}
                <StarRating value={book.rating} readonly />
                <div className="card-badges">
                  {book.read && <span className="badge read-badge">Read</span>}
                  {book.inProgress && <span className="badge progress-badge">Reading</span>}
                  {book.dnf && <span className="badge dnf-badge">DNF</span>}
                  {book.forDonation && <span className="badge donate-badge">Donate</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => { setPage(page - 1); window.scrollTo(0, 0); }}
          >
            ← Prev
          </button>
          <span className="page-info">{page} / {totalPages}</span>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => { setPage(page + 1); window.scrollTo(0, 0); }}
          >
            Next →
          </button>
        </div>
      )}

      <button className="fab" onClick={onAdd} aria-label="Add book">
          <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
            <line x1="14" y1="11" x2="14" y2="23" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="17" x2="20" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
    </div>
  );
}
