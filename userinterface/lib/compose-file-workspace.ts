export type ComposeEnvironmentKind =
  | "base"
  | "local"
  | "development"
  | "test"
  | "preview"
  | "staging"
  | "production"
  | "custom";

export interface ComposeWorkspaceFile {
  id: string;
  name: string;
  displayName: string;
  environment: ComposeEnvironmentKind;
  content: string;
  importedAt: string;
  updatedAt: string;
}

export interface ComposeFileWorkspaceState {
  version: 1;
  activeFileId?: string;
  files: ComposeWorkspaceFile[];
}

export const COMPOSE_WORKSPACE_STORAGE_KEY = "genposed.compose.workspace.v1";
export const ACTIVE_COMPOSE_CONTENT_KEY = "genposed.compose.v1";

const COMPOSE_FILE_PATTERN = /^(?:docker-)?compose(?:[._-]([a-z0-9._-]+))?\.ya?ml$/i;

const ENVIRONMENT_ALIASES: Record<string, ComposeEnvironmentKind> = {
  local: "local",
  dev: "development",
  development: "development",
  test: "test",
  testing: "test",
  ci: "test",
  preview: "preview",
  pr: "preview",
  stage: "staging",
  staging: "staging",
  prod: "production",
  production: "production",
};

const ENVIRONMENT_LABELS: Record<ComposeEnvironmentKind, string> = {
  base: "Base",
  local: "Local",
  development: "Development",
  test: "Test",
  preview: "Preview",
  staging: "Staging",
  production: "Production",
  custom: "Custom",
};

export function isComposeFileName(fileName: string): boolean {
  return COMPOSE_FILE_PATTERN.test(fileName.trim());
}

export function detectComposeEnvironment(fileName: string): ComposeEnvironmentKind {
  const match = fileName.trim().match(COMPOSE_FILE_PATTERN);
  const suffix = match?.[1]?.toLowerCase();
  if (!suffix) return "base";

  const suffixParts = suffix.split(/[._-]+/).filter(Boolean);
  for (const part of suffixParts) {
    if (part in ENVIRONMENT_ALIASES) return ENVIRONMENT_ALIASES[part];
  }

  return "custom";
}

export function composeEnvironmentLabel(environment: ComposeEnvironmentKind): string {
  return ENVIRONMENT_LABELS[environment];
}

export function defaultComposeDisplayName(fileName: string): string {
  const environment = detectComposeEnvironment(fileName);
  if (environment !== "custom") return ENVIRONMENT_LABELS[environment];

  const match = fileName.trim().match(COMPOSE_FILE_PATTERN);
  const suffix = match?.[1] ?? fileName.replace(/\.ya?ml$/i, "");
  return suffix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Custom";
}

export function createWorkspaceFile(
  fileName: string,
  content: string,
  now = new Date(),
): ComposeWorkspaceFile {
  const timestamp = now.toISOString();
  const stableSeed = `${fileName}:${timestamp}:${content.length}`;
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : stableSeed.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return {
    id,
    name: fileName,
    displayName: defaultComposeDisplayName(fileName),
    environment: detectComposeEnvironment(fileName),
    content,
    importedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function parseWorkspaceState(raw: string | null): ComposeFileWorkspaceState {
  if (!raw) return { version: 1, files: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<ComposeFileWorkspaceState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.files)) {
      return { version: 1, files: [] };
    }

    const files = parsed.files.filter((file): file is ComposeWorkspaceFile => {
      return Boolean(
        file
        && typeof file.id === "string"
        && typeof file.name === "string"
        && typeof file.displayName === "string"
        && typeof file.environment === "string"
        && typeof file.content === "string",
      );
    });

    const activeFileId = files.some((file) => file.id === parsed.activeFileId)
      ? parsed.activeFileId
      : files[0]?.id;

    return { version: 1, files, activeFileId };
  } catch {
    return { version: 1, files: [] };
  }
}

export function syncActiveFileContent(
  workspace: ComposeFileWorkspaceState,
  content: string,
  now = new Date(),
): ComposeFileWorkspaceState {
  if (!workspace.activeFileId) return workspace;
  const timestamp = now.toISOString();

  return {
    ...workspace,
    files: workspace.files.map((file) => file.id === workspace.activeFileId
      ? { ...file, content, updatedAt: timestamp }
      : file),
  };
}

export function upsertWorkspaceFiles(
  workspace: ComposeFileWorkspaceState,
  importedFiles: ComposeWorkspaceFile[],
): ComposeFileWorkspaceState {
  const filesByName = new Map(workspace.files.map((file) => [file.name.toLowerCase(), file]));

  for (const importedFile of importedFiles) {
    const key = importedFile.name.toLowerCase();
    const existing = filesByName.get(key);
    filesByName.set(key, existing
      ? {
          ...existing,
          content: importedFile.content,
          environment: importedFile.environment,
          displayName: importedFile.displayName,
          updatedAt: importedFile.updatedAt,
        }
      : importedFile);
  }

  const files = [...filesByName.values()].sort((left, right) => {
    const environmentOrder: ComposeEnvironmentKind[] = [
      "base",
      "local",
      "development",
      "test",
      "preview",
      "staging",
      "production",
      "custom",
    ];
    const environmentDifference = environmentOrder.indexOf(left.environment)
      - environmentOrder.indexOf(right.environment);
    return environmentDifference || left.name.localeCompare(right.name);
  });

  return {
    version: 1,
    files,
    activeFileId: workspace.activeFileId ?? files[0]?.id,
  };
}

export function selectWorkspaceFile(
  workspace: ComposeFileWorkspaceState,
  fileId: string,
): ComposeFileWorkspaceState {
  if (!workspace.files.some((file) => file.id === fileId)) return workspace;
  return { ...workspace, activeFileId: fileId };
}

export function renameWorkspaceFileLabel(
  workspace: ComposeFileWorkspaceState,
  fileId: string,
  displayName: string,
): ComposeFileWorkspaceState {
  const normalizedName = displayName.trim();
  if (!normalizedName) return workspace;

  return {
    ...workspace,
    files: workspace.files.map((file) => file.id === fileId
      ? { ...file, displayName: normalizedName, updatedAt: new Date().toISOString() }
      : file),
  };
}

export function removeWorkspaceFile(
  workspace: ComposeFileWorkspaceState,
  fileId: string,
): ComposeFileWorkspaceState {
  const files = workspace.files.filter((file) => file.id !== fileId);
  const activeFileId = workspace.activeFileId === fileId
    ? files[0]?.id
    : workspace.activeFileId;
  return { version: 1, files, activeFileId };
}
