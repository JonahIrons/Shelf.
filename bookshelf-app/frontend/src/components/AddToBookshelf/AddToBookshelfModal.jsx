import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './AddToBookshelfModal.css';

export const AddToBookshelfModal = ({ book, isOpen, onClose, onSuccess }) => {
    const { isAuthenticated } = useAuth();
    const [bookshelves, setBookshelves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBookshelf, setSelectedBookshelf] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newBookshelfName, setNewBookshelfName] = useState('');
    const [newBookshelfDescription, setNewBookshelfDescription] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            fetchBookshelves();
        }
    }, [isOpen, isAuthenticated]);

    const fetchBookshelves = async () => {
        try {
            setLoading(true);
            const response = await api.get('/bookshelves');
            if (response.data.success) {
                setBookshelves(response.data.bookshelves || []);
            }
        } catch (error) {
            console.error('Error fetching bookshelves:', error);
            toast.error('Failed to load bookshelves');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToBookshelf = async () => {
        if (!selectedBookshelf) {
            toast.error('Please select a bookshelf');
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

            // Add book to bookshelf (API will handle saving book to DB if needed)
            const response = await api.post(`/bookshelves/${selectedBookshelf}/books`, {
                book_data: bookData
            });

            if (response.data.success) {
                toast.success('Book added to bookshelf successfully!');
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            console.error('Error adding book to bookshelf:', error);
            const message = error.response?.data?.message || 'Failed to add book to bookshelf';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBookshelf = async (e) => {
        e.preventDefault();
        
        if (!newBookshelfName.trim()) {
            toast.error('Bookshelf name is required');
            return;
        }

        try {
            setCreating(true);
            const response = await api.post('/bookshelves', {
                name: newBookshelfName.trim(),
                description: newBookshelfDescription.trim() || null
            });

            if (response.data.success) {
                toast.success('Bookshelf created successfully!');
                await fetchBookshelves(); // Refresh list
                setSelectedBookshelf(response.data.bookshelf.id);
                setShowCreateForm(false);
                setNewBookshelfName('');
                setNewBookshelfDescription('');
            }
        } catch (error) {
            console.error('Error creating bookshelf:', error);
            const message = error.response?.data?.message || 'Failed to create bookshelf';
            toast.error(message);
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    if (!isAuthenticated) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h2>Login Required</h2>
                    <p>Please log in to add books to your bookshelves.</p>
                    <button onClick={onClose} className="modal-close-btn">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add to Bookshelf</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="book-info">
                        <h3>{book?.title}</h3>
                        <p>{book?.author}</p>
                    </div>

                    {showCreateForm ? (
                        <form onSubmit={handleCreateBookshelf} className="create-bookshelf-form">
                            <h3>Create New Bookshelf</h3>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={newBookshelfName}
                                    onChange={(e) => setNewBookshelfName(e.target.value)}
                                    placeholder="e.g., Currently Reading"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <textarea
                                    value={newBookshelfDescription}
                                    onChange={(e) => setNewBookshelfDescription(e.target.value)}
                                    placeholder="Add a description..."
                                    rows={3}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" disabled={creating} className="btn-primary">
                                    {creating ? 'Creating...' : 'Create Bookshelf'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewBookshelfName('');
                                        setNewBookshelfDescription('');
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="bookshelf-select">
                                <label>Select a bookshelf:</label>
                                {loading && bookshelves.length === 0 ? (
                                    <p>Loading bookshelves...</p>
                                ) : bookshelves.length === 0 ? (
                                    <p className="no-bookshelves">You don't have any bookshelves yet.</p>
                                ) : (
                                    <select
                                        value={selectedBookshelf}
                                        onChange={(e) => setSelectedBookshelf(e.target.value)}
                                        className="bookshelf-dropdown"
                                    >
                                        <option value="">-- Select a bookshelf --</option>
                                        {bookshelves.map((bookshelf) => (
                                            <option key={bookshelf.id} value={bookshelf.id}>
                                                {bookshelf.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button
                                    onClick={handleAddToBookshelf}
                                    disabled={!selectedBookshelf || loading}
                                    className="btn-primary"
                                >
                                    {loading ? 'Adding...' : 'Add to Bookshelf'}
                                </button>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="btn-secondary"
                                >
                                    Create New Bookshelf
                                </button>
                                <button onClick={onClose} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

