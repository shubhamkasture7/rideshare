const {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Dependencies,
} = require('@nestjs/common');
const { PrismaService } = require('../prisma/prisma.service');
const { RedisService } = require('../redis/redis.service');
const { LocationService } = require('../location/location.service');

@Injectable()
@Dependencies(PrismaService, RedisService, LocationService)
class RideService {
  constructor(
    prisma,
    redisService,
    locationService,
  ) {
    this.prisma = prisma;
    this.redis = redisService;
    this.locationService = locationService;
    this.logger = new Logger('RideService');
  }

  /**
   * Create a new ride request
   */
  async createRide(riderId, createRideDto) {
    const { pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress } = createRideDto;

    // Check for existing active ride
    const activeRide = await this.prisma.ride.findFirst({
      where: {
        riderId,
        status: { in: ['REQUESTED', 'ACCEPTED', 'STARTED'] },
      },
    });

    if (activeRide) {
      throw new ConflictException('You already have an active ride');
    }

    // Calculate estimated fare and time (use client values if provided for consistency)
    const distance = createRideDto.distance ? parseFloat(createRideDto.distance) : this.calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
    const estimatedFare = createRideDto.estimatedFare ? Number(createRideDto.estimatedFare) : this.calculateFare(distance);
    const estimatedTime = createRideDto.estimatedTime ? Number(createRideDto.estimatedTime) : this.calculateTime(distance);

    // Create ride
    const ride = await this.prisma.ride.create({
      data: {
        id: createRideDto.id,
        riderId,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropLat,
        dropLng,
        dropAddress,
        status: 'REQUESTED',
        estimatedFare,
        estimatedTime,
        distance,
      },
      include: {
        rider: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    this.logger.log(`Ride created: ${ride.id} by rider ${riderId}`);

    return ride;
  }

  /**
   * Accept a ride (called by driver)
   */
  async acceptRide(rideId, driverId) {
    // Try to acquire lock to prevent race condition
    const lockKey = `ride:lock:${rideId}`;
    const lockValue = `${driverId}:${Date.now()}`;
    const acquired = await this.redis.acquireLock(lockKey, lockValue, 30);

    if (!acquired) {
      throw new ConflictException('This ride is being processed by another driver');
    }

    try {
      const ride = await this.prisma.ride.findUnique({
        where: { id: rideId },
      });

      if (!ride) {
        throw new NotFoundException('Ride not found');
      }

      if (ride.status !== 'REQUESTED') {
        throw new BadRequestException('This ride is no longer available');
      }

      // Update ride with driver assignment
      const updatedRide = await this.prisma.ride.update({
        where: { id: rideId },
        data: {
          driverId,
          status: 'ACCEPTED',
        },
        include: {
          rider: {
            select: { id: true, name: true, phone: true, avatar: true },
          },
          driver: {
            include: {
              user: {
                select: { id: true, name: true, phone: true, avatar: true },
              },
            },
          },
        },
      });

      // Update driver status to BUSY
      await this.prisma.driver.update({
        where: { id: driverId },
        data: { status: 'BUSY' },
      });

      this.logger.log(`Ride ${rideId} accepted by driver ${driverId}`);

      return updatedRide;
    } finally {
      await this.redis.releaseLock(lockKey, lockValue);
    }
  }

  /**
   * Start a ride
   */
  async startRide(rideId, driverId) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw new BadRequestException('You are not assigned to this ride');
    }

    if (ride.status !== 'ACCEPTED') {
      throw new BadRequestException('Ride cannot be started in current state');
    }

    return this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'STARTED',
        startedAt: new Date(),
      },
      include: {
        rider: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        driver: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatar: true },
            },
          },
        },
      },
    });
  }

  /**
   * Complete a ride
   */
  async completeRide(rideId, driverId) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== driverId) {
      throw new BadRequestException('You are not assigned to this ride');
    }

    if (ride.status !== 'STARTED') {
      throw new BadRequestException('Ride cannot be completed in current state');
    }

    const actualFare = ride.estimatedFare || this.calculateFare(ride.distance || 5);

    const updatedRide = await this.prisma.$transaction(async (tx) => {
      // Update ride
      const completedRide = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          actualFare,
        },
        include: {
          rider: {
            select: { id: true, name: true, phone: true, avatar: true },
          },
          driver: {
            include: {
              user: {
                select: { id: true, name: true, phone: true, avatar: true },
              },
            },
          },
        },
      });

      // Update driver stats
      await tx.driver.update({
        where: { id: driverId },
        data: {
          status: 'ONLINE',
          totalRides: { increment: 1 },
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          rideId,
          amount: actualFare,
          method: 'CASH',
          status: 'COMPLETED',
        },
      });

      return completedRide;
    });

    this.logger.log(`Ride ${rideId} completed. Fare: ₹${actualFare}`);

    return updatedRide;
  }

  /**
   * Cancel a ride
   */
  async cancelRide(rideId, userId) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    // Only rider or assigned driver can cancel
    if (ride.riderId !== userId) {
      // Check if user is the driver
      const driver = await this.prisma.driver.findUnique({ where: { userId } });
      if (!driver || ride.driverId !== driver.id) {
        throw new BadRequestException('You cannot cancel this ride');
      }
    }

    if (!['REQUESTED', 'ACCEPTED'].includes(ride.status)) {
      throw new BadRequestException('This ride cannot be cancelled');
    }

    const updatedRide = await this.prisma.$transaction(async (tx) => {
      const cancelledRide = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // If driver was assigned, set them back to ONLINE
      if (ride.driverId) {
        await tx.driver.update({
          where: { id: ride.driverId },
          data: { status: 'ONLINE' },
        });
      }

      return cancelledRide;
    });

    this.logger.log(`Ride ${rideId} cancelled`);

    return updatedRide;
  }

  /**
   * Get ride by ID
   */
  async getRideById(rideId) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        rider: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        driver: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatar: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    return ride;
  }

  /**
   * Get ride history for a user
   */
  async getRideHistory(userId, role) {
    const where = role === 'DRIVER'
      ? { driver: { userId } }
      : { riderId: userId };

    return this.prisma.ride.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        rider: {
          select: { id: true, name: true, avatar: true },
        },
        driver: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get recommended locations for a user based on history
   */
  async getRecommendations(userId) {
    const history = await this.prisma.ride.findMany({
      where: { riderId: userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (history.length === 0) {
      return { pickup: [], drop: [] };
    }

    const countLocations = (type) => {
      const counts = {};
      history.forEach((ride) => {
        const addr = ride[`${type}Address`];
        const lat = ride[`${type}Lat`];
        const lng = ride[`${type}Lng`];
        if (addr) {
          const key = `${addr}|${lat}|${lng}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      });

      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => {
          const [address, lat, lng] = key.split('|');
          return { address, lat: parseFloat(lat), lng: parseFloat(lng) };
        });
    };

    return {
      pickup: countLocations('pickup'),
      drop: countLocations('drop'),
    };
  }

  /**
   * Find nearby available drivers for a ride
   */
  async findNearbyDrivers(lat, lng, radiusKm = 5) {
    // Get nearby driver IDs from Redis
    const nearbyGeo = await this.locationService.findNearbyDrivers(lat, lng, radiusKm);

    if (nearbyGeo.length === 0) {
      return [];
    }

    // Get driver details from DB, only ONLINE drivers
    const driverIds = nearbyGeo.map((g) => g.id);

    const drivers = await this.prisma.driver.findMany({
      where: {
        id: { in: driverIds },
        status: 'ONLINE',
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    // Merge geo data with driver data
    return drivers.map((driver) => {
      const geo = nearbyGeo.find((g) => g.id === driver.id);
      return {
        ...driver,
        distance: geo?.distance || 0,
        position: geo?.coordinates
          ? { lat: geo.coordinates.lat, lng: geo.coordinates.lng }
          : null,
      };
    });
  }

  // ─── Utility methods ───────────────────────────────────

  /**
   * Calculate distance between two coordinates using Haversine formula (km)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate estimated fare based on distance
   * Base fare ₹50 + ₹12/km
   */
  calculateFare(distanceKm) {
    const baseFare = 50;
    const perKm = 12;
    return Math.round(baseFare + distanceKm * perKm);
  }

  /**
   * Calculate estimated time in minutes
   * Assume average speed of 25 km/h in city
   */
  calculateTime(distanceKm) {
    return Math.max(5, Math.round((distanceKm / 25) * 60));
  }
}

module.exports = { RideService };
