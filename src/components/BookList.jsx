import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import bannerImg from '../assets/banner.png';

export default function BookList({ books, onSelect, onAdd }) {
  const [coverUrls, setCoverUrls] = useState({});
  const [search, setSearch] = useState('');

  const filtered = books.filter((book) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return book.title?.toLowerCase().includes(q) || book.author?.toLowerCase().includes(q);
  });

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
      </header>

      {books.length > 0 && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {books.length === 0 ? (
        <div className="empty-state">
          <p>No books yet</p>
          <p>Tap + to add your first book</p>
        </div>
      ) : (
        <div className="book-grid">
          {filtered.map((book) => (
            <button key={book.id} className="book-card" onClick={() => onSelect(book)}>
              {coverUrls[book.id] ? (
                <img src={coverUrls[book.id]} alt={book.title} className="card-cover" />
              ) : (
                <div className="card-cover-placeholder">{book.title.charAt(0)}</div>
              )}
              <div className="card-info">
                <span className="card-title">{book.title}</span>
                <span className="card-author">{book.author}</span>
                <StarRating value={book.rating} readonly />
                <div className="card-badges">
                  {book.read && <span className="badge read-badge">Read</span>}
                  {book.forDonation && <span className="badge donate-badge">Donate</span>}
                </div>
              </div>
            </button>
          ))}
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
