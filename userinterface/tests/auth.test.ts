import { beforeEach, describe, expect, it, vi } from "vitest";

const { authFactory, adapterFactory, databaseFactory } = vi.hoisted(() => ({
  authFactory: vi.fn((options) => ({ options })),
  adapterFactory: vi.fn((database, options) => ({ database, options })),
  databaseFactory: vi.fn(() => ({ connection: "test" })),
}));

vi.mock("better-auth", () => ({ betterAuth: authFactory }));
vi.mock("@better-auth/drizzle-adapter", () => ({ drizzleAdapter: adapterFactory }));
vi.mock("../lib/db", () => ({ getDatabase: databaseFactory }));

import { createAuth, getAuth } from "../lib/auth";

const environment = {
  BETTER_AUTH_SECRET: "12345678901234567890123456789012",
  BETTER_AUTH_URL: "https://genposed.example",
  NODE_ENV: "production",
};

describe("Better Auth application wiring", () => {
  beforeEach(() => {
    authFactory.mockClear();
    adapterFactory.mockClear();
    databaseFactory.mockClear();
  });

  it("connects Better Auth to PostgreSQL and disables public registration", () => {
    const auth = createAuth(environment);
    expect(auth.options).toMatchObject({
      baseURL: "https://genposed.example",
      emailAndPassword: { enabled: true, disableSignUp: true },
    });
    expect(adapterFactory).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ provider: "pg" }));
    expect(authFactory).toHaveBeenCalledTimes(1);
  });

  it("caches the runtime auth instance after the first valid configuration", () => {
    const first = getAuth(environment);
    const second = getAuth({ ...environment, BETTER_AUTH_URL: "https://ignored.example" });
    expect(first).toBe(second);
    expect(authFactory).toHaveBeenCalledTimes(1);
    expect(databaseFactory).toHaveBeenCalledTimes(1);
  });
});
