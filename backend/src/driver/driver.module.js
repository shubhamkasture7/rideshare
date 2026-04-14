const { Module } = require('@nestjs/common');
const { DriverController } = require('./driver.controller');
const { DriverService } = require('./driver.service');

@Module({
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
class DriverModule {}

module.exports = { DriverModule };
