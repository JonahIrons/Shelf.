import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './Reports.css';

export const Reports = () => {
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    
    // Filter states
    const [filters, setFilters] = useState({
        bookshelf_id: '',
        author: '',
        year_from: '',
        year_to: '',
        rating_min: '',
        rating_max: ''
    });

    // Filter options (populated from API)
    const [filterOptions, setFilterOptions] = useState({
        bookshelves: [],
        authors: [],
        year_range: { min: null, max: null }
    });

    const generateReport = useCallback(async (customFilters = null, initialLoad = false) => {
        try {
            setLoading(true);
            const params = customFilters || filters;
            
            // Build query string
            const queryParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key]) {
                    queryParams.append(key, params[key]);
                }
            });

            const response = await api.get(`/reports/books?${queryParams.toString()}`);
            
            if (response.data.success) {
                setReportData(response.data);
                
                // Update filter options on initial load
                if (initialLoad && response.data.filter_options) {
                    setFilterOptions(response.data.filter_options);
                }
            }
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (isAuthenticated) {
            // Generate initial report with no filters to get filter options
            generateReport({}, true);
        }
    }, [isAuthenticated, generateReport]);

    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        generateReport();
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            bookshelf_id: '',
            author: '',
            year_from: '',
            year_to: '',
            rating_min: '',
            rating_max: ''
        };
        setFilters(clearedFilters);
        generateReport(clearedFilters);
    };

    if (!isAuthenticated) {
        return (
            <div className="reports-container">
                <p>Please log in to view reports.</p>
            </div>
        );
    }

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h1>Book Reports</h1>
                <p className="reports-subtitle">Generate reports on your reading statistics with custom filters</p>
            </div>

            <div className="reports-content">
                <div className="filters-section">
                    <h2>Filters</h2>
                    <form onSubmit={handleApplyFilters} className="filters-form">
                        <div className="filter-group">
                            <label>Bookshelf</label>
                            <select
                                value={filters.bookshelf_id}
                                onChange={(e) => handleFilterChange('bookshelf_id', e.target.value)}
                                className="filter-input"
                            >
                                <option value="">All Bookshelves</option>
                                {filterOptions.bookshelves.map(bs => (
                                    <option key={bs.id} value={bs.id}>{bs.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Author</label>
                            <select
                                value={filters.author}
                                onChange={(e) => handleFilterChange('author', e.target.value)}
                                className="filter-input"
                            >
                                <option value="">All Authors</option>
                                {filterOptions.authors.map(author => (
                                    <option key={author} value={author}>{author}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Published Year (From)</label>
                                <input
                                    type="number"
                                    value={filters.year_from}
                                    onChange={(e) => handleFilterChange('year_from', e.target.value)}
                                    placeholder={filterOptions.year_range.min || "Year"}
                                    min={filterOptions.year_range.min || undefined}
                                    max={filterOptions.year_range.max || undefined}
                                    className="filter-input"
                                />
                            </div>

                            <div className="filter-group">
                                <label>Published Year (To)</label>
                                <input
                                    type="number"
                                    value={filters.year_to}
                                    onChange={(e) => handleFilterChange('year_to', e.target.value)}
                                    placeholder={filterOptions.year_range.max || "Year"}
                                    min={filterOptions.year_range.min || undefined}
                                    max={filterOptions.year_range.max || undefined}
                                    className="filter-input"
                                />
                            </div>
                        </div>

                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Rating (Min)</label>
                                <input
                                    type="number"
                                    value={filters.rating_min}
                                    onChange={(e) => handleFilterChange('rating_min', e.target.value)}
                                    placeholder="1"
                                    min="1"
                                    max="10"
                                    step="0.1"
                                    className="filter-input"
                                />
                            </div>

                            <div className="filter-group">
                                <label>Rating (Max)</label>
                                <input
                                    type="number"
                                    value={filters.rating_max}
                                    onChange={(e) => handleFilterChange('rating_max', e.target.value)}
                                    placeholder="10"
                                    min="1"
                                    max="10"
                                    step="0.1"
                                    className="filter-input"
                                />
                            </div>
                        </div>

                        <div className="filter-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Generating...' : 'Generate Report'}
                            </button>
                            <button type="button" onClick={handleClearFilters} className="btn-secondary">
                                Clear Filters
                            </button>
                        </div>
                    </form>
                </div>

                <div className="results-section">
                    {loading ? (
                        <div className="loading">Generating report...</div>
                    ) : reportData ? (
                        <>
                            <div className="statistics-panel">
                                <h2>Statistics</h2>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-value">{reportData.statistics.total_books}</div>
                                        <div className="stat-label">Total Books</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{reportData.statistics.total_bookshelves}</div>
                                        <div className="stat-label">Bookshelves</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{reportData.statistics.avg_books_per_bookshelf}</div>
                                        <div className="stat-label">Avg Books per Shelf</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">
                                            {reportData.statistics.overall_avg_rating || 'N/A'}
                                        </div>
                                        <div className="stat-label">Avg Rating</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{reportData.statistics.total_books_with_reviews}</div>
                                        <div className="stat-label">Books with Reviews</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{reportData.statistics.unique_authors}</div>
                                        <div className="stat-label">Unique Authors</div>
                                    </div>
                                </div>
                                {reportData.statistics.year_range.earliest && (
                                    <div className="year-range">
                                        <strong>Year Range:</strong> {reportData.statistics.year_range.earliest} - {reportData.statistics.year_range.latest}
                                    </div>
                                )}
                            </div>

                            <div className="books-results">
                                <h2>Books ({reportData.data.books.length})</h2>
                                {reportData.data.books.length === 0 ? (
                                    <div className="no-results">
                                        <p>No books match the selected filters.</p>
                                        <p>Try adjusting your filter criteria.</p>
                                    </div>
                                ) : (
                                    <div className="books-grid">
                                        {reportData.data.books.map((book) => (
                                            <div key={book.id} className="book-result-card">
                                                {book.cover_url && (
                                                    <img src={book.cover_url} alt={book.title} className="book-cover" />
                                                )}
                                                <div className="book-result-info">
                                                    <h4>{book.title}</h4>
                                                    <p className="book-author">{book.author}</p>
                                                    {book.published_year && (
                                                        <p className="book-year">{book.published_year}</p>
                                                    )}
                                                    {book.avg_rating && (
                                                        <div className="book-rating">
                                                            <span className="rating-value">⭐ {book.avg_rating}</span>
                                                            <span className="rating-count">({book.review_count} reviews)</span>
                                                        </div>
                                                    )}
                                                    {book.bookshelf_names && book.bookshelf_names.length > 0 && (
                                                        <div className="book-bookshelves">
                                                            <strong>Shelves:</strong> {book.bookshelf_names.join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-data">
                            <p>Click "Generate Report" to view your reading statistics.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

