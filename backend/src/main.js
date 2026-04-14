const { NestFactory } = require('@nestjs/core');
const { Logger } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const { IoAdapter } = require('@nestjs/platform-socket.io');
const { AppModule } = require('./app.module');
const { HttpExceptionFilter } = require('./common/filters/http-exception.filter');

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // ─── Global Prefix ─────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── CORS ──────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Global Exception Filter ───────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── WebSocket Adapter ─────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  // ─── Swagger / OpenAPI ─────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('RideSharing API')
    .setDescription('Production-ready backend for decentralized ride-sharing platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & authorization')
    .addTag('User', 'User management')
    .addTag('Driver', 'Driver management')
    .addTag('Rides', 'Ride lifecycle management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // ─── Start Server ──────────────────────────────────────
  const port = process.env.PORT || 5000;
  await app.listen(port);

  logger.log(`🚀 RideSharing API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`🔌 WebSocket server ready on ws://localhost:${port}`);
}

bootstrap();
