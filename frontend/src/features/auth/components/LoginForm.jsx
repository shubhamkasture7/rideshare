import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  alpha,
  Alert,
  Divider,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  DirectionsCar,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';

const LoginForm = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    clearError();
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(formData);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          `radial-gradient(ellipse at 20% 50%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 50%),
           radial-gradient(ellipse at 80% 20%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
           ${theme.palette.background.default}`,
        p: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 4, md: 6 },
          borderRadius: 5,
          background: '#FFFFFF',
          border: '1px solid',
          borderColor: alpha('#000', 0.05),
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
      >

        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF8533 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 24px rgba(255, 107, 0, 0.3)',
            }}
          >
            <DirectionsCar sx={{ fontSize: 36, color: '#fff' }} />
          </Box>

          <Typography variant="h4" fontWeight={800} gutterBottom>
            RideSharing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          name="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          sx={{ mb: 2.5 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          required
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isLoading}
          sx={{ mb: 2, py: 1.5 }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>

        {/* Demo credentials hint */}
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
          <strong>Demo:</strong> rider@test.com / driver@test.com (any password)
        </Alert>

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <Typography variant="body2" align="center" color="text.secondary">
          Don't have an account?{' '}
          <Link
            component={RouterLink}
            to="/signup"
            sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Sign Up
          </Link>

        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;
