import React from 'react';
import { useNavigate } from 'react-router-dom'
import './BookGrid.css';

export const BookGrid = ({ results }) => {
    // Show only the first 12 results for better grid layout
    const displayResults = results.slice(0, 12);

    const navigate = useNavigate();

    const handleClick = (book) => {
        const encodedId = encodeURIComponent(book.id);
        navigate(`/book/${encodedId}`, { state: { book: book } });
    };

    return (
        <div className="book-grid-container">
            <h3 className="grid-title">
                Search Results ({results.length} books found)
            </h3>
            <div className="book-grid">
                {displayResults.map((book, index) => (
                    <div key={book.id || index} className="book-card" onClick={() => handleClick(book)}>
                        <div className="book-cover">
                            {book.cover_url ? (
                                <img 
                                    src={book.cover_url} 
                                    alt={`Cover of ${book.title}`}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className="no-cover" style={{ display: book.cover_url ? 'none' : 'flex' }}>
                                <span>No Cover</span>
                            </div>
                        </div>
                        <div className="book-info">
                            <h4 className="book-title">{book.title}</h4>
                            <p className="book-author">{book.author}</p>
                            {book.published_year && (
                                <p className="book-year">{book.published_year}</p>
                            )}
                            {book.isbn && (
                                <p className="book-isbn">ISBN: {book.isbn}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {results.length > 12 && (
                <p className="more-results">Showing first 12 of {results.length} results</p>
            )}
        </div>
    );
};
