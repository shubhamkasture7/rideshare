const { Injectable, UnauthorizedException, Dependencies } = require('@nestjs/common');
const { PassportStrategy } = require('@nestjs/passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const { PrismaService } = require('../../prisma/prisma.service');

@Injectable()
@Dependencies(PrismaService)
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(prisma) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'ridesharing-secret',
    });
    this.prisma = prisma;
  }

  async validate(payload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { driver: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return sanitized user (no password)
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = { JwtStrategy };
