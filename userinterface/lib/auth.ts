import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import { getAuthSettings, type AuthEnvironment } from "./auth-config";
import { getDatabase } from "./db";
import * as schema from "./db/schema";

export function createAuth(
  environment: AuthEnvironment = process.env,
  options: { allowSignUp?: boolean } = {},
) {
  const settings = getAuthSettings(environment, options);
  const database = getDatabase();
  return betterAuth({
    ...settings,
    database: drizzleAdapter(database, { provider: "pg", schema }),
  });
}

type AuthInstance = ReturnType<typeof createAuth>;
let runtimeAuth: AuthInstance | undefined;

export function getAuth(environment: AuthEnvironment = process.env): AuthInstance {
  if (!runtimeAuth) runtimeAuth = createAuth(environment);
  return runtimeAuth;
}
