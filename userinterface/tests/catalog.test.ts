import { describe, expect, it } from "vitest";
import { categoryLabels, composeFields, fieldCountByCategory } from "../lib/catalog";

describe("Compose field catalogue", () => {
  it("contains unique, complete field metadata", () => {
    const ids = composeFields.map((field) => field.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const field of composeFields) {
      expect(field.title.length).toBeGreaterThan(0);
      expect(field.description.length).toBeGreaterThan(0);
      expect(Object.hasOwn(categoryLabels, field.category)).toBe(true);
      expect(Array.isArray(field.path)).toBe(true);
    }
  });

  it("keeps category counts in sync with entries", () => {
    const counts = Object.fromEntries(
      Object.keys(categoryLabels).map((category) => [category, composeFields.filter((field) => field.category === category).length]),
    );
    expect(fieldCountByCategory).toEqual(counts);
    expect(Object.values(fieldCountByCategory).reduce((total, count) => total + count, 0)).toBe(composeFields.length);
  });

  it("covers each supported insertion target and both label scopes", () => {
    expect(new Set(composeFields.map((field) => field.target))).toEqual(new Set(["top-level", "service", "service-labels", "deploy-labels"]));
    expect(composeFields.some((field) => field.id === "top.name" && field.path[0] === "name")).toBe(true);
    expect(composeFields.some((field) => field.target === "service-labels" && field.path.length === 0)).toBe(true);
    expect(composeFields.some((field) => field.target === "deploy-labels" && field.path.length === 0)).toBe(true);
  });

  it("keeps optional compatibility notes when present", () => {
    expect(composeFields.some((field) => field.compatibility)).toBe(true);
    expect(composeFields.find((field) => field.id === "top.version")?.compatibility).toBe("deprecated");
    expect(composeFields.find((field) => field.id === "top.name")?.compatibility).toBeUndefined();
  });
});
