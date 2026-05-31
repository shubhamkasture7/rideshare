const {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Dependencies,
} = require('@nestjs/common');
const { PrismaService } = require('../prisma/prisma.service');
const { RedisService } = require('../redis/redis.service');

@Injectable()
@Dependencies(PrismaService, RedisService)
class DriverService {
  constructor(prisma, redisService) {
    this.prisma = prisma;
    this.redis = redisService;
    this.logger = new Logger('DriverService');
  }

  /**
   * Get driver profile for the authenticated user
   */
  async getDriverProfile(userId) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return driver;
  }

  /**
   * Update driver status (ONLINE / OFFLINE / BUSY)
   */
  async updateStatus(userId, status) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { userId },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
        },
      },
    });

    // Update Redis geo set
    if (status === 'OFFLINE') {
      await this.redis.geoRemove(driver.id);
      this.logger.log(`Driver ${driver.id} went offline — removed from geo set`);
    }

    return updatedDriver;
  }

  /**
   * Update driver availability (simpler toggle for frontend compatibility)
   */
  async updateAvailability(userId, isOnline) {
    const status = isOnline ? 'ONLINE' : 'OFFLINE';
    return this.updateStatus(userId, status);
  }

  /**
   * Get driver ride history
   */
  async getRideHistory(userId) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.prisma.ride.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        rider: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });
  }

  /**
   * Get driver earnings summary
   */
  async getEarnings(userId) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Today's earnings
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayResult = await this.prisma.ride.aggregate({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        completedAt: { gte: startOfDay },
      },
      _sum: { actualFare: true },
      _count: true,
    });

    // Total earnings
    const totalResult = await this.prisma.ride.aggregate({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
      },
      _sum: { actualFare: true },
      _count: true,
    });

    return {
      today: todayResult._sum.actualFare || 0,
      todayRides: todayResult._count || 0,
      total: totalResult._sum.actualFare || 0,
      totalRides: totalResult._count || 0,
    };
  }

  /**
   * Get driver by ID (internal use)
   */
  async findById(driverId) {
    return this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
        },
      },
    });
  }

  /**
   * Get driver by user ID (internal use)
   */
  async findByUserId(userId) {
    return this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, role: true },
        },
      },
    });
  }

  /**
   * Get active ride for a driver
   */
  async getActiveRide(userId) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) return null;

    return this.prisma.ride.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['ACCEPTED', 'ONGOING'] },
      },
      include: {
        rider: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });
  }
}

module.exports = { DriverService };
