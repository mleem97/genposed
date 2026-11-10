import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import postcssConfig from "../postcss.config.mjs";
import drizzleConfig from "../drizzle.config";

describe("production build configuration", () => {
  it("keeps strict React mode and hides the framework signature", () => {
    expect(nextConfig).toMatchObject({ reactStrictMode: true, poweredByHeader: false });
  });

  it("loads Tailwind's PostCSS plugin", () => {
    expect(postcssConfig.plugins).toHaveProperty("@tailwindcss/postcss");
  });

  it("points migrations at the PostgreSQL domain schema", () => {
    expect(drizzleConfig).toMatchObject({ dialect: "postgresql", schema: "./lib/db/schema.ts", out: "./lib/db/migrations" });
  });
});
