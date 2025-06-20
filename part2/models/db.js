const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'DogWalkService',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const response = await fetch('http://localhost:3001/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: this.username, password: this.password })
});

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:8080', // or '*'
  credentials: true
}));

module.exports = pool;