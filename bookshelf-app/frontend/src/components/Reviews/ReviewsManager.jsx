import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './ReviewsManager.css';

export const ReviewsManager = () => {
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);

    // form state for create
    const [createOpen, setCreateOpen] = useState(false);
    const [createRating, setCreateRating] = useState('');
    const [createText, setCreateText] = useState('');
    const [createBookId, setCreateBookId] = useState('');

    // optional: allow creating with book_data
    const [createBookTitle, setCreateBookTitle] = useState('');
    const [createBookAuthor, setCreateBookAuthor] = useState('');
    const [createBookYear, setCreateBookYear] = useState('');
    const [createBookIsbn, setCreateBookIsbn] = useState('');
    const [createBookCover, setCreateBookCover] = useState('');

    // inline edit state
    const [editingId, setEditingId] = useState(null);
    const [editRating, setEditRating] = useState('');
    const [editText, setEditText] = useState('');

    const loadReviews = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reviews');
            if (res.data.success) {
                setReviews(res.data.reviews || []);
            }
        } catch (e) {
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadReviews();
        }
    }, [isAuthenticated]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createRating) {
            toast.error('Rating is required');
            return;
        }
        try {
            const body = { rating: parseFloat(createRating), review_text: createText || null };
            if (createBookId) {
                body.book_id = parseInt(createBookId);
            } else {
                if (!createBookTitle) {
                    toast.error('Provide a book id or book title');
                    return;
                }
                body.book_data = {
                    title: createBookTitle,
                    author: createBookAuthor || null,
                    published_year: createBookYear ? parseInt(createBookYear) : null,
                    isbn: createBookIsbn || null,
                    cover_url: createBookCover || null,
                };
            }
            const res = await api.post('/reviews', body);
            if (res.data.success) {
                toast.success('Review created');
                setCreateOpen(false);
                setCreateRating('');
                setCreateText('');
                setCreateBookId('');
                setCreateBookTitle('');
                setCreateBookAuthor('');
                setCreateBookYear('');
                setCreateBookIsbn('');
                setCreateBookCover('');
                await loadReviews();
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to create review');
        }
    };

    const startEdit = (rev) => {
        setEditingId(rev.id);
        setEditRating(rev.rating);
        setEditText(rev.review_text || '');
    };

    const saveEdit = async (id) => {
        try {
            const res = await api.put(`/reviews/${id}`, {
                rating: parseFloat(editRating),
                review_text: editText || null
            });
            if (res.data.success) {
                toast.success('Review updated');
                setEditingId(null);
                await loadReviews();
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update review');
        }
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Delete this review?')) return;
        try {
            const res = await api.delete(`/reviews/${id}`);
            if (res.data.success) {
                toast.success('Review deleted');
                await loadReviews();
            }
        } catch (e) {
            toast.error('Failed to delete review');
        }
    };

    return (
        <div className="reviews-manager">
            <div className="reviews-header">
                <h1>My Reviews</h1>
                <button className="btn-primary" onClick={() => setCreateOpen(!createOpen)}>
                    {createOpen ? 'Cancel' : '+ Add Review'}
                </button>
            </div>

            {createOpen && (
                <form className="create-review" onSubmit={handleCreate}>
                    <h3>Create Review</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Rating (1-10)</label>
                            <input type="number" min="1" max="10" step="1" value={createRating} onChange={e => setCreateRating(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Review</label>
                            <input type="text" value={createText} onChange={e => setCreateText(e.target.value)} placeholder="Optional" />
                        </div>
                    </div>

                    <div className="form-section">
                        <h4>Choose a book</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Existing Book ID</label>
                                <input type="number" value={createBookId} onChange={e => setCreateBookId(e.target.value)} placeholder="If known" />
                            </div>
                        </div>
                        <p className="or-text">— or —</p>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Title *</label>
                                <input type="text" value={createBookTitle} onChange={e => setCreateBookTitle(e.target.value)} placeholder="Book title" />
                            </div>
                            <div className="form-group">
                                <label>Author</label>
                                <input type="text" value={createBookAuthor} onChange={e => setCreateBookAuthor(e.target.value)} placeholder="Author" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Year</label>
                                <input type="number" value={createBookYear} onChange={e => setCreateBookYear(e.target.value)} placeholder="e.g. 1949" />
                            </div>
                            <div className="form-group">
                                <label>ISBN</label>
                                <input type="text" value={createBookIsbn} onChange={e => setCreateBookIsbn(e.target.value)} placeholder="Optional" />
                            </div>
                            <div className="form-group">
                                <label>Cover URL</label>
                                <input type="text" value={createBookCover} onChange={e => setCreateBookCover(e.target.value)} placeholder="https://..." />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary">Save Review</button>
                </form>
            )}

            {loading ? (
                <p>Loading reviews...</p>
            ) : (
                <div className="reviews-list">
                    {reviews.length === 0 ? (
                        <div className="empty-state">No reviews yet.</div>
                    ) : (
                        reviews.map(r => (
                            <div key={r.id} className="review-item">
                                <div className="book-side">
                                    {r.cover_url && <img src={r.cover_url} alt={r.title} />}
                                    <div className="book-info">
                                        <h3>{r.title}</h3>
                                        <p>{r.author}</p>
                                        {r.published_year && <p className="muted">{r.published_year}</p>}
                                    </div>
                                </div>
                                <div className="review-side">
                                    {editingId === r.id ? (
                                        <div className="edit-form">
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Rating</label>
                                                    <input type="number" min="1" max="10" step="1" value={editRating} onChange={e => setEditRating(e.target.value)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Review</label>
                                                    <input type="text" value={editText} onChange={e => setEditText(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="actions">
                                                <button className="btn-primary" onClick={() => saveEdit(r.id)}>Save</button>
                                                <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="review-meta">
                                                <span className="rating">⭐ {r.rating}</span>
                                                <span className="date">{new Date(r.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {r.review_text && <p className="review-text">{r.review_text}</p>}
                                            <div className="actions">
                                                <button className="btn-edit" onClick={() => startEdit(r)}>Edit</button>
                                                <button className="btn-delete" onClick={() => deleteReview(r.id)}>Delete</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
