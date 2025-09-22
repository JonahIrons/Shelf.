const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const booksRoutes = require('./routes/books');

// API Routes
app.use('/api/books', booksRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bookshelf Backend API is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      search: 'GET /api/books/search?q=search_term',
      allBooks: 'GET /api/books',
      bookById: 'GET /api/books/:id',
      addBook: 'POST /api/books'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 Bookshelf Backend API ready at http://localhost:${PORT}`);
});

module.exports = app;
