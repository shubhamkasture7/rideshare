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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Email,
  Lock,
  Person,
  Visibility,
  VisibilityOff,
  DirectionsCar,
  Hail,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';

const SignupForm = () => {
  const { signup, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'RIDER' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    clearError();
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(formData);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          `radial-gradient(ellipse at 80% 50%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
           radial-gradient(ellipse at 20% 80%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
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
            Join RideSharing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your account to get started
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Role Selector */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            I want to:
          </Typography>
          <ToggleButtonGroup
            value={formData.role}
            exclusive
            onChange={(_, val) => val && setFormData((prev) => ({ ...prev, role: val }))}
            fullWidth
            sx={{
              '& .MuiToggleButton-root': {
                py: 1.5,
                borderRadius: '10px !important',
                border: '1px solid',
                borderColor: 'divider',
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': {
                  background: (theme) => alpha(theme.palette.primary.main, 0.1),
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              },
            }}
          >

            <ToggleButton value="RIDER">
              <Hail sx={{ mr: 1 }} /> Ride
            </ToggleButton>
            <ToggleButton value="DRIVER">
              <DirectionsCar sx={{ mr: 1 }} /> Drive
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          fullWidth
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          sx={{ mb: 2.5 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />

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
          color={formData.role === 'RIDER' ? 'primary' : 'secondary'}
          fullWidth
          size="large"
          disabled={isLoading}
          sx={{ mb: 2, py: 1.5 }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
        </Button>

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <Typography variant="body2" align="center" color="text.secondary">
          Already have an account?{' '}
          <Link 
            component={RouterLink} 
            to="/login" 
            sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Sign In
          </Link>

        </Typography>
      </Box>
    </Box>
  );
};

export default SignupForm;
