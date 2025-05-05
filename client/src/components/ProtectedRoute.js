import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useContext(AuthContext);

  useEffect(() => {
    // For debugging purposes
    console.log("Protected route check:", { 
      isAuthenticated: !!currentUser, 
      currentRole: userRole, 
      allowedRoles, 
      loading 
    });
  }, [currentUser, userRole, allowedRoles, loading]);

  // Wait until authentication check is complete
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // For demo purposes - if we're in development, allow access temporarily
  if (process.env.NODE_ENV === 'development' && !currentUser) {
    // This is a temporary bypass for development
    console.log("DEV MODE: Bypassing authentication check temporarily");
    return children;
  }

  if (!currentUser) {
    // Not logged in, redirect to login
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // User doesn't have the required role, redirect to home
    console.log(`User role ${userRole} not allowed, redirecting to home`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
