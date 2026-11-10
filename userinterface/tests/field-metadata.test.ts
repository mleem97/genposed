import { describe, expect, it } from "vitest";
import { composeFields, type ComposeField } from "../lib/catalog";
import {
  compareComposeVersions,
  deriveFieldMetadata,
  getFieldSupport,
  summarizeFieldSupport,
} from "../lib/field-metadata";

function field(overrides: Partial<ComposeField> = {}): ComposeField {
  return {
    id: "custom.field",
    category: "compose",
    group: "Test",
    title: "Custom",
    target: "service",
    path: ["custom"],
    sample: "value",
    description: "Test field",
    ...overrides,
  };
}

describe("Compose field compatibility metadata", () => {
  it("compares normalized versions including prefixes and missing segments", () => {
    expect(compareComposeVersions("v2.32", "2.31.9")).toBe(1);
    expect(compareComposeVersions("2.20.0", "2.20")).toBe(0);
    expect(compareComposeVersions("2.19", "2.20.0")).toBe(-1);
    expect(compareComposeVersions("not-a-version", "0.0.0")).toBe(0);
  });

  it.each([
    ["string", "value", "string"],
    ["number", 2, "number"],
    ["boolean", true, "boolean"],
    ["map", { a: 1 }, "map"],
    ["list", ["a"], "list"],
    ["null", null, "null"],
    ["framework preset", { image: "app" }, "preset", "framework", []],
    ["label preset", { key: "value" }, "preset", "traefik", [], "service-labels"],
  ] as [string, unknown, string, ComposeField["category"], string[], ComposeField["target"]?][])("infers %s values", (_name, sample, valueKind, category = "compose", path = ["value"], target = "service") => {
    expect(deriveFieldMetadata(field({ sample, category, path, target })).valueKind).toBe(valueKind);
  });

  it("derives repeatability, deprecation, extension, overrides, and schema compatibility versions", () => {
    expect(deriveFieldMetadata(field({ id: "top.include", target: "top-level", path: ["include"], sample: [] }))).toMatchObject({
      valueKind: "list", repeatable: true, minimumComposeVersion: "2.20.0", deprecated: false, extension: false, source: "catalog",
    });
    expect(deriveFieldMetadata(field({ id: "service.label_file", compatibility: undefined }))).toMatchObject({ minimumComposeVersion: "2.32.0" });
    expect(deriveFieldMetadata(field({ compatibility: "Compose 2.24+" }))).toMatchObject({ minimumComposeVersion: "2.24.0" });
    expect(deriveFieldMetadata(field({ compatibility: "requires Compose 2.24.1+" }))).toMatchObject({ minimumComposeVersion: "2.24.1" });
    expect(deriveFieldMetadata(field({ compatibility: "deprecated legacy" }))).toMatchObject({ deprecated: true });
    expect(deriveFieldMetadata(field({ id: "top.x-custom", target: "top-level", category: "compose", path: ["x-custom"] }))).toMatchObject({ extension: true, source: "platform-extension" });
    expect(deriveFieldMetadata(field({ category: "caddy" }))).toMatchObject({ extension: true, source: "platform-extension" });
    expect(deriveFieldMetadata(field({ category: "compose", compatibility: "extension" }))).toMatchObject({ extension: true });
    expect(deriveFieldMetadata(field({ target: "service-labels", category: "traefik", path: [], sample: { key: "value" } })).valueKind).toBe("preset");
  });

  it("classifies support as deprecated, extension, unknown, unsupported, or supported", () => {
    expect(getFieldSupport(composeFields.find((item) => item.id === "top.version")!, "2.40").status).toBe("deprecated");
    expect(getFieldSupport(composeFields.find((item) => item.id === "caddy.site")!, "2.40").status).toBe("extension");
    expect(getFieldSupport(field(), "2.40").status).toBe("unknown");
    expect(getFieldSupport(composeFields.find((item) => item.id === "top.include")!, "2.19").status).toBe("unsupported");
    expect(getFieldSupport(composeFields.find((item) => item.id === "top.include")!, "2.40").status).toBe("supported");
    expect(summarizeFieldSupport([field(), composeFields.find((item) => item.id === "top.include")!, composeFields.find((item) => item.id === "top.version")!], "2.40")).toMatchObject({ unknown: 1, supported: 1, deprecated: 1 });
    expect(summarizeFieldSupport([], "2.40")).toEqual({ supported: 0, unsupported: 0, deprecated: 0, extension: 0, unknown: 0 });
  });
});
