import { defineConfig } from "drizzle-kit";
import { createRequire } from "node:module";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://genposed:genposed@127.0.0.1:5432/genposed",
  },
});
