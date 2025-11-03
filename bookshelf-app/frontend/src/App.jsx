import './App.css';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Home } from './components/HomePage';
import { BookDetail } from './components/BookDetail';
import { Login } from './components/LoginSignup/Login';
import { SignUp } from './components/LoginSignup/SignUp';
import { Profile } from './components/Profile/Profile';
import { BookshelfManager } from './components/BookshelfManager/BookshelfManager';
import { Reports } from './components/Reports/Reports';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookshelves" 
              element={
                <ProtectedRoute>
                  <BookshelfManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <ToastContainer
          position="top-center"
          autoClose={1000}
          hideProgressBar={true}
          closeOnClick
          // pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}


export default App;
