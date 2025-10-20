import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './components/HomePage';
import { BookDetail } from './components/BookDetail';
import { Login } from './components/LoginSignup/Login';
import { SignUp } from './components/LoginSignup/SignUp';
import { NavBar } from './components/NavBar';


function App() {
  return (
    <BrowserRouter>
      <NavBar />
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}


export default App;
