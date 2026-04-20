const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function main() {
  console.log('🚀 Starting Full System Cleanup...');
  
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not found in environment. Ensure you are running from the correct directory or the backend/.env exists.');
    process.exit(1);
  }

  try {
    const redactedString = connectionString.includes('@') 
      ? connectionString.split('@')[1] 
      : 'Local DB';
    console.log(`📡 Connecting to: ${redactedString} (Redacted)`);

    await prisma.$connect();
    
    // 1. Clean up active rides in DB
    const activeRides = await prisma.ride.updateMany({
      where: {
        status: { in: ['REQUESTED', 'ACCEPTED', 'STARTED'] },
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
    console.log(`✅ Cancelled ${activeRides.count} active rides in Database.`);

    // 2. Reset driver statuses
    const updatedDrivers = await prisma.driver.updateMany({
      where: {
        status: 'BUSY',
      },
      data: {
        status: 'ONLINE',
      },
    });
    console.log(`✅ Reset ${updatedDrivers.count} busy drivers to ONLINE.`);

    // 3. Flush Redis
    await redis.flushall();
    console.log('✅ Flushed all Redis data.');

    console.log('✨ Cleanup completed successfully! You can now request new rides.');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    await redis.quit();
  }
}

main();
