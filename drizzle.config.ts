import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts', // Ensure this points directly to the file
  dialect: 'mysql',
  dbCredentials: {
    url: 'mysql://root:rootpassword@localhost:3306/hirewex',
  },
});