import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketConnection';
import useAuthStore from '../../auth/store/authStore';
import useRideStore from '../../ride/store/rideStore';
import useDriverStore from '../../driver/store/driverStore';
import useNotificationStore from '../../../store/notificationStore';

const useSocket = () => {
  const socketRef = useRef(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const { rideAccepted, rideStarted, rideCompleted, setNearbyDrivers, updateDriverPosition } =
    useRideStore();
  const { setIncomingRide } = useDriverStore();
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    // ---- Rider-side events ----
    socket.on('ride.accept', (data) => {
      rideAccepted(data.driver);
      showNotification('Driver is on the way!', 'success');
    });

    socket.on('ride.confirmed', (data) => {
      // ride.confirmed is emitted along with ride.accept by the backend
      // Contains full ride + driver data
      if (data.driver) {
        rideAccepted(data.driver);
      }
    });

    socket.on('ride.started', (data) => {
      rideStarted();
      showNotification('Your ride has started!', 'info');
    });

    socket.on('ride.completed', (data) => {
      rideCompleted(data.fare);
      showNotification(`Ride completed! Fare: ₹${data.fare?.amount || 0}`, 'success');
    });

    socket.on('ride.cancelled', (data) => {
      const { rideCancelled } = useRideStore.getState();
      rideCancelled();
      showNotification('Ride was cancelled', 'warning');
    });

    socket.on('driver.location.update', (data) => {
      updateDriverPosition(data.driverId, data.position);
    });

    socket.on('nearby.drivers', (data) => {
      setNearbyDrivers(data.drivers || []);
    });

    socket.on('ride.created', (data) => {
      if (data.ride) {
        useRideStore.getState().requestRide({
          ...data.ride,
          pickup: { lat: data.ride.pickupLat, lng: data.ride.pickupLng, address: data.ride.pickupAddress },
          drop: { lat: data.ride.dropLat, lng: data.ride.dropLng, address: data.ride.dropAddress },
        });
      }
    });

    // ---- Driver-side events ----
    socket.on('ride.broadcast', (data) => {
      console.log('🚗 [Socket] Received ride.broadcast:', data);
      setIncomingRide(data.ride);
      showNotification('New ride request!', 'warning');
    });

    // ---- Error handling ----
    socket.on('error', (data) => {
      showNotification(data.message || 'Something went wrong', 'error');
    });

    return () => {
      disconnectSocket();
    };
  }, [token]);

  const emitEvent = useCallback((event, data) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, []);

  const requestRide = useCallback(
    (rideData) => emitEvent('ride.request', rideData),
    [emitEvent]
  );

  const acceptRide = useCallback(
    (rideId) => emitEvent('ride.accept', { rideId }),
    [emitEvent]
  );

  const sendLocationUpdate = useCallback(
    (position) => emitEvent('driver.location.update', { position }),
    [emitEvent]
  );

  const cancelRide = useCallback(
    (rideId) => emitEvent('ride.cancel', { rideId }),
    [emitEvent]
  );

  const sendRiderLocationUpdate = useCallback(
    (position) => emitEvent('rider.location.update', { position }),
    [emitEvent]
  );

  return {
    socket: socketRef.current,
    emitEvent,
    requestRide,
    acceptRide,
    sendLocationUpdate,
    sendRiderLocationUpdate,
    cancelRide,
  };
};

export default useSocket;
