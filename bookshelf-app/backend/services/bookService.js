import { pool } from '../config/db.js';

/**
 * Ensure a book exists in the database, creating it if necessary
 * @param {Object} bookData - Book data from OpenLibrary or other source
 * @returns {Object} Book object with database ID
 */
export const ensureBookExists = async (bookData) => {
    try {
        const { openlibrary_id, isbn, title, author, published_year, cover_url, description } = bookData;

        // First, try to find existing book by openlibrary_id or isbn
        let existingBook = null;

        if (openlibrary_id) {
            const [books] = await pool.query(
                'SELECT * FROM books WHERE openlibrary_id = ?',
                [openlibrary_id]
            );
            if (books.length > 0) {
                existingBook = books[0];
            }
        }

        if (!existingBook && isbn) {
            const [books] = await pool.query(
                'SELECT * FROM books WHERE isbn = ?',
                [isbn]
            );
            if (books.length > 0) {
                existingBook = books[0];
            }
        }

        // If book exists, return it
        if (existingBook) {
            return existingBook;
        }

        // Otherwise, create a new book record
        const [result] = await pool.query(
            `INSERT INTO books (openlibrary_id, isbn, title, author, published_year, cover_url, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                openlibrary_id || null,
                isbn || null,
                title,
                author || null,
                published_year ? parseInt(published_year) : null,
                cover_url || null,
                description || null
            ]
        );

        const [newBooks] = await pool.query(
            'SELECT * FROM books WHERE id = ?',
            [result.insertId]
        );

        return newBooks[0];
    } catch (error) {
        console.error('Error ensuring book exists:', error);
        throw error;
    }
};

/**
 * Get a book by ID from the database
 */
export const getBookById = async (bookId) => {
    try {
        const [books] = await pool.query('SELECT * FROM books WHERE id = ?', [bookId]);
        return books.length > 0 ? books[0] : null;
    } catch (error) {
        console.error('Error getting book:', error);
        throw error;
    }
};

