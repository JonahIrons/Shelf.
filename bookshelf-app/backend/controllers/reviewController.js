import { pool } from '../config/db.js';
import { ensureBookExists } from '../services/bookService.js';

// GET /api/reviews - list current user's reviews with book info
export const listUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query(
            `SELECT r.id, r.book_id, r.rating, r.review_text, r.created_at,
                    b.title, b.author, b.cover_url, b.published_year
             FROM reviews r
             INNER JOIN books b ON r.book_id = b.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );
        res.status(200).json({ success: true, reviews: rows });
    } catch (error) {
        console.error('List reviews error:', error);
        res.status(500).json({ success: false, message: 'Failed to load reviews' });
    }
};

// POST /api/reviews - create review (accepts book_id or book_data)
export const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { book_id, book_data, rating, review_text } = req.body;

        if (!rating || rating < 1 || rating > 10) {
            return res.status(400).json({ success: false, message: 'Rating must be 1-10' });
        }

        let finalBookId = book_id;
        if (!finalBookId) {
            if (!book_data || !book_data.title) {
                return res.status(400).json({ success: false, message: 'book_id or valid book_data is required' });
            }
            const saved = await ensureBookExists(book_data);
            finalBookId = saved.id;
        }

        // One review per user per book (enforced by unique constraint too)
        const [existing] = await pool.query(
            'SELECT id FROM reviews WHERE user_id = ? AND book_id = ?',
            [userId, finalBookId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'You already reviewed this book' });
        }

        await pool.query(
            'INSERT INTO reviews (user_id, book_id, rating, review_text) VALUES (?, ?, ?, ?)',
            [userId, finalBookId, rating, review_text || null]
        );

        res.status(201).json({ success: true, message: 'Review created' });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, message: 'Failed to create review' });
    }
};

// PUT /api/reviews/:id - update rating/text of a review owned by the user
// Transaction prevents concurrent modifications if reviews are made public in the future
export const updateReview = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, review_text } = req.body;

    // Validate input
    if (rating !== undefined && (rating < 1 || rating > 10)) {
        return res.status(400).json({ success: false, message: 'Rating must be 1-10' });
    }

    // Build update fields
    const updates = [];
    const params = [];
    if (rating !== undefined) {
        updates.push('rating = ?');
        params.push(rating);
    }
    if (review_text !== undefined) {
        updates.push('review_text = ?');
        params.push(review_text || null);
    }
    if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Get a connection from the pool for transaction
    const connection = await pool.getConnection();

    try {
        // Utilize default REPEATABLE READ isolation level
        await connection.beginTransaction();

        // Verify ownership and lock the review row
        const [rows] = await connection.query(
            'SELECT * FROM reviews WHERE id = ? AND user_id = ? FOR UPDATE',
            [id, userId]
        );

        if (rows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const currentReview = rows[0];

        // Perform the update within transaction
        params.push(id, userId);
        await connection.query(
            `UPDATE reviews SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            params
        );

        // Commit the transaction
        await connection.commit();

        // Release connection and return success
        connection.release();
        res.status(200).json({ 
            success: true, 
            message: 'Review updated',
            review: {
                id: parseInt(id),
                rating: rating !== undefined ? rating : currentReview.rating,
                review_text: review_text !== undefined ? review_text : currentReview.review_text
            }
        });
    } catch (error) {
        // Rollback transaction on any error
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
        }

        // Always release connection
        try {
            connection.release();
        } catch (releaseError) {
            console.error('Connection release error:', releaseError);
        }

        console.error('Update review error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Check for specific database errors
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
            return res.status(409).json({
                success: false,
                message: 'Review is currently being updated by another process. Please try again.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// DELETE /api/reviews/:id - delete review owned by the user
export const deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const [rows] = await pool.query('SELECT id FROM reviews WHERE id = ? AND user_id = ?', [id, userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        await pool.query('DELETE FROM reviews WHERE id = ? AND user_id = ?', [id, userId]);
        res.status(200).json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};
