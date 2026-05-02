import { useState, useEffect, useCallback } from 'react';
import { getAllBooks, addBook, updateBook, deleteBook } from './db';
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

  function handleSelect(book) {
    setSelectedBook(book);
    setView('detail');
  }

  function handleEdit(book) {
    setSelectedBook(book);
    setView('form');
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
        />
      );
  }
}
