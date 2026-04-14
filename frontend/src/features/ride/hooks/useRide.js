import { useCallback } from 'react';
import useRideStore from '../store/rideStore';
import rideService from '../services/rideService';
import useNotificationStore from '../../../store/notificationStore';

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
    requestRide,
    rideCancelled,
    resetRide,
    setLoading,
    setError,
    setEstimates,
  } = useRideStore();

  const { showNotification } = useNotificationStore();

  const createRide = useCallback(
    async (rideData) => {
      setLoading(true);
      try {
        // Transform frontend format { pickup: { lat, lng, address }, drop: { ... } }
        // to backend format { pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress }
        const payload = {
          pickupLat: rideData.pickup?.lat || rideData.pickupLat,
          pickupLng: rideData.pickup?.lng || rideData.pickupLng,
          pickupAddress: rideData.pickup?.address || rideData.pickupAddress || 'Pickup Location',
          dropLat: rideData.drop?.lat || rideData.dropLat,
          dropLng: rideData.drop?.lng || rideData.dropLng,
          dropAddress: rideData.drop?.address || rideData.dropAddress || 'Drop Location',
        };

        const result = await rideService.createRide(payload);

        // Update the store with the ride data
        requestRide({
          ...rideData,
          id: result.id,
        });

        setEstimates(result.estimatedFare, result.estimatedTime);
        showNotification('Ride requested! Looking for drivers...', 'info');
        return result;
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to create ride';
        setError(message);
        showNotification(message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [requestRide, setEstimates, setLoading, setError, showNotification]
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
    createRide,
    cancelRide,
    resetRide,
  };
};

export default useRide;
