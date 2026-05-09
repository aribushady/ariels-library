import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import StarRating from './StarRating';
import bannerImg from '../assets/banner.png';

const GENRES = [
  'Absurdist', 'Action', 'Adventure', 'Anthology', 'Classic', 'Coming of Age', 'Contemporary', 'Craft', 'Crime', 'Dark Academia', 'Drama', 'Dystopian',
  'Epic', 'Epistolary', 'Existential', 'Fantasy', 'Fiction', 'Folklore', 'Gothic', 'Heist', 'Historical Fiction', 'Horror', 'Humor', 'Literary',
  'Magical Realism', 'Memoir', 'Mythology', 'Mystery', 'Noir', 'Poetry', 'Political Intrigue', 'Postmodern',
  'Psychological Thriller', 'Retelling', 'Romance', 'Science Fiction', 'Short Stories', 'Southern Gothic', 'Speculative',
  'Surrealism', 'Suspense', 'Thriller', 'Tie-In Fiction', 'True Crime', 'Weird Fiction', 'Western', 'Young Adult',
];

async function exportLibrary(books) {
  const zip = new JSZip();
  const coversFolder = zip.folder('covers');

  const headers = ['Title', 'Author', 'Pages', 'Section', 'Genres', 'Series', 'Series #', 'Rating', 'Status', 'TBR', 'Reading Order', 'TBR Order', 'For Donation', 'Cover'];
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
      b.tbr ? 'Yes' : 'No',
      b.readingOrder ?? '',
      b.tbrOrder ?? '',
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

export default function BookList({ books, onSelect, onAdd, onImport, onReorder }) {
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

  const isSpecialTab = activeSection === 'reading' || activeSection === 'tbr';

  const orderedList = (() => {
    if (!isSpecialTab) return [];
    const items = activeSection === 'reading'
      ? books.filter((b) => b.inProgress)
      : books.filter((b) => b.tbr);
    const field = activeSection === 'reading' ? 'readingOrder' : 'tbrOrder';
    return [...items].sort((a, b) => (a[field] ?? Infinity) - (b[field] ?? Infinity));
  })();

  function handleMove(index, direction) {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= orderedList.length) return;
    const field = activeSection === 'reading' ? 'readingOrder' : 'tbrOrder';
    onReorder(orderedList[index].id, orderedList[swapIndex].id, field, swapIndex, index);
  }

  const hasActiveFilters = filterGenre || filterStatus !== 'all' || filterDonation !== 'all' || filterMinRating > 0;

  function clearFilters() {
    setFilterGenre('');
    setFilterStatus('all');
    setFilterDonation('all');
    setFilterMinRating(0);
  }

  const filtered = isSpecialTab ? [] : books.filter((book) => {
    if (activeSection !== 'all') {
      const bookSection = book.section || 'fiction';
      if (bookSection !== activeSection) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!book.title?.toLowerCase().includes(q) && !book.author?.toLowerCase().includes(q) && !book.series?.toLowerCase().includes(q)) return false;
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
      case 'series': {
        const sA = a.series || '';
        const sB = b.series || '';
        if (!sA && !sB) return 0;
        if (!sA) return 1;
        if (!sB) return -1;
        const cmp = sA.localeCompare(sB);
        if (cmp !== 0) return cmp;
        return (a.seriesNumber ?? 999) - (b.seriesNumber ?? 999);
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

  const coverUrlsRef = useRef({});
  useEffect(() => {
    const prev = coverUrlsRef.current;
    const next = {};
    const currentIds = new Set(books.map((b) => b.id));
    books.forEach((book) => {
      if (book.coverImage) {
        next[book.id] = prev[book.id] || URL.createObjectURL(book.coverImage);
      }
    });
    Object.keys(prev).forEach((id) => {
      if (!currentIds.has(Number(id)) && prev[id]) URL.revokeObjectURL(prev[id]);
    });
    coverUrlsRef.current = next;
    setCoverUrls(next);
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
            {[['all', 'All'], ['fiction', 'Fiction'], ['nonfiction', 'Nonfiction'], ['reading', 'Reading'], ['tbr', 'TBR']].map(([val, label]) => (
              <button
                key={val}
                className={`section-tab ${activeSection === val ? 'section-tab-active' : ''}`}
                onClick={() => setActiveSection(val)}
              >
                {label}
              </button>
            ))}
          </div>

          {!isSpecialTab && <div className="stats-bar">
            <span className="stat">All <strong>{filtered.length}</strong></span>
            <span className="stat">Read <strong>{filtered.filter((b) => b.read).length}</strong></span>
            <span className="stat">DNF <strong>{filtered.filter((b) => b.dnf).length}</strong></span>
          </div>}

          {!isSpecialTab && <>
          <div className="search-sort-bar">
            <input
              type="text"
              placeholder="Search by title, author, or series..."
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
              <option value="series">Series</option>
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
          </>}
        </>
      )}

      {isSpecialTab ? (
        orderedList.length === 0 ? (
          <div className="empty-state">
            <p>No books here yet</p>
            <p>{activeSection === 'reading' ? 'Mark a book as In Progress to see it here' : 'Toggle To Be Read on a book to add it'}</p>
          </div>
        ) : (
          <div className="ordered-list">
            {orderedList.map((book, i) => (
              <div key={book.id} className="ordered-item">
                <span className="ordered-num">{i + 1}</span>
                {coverUrls[book.id] ? (
                  <img src={coverUrls[book.id]} alt={book.title} className="ordered-cover" onClick={() => onSelect(book)} />
                ) : (
                  <div className="ordered-cover-placeholder" onClick={() => onSelect(book)}>{book.title.charAt(0)}</div>
                )}
                <div className="ordered-info" onClick={() => onSelect(book)}>
                  <span className="card-title">{book.title}</span>
                  <span className="card-author">{book.author}</span>
                  {book.series && (
                    <span className="card-series">{book.series}{book.seriesNumber != null ? ` #${book.seriesNumber}` : ''}</span>
                  )}
                </div>
                <div className="ordered-arrows">
                  <button className="arrow-btn" disabled={i === 0} onClick={() => handleMove(i, -1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button className="arrow-btn" disabled={i === orderedList.length - 1} onClick={() => handleMove(i, 1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : books.length === 0 ? (
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

      {!isSpecialTab && totalPages > 1 && (
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
