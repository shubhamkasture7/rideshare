const { Module } = require('@nestjs/common');
const { JwtModule } = require('@nestjs/jwt');
const { SocketGateway } = require('./socket.gateway');
const { RideModule } = require('../ride/ride.module');
const { LocationModule } = require('../location/location.module');
const { DriverModule } = require('../driver/driver.module');

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'ridesharing-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRY || '7d' },
    }),
    RideModule,
    LocationModule,
    DriverModule,
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
class SocketModule {}

module.exports = { SocketModule };
