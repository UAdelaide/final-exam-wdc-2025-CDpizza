var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');
var cors = require('cors');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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

    console.log('Connected to DogWalkService database');
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

// import routes
const dogRoutes = require('./routes/api/dog');

// make db available to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// use routes
app.use('/', dogRoutes);

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;