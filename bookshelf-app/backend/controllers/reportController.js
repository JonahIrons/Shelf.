import { pool } from '../config/db.js';

/**
 * Generate a report of books with filtering options
 * Filters: bookshelf, author, published year range, rating range
 * Statistics: average rating, total books, average books per bookshelf, etc.
 */
export const generateBookReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            bookshelf_id,
            author,
            year_from,
            year_to,
            rating_min,
            rating_max,
            limit = 100,
            offset = 0
        } = req.query;

        // Build the WHERE clause dynamically
        let whereConditions = [];
        const queryParams = [userId]; // Start with userId for the reviews join

        // Base condition: only show books in user's bookshelves or books user has reviewed
        if (bookshelf_id) {
            whereConditions.push('bb.bookshelf_id = ?');
            queryParams.push(bookshelf_id);
            // Ensure user owns this bookshelf
            whereConditions.push('bs.user_id = ?');
            queryParams.push(userId);
        } else {
            // Show books from user's bookshelves
            whereConditions.push('bs.user_id = ?');
            queryParams.push(userId);
        }

        // Filter by author if provided
        if (author) {
            whereConditions.push('b.author LIKE ?');
            queryParams.push(`%${author}%`);
        }

        // Filter by published year range
        if (year_from) {
            whereConditions.push('b.published_year >= ?');
            queryParams.push(parseInt(year_from));
        }
        if (year_to) {
            whereConditions.push('b.published_year <= ?');
            queryParams.push(parseInt(year_to));
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        // Build having clause for rating filters (after aggregation)
        let havingConditions = [];
        const havingParams = [];
        
        if (rating_min) {
            havingConditions.push('AVG(r.rating) >= ?');
            havingParams.push(parseFloat(rating_min));
        }
        if (rating_max) {
            havingConditions.push('AVG(r.rating) <= ?');
            havingParams.push(parseFloat(rating_max));
        }

        const havingClause = havingConditions.length > 0
            ? `HAVING ${havingConditions.join(' AND ')}`
            : '';

        // Get filtered books
        const booksQuery = `
            SELECT DISTINCT
                b.id,
                b.title,
                b.author,
                b.published_year,
                b.isbn,
                b.cover_url,
                b.description,
                AVG(r.rating) as avg_rating,
                COUNT(DISTINCT r.id) as review_count,
                COUNT(DISTINCT bb.bookshelf_id) as bookshelf_count,
                GROUP_CONCAT(DISTINCT bs.name ORDER BY bs.name) as bookshelf_names
            FROM books b
            INNER JOIN bookshelf_books bb ON b.id = bb.book_id
            INNER JOIN bookshelves bs ON bb.bookshelf_id = bs.id
            LEFT JOIN reviews r ON b.id = r.book_id AND r.user_id = ?
            ${whereClause}
            GROUP BY b.id, b.title, b.author, b.published_year, b.isbn, b.cover_url, b.description
            ${havingClause}
            ORDER BY b.title
            LIMIT ? OFFSET ?
        `;

        const booksParams = [...queryParams, ...havingParams, parseInt(limit), parseInt(offset)];
        const [books] = await pool.query(booksQuery, booksParams);

        // Calculate statistics - build query with correct parameter order
        let statsWhereConditions = [];
        const statsWhereParams = [];

        // Build WHERE conditions and params in the correct order
        if (bookshelf_id) {
            statsWhereConditions.push('bb.bookshelf_id = ?');
            statsWhereParams.push(parseInt(bookshelf_id)); // Ensure it's an integer
            statsWhereConditions.push('bs.user_id = ?');
            statsWhereParams.push(userId);
        } else {
            statsWhereConditions.push('bs.user_id = ?');
            statsWhereParams.push(userId);
        }

        if (author) {
            statsWhereConditions.push('b.author LIKE ?');
            statsWhereParams.push(`%${author}%`);
        }
        if (year_from) {
            statsWhereConditions.push('b.published_year >= ?');
            statsWhereParams.push(parseInt(year_from));
        }
        if (year_to) {
            statsWhereConditions.push('b.published_year <= ?');
            statsWhereParams.push(parseInt(year_to));
        }

        const statsWhereClause = statsWhereConditions.length > 0
            ? `WHERE ${statsWhereConditions.join(' AND ')}`
            : '';

        // Statistics query - parameters used in order:
        // 1. userId (for avg_books_per_bookshelf subquery)
        // 2. userId (for reviews LEFT JOIN)
        // 3. userId (for book_ratings subquery)
        // 4. ...statsWhereParams (for WHERE clause - comes LAST!)
        const statsQuery = `
            SELECT 
                COUNT(DISTINCT b.id) as total_books,
                COUNT(DISTINCT bs.id) as total_bookshelves,
                AVG(book_ratings.avg_rating) as overall_avg_rating,
                COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN b.id END) as total_books_with_reviews,
                COUNT(DISTINCT b.author) as unique_authors,
                MIN(b.published_year) as earliest_year,
                MAX(b.published_year) as latest_year,
                (
                    SELECT AVG(books_per_bs)
                    FROM (
                        SELECT bs2.id, COUNT(DISTINCT bb2.book_id) as books_per_bs
                        FROM bookshelves bs2
                        LEFT JOIN bookshelf_books bb2 ON bs2.id = bb2.bookshelf_id
                        LEFT JOIN books b2 ON bb2.book_id = b2.id
                        WHERE bs2.user_id = ?
                        GROUP BY bs2.id
                    ) as bs_stats
                ) as avg_books_per_bookshelf
            FROM books b
            INNER JOIN bookshelf_books bb ON b.id = bb.book_id
            INNER JOIN bookshelves bs ON bb.bookshelf_id = bs.id
            LEFT JOIN reviews r ON b.id = r.book_id AND r.user_id = ?
            LEFT JOIN (
                SELECT book_id, AVG(rating) as avg_rating
                FROM reviews
                WHERE user_id = ?
                GROUP BY book_id
            ) as book_ratings ON b.id = book_ratings.book_id
            ${statsWhereClause}
        `;

        // Build final parameter array in the exact order needed by the query
        // Order: userId (subquery), userId (reviews), userId (book_ratings), ...statsWhereParams (WHERE clause)
        const finalStatsParams = [userId, userId, userId, ...statsWhereParams];
        const [stats] = await pool.query(statsQuery, finalStatsParams);

        // Count total bookshelves separately (including empty ones)
        let bookshelfCountQuery = 'SELECT COUNT(*) as total FROM bookshelves WHERE user_id = ?';
        let bookshelfCountParams = [userId];
        
        // If filtering by specific bookshelf, only count that one
        if (bookshelf_id) {
            bookshelfCountQuery = 'SELECT COUNT(*) as total FROM bookshelves WHERE user_id = ? AND id = ?';
            bookshelfCountParams = [userId, bookshelf_id];
        }
        
        const [bookshelfCount] = await pool.query(bookshelfCountQuery, bookshelfCountParams);
        const totalBookshelves = parseInt(bookshelfCount[0].total || 0);

        // Get available filter options for the UI
        const [bookshelves] = await pool.query(
            'SELECT id, name FROM bookshelves WHERE user_id = ? ORDER BY name',
            [userId]
        );

        const [authors] = await pool.query(
            `SELECT DISTINCT b.author 
             FROM books b
             INNER JOIN bookshelf_books bb ON b.id = bb.book_id
             INNER JOIN bookshelves bs ON bb.bookshelf_id = bs.id
             WHERE bs.user_id = ? AND b.author IS NOT NULL AND b.author != ''
             ORDER BY b.author`,
            [userId]
        );

        const [yearRange] = await pool.query(
            `SELECT MIN(b.published_year) as min_year, MAX(b.published_year) as max_year
             FROM books b
             INNER JOIN bookshelf_books bb ON b.id = bb.book_id
             INNER JOIN bookshelves bs ON bb.bookshelf_id = bs.id
             WHERE bs.user_id = ? AND b.published_year IS NOT NULL`,
            [userId]
        );

        res.status(200).json({
            success: true,
            filters: {
                bookshelf_id: bookshelf_id || null,
                author: author || null,
                year_from: year_from || null,
                year_to: year_to || null,
                rating_min: rating_min || null,
                rating_max: rating_max || null
            },
            data: {
                books: books.map(book => ({
                    ...book,
                    avg_rating: book.avg_rating ? parseFloat(book.avg_rating).toFixed(2) : null,
                    bookshelf_names: book.bookshelf_names ? book.bookshelf_names.split(',') : []
                })),
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: books.length
                }
            },
            statistics: {
                total_books: parseInt(stats[0].total_books || 0),
                total_bookshelves: totalBookshelves,
                avg_books_per_bookshelf: stats[0].avg_books_per_bookshelf 
                    ? parseFloat(stats[0].avg_books_per_bookshelf).toFixed(2) 
                    : '0.00',
                overall_avg_rating: stats[0].overall_avg_rating 
                    ? parseFloat(stats[0].overall_avg_rating).toFixed(2) 
                    : null,
                total_books_with_reviews: parseInt(stats[0].total_books_with_reviews || 0),
                unique_authors: parseInt(stats[0].unique_authors || 0),
                year_range: {
                    earliest: stats[0].earliest_year ? parseInt(stats[0].earliest_year) : null,
                    latest: stats[0].latest_year ? parseInt(stats[0].latest_year) : null
                }
            },
            filter_options: {
                bookshelves: bookshelves,
                authors: authors.map(a => a.author).filter(a => a),
                year_range: {
                    min: yearRange[0]?.min_year ? parseInt(yearRange[0].min_year) : null,
                    max: yearRange[0]?.max_year ? parseInt(yearRange[0].max_year) : null
                }
            }
        });
    } catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
            error: error.message
        });
    }
};
