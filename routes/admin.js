const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

router.use((req, res, next) => {
  if (!req.session.user || req.session.user.email !== 'admin@store.com') {
    return res.send('Нет доступа');
  }
  next();
});

router.get('/', (req, res) => {
  const db = new sqlite3.Database('./models/bookstore.db');
  db.all('SELECT * FROM books', (err, books) => {
    db.all('SELECT * FROM users', (e, users) => {
      db.all('SELECT * FROM rentals', (rErr, rentals) => {
        res.render('admin', { books, users, rentals });
        db.close();
      });
    });
  });
});

router.post('/add-book', (req, res) => {
  const { title, author, category, year, price } = req.body;
  const db = new sqlite3.Database('./models/bookstore.db');
  db.run(`INSERT INTO books (title, author, category, year, price, status, available)
          VALUES (?, ?, ?, ?, ?, 'available', 1)`,
    [title, author, category, year, price],
    () => {
      db.close();
      res.redirect('/admin');
    });
});

router.post('/delete-book/:id', (req, res) => {
  const db = new sqlite3.Database('./models/bookstore.db');
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], () => {
    db.close();
    res.redirect('/admin');
  });
});

router.post('/toggle-availability/:id', (req, res) => {
  const db = new sqlite3.Database('./models/bookstore.db');
  db.run(`UPDATE books SET available = NOT available WHERE id = ?`, [req.params.id], () => {
    db.close();
    res.redirect('/admin');
  });
});

module.exports = router;
