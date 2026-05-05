import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Singleton Prisma client shared across all server actions.
 *
 * Uses the `@prisma/adapter-pg` driver adapter so Prisma runs on top of
 * `node-postgres` (pg) instead of its own built-in engine binaries. This is
 * required when using `@prisma/client` v6+ in a Next.js edge-compatible setup.
 *
 * The connection string is read from DATABASE_URL (see .env).
 */
const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };