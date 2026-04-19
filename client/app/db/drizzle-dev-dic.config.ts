import { defineConfig } from "drizzle-kit";

// used by drizzle-kit to generate migration files for the dictionary database
export default defineConfig({
    out: "./app/db/migrations/dictionary",
    schema: ["./app/db/schema/dictionary/dictionary.ts"],
    dialect: "sqlite",
    dbCredentials: {
        url: "./dev_sqlite.db",
    },
}
);
