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

// POST login (session version)
router.post('/login', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // allow login with username or email
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE (email = ? OR username = ?) AND password_hash = ?
    `, [email || username, username || email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // store user in session
    req.session.user = rows[0];

    // redirect based on role
    if (rows[0].role === 'owner') {
      return res.json({ redirect: '/owner-dashboard.html' });
    } else if (rows[0].role === 'walker') {
      return res.json({ redirect: '/walker-dashboard.html' });
    } else {
      return res.status(403).json({ error: 'Unknown user role' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // default cookie name for express-session
    res.json({ message: 'Logged out' });
  });
});

// get all dogs for the currently logged-in owner
router.get('/mydogs', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.status(401).json({ error: 'Not authorized' });
  }
  try {
    const [rows] = await db.query(
      'SELECT dog_id, name FROM Dogs WHERE owner_id = ?',
      [req.session.user.user_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;