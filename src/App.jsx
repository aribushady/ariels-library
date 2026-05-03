import { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { getAllBooks, getBook, addBook, updateBook, deleteBook } from './db';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import BookDetail from './components/BookDetail';

export default function App() {
  const [view, setView] = useState('list');
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  const loadBooks = useCallback(async () => {
    const all = await getAllBooks();
    setBooks(all.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        setView('list');
        setSelectedBook(null);
        loadBooks();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadBooks]);

  async function handleSave(data) {
    if (data.id) {
      await updateBook(data);
    } else {
      await addBook(data);
    }
    await loadBooks();
    setView('list');
    setSelectedBook(null);
  }

  async function handleDelete(id) {
    await deleteBook(id);
    await loadBooks();
    setView('list');
    setSelectedBook(null);
  }

  async function handleSelect(book) {
    const fresh = await getBook(book.id);
    setSelectedBook(fresh);
    setView('detail');
  }

  async function handleEdit(book) {
    const fresh = await getBook(book.id);
    setSelectedBook(fresh);
    setView('form');
  }

  async function handleImport(file) {
    const zip = await JSZip.loadAsync(file);
    const csvFile = zip.file('library.csv');
    if (!csvFile) return;

    const csvText = await csvFile.async('text');
    const lines = csvText.split('\n');
    const headers = parseCSVRow(lines[0]);

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseCSVRow(lines[i]);
      const get = (name) => cols[headers.indexOf(name)] || '';

      const genres = get('Genres') ? get('Genres').split('; ').filter(Boolean) : [];
      const statusVal = get('Status');

      const bookData = {
        title: get('Title'),
        author: get('Author'),
        pages: get('Pages') ? parseInt(get('Pages'), 10) : null,
        genres,
        genre: genres[0] || '',
        series: get('Series') || null,
        seriesNumber: get('Series #') ? parseFloat(get('Series #')) : null,
        rating: get('Rating') ? parseInt(get('Rating'), 10) : 0,
        read: statusVal === 'Read',
        inProgress: statusVal === 'In Progress',
        dnf: statusVal === 'DNF',
        forDonation: get('For Donation') === 'Yes',
      };

      const coverPath = get('Cover');
      if (coverPath) {
        const coverFile = zip.file(coverPath);
        if (coverFile) {
          const blob = await coverFile.async('blob');
          const ext = coverPath.split('.').pop();
          const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          bookData.coverImage = new File([blob], coverPath.split('/').pop(), { type: mimeType });
        }
      }

      await addBook(bookData);
    }
    await loadBooks();
  }

  function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (inQuotes) {
        if (ch === '"' && row[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  switch (view) {
    case 'form':
      return (
        <BookForm
          book={selectedBook}
          onSave={handleSave}
          onCancel={() => { setView(selectedBook ? 'detail' : 'list'); }}
        />
      );
    case 'detail':
      return (
        <BookDetail
          book={selectedBook}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBack={() => { setView('list'); setSelectedBook(null); }}
        />
      );
    default:
      return (
        <BookList
          books={books}
          onSelect={handleSelect}
          onAdd={() => { setSelectedBook(null); setView('form'); }}
          onImport={handleImport}
        />
      );
  }
}
