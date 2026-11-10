import { describe, expect, it } from "vitest";
import { readProjects, type ProjectStore } from "../lib/projects";

const validStore: ProjectStore = {
  activeId: "b",
  projects: [
    { id: "a", name: "A", yaml: "one" },
    { id: "b", name: "B", yaml: "two" },
  ],
};

describe("readProjects", () => {
  it.each([
    [null, "", "example", ""],
    [null, "[broken", "example", "[broken"],
    [null, null, "example", "example"],
  ])("migrates legacy YAML %j", (raw, legacy, example, yaml) => {
    expect(readProjects(raw, legacy, example).projects[0].yaml).toBe(yaml);
  });

  it("restores a valid multi-project store", () => {
    expect(readProjects(JSON.stringify(validStore), "old", "example")).toEqual(validStore);
  });

  it("rejects invalid JSON", () => {
    expect(() => readProjects("not json", "old", "example")).toThrow();
  });

  it.each([
    ["missing projects", JSON.stringify({ activeId: "a" })],
    ["missing activeId", JSON.stringify({ projects: validStore.projects })],
    ["null root", "null"],
    ["empty projects", JSON.stringify({ activeId: "a", projects: [] })],
    ["non-array projects", JSON.stringify({ activeId: "a", projects: {} })],
    ["non-string active id", JSON.stringify({ activeId: 1, projects: validStore.projects })],
    ["project without id", JSON.stringify({ activeId: "a", projects: [{ name: "A", yaml: "" }] })],
    ["empty id", JSON.stringify({ activeId: "", projects: [{ id: "", name: "A", yaml: "" }] })],
    ["non-string name", JSON.stringify({ activeId: "a", projects: [{ id: "a", name: 1, yaml: "" }] })],
    ["non-string yaml", JSON.stringify({ activeId: "a", projects: [{ id: "a", name: "A", yaml: null }] })],
    ["null project", JSON.stringify({ activeId: "a", projects: [null] })],
    ["duplicate ids", JSON.stringify({ activeId: "a", projects: [validStore.projects[0], validStore.projects[0]] })],
    ["unknown active project", JSON.stringify({ activeId: "missing", projects: validStore.projects })],
  ])("rejects %s", (_label, raw) => {
    expect(() => readProjects(raw, "old", "example")).toThrow("Ungültiger Projektspeicher");
  });
});
