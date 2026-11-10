import { beforeEach, describe, expect, it, vi } from "vitest";

const { postgresMock, clientEndMock, drizzleMock } = vi.hoisted(() => ({
  postgresMock: vi.fn(() => ({ end: clientEndMock })),
  clientEndMock: vi.fn(),
  drizzleMock: vi.fn((client, schema) => ({ client, schema })),
}));
vi.mock("postgres", () => ({ default: postgresMock }));
vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: drizzleMock }));

import { closeDatabase, getDatabase, getDatabaseUrl } from "../lib/db";

describe("PostgreSQL connection", () => {
  beforeEach(async () => {
    await closeDatabase();
    postgresMock.mockClear();
    clientEndMock.mockClear();
    drizzleMock.mockClear();
  });

  it("requires a configured database URL", () => {
    expect(() => getDatabaseUrl({} as NodeJS.ProcessEnv)).toThrow("DATABASE_URL");
    expect(() => getDatabase({} as NodeJS.ProcessEnv)).toThrow("DATABASE_URL");
  });

  it("reuses a lazy postgres connection and Drizzle client", () => {
    const environment = { DATABASE_URL: "postgres://app:secret@db.example/genposed", NODE_ENV: "test" } as NodeJS.ProcessEnv;
    expect(getDatabaseUrl(environment)).toBe(environment.DATABASE_URL);
    const first = getDatabase(environment);
    const second = getDatabase({ DATABASE_URL: "postgres://ignored", NODE_ENV: "test" } as NodeJS.ProcessEnv);
    expect(first).toBe(second);
    expect(postgresMock).toHaveBeenCalledTimes(1);
    expect(postgresMock).toHaveBeenCalledWith(environment.DATABASE_URL, { max: 10, prepare: false });
  });

  it("closes and clears the shared connection before a later process task", async () => {
    const environment = { DATABASE_URL: "postgres://app:secret@db.example/genposed", NODE_ENV: "test" } as NodeJS.ProcessEnv;
    const first = getDatabase(environment);
    await closeDatabase();
    await closeDatabase();
    const second = getDatabase(environment);
    expect(second).not.toBe(first);
    expect(clientEndMock).toHaveBeenCalledWith({ timeout: 1 });
    expect(postgresMock).toHaveBeenCalledTimes(2);
  });
});
