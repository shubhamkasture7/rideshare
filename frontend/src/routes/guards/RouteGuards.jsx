import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/authStore';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their own dashboard
    const redirectPath = user?.role === 'DRIVER' ? '/driver/dashboard' : '/rider/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    const redirectPath = user?.role === 'DRIVER' ? '/driver/dashboard' : '/rider/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};
