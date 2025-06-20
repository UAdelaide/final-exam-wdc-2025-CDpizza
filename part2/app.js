const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dogwalksecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');



app.use('/api/users', userRoutes);
app.use('/', walkRoutes);
// Export the app instead of listening here
module.exports = app;
