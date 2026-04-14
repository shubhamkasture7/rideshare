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

  acceptRide: () => {
    const ride = get().incomingRide;
    if (ride) {
      set({
        assignedRide: {
          ...ride,
          status: 'ACCEPTED',
          acceptedAt: new Date().toISOString(),
        },
        incomingRide: null,
      });
    }
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
