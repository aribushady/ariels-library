import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import CoverPicker from './CoverPicker';

const GENRES = [
  'Fantasy', 'Mystery', 'Thriller', 'Historical Fiction', 'Science Fiction',
  'Horror', 'Literary', 'Young Adult', 'Romance', 'Western',
  'Contemporary', 'Classic',
];

export default function BookForm({ book, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState(0);
  const [read, setRead] = useState(false);
  const [forDonation, setForDonation] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setAuthor(book.author || '');
      setPages(book.pages?.toString() || '');
      setGenre(book.genre || '');
      setRating(book.rating || 0);
      setRead(book.read || false);
      setForDonation(book.forDonation || false);
      if (book.coverImage) {
        const url = URL.createObjectURL(book.coverImage);
        setCoverUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [book]);

  function handleCoverChange(file) {
    setCoverFile(file);
    setCoverUrl(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      ...(book || {}),
      title: title.trim(),
      author: author.trim(),
      pages: pages ? parseInt(pages, 10) : null,
      genre,
      rating,
      read,
      forDonation,
    };

    if (coverFile) {
      data.coverImage = coverFile;
    } else if (book?.coverImage && !coverFile) {
      data.coverImage = book.coverImage;
    }

    onSave(data);
  }

  return (
    <div className="view">
      <header className="view-header">
        <button className="back-btn" onClick={onCancel}>Cancel</button>
        <h1>{book ? 'Edit Book' : 'Add Book'}</h1>
        <button className="save-btn" onClick={handleSubmit}>Save</button>
      </header>

      <form className="book-form" onSubmit={handleSubmit}>
        <CoverPicker coverUrl={coverUrl} onChange={handleCoverChange} />

        <label>
          Title *
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
            required
          />
        </label>

        <label>
          Author
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author name"
          />
        </label>

        <label>
          Pages
          <input
            type="number"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="Number of pages"
            min="1"
          />
        </label>

        <label>
          Genre
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Select genre...</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <div className="field">
          <span className="field-label">Rating</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="toggle-row">
          <span>Read</span>
          <button
            type="button"
            className={`toggle ${read ? 'on' : ''}`}
            onClick={() => setRead(!read)}
            role="switch"
            aria-checked={read}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="toggle-row">
          <span>Mark for Donation</span>
          <button
            type="button"
            className={`toggle ${forDonation ? 'on' : ''}`}
            onClick={() => setForDonation(!forDonation)}
            role="switch"
            aria-checked={forDonation}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </form>
    </div>
  );
}
