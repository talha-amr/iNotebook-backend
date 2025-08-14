const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');

// Connect to MongoDB
connectToMongo();

const app = express();

// Allow all origins (development only)
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

module.exports = app;
