import React from 'react';
import { useNavigate } from 'react-router-dom';

import './SearchResult.css';

export const SearchResult = ({ result }) => {
    const navigate = useNavigate();

    const handleClick = async () => {
        if (result.source === 'openlibrary' && !result.description) {
            try {
                const openLibraryId = result.id.replace('ol_', '');
                const response = await fetch(`https://openlibrary.org${openLibraryId}.json`);
                const data = await response.json();
    
                let description = '';
                if (data.description) {
                    if (typeof data.description === "string") {
                        description = data.description;
                    } else if (data.description.value) {
                        description = data.description.value;
                    }
                }
    
                // Clean up weird OpenLibrary text sections
                if (description.includes('----------')) {
                    description = description.split('----------')[0].trim();
                }
    
                if (description.includes('([source][1])')) {
                    description = description.split('([source][1])')[0].trim();
                }
    
                // Create updated book object
                const updatedResult = {
                    ...result,
                    description: description || 'No description available'
                };
    
                const encodedId = encodeURIComponent(result.id);
                navigate(`/book/${encodedId}`, { state: { book: updatedResult } });
    
            } catch (error) {
                console.error('Error fetching description:', error);
                const encodedId = encodeURIComponent(result.id);
                navigate(`/book/${encodedId}`, { state: { book: result } });
            }
        } else {
            // Navigate directly if description already exists
            const encodedId = encodeURIComponent(result.id);
            navigate(`/book/${encodedId}`, { state: { book: result } });
        }
    };
    
    
    return <div className="search-result" onClick={handleClick}>
        {result.title}
    </div>;
};