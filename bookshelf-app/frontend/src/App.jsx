import './App.css';
import { useState } from 'react';

import { SearchBar } from "./components/SearchBar";
import { SearchResultsList } from './components/SearchResultsList';
import { BookGrid } from './components/BookGrid';

function App() {

  const [results, setResults] = useState([]);
  const [showGrid, setShowGrid] = useState(false);

  return (
    <main className="App">
      <div className="title">
        <h1>Shelf.</h1>
      </div>

      <div className="title-subheader">
        <h2>Your books. Your Shelf.</h2>
      </div>

      <div className="search-bar-container">
        <SearchBar setResults={setResults} setShowGrid={setShowGrid}/>
        {!showGrid && <SearchResultsList results={results}/>}
        {showGrid && <BookGrid results={results}/>}
      </div>

    </main>
  );
}


export default App;
