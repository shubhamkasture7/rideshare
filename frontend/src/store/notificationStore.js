import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  notifications: [],
  
  showNotification: (message, severity = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      notifications: [...state.notifications, { id, message, severity, duration }],
    }));
    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => set({ notifications: [] }),
}));

export default useNotificationStore;
