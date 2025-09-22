const express = require('express');
const router = express.Router();

// Mock data for now - we'll replace this with database calls later
const mockBooks = [
    {
        id: 1,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "9780743273565",
        published_year: 1925,
        cover_url: "https://covers.openlibrary.org/b/id/8226451-M.jpg"
    },
    {
        id: 2,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "9780061120084",
        published_year: 1960,
        cover_url: "https://covers.openlibrary.org/b/id/8232019-M.jpg"
    },
    {
        id: 3,
        title: "1984",
        author: "George Orwell",
        isbn: "9780451524935",
        published_year: 1949,
        cover_url: "https://covers.openlibrary.org/b/id/8232018-M.jpg"
    }
];

// GET /api/books/search?q=search_term
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.json({ books: [] });
        }

        const searchTerm = q.toLowerCase().trim();
        
        // First, search in local mock data
        const localBooks = mockBooks.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.isbn.includes(searchTerm)
        );

        // Then, search OpenLibrary API for additional results
        try {
            const openLibraryResponse = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`);
            const openLibraryData = await openLibraryResponse.json();
            
            // Transform OpenLibrary data to match our format
            const openLibraryBooks = openLibraryData.docs
                .filter(book => book.title && book.author_name)
                .slice(0, 10) // Limit to 10 results from OpenLibrary -------- CHANGE THIS TO GET MORE RESULTS --------
                .map(book => ({
                    id: `ol_${book.key}`,
                    title: book.title,
                    author: Array.isArray(book.author_name) ? book.author_name[0] : book.author_name,
                    isbn: book.isbn ? (Array.isArray(book.isbn) ? book.isbn[0] : book.isbn) : '',
                    published_year: book.first_publish_year || null,
                    cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : '',
                    source: 'openlibrary'
                }));

            // Combine local and OpenLibrary results
            const allBooks = [...localBooks, ...openLibraryBooks];
            
            res.json({ 
                books: allBooks,
                total: allBooks.length,
                query: q,
                sources: {
                    local: localBooks.length,
                    openlibrary: openLibraryBooks.length
                }
            });
        } catch (openLibraryError) {
            console.warn('OpenLibrary API failed, using local data only:', openLibraryError.message);
            // Fallback to local data only if OpenLibrary fails
            res.json({ 
                books: localBooks,
                total: localBooks.length,
                query: q,
                sources: {
                    local: localBooks.length,
                    openlibrary: 0
                }
            });
        }
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to search books'
        });
    }
});

// GET /api/books - Get all books
router.get('/', async (req, res) => {
    try {
        res.json({ 
            books: mockBooks,
            total: mockBooks.length
        });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to retrieve books'
        });
    }
});

// GET /api/books/:id - Get book by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const book = mockBooks.find(b => b.id === parseInt(id));
        
        if (!book) {
            return res.status(404).json({ 
                error: 'Book not found',
                message: `No book found with ID ${id}`
            });
        }
        
        res.json({ book });
    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to retrieve book'
        });
    }
});

// POST /api/books - Add a new book
router.post('/', async (req, res) => {
    try {
        const { title, author, isbn, published_year, cover_url } = req.body;
        
        // Basic validation
        if (!title || !author) {
            return res.status(400).json({
                error: 'Validation error',
                message: 'Title and author are required'
            });
        }
        
        const newBook = {
            id: mockBooks.length + 1,
            title,
            author,
            isbn: isbn || '',
            published_year: published_year || null,
            cover_url: cover_url || ''
        };
        
        mockBooks.push(newBook);
        
        res.status(201).json({ 
            book: newBook,
            message: 'Book added successfully'
        });
    } catch (error) {
        console.error('Add book error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to add book'
        });
    }
});

module.exports = router;
