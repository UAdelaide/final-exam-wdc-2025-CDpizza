var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

// import the dog api route
var dogRouter = require('./routes/api/dog');

var app = express();

// enable cors for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// use the dog api route
app.use('/', dogRouter);

let db;

(async () => {
  try {
    // connect to mysql without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // set your mysql root password
    });

    // create the dogwalkservice database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await connection.end();

    // now connect to the dogwalkservice database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // execute the sql file to set up tables and data
    const fs = require('fs');
    const sqlFile = fs.readFileSync(path.join(__dirname, 'dogwalks.sql'), 'utf8');
    const statements = sqlFile.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));

    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement &&
          !trimmedStatement.startsWith('DROP DATABASE') &&
          !trimmedStatement.startsWith('CREATE DATABASE') &&
          !trimmedStatement.startsWith('USE')) {
        try {
          await db.query(trimmedStatement);
        } catch (err) {
          // ignore errors for statements that might already exist
          console.log('statement execution info:', trimmedStatement.substring(0, 50) + '...', err.message);
        }
      }
    }

    console.log('database setup completed successfully');

  } catch (err) {
    console.error('error setting up database. ensure mysql is running: service mysql start', err);
  }
})();

// route to return books as json (legacy route)
app.get('/books', async (req, res) => {
  try {
    const [books] = await db.execute('SELECT * FROM books');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch books' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;