const express = require('express');
const router = express.Router();
const path = require('path');
const mysql = require('mysql2/promise');

// DB connection config
const db = {
  host: "localhost",
  user: "root",
  password: "",
  database: "DogWalkService"
};

// serve the login page from public/index.html
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// handle login form submission
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const conn = await mysql.createConnection(db);

    // berify credentials against Users table
    const [rows] = await conn.execute(
      "SELECT * FROM Users WHERE username = ? AND password_hash = ?",
      [username, password]
    );

    // if valid login
    if (rows.length === 1) {
      const user = rows[0];

      // save user data to session
      req.session.user = {
        id: user.user_id,
        username: user.username,
        role: user.role
      };

      // redirect based on user role
      if (user.role === 'owner') {
        res.redirect('/owner');
      } else if (user.role === 'walker') {
        res.redirect('/walker');
      } else {
        res.status(403).send("Unknown role");
      }
    } else {
      // invalid credentials
      res.status(401).send("invalid login credentials");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("database error");
  }
});

// owner dashboard route (protected)
router.get('/owner', (req, res) => {
  if (req.session.user?.role === 'owner') {
    res.sendFile(path.join(__dirname, "../public/owner-dashboard.html"));
  } else {
    res.status(403).send("unauthorized");
  }
});

// walker dashboard route (protected)
router.get('/walker', (req, res) => {
  if (req.session.user?.role === 'walker') {
    res.sendFile(path.join(__dirname, "../public/walker-dashboard.html"));
  } else {
    res.status(403).send("unauthorized");
  }
});

// /logout - clears session and redirects to login page
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("error destroying session:", err);
      return res.status(500).send("Failed to logout");
    }

    // clear the cookie and redirect to login
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
