import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 1. Force Drizzle to load variables from your .env file
dotenv.config();

// Fail fast if it can't find the URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Please check your .env file.");
}

export default defineConfig({
  schema: './drizzle/schema.ts', // Keep your existing schema path
  dialect: 'mysql',
  dbCredentials: {
    // 2. Use the environment variable instead of localhost
    url: process.env.DATABASE_URL,
  },
});