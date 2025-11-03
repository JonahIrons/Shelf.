import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Profile.css';

export const Profile = () => {
    const { user, logout } = useAuth();
    const [bookshelves, setBookshelves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchBookshelves();
        }
    }, [user]);

    const fetchBookshelves = async () => {
        try {
            setLoading(true);
            const response = await api.get('/bookshelves');
            if (response.data.success) {
                setBookshelves(response.data.bookshelves || []);
            }
        } catch (err) {
            console.error('Error fetching bookshelves:', err);
            setError('Failed to load bookshelves');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    if (!user) {
        return (
            <div className="profile-container">
                <p>Please log in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-info">
                    <h1>Welcome, {user.username}!</h1>
                    <p className="profile-email">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </div>

            <div className="profile-content">
                <section className="profile-section">
                    <h2>My Bookshelves</h2>
                    {loading ? (
                        <p>Loading bookshelves...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : bookshelves.length === 0 ? (
                        <div className="empty-state">
                            <p>You don't have any bookshelves yet.</p>
                            <p className="hint">Create your first bookshelf to start organizing your books!</p>
                        </div>
                    ) : (
                        <div className="bookshelves-grid">
                            {bookshelves.map((bookshelf) => (
                                <div key={bookshelf.id} className="bookshelf-card">
                                    <h3>{bookshelf.name}</h3>
                                    {bookshelf.description && (
                                        <p className="bookshelf-description">{bookshelf.description}</p>
                                    )}
                                    <p className="bookshelf-meta">
                                        Created: {new Date(bookshelf.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="profile-section">
                    <h2>Quick Actions</h2>
                    <div className="actions-grid">
                        <Link to="/bookshelves" className="action-card clickable">
                            <h3>📚 Manage Bookshelves</h3>
                            <p>Create, edit, and organize your bookshelves</p>
                            <p className="action-link">Click to manage →</p>
                        </Link>
                        <Link to="/reports" className="action-card clickable">
                            <h3>📊 View Reports</h3>
                            <p>Generate reports on your reading statistics</p>
                            <p className="action-link">Click to view →</p>
                        </Link>
                        <div className="action-card">
                            <h3>⭐ Write Reviews</h3>
                            <p>Rate and review the books you've read</p>
                            <p className="coming-soon">Coming soon...</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

