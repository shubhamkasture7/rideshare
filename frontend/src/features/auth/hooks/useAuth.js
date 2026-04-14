import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const useAuth = () => {
  const navigate = useNavigate();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
    getRole,
    isRider,
    isDriver,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (credentials) => {
      try {
        const data = await login(credentials);
        const role = data.user.role;
        navigate(role === 'DRIVER' ? '/driver/dashboard' : '/rider/dashboard');
        return data;
      } catch (err) {
        throw err;
      }
    },
    [login, navigate]
  );

  const handleSignup = useCallback(
    async (userData) => {
      try {
        const data = await signup(userData);
        const role = data.user.role;
        navigate(role === 'DRIVER' ? '/driver/dashboard' : '/rider/dashboard');
        return data;
      } catch (err) {
        throw err;
      }
    },
    [signup, navigate]
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    clearError,
    role: getRole(),
    isRider: isRider(),
    isDriver: isDriver(),
  };
};

export default useAuth;
