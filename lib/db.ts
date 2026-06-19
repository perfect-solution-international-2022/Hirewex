import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// 1. Declare a global variable to hold the pool during development
const globalForDb = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

// Fail fast if the environment variable is missing
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables. Check your .env file or Vercel dashboard.");
}

// 2. Create the pool ONLY if it doesn't already exist globally
// AND use the Aiven database URL instead of a hardcoded local connection
const poolConnection =
  globalForDb.mysqlPool ??
  mysql.createPool(process.env.DATABASE_URL); // Notice we pass the URL directly here

// 3. Save it to the global object in dev mode to survive Next.js hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForDb.mysqlPool = poolConnection;
}

// 4. Export your Drizzle instance
export const db = drizzle(poolConnection);