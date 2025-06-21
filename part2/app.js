const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true })); // To parse form POSTs
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

app.use(session({
  secret: 'superdogsecret',
  resave: false,
  saveUninitialized: true
}));

// Route imports
const indexRoutes = require('./routes/index'); // <-- Your login + dashboard routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

// Route mounting
app.use('/', indexRoutes); 
app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
