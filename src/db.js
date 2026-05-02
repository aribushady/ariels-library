import { openDB } from 'idb';

const DB_NAME = 'ariels-library';
const STORE = 'books';

function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function getAllBooks() {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function getBook(id) {
  const db = await getDb();
  return db.get(STORE, id);
}

export async function addBook(book) {
  const db = await getDb();
  return db.add(STORE, { ...book, createdAt: Date.now() });
}

export async function updateBook(book) {
  const db = await getDb();
  return db.put(STORE, book);
}

export async function deleteBook(id) {
  const db = await getDb();
  return db.delete(STORE, id);
}
