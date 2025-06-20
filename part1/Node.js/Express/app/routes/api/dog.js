const express = require('express');
const router = express.Router();

router.get('/api/dogs', async (req, res) => {
    try {
      const [rows] = await req.db.query(`
        SELECT
          Dogs.dog_id,
          Dogs.name AS dog_name,
          Dogs.size,
          Dogs.owner_id,
          Users.username AS owner_username
        FROM Dogs
        JOIN Users ON Dogs.owner_id = Users.user_id
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;