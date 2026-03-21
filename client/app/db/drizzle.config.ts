import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './app/db/migrations',
    schema: ['./app/db/schema/dictionary.ts'],
    dialect: 'sqlite',
    dbCredentials: {
        url: './dev_sqlite.db',
    },
});