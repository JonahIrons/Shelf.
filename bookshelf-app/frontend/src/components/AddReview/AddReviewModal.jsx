import React, { useState } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './AddReviewModal.css';

export const AddReviewModal = ({ book, isOpen, onClose, onSuccess }) => {
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState('');
    const [reviewText, setReviewText] = useState('');

    const handleAddReview = async () => {
        if (!rating || rating < 1 || rating > 10) {
            toast.error('Please select a rating between 1 and 10');
            return;
        }

        try {
            setLoading(true);
            
            // Prepare book data for the API
            const bookData = {
                openlibrary_id: book.id?.startsWith('ol_') ? book.id.replace('ol_', '') : null,
                isbn: book.isbn || null,
                title: book.title,
                author: book.author || null,
                published_year: book.published_year ? parseInt(book.published_year) : null,
                cover_url: book.cover_url || null,
                description: book.description || null
            };

            // Add review
            const response = await api.post(`/reviews`, {
                book_data: bookData,
                rating: parseInt(rating),
                review_text: reviewText.trim() || null
            });

            if (response.data.success) {
                toast.success('Review added successfully!');
                setRating('');
                setReviewText('');
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            console.error('Error adding review:', error);
            const message = error.response?.data?.message || 'Failed to add review';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (!isAuthenticated) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h2>Login Required</h2>
                    <p>Please log in to add reviews to books.</p>
                    <button onClick={onClose} className="modal-close-btn">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Review</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="book-info">
                        <h3>{book?.title}</h3>
                        <p>{book?.author}</p>
                    </div>

                    <div className="form-group">
                        <label>Rating *</label>
                        <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="rating-select"
                            required
                        >
                            <option value="">-- Select a rating --</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <option key={num} value={num}>
                                    {num}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Review Text (optional)</label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Write your review here..."
                            rows={6}
                            className="review-textarea"
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            onClick={handleAddReview}
                            disabled={!rating || loading}
                            className="btn-primary"
                        >
                            {loading ? 'Adding...' : 'Add Review'}
                        </button>
                        <button 
                            onClick={() => {
                                setRating('');
                                setReviewText('');
                                onClose();
                            }} 
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

