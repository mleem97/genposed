import { describe, expect, it } from "vitest";
import { getAuthSettings } from "../lib/auth-config";

const secureEnvironment = {
  BETTER_AUTH_SECRET: "12345678901234567890123456789012",
  BETTER_AUTH_URL: "https://genposed.example",
  NODE_ENV: "production",
};

describe("authentication configuration", () => {
  it("requires a high-entropy secret and public base URL", () => {
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_SECRET: "" })).toThrow("BETTER_AUTH_SECRET");
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_SECRET: "too-short" })).toThrow("32");
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_URL: "" })).toThrow("BETTER_AUTH_URL");
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_URL: "not a url" })).toThrow("absolute HTTP(S)");
  });

  it("requires HTTPS in production and rejects URLs containing credentials", () => {
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_URL: "http://genposed.example" })).toThrow("HTTPS");
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_URL: "https://user:pass@genposed.example" })).toThrow("Zugangsdaten");
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_URL: "ftp://genposed.example" })).toThrow("HTTP(S)");
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_URL: "https://genposed.example?unsafe=1" })).toThrow("Query");
    expect(() => getAuthSettings({ ...secureEnvironment, BETTER_AUTH_URL: "https://genposed.example#unsafe" })).toThrow("Fragment");
  });

  it("disables public sign-up by default and exposes an explicit private bootstrap option", () => {
    const settings = getAuthSettings(secureEnvironment);
    expect(settings.emailAndPassword).toEqual({ enabled: true, disableSignUp: true });
    expect(settings.trustedOrigins).toEqual(["https://genposed.example"]);
    expect(settings.user.additionalFields.role).toEqual({ type: "string", required: true, defaultValue: "customer", input: false });
    const bootstrapSettings = getAuthSettings(secureEnvironment, { allowSignUp: true });
    expect(bootstrapSettings.emailAndPassword.disableSignUp).toBe(false);
    expect(bootstrapSettings.user.additionalFields.role.input).toBe(true);
  });

  it("allows local HTTP in development while retaining URL validation", () => {
    expect(getAuthSettings({
      BETTER_AUTH_SECRET: "12345678901234567890123456789012",
      BETTER_AUTH_URL: "http://localhost:3000",
      NODE_ENV: "development",
    }).baseURL).toBe("http://localhost:3000");
  });
});
