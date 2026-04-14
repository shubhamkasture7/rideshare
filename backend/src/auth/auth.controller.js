const {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Dependencies,
  Bind,
} = require('@nestjs/common');
const { ApiTags, ApiOperation, ApiBearerAuth } = require('@nestjs/swagger');
const { AuthService } = require('./auth.service');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');

@ApiTags('Auth')
@Controller('auth')
@Dependencies(AuthService)
class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Post('register')
  @Bind(Body())
  @ApiOperation({ summary: 'Register a new user (RIDER or DRIVER)' })
  @HttpCode(HttpStatus.CREATED)
  async register(body) {
    return this.authService.register(body);
  }

  @Post('login')
  @Bind(Body())
  @ApiOperation({ summary: 'Login with email and password' })
  @HttpCode(HttpStatus.OK)
  async login(body) {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Bind(Req())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(req) {
    return this.authService.getProfile(req.user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @Bind(Req())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (alias)' })
  async getProfileAlias(req) {
    return this.authService.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @Bind(Req())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(req) {
    return this.authService.updateProfile(req.user.id, req.body);
  }
}

module.exports = { AuthController };
