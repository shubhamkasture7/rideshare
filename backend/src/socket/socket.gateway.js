const {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} = require('@nestjs/websockets');
const { Logger, Dependencies } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { PrismaService } = require('../prisma/prisma.service');
const { RideService } = require('../ride/ride.service');
const { LocationService } = require('../location/location.service');
const { DriverService } = require('../driver/driver.service');
const { RedisService } = require('../redis/redis.service');

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@Dependencies(JwtService, PrismaService, RideService, LocationService, DriverService, RedisService)
class SocketGateway {
  constructor(
    jwtService,
    prisma,
    rideService,
    locationService,
    driverService,
    redisService,
  ) {
    this.jwtService = jwtService;
    this.prisma = prisma;
    this.rideService = rideService;
    this.locationService = locationService;
    this.driverService = driverService;
    this.redis = redisService;
    this.logger = new Logger('SocketGateway');
    this.server = null;

    // Map of userId -> socketId
    this.userSocketMap = new Map();
  }

  afterInit(server) {
    this.server = server;
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client) {
    try {
      const token = client.handshake.auth?.token
        || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'ridesharing-secret',
      });

      // Get user from DB
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { driver: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      // Store user info in socket data
      client.data = client.data || {};
      client.data.userId = user.id;
      client.data.role = user.role;
      client.data.driverId = user.driver?.id || null;

      // Join user-specific room
      client.join(`user:${user.id}`);

      // If driver, join drivers room
      if (user.role === 'DRIVER' && user.driver) {
        client.join('drivers');
        client.join(`driver:${user.driver.id}`);
        this.logger.log(`Driver ${user.name} joined 'drivers' room`);
      }

      // Track socket mapping
      this.userSocketMap.set(user.id, client.id);

      this.logger.log(`✅ Client connected: ${client.id} (User: ${user.name}, Role: ${user.role})`);
    } catch (error) {
      this.logger.error(`❌ Socket auth failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSocketMap.delete(userId);

      // If driver, remove from geo set
      if (client.data.role === 'DRIVER' && client.data.driverId) {
        this.locationService.removeDriver(client.data.driverId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Ride Events ───────────────────────────────────────

  @SubscribeMessage('ride.request')
  async handleRideRequest(client, data) {
    try {
      const userId = client.data.userId;

      if (client.data.role !== 'RIDER') {
        client.emit('error', { message: 'Only riders can request rides' });
        return;
      }

      // Create ride via service
      const ride = await this.rideService.createRide(userId, {
        pickupLat: data.pickupLat || data.pickup?.lat,
        pickupLng: data.pickupLng || data.pickup?.lng,
        pickupAddress: data.pickupAddress || data.pickup?.address,
        dropLat: data.dropLat || data.drop?.lat,
        dropLng: data.dropLng || data.drop?.lng,
        dropAddress: data.dropAddress || data.drop?.address,
        estimatedFare: data.estimatedFare,
        estimatedTime: data.estimatedTime,
        distance: data.distance,
      });

      // Broadcast to drivers
      const nearbyDrivers = await this.broadcastRide(ride);

      // Send nearby drivers list to rider
      const driverList = (nearbyDrivers || []).map((d) => ({
        id: d.id,
        name: d.user.name,
        position: d.position,
        rating: d.rating,
        vehicle: d.vehicleName,
        distance: d.distance,
      }));

      client.emit('nearby.drivers', { drivers: driverList });
      client.emit('ride.created', { ride });

      this.logger.log(`Ride ${ride.id} requested by user ${userId}`);
    } catch (error) {
      this.logger.error(`ride.request error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('ride.accept')
  async handleRideAccept(client, data) {
    try {
      const driverId = client.data.driverId;

      if (client.data.role !== 'DRIVER' || !driverId) {
        client.emit('error', { message: 'Only drivers can accept rides' });
        return;
      }

      const rideId = data.rideId;
      if (!rideId) {
        client.emit('error', { message: 'rideId is required' });
        return;
      }

      // Accept ride via service (with Redis lock)
      const ride = await this.rideService.acceptRide(rideId, driverId);

      // Get driver details for the rider
      const driver = await this.driverService.findById(driverId);

      const driverInfo = {
        id: driver.id,
        name: driver.user.name,
        phone: driver.user.phone,
        avatar: driver.user.avatar,
        vehicleName: driver.vehicleName,
        vehiclePlate: driver.vehiclePlate,
        rating: driver.rating,
      };

      // Emit to rider: ride accepted with driver info
      this.server.to(`user:${ride.riderId}`).emit('ride.accept', {
        driver: driverInfo,
      });

      this.server.to(`user:${ride.riderId}`).emit('ride.confirmed', {
        ride,
        driver: driverInfo,
      });

      // Confirm to the driver
      client.emit('ride.accept.confirmed', { ride, success: true });

      this.logger.log(`Ride ${rideId} accepted by driver ${driverId}`);
    } catch (error) {
      this.logger.error(`ride.accept error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('ride.start')
  async handleRideStart(client, data) {
    try {
      const driverId = client.data.driverId;
      const ride = await this.rideService.startRide(data.rideId, driverId);

      this.server.to(`user:${ride.riderId}`).emit('ride.started', { ride });
      client.emit('ride.start.confirmed', { ride });

      this.logger.log(`Ride ${data.rideId} started`);
    } catch (error) {
      this.logger.error(`ride.start error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('ride.complete')
  async handleRideComplete(client, data) {
    try {
      const driverId = client.data.driverId;
      const ride = await this.rideService.completeRide(data.rideId, driverId);

      this.server.to(`user:${ride.riderId}`).emit('ride.completed', {
        fare: { amount: ride.actualFare, method: 'CASH' },
        ride,
      });

      client.emit('ride.complete.confirmed', { ride, fare: ride.actualFare });

      this.logger.log(`Ride ${data.rideId} completed. Fare: ₹${ride.actualFare}`);
    } catch (error) {
      this.logger.error(`ride.complete error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('ride.cancel')
  async handleRideCancel(client, data) {
    try {
      const userId = client.data.userId;
      const ride = await this.rideService.cancelRide(data.rideId, userId);

      if (client.data.role === 'RIDER' && ride.driverId) {
        const driver = await this.driverService.findById(ride.driverId);
        if (driver) {
          this.server.to(`user:${driver.user.id}`).emit('ride.cancelled', { ride });
        }
      } else if (client.data.role === 'DRIVER') {
        this.server.to(`user:${ride.riderId}`).emit('ride.cancelled', { ride });
      }

      client.emit('ride.cancel.confirmed', { ride });

      this.logger.log(`Ride ${data.rideId} cancelled by ${client.data.role}`);
    } catch (error) {
      this.logger.error(`ride.cancel error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  // ─── Location Events ───────────────────────────────────

  @SubscribeMessage('driver.location.update')
  async handleLocationUpdate(client, data) {
    try {
      const driverId = client.data.driverId;
      if (!driverId) return;

      const lat = data.position?.lat || data.lat;
      const lng = data.position?.lng || data.lng;
      if (!lat || !lng) return;

      // Update in Redis
      await this.locationService.updateDriverLocation(driverId, lat, lng);

      // If driver has an active ride, forward location to the rider
      const activeRide = await this.prisma.ride.findFirst({
        where: {
          driverId,
          status: { in: ['ACCEPTED', 'STARTED'] },
        },
      });

      if (activeRide) {
        this.server.to(`user:${activeRide.riderId}`).emit('driver.location.update', {
          driverId,
          position: { lat, lng },
        });
      }
    } catch (error) {
      this.logger.error(`location.update error: ${error.message}`);
    }
  }

  @SubscribeMessage('rider.location.update')
  async handleRiderLocationUpdate(client, data) {
    try {
      const lat = data.position?.lat || data.lat;
      const lng = data.position?.lng || data.lng;
      if (!lat || !lng) return;

      // Find nearby drivers within 5km radius
      const nearbyDrivers = await this.rideService.findNearbyDrivers(lat, lng, 5);

      const driverList = (nearbyDrivers || []).map((d) => ({
        id: d.id,
        name: d.user.name,
        position: d.position,
        rating: d.rating,
        vehicle: d.vehicleName,
        distance: d.distance,
      }));

      client.emit('nearby.drivers', { drivers: driverList });
    } catch (error) {
      this.logger.error(`rider.location.update error: ${error.message}`);
    }
  }

  /**
   * Broadcast a ride to nearby or all online drivers
   */
  async broadcastRide(ride) {
    if (!this.server) return;

    // Find nearby drivers
    const nearbyDrivers = await this.rideService.findNearbyDrivers(
      ride.pickupLat,
      ride.pickupLng,
      5,
    );

    const ridePayload = {
      ride: {
        id: ride.id,
        pickup: { lat: ride.pickupLat, lng: ride.pickupLng, address: ride.pickupAddress },
        drop: { lat: ride.dropLat, lng: ride.dropLng, address: ride.dropAddress },
        estimatedFare: ride.estimatedFare,
        estimatedTime: ride.estimatedTime,
        distance: ride.distance,
        rider: ride.rider,
        status: ride.status,
        createdAt: ride.createdAt,
      },
    };

    if (nearbyDrivers.length > 0) {
      for (const driver of nearbyDrivers) {
        const individualizedPayload = {
          ride: {
            ...ridePayload.ride,
            pickupDistance: driver.distance, // distance from driver to pickup
          },
        };
        this.logger.log(`📡 Emitting ride.broadcast to user:${driver.user.id}`);
        this.server.to(`user:${driver.user.id}`).emit('ride.broadcast', individualizedPayload);
      }
      this.logger.log(`✅ Ride ${ride.id} broadcast to ${nearbyDrivers.length} nearby drivers`);
    } else {
      this.logger.warn(`⚠️ No nearby drivers found for ride ${ride.id}. Broadcasting to all drivers room.`);
      this.server.to('drivers').emit('ride.broadcast', ridePayload);
      this.logger.log(`✅ Ride ${ride.id} broadcast to all online drivers`);
    }

    return nearbyDrivers;
  }

  // ─── Utility methods ──────────────────────────────────

  emitToUser(userId, event, data) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }

  emitToDrivers(event, data) {
    if (this.server) {
      this.server.to('drivers').emit(event, data);
    }
  }
}

module.exports = { SocketGateway };
