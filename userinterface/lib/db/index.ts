import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | undefined;
let database: Database | undefined;

export function getDatabaseUrl(environment: NodeJS.ProcessEnv = process.env): string {
  const url = environment.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL muss für den PostgreSQL-Zugriff gesetzt sein.");
  return url;
}

export function getDatabase(environment: NodeJS.ProcessEnv = process.env): Database {
  const url = getDatabaseUrl(environment);
  if (!client) client = postgres(url, { max: 10, prepare: false });
  if (!database) database = drizzle(client, { schema });
  return database;
}

export async function closeDatabase(): Promise<void> {
  if (!client) return;
  const currentClient = client;
  client = undefined;
  database = undefined;
  await currentClient.end({ timeout: 1 });
}
