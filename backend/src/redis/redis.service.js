const { Injectable, Logger } = require('@nestjs/common');
const Redis = require('ioredis');

@Injectable()
class RedisService {
  constructor() {
    this.logger = new Logger('RedisService');
    this.client = null;
  }

  async onModuleInit() {
    try {
      this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis max retries reached — disabling Redis');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
        connectTimeout: 5000,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        // Only log once, not on every retry
        if (this.client?.status !== 'end') {
          this.logger.error(`Redis error: ${err.message}`);
        }
      });

      this.client.on('end', () => {
        this.logger.warn('Redis connection ended — running without Redis');
        this.client = null;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.warn(`Redis unavailable: ${error.message} — running without Redis`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.client.status !== 'end') {
      await this.client.quit();
    }
  }

  getClient() {
    return this.client;
  }

  isConnected() {
    return this.client?.status === 'ready';
  }

  // ─── GEO Commands ──────────────────────────────────────

  async geoAdd(driverId, lng, lat) {
    if (!this.isConnected()) return null;
    return this.client.geoadd('drivers:locations', lng, lat, driverId);
  }

  async geoRemove(driverId) {
    if (!this.isConnected()) return null;
    return this.client.zrem('drivers:locations', driverId);
  }

  async geoSearchDrivers(lng, lat, radiusKm = 5, count = 20) {
    if (!this.isConnected()) return [];

    try {
      const results = await this.client.call(
        'GEOSEARCH',
        'drivers:locations',
        'FROMLONLAT', lng, lat,
        'BYRADIUS', radiusKm, 'km',
        'ASC',
        'COUNT', count,
        'WITHCOORD',
        'WITHDIST',
      );

      return results.map((result) => ({
        id: result[0],
        distance: parseFloat(result[1]),
        coordinates: {
          lng: parseFloat(result[2][0]),
          lat: parseFloat(result[2][1]),
        },
      }));
    } catch (error) {
      this.logger.error(`GeoSearch error: ${error.message}`);
      return [];
    }
  }

  // ─── Distributed Locking ───────────────────────────────

  async acquireLock(key, value, ttlSeconds = 30) {
    if (!this.isConnected()) return true; // Fallback: always succeed
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseLock(key, value) {
    if (!this.isConnected()) return;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.client.eval(script, 1, key, value);
  }

  // ─── Key-Value ─────────────────────────────────────────

  async set(key, value, ttlSeconds) {
    if (!this.isConnected()) return null;
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  async get(key) {
    if (!this.isConnected()) return null;
    return this.client.get(key);
  }

  async del(key) {
    if (!this.isConnected()) return null;
    return this.client.del(key);
  }
}

module.exports = { RedisService };
