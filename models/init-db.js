const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const dayjs = require('dayjs');

const db = new sqlite3.Database('./models/bookstore.db');
const saltRounds = 10;

db.serialize(async () => {
  // USERS
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // BOOKS
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT,
    year INTEGER,
    price REAL,
    status TEXT,
    available BOOLEAN
  )`);

  // RENTALS
  db.run(`CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    book_id INTEGER,
    start_date TEXT,
    end_date TEXT,
    status TEXT
  )`);

  // PURCHASES
  db.run(`CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    book_id INTEGER,
    purchase_date TEXT
  )`);

  // Добавить администратора
  const adminPassword = await bcrypt.hash('admin', saltRounds);
  db.run(`INSERT OR IGNORE INTO users (name, email, password) VALUES (?, ?, ?)`,
    ['Admin', 'admin@store.com', adminPassword]);

  // Примеры книг
  const books = [
    ['Преступление и наказание', 'Фёдор Достоевский', 'Роман', 1866, 9.99],
    ['Мастер и Маргарита', 'Михаил Булгаков', 'Фантастика', 1967, 11.99],
    ['1984', 'Джордж Оруэлл', 'Антиутопия', 1949, 10.49],
    ['Война и мир', 'Лев Толстой', 'История', 1869, 14.99]
  ];

  books.forEach(([title, author, category, year, price]) => {
    db.run(`INSERT INTO books (title, author, category, year, price, status, available)
            VALUES (?, ?, ?, ?, ?, 'available', 1)`,
      [title, author, category, year, price]);
  });

  console.log('✅ База данных создана и заполнена.');
  db.close();
});
