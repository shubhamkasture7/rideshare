import { useCallback, useEffect, useRef } from 'react';
import useDriverStore from '../store/driverStore';
import driverService from '../services/driverService';
import useNotificationStore from '../../../store/notificationStore';
import useBlockchain from '../../blockchain/useBlockchain';

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

  // Blockchain integration
  const {
    walletConnected,
    acceptRideOnChain,
    startRideOnChain,
    completeRideOnChain,
  } = useBlockchain();

  // Send periodic location updates via WebSocket when online
  const positionRef = useRef(currentPosition);
  useEffect(() => {
    positionRef.current = currentPosition;
  }, [currentPosition]);

  useEffect(() => {
    let watchId = null;

    if (isOnline) {
      // 1. Start watching position for real-time updates
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            updatePosition(newPos);
          },
          (err) => {
            console.warn('Geolocation watch error:', err);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );
      }

      // 2. Set up interval to broadcast location to server/rider every 1 second
      locationIntervalRef.current = setInterval(() => {
        // Send the latest position stored in the ref to avoid stale closure
        if (positionRef.current) {
          driverService.sendLocationUpdate(positionRef.current);
        }
      }, 1000); // 1 second update frequency for "realistic" feel
    } else {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [isOnline, updatePosition]);

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
      // 1. Accept off-chain (Backend)
      await driverService.acceptRide(incomingRide.id);
      
      // 2. Accept on-chain (Blockchain) if wallet is connected
      if (walletConnected) {
        try {
          await acceptRideOnChain(incomingRide.id);
        } catch (bcErr) {
          showNotification('On-chain acceptance failed, but ride is assigned.', 'warning');
        }
      }

      acceptRide();
      showNotification('Ride accepted!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to accept ride', 'error');
    } finally {
      setLoading(false);
    }
  }, [incomingRide, acceptRide, showNotification, setLoading, walletConnected, acceptRideOnChain]);

  const handleRejectRide = useCallback(() => {
    rejectRide();
    showNotification('Ride rejected', 'warning');
  }, [rejectRide, showNotification]);

  const handleStartRide = useCallback(async () => {
    if (!assignedRide) return;
    try {
      // 1. Start off-chain (Backend)
      await driverService.startRide(assignedRide.id);

      // 2. Start on-chain (Blockchain)
      if (walletConnected) {
        try {
          await startRideOnChain(assignedRide.id);
        } catch (bcErr) {
          showNotification('On-chain record failed. Proceeding...', 'warning');
        }
      }

      startRide();
      showNotification('Ride started — drive safely!', 'info');
    } catch (err) {
      showNotification(err.message || 'Failed to start ride', 'error');
    }
  }, [assignedRide, startRide, showNotification, walletConnected, startRideOnChain]);

  const handleCompleteRide = useCallback(async () => {
    if (!assignedRide) return;
    try {
      // 1. Complete off-chain (Backend)
      const result = await driverService.completeRide(assignedRide.id);
      const fare = result?.fare || result?.ride?.actualFare || 0;

      // 2. Release Escrow on-chain (Blockchain)
      if (walletConnected) {
        try {
          showNotification('Releasing payment from smart contract...', 'info');
          await completeRideOnChain(assignedRide.id);
        } catch (bcErr) {
          showNotification('Payment release failed on blockchain. Please contact support.', 'error');
        }
      }

      completeRide(fare);
      showNotification(`Ride completed! Earned ₹${fare}`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to complete ride', 'error');
    }
  }, [assignedRide, completeRide, showNotification, walletConnected, completeRideOnChain]);

  const fetchEarnings = useCallback(async () => {
    try {
      const data = await driverService.getEarnings();
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
