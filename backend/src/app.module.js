const { Module } = require('@nestjs/common');
const { PrismaModule } = require('./prisma/prisma.module');
const { RedisModule } = require('./redis/redis.module');
const { AuthModule } = require('./auth/auth.module');
const { UserModule } = require('./user/user.module');
const { DriverModule } = require('./driver/driver.module');
const { RideModule } = require('./ride/ride.module');
const { LocationModule } = require('./location/location.module');
const { SocketModule } = require('./socket/socket.module');
const { PaymentModule } = require('./payment/payment.module');

@Module({
  imports: [
    // Infrastructure
    PrismaModule,
    RedisModule,

    // Feature Modules
    AuthModule,
    UserModule,
    DriverModule,
    RideModule,
    LocationModule,
    SocketModule,
    PaymentModule,
  ],
})
class AppModule {}

module.exports = { AppModule };
