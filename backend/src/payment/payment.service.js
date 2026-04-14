const { Injectable, NotFoundException, Logger, Dependencies } = require('@nestjs/common');
const { PrismaService } = require('../prisma/prisma.service');

@Injectable()
@Dependencies(PrismaService)
class PaymentService {
  constructor(prisma) {
    this.prisma = prisma;
    this.logger = new Logger('PaymentService');
  }

  /**
   * Create a payment record for a completed ride
   */
  async createPayment(rideId, amount, method = 'CASH') {
    const payment = await this.prisma.payment.create({
      data: {
        rideId,
        amount,
        method,
        status: 'COMPLETED',
      },
    });

    this.logger.log(`Payment created for ride ${rideId}: ₹${amount}`);
    return payment;
  }

  /**
   * Get payment by ride ID
   */
  async getPaymentByRideId(rideId) {
    const payment = await this.prisma.payment.findUnique({
      where: { rideId },
      include: {
        ride: {
          select: {
            id: true,
            riderId: true,
            driverId: true,
            status: true,
            actualFare: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId) {
    return this.prisma.payment.findMany({
      where: {
        ride: {
          OR: [
            { riderId: userId },
            { driver: { userId } },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            dropAddress: true,
            completedAt: true,
          },
        },
      },
    });
  }

  /**
   * Update payment status (for future payment gateway integration)
   */
  async updatePaymentStatus(paymentId, status) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });
  }
}

module.exports = { PaymentService };
