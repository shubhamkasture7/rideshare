const { Injectable, Logger } = require('@nestjs/common');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

@Injectable()
class PrismaService {
  constructor() {
    this.logger = new Logger('PrismaService');

    // Create pg pool
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ridesharing';
    this.pool = new Pool({ connectionString });

    // Create Prisma adapter
    const adapter = new PrismaPg(this.pool);

    // Create Prisma client with adapter
    this._client = new PrismaClient({ adapter });

    // Proxy all Prisma model methods through to the client
    return new Proxy(this, {
      get: (target, prop) => {
        // Prioritize PrismaService own methods
        if (prop in target && typeof target[prop] !== 'undefined') {
          return target[prop];
        }
        // Delegate to PrismaClient
        if (target._client && prop in target._client) {
          const value = target._client[prop];
          if (typeof value === 'function') {
            return value.bind(target._client);
          }
          return value;
        }
        return undefined;
      },
    });
  }

  async onModuleInit() {
    await this._client.$connect();
    this.logger.log('Prisma connected to PostgreSQL');
  }

  async onModuleDestroy() {
    await this._client.$disconnect();
    await this.pool.end();
    this.logger.log('Prisma disconnected');
  }
}

module.exports = { PrismaService };
