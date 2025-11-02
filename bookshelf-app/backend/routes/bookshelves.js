import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getUserBookshelves,
    getBookshelf,
    createBookshelf,
    updateBookshelf,
    deleteBookshelf,
    addBookToBookshelf,
    removeBookFromBookshelf
} from '../controllers/bookshelfController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Bookshelf CRUD routes
router.get('/', getUserBookshelves); // Get all bookshelves for user
router.get('/:id', getBookshelf); // Get single bookshelf with books
router.post('/', createBookshelf); // Create new bookshelf
router.put('/:id', updateBookshelf); // Update bookshelf
router.delete('/:id', deleteBookshelf); // Delete bookshelf

// Bookshelf-Book relationship routes
router.post('/:id/books', addBookToBookshelf); // Add book to bookshelf
router.delete('/:id/books/:book_id', removeBookFromBookshelf); // Remove book from bookshelf

export default router;

