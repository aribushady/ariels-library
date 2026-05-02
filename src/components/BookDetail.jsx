import { useState, useEffect } from 'react';
import StarRating from './StarRating';

export default function BookDetail({ book, onEdit, onDelete, onBack }) {
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    if (book?.coverImage) {
      const url = URL.createObjectURL(book.coverImage);
      setCoverUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [book]);

  if (!book) return null;

  return (
    <div className="view">
      <header className="view-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Details</h1>
        <button className="edit-btn" onClick={() => onEdit(book)}>Edit</button>
      </header>

      <div className="book-detail">
        {coverUrl ? (
          <img src={coverUrl} alt={book.title} className="detail-cover" />
        ) : (
          <div className="detail-cover-placeholder">No Cover</div>
        )}

        <h2 className="detail-title">{book.title}</h2>
        {book.author && <p className="detail-author">by {book.author}</p>}

        <div className="detail-meta">
          {book.genre && <span className="badge genre-badge">{book.genre}</span>}
          {book.read && <span className="badge read-badge">Read</span>}
          {book.forDonation && <span className="badge donate-badge">For Donation</span>}
        </div>

        <StarRating value={book.rating} readonly />

        {book.pages && <p className="detail-pages">{book.pages} pages</p>}

        <button className="delete-btn" onClick={() => {
          if (confirm('Delete this book?')) onDelete(book.id);
        }}>
          Delete Book
        </button>
      </div>
    </div>
  );
}
