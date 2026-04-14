const { Module } = require('@nestjs/common');
const { RideController } = require('./ride.controller');
const { RideService } = require('./ride.service');
const { LocationModule } = require('../location/location.module');

@Module({
  imports: [LocationModule],
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
class RideModule {}

module.exports = { RideModule };
