const express = require('express');
const path = require('path');
const dogRoutes = require('./routes/dogRoutes');
const session = require('express-session'); // added session support for login persistence

require('dotenv').config();

const app = express();

// middleware
app.use(express.urlencoded({ extended: true })); // added to handle form submissions (e.g., login POST)
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

app.use(session({
  secret: 'superdogsecret', // session secret (would move to .env if this was a meanigful piece of work)
  resave: false,
  saveUninitialized: true
})); //  express-session middleware


// route imports
const indexRoutes = require('./routes/index'); // added new route for login and dashboard handling
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

// route mounting
app.use('/', indexRoutes); // mounted index route (handles /login, /owner, /walker)
app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes);


module.exports = app;
