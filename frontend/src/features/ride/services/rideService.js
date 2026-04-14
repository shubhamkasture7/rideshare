import api from '../../../api/axiosConfig';

const rideService = {
  createRide: async (rideData) => {
    return (await api.post('/rides', rideData)).data;
  },

  cancelRide: async (rideId) => {
    return (await api.post(`/rides/${rideId}/cancel`)).data;
  },

  getRideHistory: async () => {
    return (await api.get('/rides/history')).data;
  },

  getRideDetails: async (rideId) => {
    return (await api.get(`/rides/${rideId}`)).data;
  },

  rateRide: async (rideId, rating) => {
    return (await api.post(`/rides/${rideId}/rate`, { rating })).data;
  },
};

export default rideService;
