const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const saltRounds = 10;

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = new sqlite3.Database('./models/bookstore.db');

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.send('Пользователь не найден');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Неверный пароль');

    req.session.user = user;
    user.email === 'admin@store.com'
      ? res.redirect('/admin')
      : res.redirect('/user');
  });

  db.close();
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, saltRounds);
  const db = new sqlite3.Database('./models/bookstore.db');

  db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, hashed],
    (err) => {
      db.close();
      if (err) return res.send('Ошибка: Email уже зарегистрирован');
      res.redirect('/auth/login');
    });
});

module.exports = router;
