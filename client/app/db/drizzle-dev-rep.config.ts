import { defineConfig } from "drizzle-kit";

// used by drizzle-kit to generate migration files for the repetition database
export default defineConfig({
    out: "./app/db/migrations/repetition",
    schema: ["./app/db/schema/repetition/repetition.ts"],
    dialect: "sqlite",
    dbCredentials: {
        url: "./dev_sqlite.db",
    },
}
);
