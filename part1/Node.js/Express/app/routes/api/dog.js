const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// database connection
let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });
  } catch (err) {
    console.error('error connecting to dogwalkservice database:', err);
  }
})();

router.get('/api/dogs', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          Dogs.dog_id,
          Dogs.name,
          Dogs.size,
          Dogs.owner_id
        FROM Dogs
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;