import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import CoverPicker from './CoverPicker';

const GENRES = [
  'Fantasy', 'Gothic', 'Southern Gothic', 'Mystery', 'Thriller', 'Historical Fiction',
  'Science Fiction', 'Horror', 'Literary', 'Young Adult', 'Romance', 'Western',
  'Contemporary', 'Classic',
];

export default function BookForm({ book, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [genre, setGenre] = useState('');
  const [series, setSeries] = useState('');
  const [seriesNumber, setSeriesNumber] = useState('');
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState('none');
  const [forDonation, setForDonation] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setAuthor(book.author || '');
      setPages(book.pages?.toString() || '');
      setGenre(book.genre || '');
      setSeries(book.series || '');
      setSeriesNumber(book.seriesNumber?.toString() || '');
      setRating(book.rating || 0);
      if (book.inProgress) setStatus('inProgress');
      else if (book.read) setStatus('read');
      else if (book.dnf) setStatus('dnf');
      else setStatus('none');
      setForDonation(book.forDonation || false);
      setCoverFile(null);
      if (book.coverImage) {
        const url = URL.createObjectURL(book.coverImage);
        setCoverUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setCoverUrl(null);
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
      series: series.trim() || null,
      seriesNumber: seriesNumber ? parseFloat(seriesNumber) : null,
      rating,
      read: status === 'read',
      inProgress: status === 'inProgress',
      dnf: status === 'dnf',
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

        <div className="series-row">
          <label className="series-name">
            Series
            <input
              type="text"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              placeholder="Series name"
            />
          </label>
          <label className="series-num">
            #
            <input
              type="number"
              value={seriesNumber}
              onChange={(e) => setSeriesNumber(e.target.value)}
              placeholder="#"
              min="0"
              step="0.5"
            />
          </label>
        </div>

        <div className="field">
          <span className="field-label">Rating</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="field">
          <span className="field-label">Reading Status</span>
          <div className="status-chips">
            {[
              ['none', 'Not Started'],
              ['inProgress', 'In Progress'],
              ['read', 'Read'],
              ['dnf', 'DNF'],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`chip ${status === val ? 'chip-active' : ''}`}
                onClick={() => setStatus(val)}
              >
                {label}
              </button>
            ))}
          </div>
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
