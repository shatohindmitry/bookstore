const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Главная страница со списком книг и сортировкой
router.get('/', (req, res) => {
  const sortBy = req.query.sort || 'title';
  const allowedSorts = ['author', 'category', 'year'];
  const column = allowedSorts.includes(sortBy) ? sortBy : 'title';

  const db = new sqlite3.Database('./models/bookstore.db');
  db.all(`SELECT * FROM books ORDER BY ${column}`, (err, books) => {
    db.close();
    if (err) return res.send('Ошибка загрузки книг');
    res.render('index', { books });
  });
});

module.exports = router;
