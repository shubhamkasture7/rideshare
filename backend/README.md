# 🚗 RideSharing Backend

Production-ready NestJS backend for a decentralized ride-sharing platform.

## Tech Stack

- **Framework:** NestJS (JavaScript + Babel decorators)
- **Database:** PostgreSQL (via Prisma 7 ORM)
- **Cache/Geo:** Redis (ioredis)
- **WebSocket:** Socket.io
- **Auth:** JWT + bcrypt + Passport
- **Docs:** Swagger / OpenAPI
- **Container:** Docker Compose

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 15+ (local or Docker)
- Redis 7+ (optional — app works without it)

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Start Infrastructure (Docker)

```bash
docker-compose up -d postgres redis
```

Or configure your own PostgreSQL/Redis in `.env`.

### 4. Setup Database

```bash
npx prisma db push       # Push schema to database
npx prisma generate      # Generate Prisma Client (already done)
```

### 5. Start Development Server

```bash
npm run dev
# or
npm start
```

Server starts at:
- **API:** http://localhost:5000/api
- **Swagger:** http://localhost:5000/api/docs
- **WebSocket:** ws://localhost:5000

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | - | Register (RIDER/DRIVER) |
| POST | `/login` | - | Login, returns `{ user, token }` |
| GET | `/me` | JWT | Get current user |
| GET | `/profile` | JWT | Get profile (alias) |
| PUT | `/profile` | JWT | Update profile |

### User (`/api/user`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | JWT | Get user details |

### Driver (`/api/driver`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/me` | JWT+DRIVER | Driver profile |
| PATCH | `/status` | JWT+DRIVER | Set ONLINE/OFFLINE/BUSY |
| PUT | `/availability` | JWT+DRIVER | Toggle availability |
| GET | `/rides/history` | JWT+DRIVER | Ride history |
| GET | `/earnings` | JWT+DRIVER | Earnings summary |

### Rides (`/api/rides`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | JWT+RIDER | Create ride request |
| GET | `/history` | JWT | Ride history |
| GET | `/:id` | JWT | Ride details |
| POST | `/:id/cancel` | JWT | Cancel ride |
| POST | `/:id/rate` | JWT | Rate ride |

## WebSocket Events

### Client → Server

| Event | Sender | Payload |
|-------|--------|---------|
| `ride.request` | Rider | `{ pickupLat, pickupLng, dropLat, dropLng, ... }` |
| `ride.accept` | Driver | `{ rideId }` |
| `ride.start` | Driver | `{ rideId }` |
| `ride.complete` | Driver | `{ rideId }` |
| `ride.cancel` | Both | `{ rideId }` |
| `driver.location.update` | Driver | `{ position: { lat, lng } }` |

### Server → Client

| Event | Receiver | Payload |
|-------|----------|---------|
| `ride.broadcast` | Drivers | `{ ride: { id, pickup, drop, ... } }` |
| `ride.accept` | Rider | `{ driver: { id, name, vehicle, ... } }` |
| `ride.confirmed` | Rider | `{ ride, driver }` |
| `ride.started` | Rider | `{ ride }` |
| `ride.completed` | Rider | `{ fare: { amount } }` |
| `ride.cancelled` | Both | `{ ride }` |
| `driver.location.update` | Rider | `{ driverId, position }` |
| `nearby.drivers` | Rider | `{ drivers: [...] }` |

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ridesharing
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

## Project Structure

```
backend/
├── prisma/schema.prisma      # Database schema
├── src/
│   ├── main.js                # App entry point
│   ├── app.module.js          # Root module
│   ├── common/                # Guards, filters, decorators
│   ├── prisma/                # Prisma ORM service
│   ├── redis/                 # Redis service (GEO, locking)
│   ├── auth/                  # Authentication module
│   ├── user/                  # User module
│   ├── driver/                # Driver module
│   ├── ride/                  # Ride lifecycle module
│   ├── location/              # Location tracking (Redis GEO)
│   ├── socket/                # WebSocket gateway
│   └── payment/               # Payment module (future-ready)
├── docker-compose.yml         # PostgreSQL + Redis
├── Dockerfile                 # Multi-stage production build
└── .env                       # Environment config
```

## Scripts

```bash
npm run dev            # Start with hot-reload (nodemon)
npm start              # Start production
npm run prisma:push    # Push schema to DB
npm run prisma:studio  # Open Prisma Studio
npm run docker:up      # Start Docker services
npm run docker:down    # Stop Docker services
```
