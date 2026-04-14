const { Controller, Get, UseGuards, Dependencies, Bind, Req } = require('@nestjs/common');
const { ApiTags, ApiBearerAuth, ApiOperation } = require('@nestjs/swagger');
const { UserService } = require('./user.service');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Dependencies(UserService)
class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  @Get('me')
  @Bind(Req())
  @ApiOperation({ summary: 'Get current user details' })
  async getMe(req) {
    return this.userService.findById(req.user.id);
  }
}

module.exports = { UserController };
