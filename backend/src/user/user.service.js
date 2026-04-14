const { Injectable, NotFoundException, Dependencies } = require('@nestjs/common');
const { PrismaService } = require('../prisma/prisma.service');

@Injectable()
@Dependencies(PrismaService)
class UserService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findById(id) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...sanitized } = user;
    return sanitized;
  }

  async findByEmail(email) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateUser(id, data) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { driver: true },
    });
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = { UserService };
