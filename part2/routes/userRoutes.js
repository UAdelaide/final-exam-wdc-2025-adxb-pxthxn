const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login (dummy version)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE email = ? AND password_hash = ?
    `, [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/users/mydogs - return all dogs owned by the logged-in user
router.get('/mydogs', async (req, res) => {
  // reject if user not logged in or not an owner
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.status(403).json({ error: 'access denied' });
  }

  const ownerId = req.session.user.id;

  try {
    // query for dogs belonging to this user
    const [rows] = await db.query(
      'SELECT dog_id, name, size FROM Dogs WHERE owner_id = ?',
      [ownerId]
    );

    // return list of dogs as JSON
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'failed to fetch dogs' });
  }
});

module.exports = router;