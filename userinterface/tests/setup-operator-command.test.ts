import { describe, expect, it, vi } from "vitest";
import type { Database } from "../lib/db";
import { createSetupDependencies, isDirectExecution, runDefaultSetupCommand, runSetupCommand, runSetupFromEnvironment, startIfDirectExecution } from "../scripts/setup-operator";

const environment = {
  GENPOSED_OPERATOR_NAME: "Owner",
  GENPOSED_OPERATOR_EMAIL: "owner@example.com",
  GENPOSED_OPERATOR_PASSWORD: "a sufficiently long password",
  BETTER_AUTH_SECRET: "12345678901234567890123456789012",
  BETTER_AUTH_URL: "https://genposed.example",
  NODE_ENV: "test",
} as NodeJS.ProcessEnv;

function mockDatabase(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { database: { select } as unknown as Database, select, from, where, limit };
}

describe("operator setup command", () => {
  it("checks for existing operators and creates the initial operator through Better Auth", async () => {
    const empty = mockDatabase([]);
    const authFactory = vi.fn(() => ({ api: { signUpEmail: vi.fn().mockResolvedValue({ user: { id: "operator-1", role: "operator" } }) } })) as never;
    const dependencies = createSetupDependencies(empty.database, environment, authFactory);
    expect(await dependencies.operatorExists()).toBe(false);
    expect(await dependencies.createOperator({ name: "Owner", email: "owner@example.com", password: environment.GENPOSED_OPERATOR_PASSWORD! })).toEqual({ id: "operator-1", role: "operator" });
    expect(authFactory).toHaveBeenCalledWith(environment, { allowSignUp: true });

    const existing = mockDatabase([{ id: "operator-existing" }]);
    expect(await createSetupDependencies(existing.database, environment, authFactory).operatorExists()).toBe(true);
  });

  it("logs the created operator ID", async () => {
    const log = vi.fn();
    const result = await runSetupCommand(environment, {
      operatorExists: async () => false,
      createOperator: async () => ({ id: "operator-1", role: "operator" }),
    }, { log });
    expect(result).toBe("operator-1");
    expect(log).toHaveBeenCalledWith("Betreiberzugang operator-1 wurde eingerichtet.");
  });

  it("builds the default dependencies from the database and rejects a repeated CLI bootstrap", async () => {
    const limit = vi.fn().mockResolvedValue([{ id: "operator-existing" }]);
    const databaseFactory = vi.fn(() => ({
      select: () => ({ from: () => ({ where: () => ({ limit }) }) }),
    } as unknown as Database));
    await expect(runDefaultSetupCommand(environment, databaseFactory)).rejects.toThrow("existiert bereits");
    expect(databaseFactory).toHaveBeenCalledOnce();

    const previousUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    await expect(runDefaultSetupCommand(environment)).rejects.toThrow("DATABASE_URL");
    await expect(runSetupFromEnvironment()).rejects.toThrow("DATABASE_URL");
    if (previousUrl) process.env.DATABASE_URL = previousUrl;
  });

  it("runs only as a direct CLI invocation and reports failures", async () => {
    expect(isDirectExecution(undefined, "file:///tmp/setup.ts")).toBe(false);
    expect(isDirectExecution("/tmp/setup.ts", "file:///tmp/setup.ts")).toBe(true);
    expect(isDirectExecution("/tmp/other.ts", "file:///tmp/setup.ts")).toBe(false);

    const run = vi.fn().mockResolvedValue(undefined);
    expect(startIfDirectExecution(undefined, "file:///tmp/setup.ts", run)).toBe(false);
    expect(run).not.toHaveBeenCalled();
    expect(startIfDirectExecution("/tmp/setup.ts", "file:///tmp/setup.ts", run)).toBe(true);
    await vi.waitFor(() => expect(run).toHaveBeenCalledOnce());

    const error = vi.fn();
    const onFailure = vi.fn();
    startIfDirectExecution("/tmp/setup.ts", "file:///tmp/setup.ts", async () => { throw new Error("database unavailable"); }, { error }, onFailure);
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith("database unavailable"));
    expect(onFailure).toHaveBeenCalledWith(1);
    startIfDirectExecution("/tmp/setup.ts", "file:///tmp/setup.ts", async () => { throw "unknown failure"; }, { error }, onFailure);
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith("Betreiberzugang konnte nicht eingerichtet werden."));
    expect(onFailure).toHaveBeenCalledTimes(2);

    const previousExitCode = process.exitCode;
    startIfDirectExecution("/tmp/setup.ts", "file:///tmp/setup.ts", async () => { throw new Error("failure with default exit handling"); }, { error });
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith("failure with default exit handling"));
    expect(process.exitCode).toBe(1);
    process.exitCode = previousExitCode;
  });
});
