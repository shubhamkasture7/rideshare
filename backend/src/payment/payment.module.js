const { Module } = require('@nestjs/common');
const { PaymentService } = require('./payment.service');

@Module({
  providers: [PaymentService],
  exports: [PaymentService],
})
class PaymentModule {}

module.exports = { PaymentModule };
