const { Injectable, CanActivate, ExecutionContext } = require('@nestjs/common');
const { AuthGuard } = require('@nestjs/passport');

@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      const { UnauthorizedException } = require('@nestjs/common');
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

module.exports = { JwtAuthGuard };
