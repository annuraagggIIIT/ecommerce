import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString,
  max: 5,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);

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
