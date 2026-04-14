import { useCallback, useEffect, useRef } from 'react';
import useDriverStore from '../store/driverStore';
import driverService from '../services/driverService';
import useNotificationStore from '../../../store/notificationStore';

const useDriver = () => {
  const {
    isOnline,
    currentPosition,
    incomingRide,
    assignedRide,
    earnings,
    rideHistory,
    isLoading,
    toggleOnline,
    setOnline,
    updatePosition,
    acceptRide,
    rejectRide,
    startRide,
    completeRide,
    setLoading,
  } = useDriverStore();

  const { showNotification } = useNotificationStore();
  const locationIntervalRef = useRef(null);

  // Send periodic location updates via WebSocket when online
  useEffect(() => {
    if (isOnline) {
      // Get initial position via browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            updatePosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            // Use default position if geolocation fails
          }
        );
      }

      locationIntervalRef.current = setInterval(() => {
        // Send current position to backend via socket
        driverService.sendLocationUpdate(currentPosition);
      }, 5000);
    } else {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    }
    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [isOnline]);

  const handleToggleOnline = useCallback(async () => {
    try {
      const newStatus = !isOnline;
      await driverService.updateAvailability(newStatus);
      toggleOnline();
      showNotification(newStatus ? 'You are now online' : 'You are now offline', 'info');
    } catch (err) {
      showNotification('Failed to update availability', 'error');
    }
  }, [isOnline, toggleOnline, showNotification]);

  const handleAcceptRide = useCallback(async () => {
    if (!incomingRide) return;
    setLoading(true);
    try {
      await driverService.acceptRide(incomingRide.id);
      acceptRide();
      showNotification('Ride accepted!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to accept ride', 'error');
    } finally {
      setLoading(false);
    }
  }, [incomingRide, acceptRide, showNotification, setLoading]);

  const handleRejectRide = useCallback(() => {
    rejectRide();
    showNotification('Ride rejected', 'warning');
  }, [rejectRide, showNotification]);

  const handleStartRide = useCallback(async () => {
    if (!assignedRide) return;
    try {
      await driverService.startRide(assignedRide.id);
      startRide();
      showNotification('Ride started — drive safely!', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to start ride', 'error');
    }
  }, [assignedRide, startRide, showNotification]);

  const handleCompleteRide = useCallback(async () => {
    if (!assignedRide) return;
    try {
      const result = await driverService.completeRide(assignedRide.id);
      const fare = result?.fare || result?.ride?.actualFare || 0;
      completeRide(fare);
      showNotification(`Ride completed! Earned ₹${fare}`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to complete ride', 'error');
    }
  }, [assignedRide, completeRide, showNotification]);

  const fetchEarnings = useCallback(async () => {
    try {
      const data = await driverService.getEarnings();
      // Update store with real earnings from backend
      return data;
    } catch (err) {
      showNotification('Failed to fetch earnings', 'error');
    }
  }, [showNotification]);

  return {
    isOnline,
    currentPosition,
    incomingRide,
    assignedRide,
    earnings,
    rideHistory,
    isLoading,
    toggleOnline: handleToggleOnline,
    acceptRide: handleAcceptRide,
    rejectRide: handleRejectRide,
    startRide: handleStartRide,
    completeRide: handleCompleteRide,
    updatePosition,
    fetchEarnings,
  };
};

export default useDriver;
