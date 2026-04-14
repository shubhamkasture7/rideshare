import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, alpha } from '@mui/material';

import { ProtectedRoute, PublicRoute } from './guards/RouteGuards';
import DashboardLayout from '../layouts/DashboardLayout';

// Lazy loaded pages
const LoginForm = lazy(() => import('../features/auth/components/LoginForm'));
const SignupForm = lazy(() => import('../features/auth/components/SignupForm'));
const RiderDashboard = lazy(() => import('../features/ride/components/RiderDashboard'));
const DriverDashboard = lazy(() => import('../features/driver/components/DriverDashboard'));

const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: (theme) =>
        `radial-gradient(ellipse at 50% 50%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%),
         ${theme.palette.background.default}`,
    }}
  >
    <CircularProgress size={48} thickness={3} sx={{ color: 'primary.main' }} />
  </Box>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupForm />
            </PublicRoute>
          }
        />

        {/* Protected - Rider */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['RIDER']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/rider/dashboard" element={<RiderDashboard />} />
        </Route>

        {/* Protected - Driver */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['DRIVER']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
