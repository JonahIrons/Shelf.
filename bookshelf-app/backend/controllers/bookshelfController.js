import { pool } from '../config/db.js';
import { ensureBookExists } from '../services/bookService.js';

/**
 * Get all bookshelves for the authenticated user
 */
export const getUserBookshelves = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [bookshelves] = await pool.query(
            'SELECT * FROM bookshelves WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.status(200).json({
            success: true,
            bookshelves: bookshelves
        });
    } catch (error) {
        console.error('Get bookshelves error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bookshelves'
        });
    }
};

/**
 * Get a single bookshelf by ID (with its books)
 */
export const getBookshelf = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Get bookshelf
        const [bookshelves] = await pool.query(
            'SELECT * FROM bookshelves WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (bookshelves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bookshelf not found'
            });
        }

        const bookshelf = bookshelves[0];

        // Get books in this bookshelf
        const [books] = await pool.query(
            `SELECT b.*, bb.added_at 
             FROM books b
             INNER JOIN bookshelf_books bb ON b.id = bb.book_id
             WHERE bb.bookshelf_id = ?
             ORDER BY bb.added_at DESC`,
            [id]
        );

        res.status(200).json({
            success: true,
            bookshelf: {
                ...bookshelf,
                books: books
            }
        });
    } catch (error) {
        console.error('Get bookshelf error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve bookshelf'
        });
    }
};

/**
 * Create a new bookshelf
 */
export const createBookshelf = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Bookshelf name is required'
            });
        }

        // Check if user already has a bookshelf with this name
        const [existing] = await pool.query(
            'SELECT * FROM bookshelves WHERE user_id = ? AND name = ?',
            [userId, name.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You already have a bookshelf with this name'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO bookshelves (user_id, name, description) VALUES (?, ?, ?)',
            [userId, name.trim(), description || null]
        );

        const [newBookshelf] = await pool.query(
            'SELECT * FROM bookshelves WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Bookshelf created successfully',
            bookshelf: newBookshelf[0]
        });
    } catch (error) {
        console.error('Create bookshelf error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create bookshelf'
        });
    }
};

/**
 * Update a bookshelf
 */
export const updateBookshelf = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, description } = req.body;

        // Verify bookshelf exists and belongs to user
        const [bookshelves] = await pool.query(
            'SELECT * FROM bookshelves WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (bookshelves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bookshelf not found'
            });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name !== undefined) {
            if (name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Bookshelf name cannot be empty'
                });
            }
            
            // Check if another bookshelf with this name exists
            const [existing] = await pool.query(
                'SELECT * FROM bookshelves WHERE user_id = ? AND name = ? AND id != ?',
                [userId, name.trim(), id]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have a bookshelf with this name'
                });
            }

            updates.push('name = ?');
            values.push(name.trim());
        }

        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id, userId);

        await pool.query(
            `UPDATE bookshelves SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );

        const [updated] = await pool.query(
            'SELECT * FROM bookshelves WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Bookshelf updated successfully',
            bookshelf: updated[0]
        });
    } catch (error) {
        console.error('Update bookshelf error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update bookshelf'
        });
    }
};

/**
 * Delete a bookshelf
 */
export const deleteBookshelf = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify bookshelf exists and belongs to user
        const [bookshelves] = await pool.query(
            'SELECT * FROM bookshelves WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (bookshelves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bookshelf not found'
            });
        }

        // Delete bookshelf (cascade will handle bookshelf_books)
        await pool.query(
            'DELETE FROM bookshelves WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Bookshelf deleted successfully'
        });
    } catch (error) {
        console.error('Delete bookshelf error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bookshelf'
        });
    }
};

/**
 * Add a book to a bookshelf
 * Accepts either book_id (if book already in DB) or full book data (to create book record)
 */
export const addBookToBookshelf = async (req, res) => {
    try {
        const { id } = req.params; // bookshelf id
        const userId = req.user.id;
        const { book_id, book_data } = req.body;

        // Verify bookshelf exists and belongs to user
        const [bookshelves] = await pool.query(
            'SELECT * FROM bookshelves WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (bookshelves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bookshelf not found'
            });
        }

        let finalBookId = book_id;

        // If book_data is provided, ensure the book exists in the database
        if (book_data && !book_id) {
            try {
                const book = await ensureBookExists(book_data);
                finalBookId = book.id;
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save book to database'
                });
            }
        }

        if (!finalBookId) {
            return res.status(400).json({
                success: false,
                message: 'Book ID or book data is required'
            });
        }

        // Verify book exists in database
        const [existingBooks] = await pool.query(
            'SELECT * FROM books WHERE id = ?',
            [finalBookId]
        );

        if (existingBooks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found in database'
            });
        }

        // Check if book is already in this bookshelf
        const [existing] = await pool.query(
            'SELECT * FROM bookshelf_books WHERE bookshelf_id = ? AND book_id = ?',
            [id, finalBookId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Book is already in this bookshelf'
            });
        }

        await pool.query(
            'INSERT INTO bookshelf_books (bookshelf_id, book_id) VALUES (?, ?)',
            [id, finalBookId]
        );

        res.status(200).json({
            success: true,
            message: 'Book added to bookshelf successfully',
            book_id: finalBookId
        });
    } catch (error) {
        console.error('Add book to bookshelf error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add book to bookshelf'
        });
    }
};

/**
 * Remove a book from a bookshelf
 */
export const removeBookFromBookshelf = async (req, res) => {
    try {
        const { id, book_id } = req.params; // bookshelf id and book id
        const userId = req.user.id;

        // Verify bookshelf exists and belongs to user
        const [bookshelves] = await pool.query(
            'SELECT * FROM bookshelves WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (bookshelves.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bookshelf not found'
            });
        }

        await pool.query(
            'DELETE FROM bookshelf_books WHERE bookshelf_id = ? AND book_id = ?',
            [id, book_id]
        );

        res.status(200).json({
            success: true,
            message: 'Book removed from bookshelf successfully'
        });
    } catch (error) {
        console.error('Remove book from bookshelf error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove book from bookshelf'
        });
    }
};

