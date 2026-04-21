import { create } from 'zustand';
import api from '../../../api/axiosConfig';

const RIDE_STATUS = {
  IDLE: 'IDLE',
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const useRideStore = create((set, get) => ({
  currentRide: null,
  rideStatus: RIDE_STATUS.IDLE,
  nearbyDrivers: [],
  activeDriverPosition: null,
  rideHistory: [],
  isLoading: false,
  error: null,
  estimatedFare: null,
  estimatedTime: null,
  estimatedDistance: null,
  pickup: null,
  drop: null,

  setPickup: (pickup) => set({ pickup }),
  setDrop: (drop) => set({ drop }),
  setRideStatus: (status) => set({ rideStatus: status }),

  requestRide: (rideData) => {
    // Normalize data structure
    const normalizedRide = {
      id: rideData.id || `ride_${Date.now()}`,
      pickup: rideData.pickup || { lat: rideData.pickupLat, lng: rideData.pickupLng, address: rideData.pickupAddress },
      drop: rideData.drop || { lat: rideData.dropLat, lng: rideData.dropLng, address: rideData.dropAddress },
      createdAt: new Date().toISOString(),
      ...rideData,
    };

    set({
      currentRide: normalizedRide,
      rideStatus: RIDE_STATUS.REQUESTED,
      isLoading: false,
    });
  },

  rideAccepted: (driverInfo) => {
    const state = get();
    // Try to find driver's last known position from nearbyDrivers list
    const lastPos = state.nearbyDrivers.find(d => d.id === driverInfo.id)?.position;
    
    set({
      currentRide: {
        ...state.currentRide,
        driver: driverInfo,
        driverId: driverInfo.id,
        acceptedAt: new Date().toISOString(),
      },
      rideStatus: RIDE_STATUS.ACCEPTED,
      activeDriverPosition: lastPos || state.activeDriverPosition,
    });
  },

  rideStarted: () => {
    set((state) => ({
      currentRide: {
        ...state.currentRide,
        startedAt: new Date().toISOString(),
      },
      rideStatus: RIDE_STATUS.ONGOING,
    }));
  },

  rideCompleted: (fareInfo) => {
    const ride = get().currentRide;
    set((state) => ({
      currentRide: {
        ...state.currentRide,
        completedAt: new Date().toISOString(),
        fare: fareInfo,
      },
      rideStatus: RIDE_STATUS.COMPLETED,
      rideHistory: [...state.rideHistory, { ...ride, ...fareInfo, completedAt: new Date().toISOString() }],
    }));
  },

  rideCancelled: () => {
    set({
      currentRide: null,
      rideStatus: RIDE_STATUS.CANCELLED,
      activeDriverPosition: null,
    });
    setTimeout(() => set({ rideStatus: RIDE_STATUS.IDLE }), 2000);
  },

  setNearbyDrivers: (drivers) => set({ nearbyDrivers: drivers }),

  updateDriverPosition: (driverId, position) => {
    // Normalize position to [lat, lng]
    const pos = Array.isArray(position) ? position : [position.lat, position.lng];
    
    set((state) => {
      // Check if this is our assigned driver
      const assignedDriverId = state.currentRide?.driver?.id || state.currentRide?.driverId;
      const isAssignedDriver = assignedDriverId === driverId;
      
      return {
        nearbyDrivers: state.nearbyDrivers.map((d) =>
          d.id === driverId ? { ...d, position: pos } : d
        ),
        ...(isAssignedDriver ? { activeDriverPosition: pos } : {}),
      };
    });
  },

  setEstimates: (fare, time, distance) => set({ estimatedFare: fare, estimatedTime: time, estimatedDistance: distance }),

  fetchRideHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/rides/history');
      set({ rideHistory: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch ride history',
        isLoading: false,
      });
    }
  },

  resetRide: () =>
    set({
      currentRide: null,
      rideStatus: RIDE_STATUS.IDLE,
      estimatedFare: null,
      estimatedTime: null,
      activeDriverPosition: null,
      error: null,
    }),

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export { RIDE_STATUS };
export default useRideStore;
