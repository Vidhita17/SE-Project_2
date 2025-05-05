import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useContext(AuthContext);
  
  return (
    <nav className="bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link to="/" className="text-white text-xl md:text-2xl font-bold">University Portal</Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-white px-3 py-2 hover:text-green-500 hover:border-b-2 hover:border-green-500 transition-all">Home</Link>
            <Link to="/about" className="text-white px-3 py-2 hover:text-green-500 hover:border-b-2 hover:border-green-500 transition-all">About</Link>
            <Link to="/projects" className="text-white px-3 py-2 hover:text-green-500 hover:border-b-2 hover:border-green-500 transition-all">Projects</Link>
            <Link to="/faculty" className="text-white px-3 py-2 hover:text-green-500 hover:border-b-2 hover:border-green-500 transition-all">Faculty</Link>
            
            {currentUser && (
              <Link to="/dashboard" className="text-white px-3 py-2 hover:text-green-500 hover:border-b-2 hover:border-green-500 transition-all">Dashboard</Link>
            )}
            
            {currentUser ? (
              <button 
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md">Login</Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-900">
            <Link to="/" className="text-white block px-3 py-2 hover:bg-gray-800 rounded-md">Home</Link>
            <Link to="/about" className="text-white block px-3 py-2 hover:bg-gray-800 rounded-md">About</Link>
            <Link to="/projects" className="text-white block px-3 py-2 hover:bg-gray-800 rounded-md">Projects</Link>
            <Link to="/faculty" className="text-white block px-3 py-2 hover:bg-gray-800 rounded-md">Faculty</Link>
            
            {currentUser && (
              <Link to="/dashboard" className="text-white block px-3 py-2 hover:bg-gray-800 rounded-md">Dashboard</Link>
            )}
            
            {currentUser ? (
              <button 
                onClick={logout}
                className="text-white block w-full text-left px-3 py-2 hover:bg-gray-800 rounded-md"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="text-white block px-3 py-2 hover:bg-gray-800 rounded-md">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
