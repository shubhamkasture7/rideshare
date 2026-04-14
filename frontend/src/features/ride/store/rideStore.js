import { create } from 'zustand';

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
  rideHistory: [],
  isLoading: false,
  error: null,
  estimatedFare: null,
  estimatedTime: null,

  setRideStatus: (status) => set({ rideStatus: status }),

  requestRide: (rideData) => {
    set({
      currentRide: {
        id: `ride_${Date.now()}`,
        pickup: rideData.pickup,
        drop: rideData.drop,
        createdAt: new Date().toISOString(),
        ...rideData,
      },
      rideStatus: RIDE_STATUS.REQUESTED,
      isLoading: false,
    });
  },

  rideAccepted: (driverInfo) => {
    set((state) => ({
      currentRide: {
        ...state.currentRide,
        driver: driverInfo,
        acceptedAt: new Date().toISOString(),
      },
      rideStatus: RIDE_STATUS.ACCEPTED,
    }));
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
    });
    setTimeout(() => set({ rideStatus: RIDE_STATUS.IDLE }), 2000);
  },

  setNearbyDrivers: (drivers) => set({ nearbyDrivers: drivers }),

  updateDriverPosition: (driverId, position) => {
    set((state) => ({
      nearbyDrivers: state.nearbyDrivers.map((d) =>
        d.id === driverId ? { ...d, position } : d
      ),
    }));
  },

  setEstimates: (fare, time) => set({ estimatedFare: fare, estimatedTime: time }),

  resetRide: () =>
    set({
      currentRide: null,
      rideStatus: RIDE_STATUS.IDLE,
      estimatedFare: null,
      estimatedTime: null,
      error: null,
    }),

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export { RIDE_STATUS };
export default useRideStore;
