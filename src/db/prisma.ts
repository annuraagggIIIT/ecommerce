import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Parse DATABASE_URL if available (for Railway), otherwise use individual env vars
function getDbConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Parse Railway's DATABASE_URL: mysql://user:password@host:port/database
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
      port: Number(url.port) || 3306,
    };
  }

  // Fallback to individual environment variables (local development)
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '0414',
    database: process.env.DATABASE_NAME || 'ecommerce',
    port: Number(process.env.DATABASE_PORT) || 3306,
  };
}

const dbConfig = getDbConfig();

const adapter = new PrismaMariaDb({
  ...dbConfig,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true
});

export const prismaClient = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'production' ? ["error"] : ["query", "info", "warn", "error"],
}).$extends({
  result: {
    address: {
      formattedAddress: {
        needs: {
          lineOne: true,
          lineTwo: true,
          city: true,
          country: true,
          pinCode: true
        },
        compute: (addr) => {
          return `${addr.lineOne},${addr.lineTwo || ''},${addr.city},${addr.country},${addr.pinCode}`
        }
      }
    }
  }
})
