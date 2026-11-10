import { describe, expect, it, vi } from "vitest";
import { fileURLToPath } from "node:url";
import {
  buildComposeFieldIndex,
  collectNodeTypes,
  docsDirectory,
  fieldEntry,
  propertyIndex,
  resolveLocalReference,
  resolveSchemaNode,
  runCli,
  schemaDirectory,
  syncSchemas,
} from "../scripts/sync-schemas.mjs";

describe("schema index generator", () => {
  it("resolves only local JSON pointers and decodes escaped path segments", () => {
    const schema = { definitions: { "a/b~c": { type: "string" } } };
    expect(resolveLocalReference(schema, "#/definitions/a~1b~0c")).toEqual({ type: "string" });
    expect(resolveLocalReference(schema, "https://example.test/schema")).toBeUndefined();
    expect(resolveLocalReference(schema, 42)).toBeUndefined();
    expect(resolveLocalReference(schema, "#/missing/value")).toBeUndefined();
  });

  it("resolves reference chains, merges local overrides, and stops cycles", () => {
    const schema = { definitions: { leaf: { type: "string", description: "base" }, cycle: { $ref: "#/definitions/cycle" } } };
    expect(resolveSchemaNode(schema, { $ref: "#/definitions/leaf", description: "override" })).toEqual({ type: "string", description: "override" });
    expect(resolveSchemaNode(schema, null)).toBeNull();
    const noReference = { type: "integer" };
    expect(resolveSchemaNode(schema, noReference)).toBe(noReference);
    expect(resolveSchemaNode(schema, { $ref: "#/definitions/absent" })).toEqual({ $ref: "#/definitions/absent" });
    expect(resolveSchemaNode(schema, { $ref: "#/definitions/cycle" })).toEqual({ $ref: "#/definitions/cycle" });
    expect(resolveSchemaNode(schema, { $ref: "#/definitions/leaf" }, new Set(["#/definitions/leaf"]))).toEqual({ $ref: "#/definitions/leaf" });
  });

  it("collects direct, union, intersection, and nested schema types without duplicates", () => {
    const schema = { definitions: { text: { type: "string" } } };
    expect(collectNodeTypes(schema, null)).toEqual([]);
    expect(collectNodeTypes(schema, { type: "string", oneOf: [{ type: "number" }, { $ref: "#/definitions/text" }], anyOf: [{ type: ["boolean", "string"] }] })).toEqual(["string", "number", "boolean"]);
  });

  it("indexes field metadata with optional attributes and properties", () => {
    const schema = {};
    expect(fieldEntry(schema, "service", "image", { type: ["string", "null"], enum: ["x"], description: "image", default: "x", examples: ["y"], deprecated: true, readOnly: true, writeOnly: true })).toMatchObject({ id: "service.image", types: ["string", "null"], enum: ["x"], deprecated: true, readOnly: true, writeOnly: true });
    expect(fieldEntry(schema, "top", "name", {})).toMatchObject({ types: [], deprecated: false, readOnly: false, writeOnly: false });
    expect(propertyIndex(schema, "top", null)).toEqual([]);
    expect(propertyIndex(schema, "top", { image: { type: "string" } })).toHaveLength(1);
  });

  it("builds top-level, service, and build records through both build schema locations", () => {
    const schema = {
      $id: "compose", title: "Compose",
      properties: {
        services: { additionalProperties: { properties: { image: { type: "string" }, build: { properties: { context: { type: "string" } } } } } },
        name: { type: "string" },
      },
    };
    const index = buildComposeFieldIndex(schema);
    expect(index).toMatchObject({ schemaId: "compose", schemaTitle: "Compose" });
    expect(index.fields.map((field) => field.id)).toEqual(["top.services", "top.name", "service.image", "service.build", "build.context"]);
    expect(buildComposeFieldIndex({ properties: {}, $defs: { build: { properties: { dockerfile: { type: "string" } } } } }).fields.map((field) => field.id)).toContain("build.dockerfile");
    expect(buildComposeFieldIndex({ definitions: { build: { properties: { target: { type: "string" } } } } }).fields.map((field) => field.id)).toContain("build.target");
  });
});

describe("schema synchronization", () => {
  const targets = {
    schemaTarget: new URL("file:///tmp/genposed-schema-sync-test/schemas/"),
    docsTarget: new URL("file:///tmp/genposed-schema-sync-test/docs/"),
  };
  const mockSources = [
    { name: "compose-spec.json", url: "https://schema.test/compose", target: schemaDirectory },
    { name: "guide.md", url: "https://schema.test/guide", target: docsDirectory },
  ];
  const mockFetch = (contents: string[]) => vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", text: async () => contents.shift() ?? "" }));

  it("downloads inputs, generates index and manifest, and records sizes", async () => {
    const writeFileImpl = vi.fn(async () => undefined);
    const log = vi.fn();
    const schema = JSON.stringify({ $id: "compose", properties: { name: { type: "string" } } });
    const result = await syncSchemas({ ...targets, inputSources: mockSources, fetchImpl: mockFetch([schema, "guide content"]), writeFileImpl, log });
    expect(writeFileImpl).toHaveBeenCalledTimes(4);
    expect(result.composeFieldIndex.fields[0].id).toBe("top.name");
    expect(result.manifest.map(({ name }) => name)).toEqual(["compose-spec.json", "guide.md", "compose-field-index.json"]);
    expect(log).toHaveBeenCalledWith("generated 1 Compose field metadata records");
  });

  it("rejects failed downloads, missing compose schemas, and malformed JSON", async () => {
    await expect(syncSchemas({ ...targets, inputSources: mockSources, fetchImpl: vi.fn(async () => ({ ok: false, status: 503, statusText: "Unavailable", text: async () => "" })) })).rejects.toThrow("Failed to download compose-spec.json: 503 Unavailable");
    await expect(syncSchemas({ ...targets, inputSources: [mockSources[1]], fetchImpl: mockFetch(["docs"]), writeFileImpl: vi.fn() })).rejects.toThrow("compose-spec.json was not downloaded");
    await expect(syncSchemas({ ...targets, inputSources: [mockSources[0]], fetchImpl: mockFetch(["{"]), writeFileImpl: vi.fn() })).rejects.toThrow();
  });

  it("runs the CLI only when invoked through its own script path", async () => {
    const log = vi.fn();
    const source = { name: "compose-spec.json", url: "https://schema.test/compose", target: schemaDirectory };
    const fetchImpl = mockFetch([JSON.stringify({ properties: { services: { type: "object" } } })]);
    await runCli({
      scriptPath: fileURLToPath(new URL("../scripts/sync-schemas.mjs", import.meta.url)),
      ...targets,
      inputSources: [source],
      fetchImpl,
      mkdirImpl: vi.fn(async () => undefined),
      writeFileImpl: vi.fn(async () => undefined),
      log,
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith("generated 1 Compose field metadata records");
    await runCli({ scriptPath: "/tmp/not-the-schema-sync-script.mjs", inputSources: [], fetchImpl });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
