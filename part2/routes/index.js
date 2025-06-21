const express = require('express');
const router = express.Router();
const path = require('path');
const mysql = require('mysql2/promise');

// GET / => index.html
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const conn = await mysql.createConnection(db);
    const [rows] = await conn.execute(
      "SELECT * FROM Users WHERE username = ? AND password_hash = ?",
      [username, password]
    );

    if (rows.length === 1) {
      const user = rows[0];
      req.session.user = {
        id: user.user_id,
        username: user.username,
        role: user.role
      };

      if (user.role === 'owner') {
        res.redirect('/owner');
      } else if (user.role === 'walker') {
        res.redirect('/walker');
      } else {
        res.status(403).send("Unknown role");
      }
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// GET /owner
router.get('/owner', (req, res) => {
  if (req.session.user?.role === 'owner') {
    res.sendFile(path.join(__dirname, "../public/owner.html"));
  } else {
    res.status(403).send("Unauthorized");
  }
});

// GET /walker
router.get('/walker', (req, res) => {
  if (req.session.user?.role === 'walker') {
    res.sendFile(path.join(__dirname, "../public/walker.html"));
  } else {
    res.status(403).send("Unauthorized");
  }
});

module.exports = router;
