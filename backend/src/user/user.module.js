const { Module } = require('@nestjs/common');
const { UserController } = require('./user.controller');
const { UserService } = require('./user.service');

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
class UserModule {}

module.exports = { UserModule };
