import { PrismaClient } from "../generated/prisma/client.js";

export const prismaClient = new PrismaClient({
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
