import React from 'react';
import { useNavigate } from 'react-router-dom';

import './SearchResult.css';

export const SearchResult = ({ result }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        const encodedId = encodeURIComponent(result.id);
        navigate(`/book/${encodedId}`, { state: { book: result } });
    };
    
    return <div className="search-result" onClick={handleClick}>
        {result.title}
    </div>;
};