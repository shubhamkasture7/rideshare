import { create } from 'zustand';

const useDriverStore = create((set, get) => ({
  isOnline: false,
  currentPosition: { lat: 28.6139, lng: 77.209 },
  incomingRide: null,
  assignedRide: null,
  earnings: { today: 0, total: 0 },
  rideHistory: [],
  isLoading: false,

  toggleOnline: () => {
    set((state) => ({ isOnline: !state.isOnline }));
  },

  setOnline: (status) => set({ isOnline: status }),

  updatePosition: (position) => set({ currentPosition: position }),

  setIncomingRide: (ride) => set({ incomingRide: ride }),

  clearIncomingRide: () => set({ incomingRide: null }),

  acceptRide: (rideData) => {
    const ride = rideData || get().incomingRide;
    if (ride) {
      // Normalize data structure if it comes from DB (pickupLat vs pickup.lat)
      const normalizedRide = {
        ...ride,
        pickup: ride.pickup || { lat: ride.pickupLat, lng: ride.pickupLng, address: ride.pickupAddress },
        drop: ride.drop || { lat: ride.dropLat, lng: ride.dropLng, address: ride.dropAddress },
        status: ride.status || 'ACCEPTED',
        acceptedAt: ride.acceptedAt || new Date().toISOString(),
      };

      set({
        assignedRide: normalizedRide,
        incomingRide: null,
      });
    }
  },

  setAssignedRide: (ride) => {
    if (!ride) {
      set({ assignedRide: null });
      return;
    }
    
    // Normalize data structure
    const normalizedRide = {
      ...ride,
      pickup: ride.pickup || { lat: ride.pickupLat, lng: ride.pickupLng, address: ride.pickupAddress },
      drop: ride.drop || { lat: ride.dropLat, lng: ride.dropLng, address: ride.dropAddress },
    };
    set({ assignedRide: normalizedRide });
  },

  rejectRide: () => {
    set({ incomingRide: null });
  },

  startRide: () => {
    set((state) => ({
      assignedRide: state.assignedRide
        ? { ...state.assignedRide, status: 'ONGOING', startedAt: new Date().toISOString() }
        : null,
    }));
  },

  completeRide: (fareAmount) => {
    const ride = get().assignedRide;
    if (ride) {
      set((state) => ({
        assignedRide: null,
        earnings: {
          today: state.earnings.today + (fareAmount || 0),
          total: state.earnings.total + (fareAmount || 0),
        },
        rideHistory: [
          ...state.rideHistory,
          { ...ride, status: 'COMPLETED', completedAt: new Date().toISOString(), fare: fareAmount },
        ],
      }));
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}));

export default useDriverStore;
