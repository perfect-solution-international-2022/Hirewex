import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// 1. Declare a global variable to hold the pool during development
const globalForDb = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

// 2. Create the pool ONLY if it doesn't already exist globally
const poolConnection =
  globalForDb.mysqlPool ??
  mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'rootpassword', 
    database: 'hirewex',
    port: 3306,
    connectionLimit: 10, // Cap the max simultaneous connections
  });

// 3. Save it to the global object in dev mode to survive Next.js hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForDb.mysqlPool = poolConnection;
}

// 4. Export your Drizzle instance
export const db = drizzle(poolConnection);