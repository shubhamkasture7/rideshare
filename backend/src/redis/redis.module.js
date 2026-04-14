const { Module, Global } = require('@nestjs/common');
const { RedisService } = require('./redis.service');

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
class RedisModule {}

module.exports = { RedisModule };
