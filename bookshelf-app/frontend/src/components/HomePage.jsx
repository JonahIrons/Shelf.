import { useState } from 'react';
import { SearchBar } from "./SearchBar";
import { SearchResultsList } from './SearchResultsList';
import { BookGrid } from './BookGrid';

export const Home = () => {
  const [results, setResults] = useState([]);
  const [showGrid, setShowGrid] = useState(false);

  return (
    <div className="search-bar-container">
      <SearchBar setResults={setResults} setShowGrid={setShowGrid}/>
      {!showGrid && <SearchResultsList results={results}/>}
      {showGrid && <BookGrid results={results}/>}
    </div>
  );
};