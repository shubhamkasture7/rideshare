const {
  Controller,
  Get,
  Patch,
  Put,
  UseGuards,
  Dependencies,
  Bind,
  Req,
} = require('@nestjs/common');
const { ApiTags, ApiBearerAuth, ApiOperation } = require('@nestjs/swagger');
const { DriverService } = require('./driver.service');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');
const { RolesGuard } = require('../common/guards/roles.guard');
const { Roles } = require('../common/decorators/roles.decorator');

@ApiTags('Driver')
@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Dependencies(DriverService)
class DriverController {
  constructor(driverService) {
    this.driverService = driverService;
  }

  @Get('me')
  @Roles('DRIVER')
  @Bind(Req())
  @ApiOperation({ summary: 'Get current driver profile' })
  async getProfile(req) {
    return this.driverService.getDriverProfile(req.user.id);
  }

  @Patch('status')
  @Roles('DRIVER')
  @Bind(Req())
  @ApiOperation({ summary: 'Update driver status (ONLINE/OFFLINE/BUSY)' })
  async updateStatus(req) {
    return this.driverService.updateStatus(req.user.id, req.body.status);
  }

  @Put('availability')
  @Roles('DRIVER')
  @Bind(Req())
  @ApiOperation({ summary: 'Toggle driver availability' })
  async updateAvailability(req) {
    return this.driverService.updateAvailability(req.user.id, req.body.isOnline);
  }

  @Get('rides/history')
  @Roles('DRIVER')
  @Bind(Req())
  @ApiOperation({ summary: 'Get driver ride history' })
  async getRideHistory(req) {
    return this.driverService.getRideHistory(req.user.id);
  }

  @Get('earnings')
  @Roles('DRIVER')
  @Bind(Req())
  @ApiOperation({ summary: 'Get driver earnings summary' })
  async getEarnings(req) {
    return this.driverService.getEarnings(req.user.id);
  }
}

module.exports = { DriverController };
