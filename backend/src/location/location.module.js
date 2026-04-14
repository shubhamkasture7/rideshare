const { Module } = require('@nestjs/common');
const { LocationService } = require('./location.service');

@Module({
  providers: [LocationService],
  exports: [LocationService],
})
class LocationModule {}

module.exports = { LocationModule };
