const express = require('express');
const router = express.Router();
const db = require('../models/db');
const fetch = require('node-fetch');

// GET all walk requests (for walkers to view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT wr.*, d.name AS dog_name, d.size, u.username AS owner_name
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// POST a new walk request (from owner)
router.post('/', async (req, res) => {
  const { dog_id, requested_time, duration_minutes, location } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location)
      VALUES (?, ?, ?, ?)
    `, [dog_id, requested_time, duration_minutes, location]);

    res.status(201).json({ message: 'Walk request created', request_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create walk request' });
  }
});

// POST an application to walk a dog (from walker)
router.post('/:id/apply', async (req, res) => {
  const requestId = req.params.id;
  const { walker_id } = req.body;

  try {
    await db.query(`
      INSERT INTO WalkApplications (request_id, walker_id)
      VALUES (?, ?)
    `, [requestId, walker_id]);

    await db.query(`
      UPDATE WalkRequests
      SET status = 'accepted'
      WHERE request_id = ?
    `, [requestId]);

    res.status(201).json({ message: 'Application submitted' });
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to apply for walk' });
  }
});

// get all dogs with a random photo from dogs.ceo
router.get('/api/dogs', async (req, res) => {
  try {
    // get all dogs from the database
    const [dogs] = await db.query('SELECT dog_id, name, size, owner_id FROM Dogs');

    // fetch a random photo for each dog from dogs.ceo
    const dogsWithPhotos = await Promise.all(dogs.map(async (dog) => {
      // fetch a random dog photo
      let photoUrl = '';
      try {
        const response = await fetch('https://dog.ceo/api/breeds/image/random');
        const data = await response.json();
        photoUrl = data.message;
      } catch (err) {
        // fallback to empty string if fetch fails
        photoUrl = '';
      }
      // return dog info with photo
      return { ...dog, photo: photoUrl };
    }));

    // return the dogs with photos
    res.json(dogsWithPhotos);
  } catch (error) {
    // handle errors
    res.status(500).json({ error: 'failed to fetch dogs' });
  }
});

module.exports = router;