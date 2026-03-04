import path from 'node:path'
import { env } from '@prisma/config'
import type { PrismaConfig } from 'prisma'

export default {
  schema: path.join(__dirname, 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL')
  }
} satisfies PrismaConfig
