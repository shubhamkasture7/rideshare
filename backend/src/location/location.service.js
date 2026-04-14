const { Injectable, Logger, Dependencies } = require('@nestjs/common');
const { RedisService } = require('../redis/redis.service');

@Injectable()
@Dependencies(RedisService)
class LocationService {
  constructor(redisService) {
    this.redis = redisService;
    this.logger = new Logger('LocationService');
  }

  /**
   * Update a driver's location in Redis GEO set
   * @param {string} driverId
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  async updateDriverLocation(driverId, lat, lng) {
    try {
      await this.redis.geoAdd(driverId, lng, lat);
      this.logger.debug(`Updated location for driver ${driverId}: [${lat}, ${lng}]`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update driver location: ${error.message}`);
      return false;
    }
  }

  /**
   * Find nearby drivers within a radius
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Promise<Array<{id: string, distance: number, coordinates: {lng: number, lat: number}}>>}
   */
  async findNearbyDrivers(lat, lng, radiusKm = 5) {
    try {
      const results = await this.redis.geoSearchDrivers(lng, lat, radiusKm);
      this.logger.debug(`Found ${results.length} nearby drivers within ${radiusKm}km of [${lat}, ${lng}]`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to find nearby drivers: ${error.message}`);
      return [];
    }
  }

  /**
   * Remove a driver from the geo set (when going offline)
   * @param {string} driverId
   */
  async removeDriver(driverId) {
    try {
      await this.redis.geoRemove(driverId);
      this.logger.debug(`Removed driver ${driverId} from geo set`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove driver from geo set: ${error.message}`);
      return false;
    }
  }
}

module.exports = { LocationService };
