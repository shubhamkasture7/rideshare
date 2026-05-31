import { useCallback } from 'react';
import useRideStore from '../store/rideStore';
import rideService from '../services/rideService';
import useNotificationStore from '../../../store/notificationStore';
import useSocket from '../../socket/hooks/useSocket';

const useRide = () => {
  const {
    currentRide,
    rideStatus,
    nearbyDrivers,
    rideHistory,
    isLoading,
    error,
    estimatedFare,
    estimatedTime,
    estimatedDistance,
    recommendations,
    fetchRecommendations,
    requestRide: setStoreRide,
    rideCancelled,
    resetRide,
    setLoading,
    setError,
    setEstimates,
    pickup,
    drop,
    setPickup,
    setDrop,
  } = useRideStore();

  const { showNotification } = useNotificationStore();
  const { requestRide: socketRequestRide } = useSocket();

  const createRide = useCallback(
    async (rideData) => {
      setLoading(true);
      try {
        // Transform formats
        const payload = {
          pickupLat: rideData.pickup?.lat || rideData.pickupLat,
          pickupLng: rideData.pickup?.lng || rideData.pickupLng,
          pickupAddress: rideData.pickup?.address || rideData.pickupAddress || 'Pickup Location',
          dropLat: rideData.drop?.lat || rideData.dropLat,
          dropLng: rideData.drop?.lng || rideData.dropLng,
          dropAddress: rideData.drop?.address || rideData.dropAddress || 'Drop Location',
          estimatedFare: rideData.estimatedFare,
          estimatedTime: rideData.estimatedTime,
          distance: rideData.distance,
        };

        // Trigger broadcast AND creation via socket
        socketRequestRide(payload);

        showNotification('Ride requested! Looking for drivers...', 'info');
        return true;
      } catch (err) {
        const message = err.message || 'Failed to create ride';
        setError(message);
        showNotification(message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [socketRequestRide, setLoading, setError, showNotification]
  );

  const cancelRide = useCallback(async () => {
    try {
      if (currentRide?.id) {
        await rideService.cancelRide(currentRide.id);
      }
      rideCancelled();
      showNotification('Ride cancelled', 'warning');
    } catch (err) {
      showNotification('Failed to cancel ride', 'error');
    }
  }, [currentRide, rideCancelled, showNotification]);

  return {
    currentRide,
    rideStatus,
    nearbyDrivers,
    rideHistory,
    isLoading,
    error,
    estimatedFare,
    estimatedTime,
    estimatedDistance,
    createRide,
    cancelRide,
    resetRide,
    pickup,
    drop,
    setPickup,
    setDrop,
  };
};

export default useRide;
