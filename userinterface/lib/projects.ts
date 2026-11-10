export interface Project {
  id: string;
  name: string;
  yaml: string;
}

export interface ProjectStore {
  activeId: string;
  projects: Project[];
}

export const PROJECTS_KEY = "genposed.projects.v1";
export const LEGACY_KEY = "genposed.compose.v1";

export function readProjects(raw: string | null, legacy: string | null, example: string): ProjectStore {
  if (raw !== null) {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("projects" in parsed) || !("activeId" in parsed)) throw new Error("Ungültiger Projektspeicher");
    const store = parsed as ProjectStore;
    if (!Array.isArray(store.projects) || store.projects.length === 0 || typeof store.activeId !== "string" ||
        store.projects.some((project) => !project || typeof project.id !== "string" || !project.id || typeof project.name !== "string" || typeof project.yaml !== "string") ||
        new Set(store.projects.map((project) => project.id)).size !== store.projects.length ||
        !store.projects.some((project) => project.id === store.activeId)) throw new Error("Ungültiger Projektspeicher");
    return store;
  }
  return { activeId: "default", projects: [{ id: "default", name: "Mein Projekt", yaml: legacy ?? example }] };
}
