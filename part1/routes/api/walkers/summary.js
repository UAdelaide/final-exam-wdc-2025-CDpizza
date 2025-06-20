app.get('/api/walkers/summary', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          u.username AS walker_username,
          COUNT(r.rating_id) AS total_ratings,
          AVG(r.rating) AS average_rating,
          (
            SELECT COUNT(*)
            FROM WalkApplications wa
            JOIN WalkRequests wr ON wa.request_id = wr.request_id
            WHERE wa.walker_id = u.user_id AND wr.status = 'completed'
          ) AS completed_walks
        FROM Users u
        LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
        WHERE u.role = 'walker'
        GROUP BY u.user_id, u.username
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });