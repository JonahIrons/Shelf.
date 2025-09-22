import React, { useState, useRef } from 'react';


import {FaSearch} from "react-icons/fa";
import './SearchBar.css';


export const SearchBar = ({ setResults, setShowGrid }) => {
    const [input, setInput] = useState("");
    const abortControllerRef = useRef(null);

    // Send request to backend API
    const fetchBooks = (value) => {
        const q = value.trim();
        if (!q) { setResults([]); return; }

        // Cancel previous request if it's still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const query = encodeURIComponent(q);
        fetch(`http://localhost:3001/api/books/search?q=${query}`, {
            signal: abortController.signal
        })
            .then((response) => response.json())
            .then((data) => {
                // Only update results if this request wasn't cancelled
                if (!abortController.signal.aborted) {
                    setResults(data.books || []);
                }
            })
            .catch((error) => {
                // Don't log errors for cancelled requests
                if (error.name !== 'AbortError') {
                    console.error('Error fetching books:', error);
                    setResults([]);
                }
            });
    }

    // Handle enter key to show grid view
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            setShowGrid(true);
        }
    }

    const handleChange = (value) => {
        setInput(value);
        setShowGrid(false); // Hide grid when typing
        fetchBooks(value);
    }

    return <div className="input-wrapper">
        <FaSearch id="search-icon" />
        <input placeholder="Search by title, author, or ISBN..." value={input} onChange={(e) => handleChange(e.target.value)} onKeyDown={handleKeyPress}/>
    </div>;
};