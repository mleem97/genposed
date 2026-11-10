import { afterEach, describe, expect, it, vi } from "vitest";
import {
  composeEnvironmentLabel,
  createWorkspaceFile,
  defaultComposeDisplayName,
  detectComposeEnvironment,
  isComposeFileName,
  parseWorkspaceState,
  removeWorkspaceFile,
  renameWorkspaceFileLabel,
  selectWorkspaceFile,
  syncActiveFileContent,
  upsertWorkspaceFiles,
  type ComposeFileWorkspaceState,
} from "../lib/compose-file-workspace";

const now = new Date("2026-11-10T12:00:00.000Z");
const file = (id: string, name: string, environment: "base" | "test" | "production" | "custom" = "base", content = id) => ({
  id,
  name,
  displayName: name,
  environment,
  content,
  importedAt: now.toISOString(),
  updatedAt: now.toISOString(),
});

afterEach(() => vi.unstubAllGlobals());

describe("Compose file workspace", () => {
  it("recognizes Compose filenames and environment aliases", () => {
    expect(isComposeFileName(" compose.yaml ")).toBe(true);
    expect(isComposeFileName("docker-compose.production.yml")).toBe(true);
    expect(isComposeFileName("deployment.yml")).toBe(false);
    expect(detectComposeEnvironment("compose.yaml")).toBe("base");
    expect(detectComposeEnvironment("compose.local.yml")).toBe("local");
    for (const [suffix, environment] of Object.entries({ dev: "development", development: "development", test: "test", testing: "test", ci: "test", preview: "preview", pr: "preview", stage: "staging", staging: "staging", prod: "production", production: "production" })) {
      expect(detectComposeEnvironment(`compose.${suffix}.yaml`)).toBe(environment);
    }
    expect(detectComposeEnvironment("compose.qa-blue.yml")).toBe("custom");
  });

  it("labels every environment and derives display names", () => {
    expect(composeEnvironmentLabel("base")).toBe("Base");
    expect(composeEnvironmentLabel("local")).toBe("Local");
    expect(composeEnvironmentLabel("development")).toBe("Development");
    expect(composeEnvironmentLabel("test")).toBe("Test");
    expect(composeEnvironmentLabel("preview")).toBe("Preview");
    expect(composeEnvironmentLabel("staging")).toBe("Staging");
    expect(composeEnvironmentLabel("production")).toBe("Production");
    expect(composeEnvironmentLabel("custom")).toBe("Custom");
    expect(defaultComposeDisplayName("compose.prod.yml")).toBe("Production");
    expect(defaultComposeDisplayName("compose.qa-blue.yml")).toBe("Qa Blue");
    expect(defaultComposeDisplayName("")).toBe("Custom");
  });

  it("creates stable file metadata and falls back without crypto UUID support", () => {
    expect(createWorkspaceFile("compose.production.yml", "yaml", now)).toEqual({
      id: expect.any(String), name: "compose.production.yml", displayName: "Production", environment: "production",
      content: "yaml", importedAt: now.toISOString(), updatedAt: now.toISOString(),
    });
    vi.stubGlobal("crypto", {});
    expect(createWorkspaceFile("compose.qa.yml", "x", now).id).toBe("compose-qa-yml-2026-11-10t12-00-00-000z-1");
  });

  it("loads valid saved state and safely recovers malformed state", () => {
    expect(parseWorkspaceState(null)).toEqual({ version: 1, files: [] });
    expect(parseWorkspaceState("")).toEqual({ version: 1, files: [] });
    expect(parseWorkspaceState("not json")).toEqual({ version: 1, files: [] });
    expect(parseWorkspaceState(JSON.stringify({ version: 2, files: [file("a", "compose.yaml")] }))).toEqual({ version: 1, files: [] });
    expect(parseWorkspaceState(JSON.stringify({ version: 1, files: {} }))).toEqual({ version: 1, files: [] });

    const state: ComposeFileWorkspaceState = { version: 1, activeFileId: "b", files: [file("a", "compose.yaml"), file("b", "compose.prod.yml")] };
    expect(parseWorkspaceState(JSON.stringify(state))).toEqual(state);
    expect(parseWorkspaceState(JSON.stringify({ ...state, activeFileId: "missing" })).activeFileId).toBe("a");
    expect(parseWorkspaceState(JSON.stringify({ version: 1, files: [null, {}, file("a", "compose.yaml")] })).files).toEqual([file("a", "compose.yaml")]);
  });

  it("syncs current contents without changing an inactive workspace", () => {
    const empty: ComposeFileWorkspaceState = { version: 1, files: [] };
    expect(syncActiveFileContent(empty, "next", now)).toBe(empty);
    const state: ComposeFileWorkspaceState = { version: 1, activeFileId: "a", files: [file("a", "compose.yaml"), file("b", "compose.prod.yml", "production")] };
    expect(syncActiveFileContent(state, "updated", now).files).toEqual([
      { ...state.files[0], content: "updated", updatedAt: now.toISOString() }, state.files[1],
    ]);
  });

  it("upserts filenames case-insensitively, preserves active selection, and sorts environments", () => {
    const state: ComposeFileWorkspaceState = { version: 1, activeFileId: "old", files: [file("old", "compose.yaml"), file("test", "compose.test.yml", "test")] };
    const result = upsertWorkspaceFiles(state, [
      { ...file("new", "COMPOSE.YAML", "base", "new content"), displayName: "Updated" },
      file("prod", "compose.production.yml", "production"),
      file("custom", "compose.qa.yml", "custom"),
    ]);
    expect(result.activeFileId).toBe("old");
    expect(result.files.map((item) => item.name)).toEqual(["compose.yaml", "compose.test.yml", "compose.production.yml", "compose.qa.yml"]);
    expect(result.files[0]).toMatchObject({ id: "old", content: "new content", displayName: "Updated" });
    expect(upsertWorkspaceFiles({ version: 1, files: [] }, []).activeFileId).toBeUndefined();
    expect(upsertWorkspaceFiles({ version: 1, files: [] }, [file("first", "compose.yaml")]).activeFileId).toBe("first");
    expect(upsertWorkspaceFiles({ version: 1, files: [] }, [file("z", "compose.zeta.yml", "base"), file("a", "compose.alpha.yml", "base")]).files.map((item) => item.name)).toEqual(["compose.alpha.yml", "compose.zeta.yml"]);
  });

  it("selects, renames, and removes workspace entries", () => {
    const state: ComposeFileWorkspaceState = { version: 1, activeFileId: "a", files: [file("a", "compose.yaml"), file("b", "compose.prod.yml", "production")] };
    expect(selectWorkspaceFile(state, "b").activeFileId).toBe("b");
    expect(selectWorkspaceFile(state, "missing")).toBe(state);
    expect(renameWorkspaceFileLabel(state, "a", "  ")).toBe(state);
    expect(renameWorkspaceFileLabel(state, "a", "  Base config  ").files[0].displayName).toBe("Base config");
    expect(removeWorkspaceFile(state, "b")).toMatchObject({ activeFileId: "a", files: [{ id: "a" }] });
    expect(removeWorkspaceFile(state, "a")).toMatchObject({ activeFileId: "b", files: [{ id: "b" }] });
    expect(removeWorkspaceFile(state, "missing")).toEqual(state);
  });
});
