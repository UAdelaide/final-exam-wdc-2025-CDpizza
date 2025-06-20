const express = require('express');
const router = express.Router();

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