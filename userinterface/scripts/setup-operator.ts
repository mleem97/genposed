import { eq } from "drizzle-orm";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { createAuth } from "../lib/auth";
import type { AuthEnvironment } from "../lib/auth-config";
import { closeDatabase, getDatabase, type Database } from "../lib/db";
import { user } from "../lib/db/schema";
import {
  setupOperator,
  type OperatorBootstrapDependencies,
  type OperatorBootstrapInput,
} from "../lib/installer/setup-operator";

const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd());

export function createSetupDependencies(
  database: Database,
  environment: AuthEnvironment,
  authFactory: typeof createAuth = createAuth,
): OperatorBootstrapDependencies {
  return {
    async operatorExists() {
      const rows = await database.select({ id: user.id }).from(user).where(eq(user.role, "operator")).limit(1);
      return rows.length > 0;
    },
    async createOperator(input: OperatorBootstrapInput) {
      const auth = authFactory(environment, { allowSignUp: true });
      const result = await auth.api.signUpEmail({ body: { ...input, role: "operator" } });
      return { id: result.user.id, role: result.user.role };
    },
  };
}

export async function runSetupCommand(
  environment: NodeJS.ProcessEnv,
  dependencies: OperatorBootstrapDependencies,
  output: Pick<Console, "log"> = console,
): Promise<string> {
  const operator = await setupOperator(environment, dependencies);
  output.log(`Betreiberzugang ${operator.id} wurde eingerichtet.`);
  return operator.id;
}

export async function runDefaultSetupCommand(
  environment: NodeJS.ProcessEnv = process.env,
  databaseFactory: () => Database = () => getDatabase(),
): Promise<string> {
  return runSetupCommand(environment, createSetupDependencies(databaseFactory(), environment));
}

export function isDirectExecution(argvPath: string | undefined, moduleUrl: string): boolean {
  return argvPath !== undefined && pathToFileURL(argvPath).href === moduleUrl;
}

export function startIfDirectExecution(
  argvPath: string | undefined,
  moduleUrl: string,
  run: () => Promise<unknown>,
  output: Pick<Console, "error"> = console,
  onFailure: (exitCode: number) => void = (exitCode) => { process.exitCode = exitCode; },
): boolean {
  if (!isDirectExecution(argvPath, moduleUrl)) return false;
  void run().catch((error: unknown) => {
    output.error(error instanceof Error ? error.message : "Betreiberzugang konnte nicht eingerichtet werden.");
    onFailure(1);
  });
  return true;
}

export function runSetupFromEnvironment(): Promise<string> {
  return runDefaultSetupCommand().finally(closeDatabase);
}

startIfDirectExecution(process.argv[1], import.meta.url, runSetupFromEnvironment);
