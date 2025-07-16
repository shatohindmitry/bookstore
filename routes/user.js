const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

// Авторизованный пользователь (не админ)
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.email === 'admin@store.com') {
    return res.send('Доступ только для авторизованных пользователей');
  }
  next();
});

// Личный кабинет пользователя
router.get('/', (req, res) => {
  const db = new sqlite3.Database('./models/bookstore.db');

  db.all('SELECT * FROM books WHERE available = 1', (err, books) => {
    if (err) return res.send('Ошибка при получении книг');

    db.all('SELECT * FROM rentals WHERE user_id = ?', [req.session.user.id], (err2, rentals) => {
      if (err2) return res.send('Ошибка при получении аренд');

      db.all('SELECT * FROM purchases WHERE user_id = ?', [req.session.user.id], (err3, purchases) => {
        if (err3) return res.send('Ошибка при получении покупок');

        db.all(`SELECT * FROM rentals 
                WHERE user_id = ? AND status = 'active' 
                AND end_date <= DATE('now', '+2 days')`,
          [req.session.user.id],
          (warnErr, upcomingExpirations) => {
            if (warnErr) return res.send('Ошибка при получении напоминаний');

            res.render('user', {
              books,
              rentals,
              purchases,
              upcomingExpirations,
              session: req.session
            });

            db.close();
          });
      });
    });
  });
});

// Покупка книги
router.post('/buy/:bookId', (req, res) => {
  const db = new sqlite3.Database('./models/bookstore.db');
  const bookId = req.params.bookId;
  const userId = req.session.user.id;
  const now = dayjs().format('YYYY-MM-DD');

  db.run(
    `INSERT INTO purchases (user_id, book_id, purchase_date)
     VALUES (?, ?, ?)`,
    [userId, bookId, now],
    (err) => {
      if (err) {
        db.close();
        return res.send('Ошибка при покупке');
      }

      db.run(
        `UPDATE books SET available = 0, status = 'sold' WHERE id = ?`,
        [bookId],
        (err2) => {
          db.close();
          if (err2) return res.send('Ошибка обновления книги');
          res.redirect('/user');
        }
      );
    }
  );
});

// Аренда книги
router.post('/rent/:bookId', (req, res) => {
  const db = new sqlite3.Database('./models/bookstore.db');
  const { period } = req.body;
  const bookId = req.params.bookId;
  const userId = req.session.user.id;

  const start = dayjs();
  const durationInMonths = Number(period);
  const end = start.add(durationInMonths, 'month').format('YYYY-MM-DD');
  const startFormatted = start.format('YYYY-MM-DD');

  db.run(
    `INSERT INTO rentals (user_id, book_id, start_date, end_date, status)
     VALUES (?, ?, ?, ?, 'active')`,
    [userId, bookId, startFormatted, end],
    (err) => {
      if (err) {
        db.close();
        return res.send('Ошибка при аренде');
      }

      db.run(
        `UPDATE books SET status = 'rented', available = 0 WHERE id = ?`,
        [bookId],
        (err2) => {
          db.close();
          if (err2) return res.send('Ошибка при обновлении книги');
          res.redirect('/user');
        }
      );
    }
  );
});

module.exports = router;
