import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './BookDetail.css';

export const BookDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('BookDetail useEffect running');
        console.log('location.state:', location.state);
        console.log('location.state?.book:', location.state?.book);
        
        // Check for book data from navigation state
        if (location.state?.book) {
            console.log('Using book from navigation state:', location.state.book);
            setBook(location.state.book);
            setLoading(false);
        } else {
            console.log('Fetching book from API with ID:', id);
            // Fetch book data using id from URL, as direct fallback
            fetch(`http://localhost:3001/api/books/${id}`)
                .then(response => response.json())
                .then(data => {
                    console.log('API response:', data);
                    setBook(data.book);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching book:', error);
                    setLoading(false);
                });
        }
    }, [id, location.state]);

    if (loading) {
        return <div>Loading...</div>
    }

    if (!book) {
        return <div>Book not found!</div>
    }

    return (
        <div className="book-detail">
            <button onClick={() => navigate('/')}>Back to Search</button>

            <div className="book-detail-cover">
                <img src={book.cover_url} alt={"No cover available."} />
            </div>

            <div className="book-detail-info">
                <h1>{book.title}</h1>
                <p>{book.author}</p>
                <p>{book.published_year}</p>
                <p>{book.description}</p>
            </div>
        </div>
    );
};