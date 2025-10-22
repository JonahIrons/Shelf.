import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { checkConnection } from './config/db.js';
import { createAllTable } from './utils/dbUtils.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import booksRoutes from './routes/books.js';

// API Routes
app.use('/api/books', booksRoutes);
app.use('/api/auth', authRoutes)

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
app.listen(PORT, async() => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Bookshelf Backend API ready at http://localhost:${PORT}`);

  try {
    await checkConnection();
    await createAllTable(); //Auto-create tables on start (if not exists)
  }
  catch (error) {
    console.log("Failed to initialize the database", error);
  }
});

export default app;
