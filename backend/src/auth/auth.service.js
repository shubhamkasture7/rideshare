const {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  Dependencies,
} = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const bcrypt = require('bcryptjs');
const { PrismaService } = require('../prisma/prisma.service');

@Injectable()
@Dependencies(PrismaService, JwtService)
class AuthService {
  constructor(prisma, jwtService) {
    this.prisma = prisma;
    this.jwtService = jwtService;
    this.logger = new Logger('AuthService');
  }

  /**
   * Register a new user (RIDER or DRIVER)
   */
  async register(registerDto) {
    const { name, email, password, phone, role = 'RIDER', vehicleName, vehiclePlate } = registerDto;

    // Validate input
    if (!name || name.length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }
    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('A valid email is required');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    if (role && !['RIDER', 'DRIVER'].includes(role)) {
      throw new BadRequestException('Role must be RIDER or DRIVER');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user + driver profile in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          role,
        },
      });

      // If registering as a driver, create driver profile
      if (role === 'DRIVER') {
        await tx.driver.create({
          data: {
            userId: newUser.id,
            vehicleName: vehicleName || null,
            vehiclePlate: vehiclePlate || null,
          },
        });
      }

      return newUser;
    });

    // Generate JWT
    const token = this.generateToken(user);

    this.logger.log(`User registered: ${email} as ${role}`);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login an existing user
   */
  async login(loginDto) {
    const { email, password } = loginDto;

    // Validate input
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { driver: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const token = this.generateToken(user);

    this.logger.log(`User logged in: ${email}`);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driver: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const { name, phone, avatar } = updateData;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      include: { driver: true },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driver: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  // ─── Private helpers ───────────────────────────────────

  generateToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

module.exports = { AuthService };
