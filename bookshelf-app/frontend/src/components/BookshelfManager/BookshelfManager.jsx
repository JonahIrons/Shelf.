import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './BookshelfManager.css';

export const BookshelfManager = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [bookshelves, setBookshelves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [selectedBookshelf, setSelectedBookshelf] = useState(null);
    const [bookshelfBooks, setBookshelfBooks] = useState([]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchBookshelves();
        } else {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

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

    const fetchBookshelfDetails = async (bookshelfId) => {
        try {
            const response = await api.get(`/bookshelves/${bookshelfId}`);
            if (response.data.success) {
                setBookshelfBooks(response.data.bookshelf.books || []);
            }
        } catch (error) {
            console.error('Error fetching bookshelf details:', error);
            toast.error('Failed to load bookshelf details');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) {
            toast.error('Bookshelf name is required');
            return;
        }

        try {
            const response = await api.post('/bookshelves', {
                name: newName.trim(),
                description: newDescription.trim() || null
            });

            if (response.data.success) {
                toast.success('Bookshelf created successfully!');
                await fetchBookshelves();
                setShowCreateForm(false);
                setNewName('');
                setNewDescription('');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create bookshelf';
            toast.error(message);
        }
    };

    const handleEdit = (bookshelf) => {
        setEditingId(bookshelf.id);
        setEditName(bookshelf.name);
        setEditDescription(bookshelf.description || '');
    };

    const handleUpdate = async (bookshelfId) => {
        if (!editName.trim()) {
            toast.error('Bookshelf name cannot be empty');
            return;
        }

        try {
            const response = await api.put(`/bookshelves/${bookshelfId}`, {
                name: editName.trim(),
                description: editDescription.trim() || null
            });

            if (response.data.success) {
                toast.success('Bookshelf updated successfully!');
                await fetchBookshelves();
                setEditingId(null);
                setEditName('');
                setEditDescription('');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update bookshelf';
            toast.error(message);
        }
    };

    const handleDelete = async (bookshelfId) => {
        if (!window.confirm('Are you sure you want to delete this bookshelf? All books in it will be removed.')) {
            return;
        }

        try {
            const response = await api.delete(`/bookshelves/${bookshelfId}`);
            if (response.data.success) {
                toast.success('Bookshelf deleted successfully!');
                await fetchBookshelves();
                if (selectedBookshelf === bookshelfId) {
                    setSelectedBookshelf(null);
                    setBookshelfBooks([]);
                }
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete bookshelf';
            toast.error(message);
        }
    };

    const handleRemoveBook = async (bookshelfId, bookId) => {
        if (!window.confirm('Remove this book from the bookshelf?')) {
            return;
        }

        try {
            const response = await api.delete(`/bookshelves/${bookshelfId}/books/${bookId}`);
            if (response.data.success) {
                toast.success('Book removed from bookshelf');
                await fetchBookshelfDetails(bookshelfId);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to remove book';
            toast.error(message);
        }
    };

    const handleViewBooks = (bookshelf) => {
        if (selectedBookshelf === bookshelf.id) {
            setSelectedBookshelf(null);
            setBookshelfBooks([]);
        } else {
            setSelectedBookshelf(bookshelf.id);
            fetchBookshelfDetails(bookshelf.id);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="bookshelf-manager">
            <div className="manager-header">
                <h1>Manage Bookshelves</h1>
                <button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="btn-create"
                >
                    {showCreateForm ? 'Cancel' : '+ Create New Bookshelf'}
                </button>
            </div>

            {showCreateForm && (
                <div className="create-form-container">
                    <form onSubmit={handleCreate} className="create-form">
                        <h3>Create New Bookshelf</h3>
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g., Currently Reading"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description (optional)</label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Add a description..."
                                rows={3}
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Create Bookshelf
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <p>Loading bookshelves...</p>
            ) : bookshelves.length === 0 ? (
                <div className="empty-state">
                    <p>You don't have any bookshelves yet.</p>
                    <p>Create one to get started organizing your books!</p>
                </div>
            ) : (
                <div className="bookshelves-list">
                    {bookshelves.map((bookshelf) => (
                        <div key={bookshelf.id} className="bookshelf-item">
                            {editingId === bookshelf.id ? (
                                <div className="edit-form">
                                    <div className="form-group">
                                        <label>Name *</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="edit-actions">
                                        <button 
                                            onClick={() => handleUpdate(bookshelf.id)}
                                            className="btn-primary"
                                        >
                                            Save
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditName('');
                                                setEditDescription('');
                                            }}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bookshelf-info">
                                        <h3>{bookshelf.name}</h3>
                                        {bookshelf.description && (
                                            <p className="bookshelf-description">{bookshelf.description}</p>
                                        )}
                                        <p className="bookshelf-meta">
                                            Created: {new Date(bookshelf.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="bookshelf-actions">
                                        <button 
                                            onClick={() => handleViewBooks(bookshelf)}
                                            className="btn-view"
                                        >
                                            {selectedBookshelf === bookshelf.id ? 'Hide Books' : 'View Books'}
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(bookshelf)}
                                            className="btn-edit"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(bookshelf.id)}
                                            className="btn-delete"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}

                            {selectedBookshelf === bookshelf.id && bookshelfBooks.length > 0 && (
                                <div className="bookshelf-books">
                                    <h4>Books in this bookshelf:</h4>
                                    <div className="books-grid">
                                        {bookshelfBooks.map((book) => (
                                            <div key={book.id} className="book-card">
                                                {book.cover_url && (
                                                    <img src={book.cover_url} alt={book.title} />
                                                )}
                                                <div className="book-card-info">
                                                    <h5>{book.title}</h5>
                                                    <p>{book.author}</p>
                                                    <button 
                                                        onClick={() => handleRemoveBook(bookshelf.id, book.id)}
                                                        className="btn-remove"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

