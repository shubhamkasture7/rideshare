const {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Dependencies,
  Bind,
  Body,
  Req,
} = require('@nestjs/common');
const { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } = require('@nestjs/swagger');
const { RideService } = require('./ride.service');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');
const { RolesGuard } = require('../common/guards/roles.guard');
const { Roles } = require('../common/decorators/roles.decorator');

@ApiTags('Rides')
@Controller('rides')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Dependencies(RideService)
class RideController {
  constructor(rideService) {
    this.rideService = rideService;
  }

  @Post()
  @Roles('RIDER')
  @Bind(Req())
  @ApiOperation({ summary: 'Create a new ride request' })
  async createRide(req) {
    return this.rideService.createRide(req.user.id, req.body);
  }

  @Get('history')
  @Bind(Req())
  @ApiOperation({ summary: 'Get ride history' })
  async getRideHistory(req) {
    return this.rideService.getRideHistory(req.user.id, req.user.role);
  }

  @Get(':id')
  @Bind(Req())
  @ApiOperation({ summary: 'Get ride details by ID' })
  @ApiParam({ name: 'id', description: 'Ride UUID' })
  async getRide(req) {
    return this.rideService.getRideById(req.params.id);
  }

  @Post(':id/cancel')
  @Bind(Req())
  @ApiOperation({ summary: 'Cancel a ride' })
  @ApiParam({ name: 'id', description: 'Ride UUID' })
  async cancelRide(req) {
    return this.rideService.cancelRide(req.params.id, req.user.id);
  }

  @Post(':id/rate')
  @Bind(Req())
  @ApiOperation({ summary: 'Rate a completed ride' })
  async rateRide(req) {
    return { success: true, rideId: req.params.id, rating: req.body.rating };
  }
}

module.exports = { RideController };
