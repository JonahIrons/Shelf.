import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './components/HomePage';
import { BookDetail } from './components/BookDetail';


function App() {
  return (
    <BrowserRouter>
      <main className="App">
        <div className="title">
          <h1>Shelf.</h1>
        </div>

        <div className="title-subheader">
          <h2>Your books. Your Shelf.</h2>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:id" element={<BookDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}


export default App;
