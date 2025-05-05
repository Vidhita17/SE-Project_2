import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Define API URL based on environment
const API_URL = '/api'; // Use relative path to leverage the proxy

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  
  useEffect(() => {
    // Set default timeout
    axios.defaults.timeout = 15000;
    
    // Add request interceptor for debugging
    axios.interceptors.request.use(
      config => {
        console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
        return config;
      },
      error => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for debugging
    axios.interceptors.response.use(
      response => {
        console.log(`Received response from ${response.config.url}:`, response.status);
        return response;
      },
      error => {
        if (error.response) {
          // Server responded with a status code outside of 2xx range
          console.error('Response error:', error.response.status, error.response.data);
        } else if (error.request) {
          // Request was made but no response received
          console.error('Network error - no response received:', error.request);
        } else {
          // Something else happened while setting up the request
          console.error('Request setup error:', error.message);
        }
        return Promise.reject(error);
      }
    );

    // Check if user is already logged in (from localStorage)
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setUserRole(user.role);
        setAuthToken(token);
        
        // Set default authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        // If there's an error parsing the userData, clear localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    
    setLoading(false);
  }, []);

  // Add a function to test server connectivity
  const checkServerConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/status`);
      console.log('Server status check:', response.data);
      return true;
    } catch (err) {
      console.error('Server connection test failed:', err);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      // Extract data from the response - server returns token and user fields directly
      const { token, _id, name, email: userEmail, role } = response.data;
      
      // Create a user object from the response data
      const user = {
        id: _id,
        name,
        email: userEmail,
        role
      };
      
      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      setUserRole(user.role);
      setAuthToken(token);
      setError(null);
      
      console.log("Login successful:", user);
      return user;
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to login');
      throw err;
    }
  };

  const signup = async (email, password, additionalData) => {
    try {
      // First, check if the server is reachable
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }

      const userData = {
        email,
        password,
        ...additionalData
      };

      console.log("Signup data:", userData);
      
      // Use a simpler URL construction with the proxy
      const response = await axios.post(`${API_URL}/auth/signup`, userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Signup response:", response.data);
      
      // Store the token and user information
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set the authentication state
      setCurrentUser(user);
      setUserRole(user.role);
      setAuthToken(token);
      setError(null);
      
      return response.data;
    } catch (err) {
      console.error('Signup error details:', err);
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        const serverRunning = await checkServerConnection().catch(() => false);
        if (!serverRunning) {
          throw new Error('Cannot connect to server. Please make sure the server is running on port 9000.');
        }
      }
      
      throw err;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Clear axios header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear state
    setCurrentUser(null);
    setUserRole(null);
    setAuthToken(null);
  };

  const value = {
    currentUser,
    userRole,
    loading,
    error,
    login,
    signup,
    logout,
    checkServerConnection, // Add this to the context
    authToken // Add this line to expose the token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
