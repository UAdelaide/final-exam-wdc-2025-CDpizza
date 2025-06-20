const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3001;


const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'DogWalkService'
};

let db;


async function insertTestData(connection) {
  try {
    // Insert users
    await connection.query(`
      INSERT IGNORE INTO Users (username, email, password_hash, role) VALUES
      ('alice123', 'alice@example.com', 'hashed123', 'owner'),
      ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
      ('carol123', 'carol@example.com', 'hashed789', 'owner'),
      ('pizzawalker', 'pizza@example.com', 'hashedzxc', 'walker'),
      ('vscodeowner', 'vscode@example.com', 'hasheasd', 'owner')
    `);

    // Dogs
    await connection.query(`
      INSERT IGNORE INTO Dogs (owner_id, name, size) VALUES
      ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
      ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
      ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Rocky', 'large'),
      ((SELECT user_id FROM Users WHERE username = 'vscodeowner'), 'Luna', 'medium'),
      ((SELECT user_id FROM Users WHERE username = 'vscodeowner'), 'Charlie', 'small')
    `);

    // Walk requests
    await connection.query(`
      INSERT IGNORE INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
      ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Rocky'), '2025-06-11 10:00:00', 60, 'Central Park', 'open'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Luna'), '2025-06-12 11:15:00', 40, 'Riverside Walk', 'completed'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Charlie'), '2025-06-13 14:00:00', 20, 'Downtown Plaza', 'cancelled')
    `);


    console.log('Test data inserted successfully');
  } catch (error) {
    console.error('Error inserting test data:', error.message);
  }
}

// Initialize database connection and insert test data
(async () => {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to DogWalkService database');
    await insertTestData(db);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Make sure MySQL is running and DogWalkService database exists');
    process.exit(1);
  }
})();

// Route 1: /api/dogs - Return all dogs with size and owner's username
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        Dogs.name AS dog_name,
        Dogs.size,
        Users.username AS owner_username
      FROM Dogs
      JOIN Users ON Dogs.owner_id = Users.user_id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 2: /api/walkrequests/open - Return all open walk requests
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        WalkRequests.request_id,
        Dogs.name AS dog_name,
        WalkRequests.requested_time,
        WalkRequests.duration_minutes,
        WalkRequests.location,
        Users.username AS owner_username
      FROM WalkRequests
      JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
      JOIN Users ON Dogs.owner_id = Users.user_id
      WHERE WalkRequests.status = 'open'
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 3: /api/walkers/summary - Return walker summary with ratings and completed walks
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the endpoints:`);
  console.log(`- http://localhost:${PORT}/api/dogs`);
  console.log(`- http://localhost:${PORT}/api/walkrequests/open`);
  console.log(`- http://localhost:${PORT}/api/walkers/summary`);
});

module.exports = app;