import api from '../../../api/axiosConfig';

const authService = {
  login: async ({ email, password }) => {
    return (await api.post('/auth/login', { email, password })).data;
  },

  signup: async ({ name, email, password, role }) => {
    return (await api.post('/auth/register', { name, email, password, role })).data;
  },

  getProfile: async () => {
    return (await api.get('/auth/profile')).data;
  },

  updateProfile: async (data) => {
    return (await api.put('/auth/profile', data)).data;
  },
};

export default authService;
