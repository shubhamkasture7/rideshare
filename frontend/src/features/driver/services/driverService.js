import api from '../../../api/axiosConfig';
import { getSocket } from '../../socket/services/socketConnection';

const driverService = {
  updateAvailability: async (isOnline) => {
    return (await api.put('/driver/availability', { isOnline })).data;
  },

  updateStatus: async (status) => {
    return (await api.patch('/driver/status', { status })).data;
  },

  sendLocationUpdate: (position) => {
    // Location updates go through WebSocket, not REST
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('driver.location.update', { position });
    }
  },

  acceptRide: async (rideId) => {
    // Ride acceptance goes through WebSocket for real-time locking
    const socket = getSocket();
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Emit acceptance
      socket.emit('ride.accept', { rideId });

      // Listen for confirmation or error
      const timeout = setTimeout(() => {
        socket.off('ride.accept.confirmed', onConfirm);
        socket.off('error', onError);
        reject(new Error('Ride accept timed out'));
      }, 10000);

      const onConfirm = (data) => {
        clearTimeout(timeout);
        socket.off('error', onError);
        resolve(data);
      };

      const onError = (data) => {
        clearTimeout(timeout);
        socket.off('ride.accept.confirmed', onConfirm);
        reject(new Error(data.message || 'Failed to accept ride'));
      };

      socket.once('ride.accept.confirmed', onConfirm);
      socket.once('error', onError);
    });
  },

  rejectRide: async (rideId) => {
    // Rejection is local-only (just dismiss the notification)
    return { success: true };
  },

  startRide: async (rideId) => {
    const socket = getSocket();
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('ride.start', { rideId });

      const timeout = setTimeout(() => {
        socket.off('ride.start.confirmed', onConfirm);
        socket.off('error', onError);
        reject(new Error('Ride start timed out'));
      }, 10000);

      const onConfirm = (data) => {
        clearTimeout(timeout);
        socket.off('error', onError);
        resolve(data);
      };

      const onError = (data) => {
        clearTimeout(timeout);
        socket.off('ride.start.confirmed', onConfirm);
        reject(new Error(data.message || 'Failed to start ride'));
      };

      socket.once('ride.start.confirmed', onConfirm);
      socket.once('error', onError);
    });
  },

  completeRide: async (rideId, fareAmount) => {
    const socket = getSocket();
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('ride.complete', { rideId });

      const timeout = setTimeout(() => {
        socket.off('ride.complete.confirmed', onConfirm);
        socket.off('error', onError);
        reject(new Error('Ride complete timed out'));
      }, 10000);

      const onConfirm = (data) => {
        clearTimeout(timeout);
        socket.off('error', onError);
        resolve(data);
      };

      const onError = (data) => {
        clearTimeout(timeout);
        socket.off('ride.complete.confirmed', onConfirm);
        reject(new Error(data.message || 'Failed to complete ride'));
      };

      socket.once('ride.complete.confirmed', onConfirm);
      socket.once('error', onError);
    });
  },

  getEarnings: async () => {
    return (await api.get('/driver/earnings')).data;
  },

  getProfile: async () => {
    return (await api.get('/driver/me')).data;
  },

  getRideHistory: async () => {
    return (await api.get('/driver/rides/history')).data;
  },
  
  getActiveRide: async () => {
    return (await api.get('/driver/rides/active')).data;
  },
};

export default driverService;
