import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  cloneTopLevelResource,
  createTopLevelResource,
  deleteTopLevelResource,
  findTopLevelResourceReferences,
  listTopLevelResources,
  readTopLevelResource,
  renameTopLevelResource,
  TOP_LEVEL_RESOURCE_KINDS,
  TOP_LEVEL_RESOURCE_SAMPLES,
  uniqueTopLevelResourceName,
  writeTopLevelResource,
} from "../lib/top-level-resources";

const empty = "services: {}\n";
const allResources = `networks:
  front: { driver: bridge }
  other: {}
volumes:
  data: { driver: local }
  backup: {}
configs:
  app-config: { file: ./app.yml }
secrets:
  app-secret: { file: ./secret.txt }
services:
  app:
    networks: [front, other]
    build:
      network: front
      secrets: [app-secret, { source: app-secret, target: key }]
    volumes:
      - data:/data
      - { type: volume, source: data, target: /more }
      - { type: bind, source: data, target: /bind }
    configs: [app-config, { source: app-config, target: /etc/app.yml }, other-config]
    secrets: [app-secret, { source: app-secret, target: /run/key }, other-secret]
  invalid: false
  secondary:
    secrets: [other-secret]
`;

function parsed(source: string): unknown {
  return parse(source);
}

describe("top-level Compose resources", () => {
  it("lists, reads, and writes all resource kinds", () => {
    expect(listTopLevelResources(allResources)).toEqual({
      networks: ["front", "other"], volumes: ["data", "backup"], configs: ["app-config"], secrets: ["app-secret"],
    });
    expect(listTopLevelResources("services: {}\nnetworks: null\n")).toEqual({ networks: [], volumes: [], configs: [], secrets: [] });
    expect(listTopLevelResources("null")).toEqual({ networks: [], volumes: [], configs: [], secrets: [] });
    expect(readTopLevelResource(allResources, "volumes", "data")).toEqual({ driver: "local" });
    expect(readTopLevelResource(allResources, "volumes", "missing")).toBeUndefined();
    expect(parsed(writeTopLevelResource(allResources, "volumes", "data", { driver: "custom" }))).toMatchObject({ volumes: { data: { driver: "custom" } } });
    expect(() => writeTopLevelResource(allResources, "volumes", "missing", {})).toThrow("Volumes-Ressource missing existiert nicht.");
    expect(() => listTopLevelResources("services: [")).toThrow("Das YAML muss zuerst syntaktisch gültig sein.");
  });

  it("finds service and build references for networks, volumes, configs, and secrets", () => {
    expect(findTopLevelResourceReferences(allResources, "networks", "front")).toEqual([
      { sourceService: "app", path: "services.app.networks.0", value: "front", kind: "service" },
      { sourceService: "app", path: "services.app.build.network", value: "front", kind: "build" },
    ]);
    expect(findTopLevelResourceReferences(allResources, "volumes", "data")).toHaveLength(2);
    expect(findTopLevelResourceReferences(allResources, "configs", "app-config")).toHaveLength(2);
    expect(findTopLevelResourceReferences(allResources, "secrets", "app-secret")).toHaveLength(4);
    expect(findTopLevelResourceReferences("services: null\n", "networks", "front")).toEqual([]);
    expect(findTopLevelResourceReferences("services:\n  app:\n    networks:\n      front: { aliases: [web] }\n", "networks", "front")[0].path).toBe("services.app.networks.front");
    expect(findTopLevelResourceReferences("services:\n  app:\n    volumes: [data:/data]\n", "volumes", "data")).toHaveLength(1);
    expect(findTopLevelResourceReferences("services:\n  app:\n    volumes: [{source: data, target: /data}]\n", "volumes", "data")).toHaveLength(1);
    expect(findTopLevelResourceReferences("services:\n  app:\n    configs: [other]\n", "configs", "none")).toEqual([]);
    expect(() => findTopLevelResourceReferences("services: [", "secrets", "x")).toThrow();
  });

  it("creates namespaced resources from samples and validates names", () => {
    for (const kind of TOP_LEVEL_RESOURCE_KINDS) {
      const result = createTopLevelResource(empty, kind, " resource ");
      expect(result.selection).toEqual({ kind, name: "resource" });
      expect(parsed(result.yaml)).toMatchObject({ [kind]: { resource: TOP_LEVEL_RESOURCE_SAMPLES[kind] } });
    }
    expect(() => createTopLevelResource(allResources, "networks", "front")).toThrow("Networks-Ressource front existiert bereits.");
    expect(() => createTopLevelResource(empty, "networks", "bad name")).toThrow("Ressourcennamen dürfen nur");
    expect(() => createTopLevelResource(empty, "networks", " ")).toThrow("Der Ressourcenname darf nicht leer sein.");
    expect(() => createTopLevelResource("services: [", "networks", "x")).toThrow("Das YAML muss zuerst syntaktisch gültig sein.");
  });

  it("clones and renames definitions with references updated", () => {
    const cloned = cloneTopLevelResource(allResources, "volumes", "data", "copy");
    expect(parsed(cloned.yaml)).toMatchObject({ volumes: { copy: { driver: "local" } } });
    expect(cloned.selection).toEqual({ kind: "volumes", name: "copy" });
    expect(() => cloneTopLevelResource(allResources, "volumes", "missing", "copy")).toThrow("Volumes-Ressource missing existiert nicht.");
    expect(() => cloneTopLevelResource(allResources, "volumes", "data", "backup")).toThrow("Volumes-Ressource backup existiert bereits.");

    const networkRename = renameTopLevelResource(allResources, "networks", "front", "edge");
    expect(networkRename.updatedReferences).toBe(2);
    expect(parsed(networkRename.yaml)).toMatchObject({
      networks: { edge: { driver: "bridge" } },
      services: { app: { networks: ["edge", "other"], build: { network: "edge" } } },
    });
    expect(renameTopLevelResource(allResources, "volumes", "data", "data")).toMatchObject({ yaml: allResources, updatedReferences: 0 });
    expect(() => renameTopLevelResource(allResources, "volumes", "missing", "copy")).toThrow("Volumes-Ressource missing existiert nicht.");
    expect(() => renameTopLevelResource(allResources, "volumes", "data", "backup")).toThrow("Volumes-Ressource backup existiert bereits.");
  });

  it("rewrites mapping networks and all volume, config, and secret reference forms", () => {
    const mappedNetwork = `networks: { front: {} }
services:
  app:
    networks: { front: { aliases: [web] }, other: {} }
`;
    expect(parsed(renameTopLevelResource(mappedNetwork, "networks", "front", "edge").yaml)).toMatchObject({ services: { app: { networks: { edge: { aliases: ["web"] }, other: {} } } } });

    const volumeRename = renameTopLevelResource(allResources, "volumes", "data", "store");
    expect(volumeRename.updatedReferences).toBe(2);
    expect(parsed(volumeRename.yaml)).toMatchObject({ services: { app: { volumes: ["store:/data", { type: "volume", source: "store", target: "/more" }, { type: "bind", source: "data", target: "/bind" }] } } });

    const configRename = renameTopLevelResource(allResources, "configs", "app-config", "settings");
    expect(configRename.updatedReferences).toBe(2);
    expect(parsed(configRename.yaml)).toMatchObject({ services: { app: { configs: ["settings", { source: "settings", target: "/etc/app.yml" }, "other-config"] } } });

    const secretRename = renameTopLevelResource(allResources, "secrets", "app-secret", "credential");
    expect(secretRename.updatedReferences).toBe(4);
    expect(parsed(secretRename.yaml)).toMatchObject({ services: { app: {
      secrets: ["credential", { source: "credential", target: "/run/key" }, "other-secret"],
      build: { secrets: ["credential", { source: "credential", target: "key" }] },
    } } });
  });

  it("requires explicit cleanup before deleting referenced resources", () => {
    expect(() => deleteTopLevelResource(allResources, "secrets", "app-secret")).toThrow("wird noch 4-mal referenziert");
    const removed = deleteTopLevelResource(allResources, "secrets", "app-secret", true);
    expect(removed.removedReferences).toBe(4);
    expect(parsed(removed.yaml)).toMatchObject({ services: { app: { build: { network: "front" } } } });
    expect((parsed(removed.yaml) as { services: { app: { build: Record<string, unknown> } } }).services.app.build).not.toHaveProperty("secrets");
    expect(() => deleteTopLevelResource(allResources, "volumes", "missing")).toThrow("Volumes-Ressource missing existiert nicht.");
    expect(deleteTopLevelResource(allResources, "volumes", "data", true).removedReferences).toBe(2);
    const networkCleanup = deleteTopLevelResource(allResources, "networks", "front", true);
    expect(parsed(networkCleanup.yaml)).toMatchObject({ services: { app: { networks: ["other"] } } });
    expect((parsed(networkCleanup.yaml) as { services: { app: { build: Record<string, unknown> } } }).services.app.build).not.toHaveProperty("network");
    const singleMapNetwork = "networks: { front: {} }\nservices:\n  app:\n    networks: { front: {} }\n";
    expect((parsed(deleteTopLevelResource(singleMapNetwork, "networks", "front", true).yaml) as { services: { app: Record<string, unknown> } }).services.app).not.toHaveProperty("networks");
    const singleArrayNetwork = "networks: { front: {} }\nservices:\n  app:\n    networks: [front]\n";
    expect((parsed(deleteTopLevelResource(singleArrayNetwork, "networks", "front", true).yaml) as { services: { app: Record<string, unknown> } }).services.app).not.toHaveProperty("networks");
    const singleVolume = "volumes: { data: {} }\nservices:\n  app:\n    volumes: [data:/data]\n";
    expect((parsed(deleteTopLevelResource(singleVolume, "volumes", "data", true).yaml) as { services: { app: Record<string, unknown> } }).services.app).not.toHaveProperty("volumes");
    const singleConfig = "configs: { app-config: { file: ./app.yml } }\nservices:\n  app:\n    configs: [app-config]\n";
    expect((parsed(deleteTopLevelResource(singleConfig, "configs", "app-config", true).yaml) as { services: { app: Record<string, unknown> } }).services.app).not.toHaveProperty("configs");
    expect(uniqueTopLevelResourceName(["volume", "volume-2"], "volume")).toBe("volume-3");
    expect(uniqueTopLevelResourceName([], "volume")).toBe("volume");
    expect(() => uniqueTopLevelResourceName([], "bad name")).toThrow("Ressourcennamen dürfen nur");
  });

  it("leaves unrelated resource references unchanged and deletes unused definitions directly", () => {
    const source = `networks: { front: {} }
volumes: { data: {} }
secrets: { app-secret: { file: ./secret.txt } }
services:
  app:
    networks: [other]
    volumes: [other:/data]
    secrets: [other-secret]
    build:
      secrets: [other-secret]
`;
    expect(renameTopLevelResource(source, "networks", "front", "edge").updatedReferences).toBe(0);
    expect(renameTopLevelResource(source, "volumes", "data", "store").updatedReferences).toBe(0);
    expect(renameTopLevelResource(source, "secrets", "app-secret", "credential").updatedReferences).toBe(0);
    expect(deleteTopLevelResource(source, "secrets", "app-secret")).toMatchObject({ removedReferences: 0 });
  });
});
