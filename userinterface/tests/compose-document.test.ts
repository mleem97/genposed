import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { ComposeField } from "../lib/catalog";
import {
  analyzeComposeDocument,
  applyFieldSample,
  asComposeValue,
  cloneComposeValue,
  cloneService,
  createBlankLike,
  createService,
  deleteService,
  findServiceReferences,
  getFieldPath,
  isRecord,
  readFieldValue,
  removeFieldValue,
  renameService,
  uniqueMapKey,
  uniqueServiceName,
  writeFieldValue,
} from "../lib/compose-document";

const base = `services:
  app:
    image: app:1
  worker:
    image: worker:1
`;

function field(overrides: Partial<ComposeField>): ComposeField {
  return {
    id: "test.field",
    category: "compose",
    group: "Test",
    title: "Test field",
    target: "service",
    path: ["image"],
    sample: "example:latest",
    description: "Test field description",
    ...overrides,
  };
}

function readYaml(source: string): unknown {
  return parse(source);
}

describe("Compose document parsing and field operations", () => {
  it("distinguishes records from null and arrays", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
  });

  it("reports services, YAML errors, and warnings", () => {
    expect(analyzeComposeDocument(base)).toMatchObject({ services: ["app", "worker"], errors: [], warnings: [] });
    expect(analyzeComposeDocument("services: [").errors.length).toBeGreaterThan(0);
    expect(analyzeComposeDocument("value: !custom tag").warnings.length).toBeGreaterThan(0);
    expect(analyzeComposeDocument("services: null").services).toEqual([]);
    expect(findServiceReferences("null", "app")).toEqual([]);
    expect(findServiceReferences("services: null", "app")).toEqual([]);
  });

  it("resolves top-level, service, label, and deploy-label paths", () => {
    expect(getFieldPath("app", field({ target: "top-level", path: ["name"] }))).toEqual(["name"]);
    expect(getFieldPath("app", field({ target: "service-labels", path: ["ignored"] }))).toEqual(["services", "app", "labels"]);
    expect(getFieldPath("app", field({ target: "deploy-labels", path: [] }))).toEqual(["services", "app", "deploy", "labels"]);
    expect(getFieldPath("app", field({ path: ["deploy", "replicas"] }))).toEqual(["services", "app", "deploy", "replicas"]);
  });

  it("reads, writes, and removes scalar and nested field values", () => {
    const image = field({});
    expect(readFieldValue(base, "app", image)).toBe("app:1");
    expect(readFieldValue(base, "missing", image)).toBeUndefined();
    expect(readFieldValue("services: [", "app", image)).toBeUndefined();
    expect(readFieldValue("services: {}", "", field({ target: "top-level", path: ["name"] }))).toBeUndefined();

    const written = writeFieldValue(base, "app", field({ path: ["deploy", "replicas"] }), 4);
    expect(readYaml(written)).toMatchObject({ services: { app: { deploy: { replicas: 4 } } } });
    expect(() => writeFieldValue("services: [", "app", image, "x")).toThrow("Das YAML muss zuerst syntaktisch gültig sein.");
    expect(readYaml(removeFieldValue(written, "app", field({ path: ["deploy", "replicas"] })))).toMatchObject({ services: { app: { deploy: {} } } });
  });

  it("applies samples to project, service, and label paths while preserving other labels", () => {
    const named = applyFieldSample(base, "app", field({ target: "top-level", path: ["name"], sample: "demo" }));
    expect(readYaml(named)).toMatchObject({ name: "demo" });

    const labels = applyFieldSample("services:\n  app:\n    labels:\n      keep: yes\n      route: old\n", "app", field({ target: "service-labels", path: [], sample: { route: "new", "proxy.enable": "true" } }));
    expect(readYaml(labels)).toMatchObject({ services: { app: { labels: { keep: "yes", route: "new", "proxy.enable": "true" } } } });

    const deployLabels = applyFieldSample("services:\n  app: {}\n", "app", field({ target: "deploy-labels", path: [], sample: { enabled: "true" } }));
    expect(readYaml(deployLabels)).toMatchObject({ services: { app: { deploy: { labels: { enabled: "true" } } } } });

    const serviceRoot = applyFieldSample("services:\n  app:\n    image: old\n", "app", field({ path: [], sample: { image: "new", restart: "always" } }));
    expect(readYaml(serviceRoot)).toMatchObject({ services: { app: { image: "new", restart: "always" } } });

    const nested = applyFieldSample(base, "app", field({ path: ["init"], sample: true }));
    expect(readYaml(nested)).toMatchObject({ services: { app: { init: true } } });
    expect(() => applyFieldSample("services: [", "app", field({}))).toThrow("Das YAML muss zuerst syntaktisch gültig sein.");
    expect(() => applyFieldSample(base, "app", field({ target: "service-labels", sample: ["invalid"] }))).toThrow("Das Feld enthält keine gültige Label-Map.");
  });

  it("removes label maps, service-root presets, and individual fields", () => {
    const labels = "services:\n  app:\n    labels:\n      keep: yes\n      remove: yes\n";
    expect(readYaml(removeFieldValue(labels, "app", field({ target: "service-labels", path: [], sample: { remove: "yes" } })))).toMatchObject({ services: { app: { labels: { keep: "yes" } } } });
    const deployLabels = "services:\n  app:\n    deploy:\n      labels: { remove: yes, keep: yes }\n";
    expect(readYaml(removeFieldValue(deployLabels, "app", field({ target: "deploy-labels", path: [], sample: { remove: "yes" } })))).toMatchObject({ services: { app: { deploy: { labels: { keep: "yes" } } } } });
    expect(readYaml(removeFieldValue("services:\n  app: {}\n", "app", field({ target: "service-labels", path: [], sample: { absent: "yes" } })))).toMatchObject({ services: { app: {} } });
    expect(readYaml(removeFieldValue("services:\n  app:\n    image: app\n    restart: always\n", "app", field({ path: [], sample: { image: "x", restart: "x" } })))).toMatchObject({ services: { app: {} } });
    expect(readYaml(removeFieldValue("services:\n  app: {}\n", "app", field({ path: [], sample: { missing: "x" } })))).toMatchObject({ services: { app: {} } });
    expect(readYaml(removeFieldValue(base, "app", field({ path: ["image"] })))).toMatchObject({ services: { app: {} } });
    expect(readYaml(removeFieldValue("services: {}", "app", field({ target: "service-labels", path: [], sample: "bad" })))).toBeDefined();
  });
});

describe("service references and lifecycle", () => {
  const referenceFixture = `services:
  app:
    image: app:1
  worker:
    depends_on: [app, other]
    network_mode: service:app
    ipc: service:app
    pid: service:app
    links: [app:db, other, 42]
    volumes_from: [app:ro]
    build:
      additional_contexts:
        named: service:app
        other: ./other
      context: .
    extends:
      service: app
  invalid: false
`;

  it("finds Compose service references in all supported forms", () => {
    const refs = findServiceReferences(referenceFixture, "app");
    expect(refs.map((reference) => reference.kind)).toEqual([
      "depends_on", "service_namespace", "service_namespace", "service_namespace", "link", "volumes_from", "build_context", "extends",
    ]);
    expect(findServiceReferences("services:\n  worker:\n    depends_on:\n      app:\n        condition: service_started\n", "app")[0].kind).toBe("depends_on");
    expect(findServiceReferences("services:\n  worker:\n    build:\n      additional_contexts: [cache=service:app, service:app, nope, 12]\n", "app").map((reference) => reference.kind)).toEqual(["build_context", "build_context"]);
    expect(() => findServiceReferences("services: [", "app")).toThrow();
  });

  it("creates services and rejects invalid or duplicate names", () => {
    expect(createService("{}\n", " api ")).toMatchObject({ serviceName: "api" });
    expect(createService("services: null\n", "api").serviceName).toBe("api");
    expect(() => createService(base, "app")).toThrow("Der Service app existiert bereits.");
    expect(() => createService(base, "bad name")).toThrow("Servicenamen dürfen nur");
    expect(() => createService(base, " ")).toThrow("Der Servicename darf nicht leer sein.");
    expect(() => createService("services: [", "api")).toThrow("Das YAML muss zuerst syntaktisch gültig sein.");
  });

  it("clones services and rejects absent sources or occupied names", () => {
    const cloned = cloneService(base, "app", "copy");
    expect(readYaml(cloned.yaml)).toMatchObject({ services: { copy: { image: "app:1" } } });
    expect(() => cloneService(base, "missing", "copy")).toThrow("Der Service missing existiert nicht.");
    expect(() => cloneService(base, "app", "worker")).toThrow("Der Service worker existiert bereits.");
    expect(() => cloneService(base, "app", "bad name")).toThrow("Servicenamen dürfen nur");
  });

  it("renames services and rewrites references, including a no-op", () => {
    expect(renameService(base, "app", "app")).toMatchObject({ yaml: base, serviceName: "app", updatedReferences: 0 });
    const renamed = renameService(referenceFixture, "app", "api");
    expect(renamed.updatedReferences).toBe(8);
    expect(readYaml(renamed.yaml)).toMatchObject({ services: {
      api: { image: "app:1" },
      worker: {
        depends_on: ["api", "other"], network_mode: "service:api", ipc: "service:api", pid: "service:api",
        links: ["api:db", "other", 42], volumes_from: ["api:ro"], build: { additional_contexts: { named: "service:api", other: "./other" } }, extends: { service: "api" },
      },
    } });
    expect(() => renameService(base, "missing", "next")).toThrow("Der Service missing existiert nicht.");
    expect(() => renameService(base, "app", "worker")).toThrow("Der Service worker existiert bereits.");
  });

  it("preserves pre-existing dependency map entries and rewrites list build contexts", () => {
    const mapDependencies = `services:
  app: {}
  worker:
    depends_on:
      app: { condition: service_started }
      api: { condition: service_healthy }
`;
    expect(readYaml(renameService(mapDependencies, "app", "api").yaml)).toMatchObject({ services: { worker: { depends_on: { api: { condition: "service_healthy" } } } } });

    const contexts = `services:
  app: {}
  worker:
    build:
      additional_contexts: [cache=service:app, service:app, other, 7]
`;
    expect(readYaml(renameService(contexts, "app", "api").yaml)).toMatchObject({ services: { worker: { build: { additional_contexts: ["cache=service:api", "service:api", "other", 7] } } } });
    expect(readYaml(deleteService(contexts, "app", true).yaml)).toMatchObject({ services: { worker: { build: {} } } });

    const dependencyMap = "services:\n  app: {}\n  worker:\n    depends_on: { app: true, other: true }\n";
    expect(readYaml(renameService(dependencyMap, "app", "new-app").yaml)).toMatchObject({ services: { worker: { depends_on: { "new-app": true, other: true } } } });
  });

  it("deletes an array of build contexts when every entry references the removed service", () => {
    const source = "services:\n  app: {}\n  worker:\n    build:\n      additional_contexts: [service:app]\n";
    expect(readYaml(deleteService(source, "app", true).yaml)).toMatchObject({ services: { worker: { build: {} } } });
  });

  it("leaves unrelated references untouched when renaming another service", () => {
    const source = `services:
  app: {}
  database: {}
  worker:
    depends_on: [database]
    links: [other]
    build:
      additional_contexts:
        other: ./other
`;
    expect(readYaml(renameService(source, "app", "api").yaml)).toMatchObject({ services: {
      api: {}, database: {}, worker: { depends_on: ["database"], links: ["other"], build: { additional_contexts: { other: "./other" } } },
    } });

    const listContexts = `services:
  app: {}
  worker:
    build:
      additional_contexts: [other, cache=./cache]
`;
    expect(readYaml(renameService(listContexts, "app", "api").yaml)).toMatchObject({ services: { worker: { build: { additional_contexts: ["other", "cache=./cache"] } } } });
  });

  it("removes empty reference collections when deleting their only target", () => {
    const source = `services:
  app: {}
  worker:
    depends_on: { app: true }
    links: [app]
    volumes_from: [app]
    build:
      additional_contexts: { base: service:app }
    extends: { service: app }
`;
    const removed = readYaml(deleteService(source, "app", true).yaml) as { services: { worker: Record<string, unknown> } };
    expect(removed.services.worker).toEqual({ build: {} });
  });

  it("deletes unreferenced services and safely rejects or cleans referenced ones", () => {
    expect(readYaml(deleteService(base, "app").yaml)).toMatchObject({ services: { worker: { image: "worker:1" } } });
    expect(() => deleteService(referenceFixture, "app")).toThrow("wird noch 8-mal referenziert");
    const deleted = deleteService(referenceFixture, "app", true);
    expect(deleted.removedReferences).toBe(8);
    expect(readYaml(deleted.yaml)).toMatchObject({ services: { worker: { build: { context: "." } } } });
    expect(() => deleteService(base, "missing")).toThrow("Der Service missing existiert nicht.");
  });

  it("generates unique names and converts nested editor values", () => {
    expect(uniqueServiceName(["api", "api-2"], "api")).toBe("api-3");
    expect(uniqueServiceName([], "api")).toBe("api");
    expect(() => uniqueServiceName([], "bad name")).toThrow("Servicenamen dürfen nur");
    expect(asComposeValue(null)).toBeNull();
    expect(asComposeValue(1)).toBe(1);
    expect(asComposeValue(true)).toBe(true);
    expect(asComposeValue(["a", { nested: undefined }])).toEqual(["a", { nested: "undefined" }]);
    expect(asComposeValue(undefined)).toBe("undefined");
    expect(cloneComposeValue({ list: [1, { value: false }] })).toEqual({ list: [1, { value: false }] });
    expect(createBlankLike(undefined)).toBe("");
    expect(createBlankLike(null)).toBe("");
    expect(createBlankLike([1])).toEqual([]);
    expect(createBlankLike({ name: "x", nested: { on: true }, count: 2 })).toEqual({ name: "", nested: { on: false }, count: 0 });
    expect(uniqueMapKey({}, "key")).toBe("key");
    expect(uniqueMapKey({ key: "x", key_2: "y" }, "key")).toBe("key_3");
  });
});
