# E-Commerce Application

A full-stack e-commerce application with Node.js/Express backend and React frontend.

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5
- **Database**: MySQL/MariaDB
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Testing**: Mocha, Chai, Sinon, Supertest

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: TanStack React Query
- **HTTP Client**: Axios

## Prerequisites

- Node.js v18+
- MySQL 8.0+ or MariaDB 10.5+
- npm or yarn

## Project Structure

```
ecommerce/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── controllers/           # Route handlers
│   ├── db/                    # Database connection
│   ├── exceptions/            # Custom error classes
│   ├── generated/             # Prisma generated client
│   ├── middlewares/           # Express middlewares
│   ├── routes/                # API route definitions
│   ├── schema/                # Zod validation schemas
│   ├── types/                 # TypeScript type definitions
│   ├── index.ts               # Application entry point
│   └── secrets.ts             # Environment variable exports
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── mocks/                 # Test mocks
├── client/                    # React frontend (see client/README.md)
├── package.json
└── README.md
```

## Quick Start

### 1. Clone and install

```bash
git clone <repository-url>
cd ecommerce

# Install backend dependencies
npm install

# Install frontend dependencies
npm run client:install
```

### 2. Configure environment

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/ecommerce"
DATABASE_HOST="localhost"
DATABASE_USER="your_mysql_username"
DATABASE_PASSWORD="your_mysql_password"
DATABASE_NAME="ecommerce"
DATABASE_PORT=3306

# Server Configuration
PORT=3000

# Authentication
JWT_SECRET="your-secure-jwt-secret-key-min-32-chars"
```

### 3. Set up the database

```bash
# Create the database in MySQL
mysql -u root -p -e "CREATE DATABASE ecommerce;"

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Start development servers

```bash
# Terminal 1 - Start backend (port 3000)
npm start

# Terminal 2 - Start frontend (port 5173)
npm run start:client
```

Open `http://localhost:5173` in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the backend server with hot reload |
| `npm run start:client` | Start the frontend dev server |
| `npm run client:install` | Install frontend dependencies |
| `npm run client:build` | Build the frontend for production |
| `npm test` | Run all tests with coverage |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run typecheck` | Run TypeScript type checking |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/signup` | Register a new user | No |
| POST | `/api/login` | Login and get JWT token | No |
| GET | `/api/me` | Get current user profile | Yes |

### Products

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products | No |
| GET | `/api/products/:id` | Get product by ID | No |
| POST | `/api/products` | Create a new product | Yes (Admin) |
| PUT | `/api/products/:id` | Update a product | Yes (Admin) |
| DELETE | `/api/products/:id` | Delete a product | Yes (Admin) |

## Database Schema

### User
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key, auto-increment |
| name | String | User's full name |
| email | String | Unique email address |
| password | String | Hashed password (bcrypt) |
| role | Enum | USER or ADMIN |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Product
| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key, auto-increment |
| name | String | Product name |
| description | String | Product description |
| price | Decimal | Product price |
| tags | String | Comma-separated tags |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

## Testing

```bash
# Run all tests with coverage
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Creating an Admin User

After registering a user, promote them to admin:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Or use Prisma Studio:
```bash
npx prisma studio
```

## Troubleshooting

### Database connection issues
- Verify MySQL is running
- Check credentials in `.env` match your MySQL setup
- Ensure the database exists

### Prisma issues
```bash
# Regenerate client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Port conflicts
- Backend default: 3000
- Frontend default: 5173
- Change PORT in `.env` for backend
- Frontend will auto-select next available port

## License

ISC
