import React from 'react';

import './SearchResult.css';

export const SearchResult = ({ result }) => {
    return <div className="search-result" onClick={(e) => alert(`Clicked on ${result.title}`)}>{result.title}</div>;
}