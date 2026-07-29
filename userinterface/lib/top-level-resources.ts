import {
  analyzeComposeDocument,
  isRecord,
  SERVICE_NAME_PATTERN,
  type ComposeValue,
} from "@/lib/compose-document";

export type TopLevelResourceKind = "networks" | "volumes" | "configs" | "secrets";

type ParsedDocument = ReturnType<typeof analyzeComposeDocument>["document"];

type CloneableYamlNode = {
  clone(): unknown;
  toJS(document: ParsedDocument): unknown;
};

export interface TopLevelResourceReference {
  sourceService: string;
  path: string;
  value: string;
  kind: "service" | "build";
}

export interface TopLevelResourceSelection {
  kind: TopLevelResourceKind;
  name: string;
}

export const TOP_LEVEL_RESOURCE_KINDS: TopLevelResourceKind[] = [
  "networks",
  "volumes",
  "configs",
  "secrets",
];

export const TOP_LEVEL_RESOURCE_LABELS: Record<TopLevelResourceKind, string> = {
  networks: "Networks",
  volumes: "Volumes",
  configs: "Configs",
  secrets: "Secrets",
};

export const TOP_LEVEL_RESOURCE_SAMPLES: Record<TopLevelResourceKind, ComposeValue> = {
  networks: { driver: "bridge" },
  volumes: { driver: "local" },
  configs: { file: "./config/replace-me.yaml" },
  secrets: { file: "./secrets/replace-me.txt" },
};

function requireValidDocument(source: string) {
  const analysis = analyzeComposeDocument(source);
  if (analysis.errors.length > 0) {
    throw new Error("Das YAML muss zuerst syntaktisch gültig sein.");
  }

  return analysis;
}

function serialize(document: ParsedDocument): string {
  return document.toString({ lineWidth: 0 });
}

function rootValue(document: ParsedDocument): Record<string, unknown> {
  const root = document.toJS() as Record<string, unknown> | null;
  return isRecord(root) ? root : {};
}

function resources(document: ParsedDocument, kind: TopLevelResourceKind): Record<string, unknown> {
  const value = rootValue(document)[kind];
  return isRecord(value) ? value : {};
}

function services(document: ParsedDocument): Record<string, unknown> {
  const value = rootValue(document).services;
  return isRecord(value) ? value : {};
}

function normalizeResourceName(name: string): string {
  return name.trim();
}

function assertResourceName(name: string): string {
  const normalized = normalizeResourceName(name);
  if (!normalized) throw new Error("Der Ressourcenname darf nicht leer sein.");
  if (!SERVICE_NAME_PATTERN.test(normalized)) {
    throw new Error("Ressourcennamen dürfen nur Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche enthalten.");
  }
  return normalized;
}

function assertResourceExists(
  document: ParsedDocument,
  kind: TopLevelResourceKind,
  resourceName: string,
): void {
  if (!(resourceName in resources(document, kind))) {
    throw new Error(`${TOP_LEVEL_RESOURCE_LABELS[kind]}-Ressource ${resourceName} existiert nicht.`);
  }
}

function assertResourceAvailable(
  document: ParsedDocument,
  kind: TopLevelResourceKind,
  resourceName: string,
): void {
  if (resourceName in resources(document, kind)) {
    throw new Error(`${TOP_LEVEL_RESOURCE_LABELS[kind]}-Ressource ${resourceName} existiert bereits.`);
  }
}

function ensureResourceCollection(document: ParsedDocument, kind: TopLevelResourceKind): void {
  if (!isRecord(rootValue(document)[kind])) {
    document.setIn([kind], {});
  }
}

export function listTopLevelResources(
  source: string,
): Record<TopLevelResourceKind, string[]> {
  const { document } = requireValidDocument(source);

  return {
    networks: Object.keys(resources(document, "networks")),
    volumes: Object.keys(resources(document, "volumes")),
    configs: Object.keys(resources(document, "configs")),
    secrets: Object.keys(resources(document, "secrets")),
  };
}

export function readTopLevelResource(
  source: string,
  kind: TopLevelResourceKind,
  resourceName: string,
): ComposeValue | undefined {
  const { document } = requireValidDocument(source);
  const node = document.getIn([kind, resourceName], true) as CloneableYamlNode | undefined;
  return node?.toJS(document) as ComposeValue | undefined;
}

export function writeTopLevelResource(
  source: string,
  kind: TopLevelResourceKind,
  resourceName: string,
  value: ComposeValue,
): string {
  const { document } = requireValidDocument(source);
  assertResourceExists(document, kind, resourceName);
  document.setIn([kind, resourceName], value);
  return serialize(document);
}

function addReference(
  references: TopLevelResourceReference[],
  sourceService: string,
  path: string,
  value: string,
  kind: TopLevelResourceReference["kind"] = "service",
): void {
  references.push({ sourceService, path, value, kind });
}

function collectArrayResourceReferences(
  references: TopLevelResourceReference[],
  sourceService: string,
  field: "configs" | "secrets",
  entries: unknown[],
  resourceName: string,
  pathPrefix = `services.${sourceService}.${field}`,
  referenceKind: TopLevelResourceReference["kind"] = "service",
): void {
  entries.forEach((entry, index) => {
    if (entry === resourceName) {
      addReference(references, sourceService, `${pathPrefix}.${index}`, resourceName, referenceKind);
      return;
    }

    if (isRecord(entry) && entry.source === resourceName) {
      addReference(references, sourceService, `${pathPrefix}.${index}.source`, resourceName, referenceKind);
    }
  });
}

function collectResourceReferences(
  document: ParsedDocument,
  kind: TopLevelResourceKind,
  resourceName: string,
): TopLevelResourceReference[] {
  const references: TopLevelResourceReference[] = [];

  for (const [sourceService, rawService] of Object.entries(services(document))) {
    if (!isRecord(rawService)) continue;

    if (kind === "networks") {
      const networkEntries = rawService.networks;
      if (Array.isArray(networkEntries)) {
        networkEntries.forEach((entry, index) => {
          if (entry === resourceName) {
            addReference(references, sourceService, `services.${sourceService}.networks.${index}`, resourceName);
          }
        });
      } else if (isRecord(networkEntries) && resourceName in networkEntries) {
        addReference(references, sourceService, `services.${sourceService}.networks.${resourceName}`, resourceName);
      }

      const build = isRecord(rawService.build) ? rawService.build : undefined;
      if (build?.network === resourceName) {
        addReference(references, sourceService, `services.${sourceService}.build.network`, resourceName, "build");
      }
    }

    if (kind === "volumes") {
      const volumeEntries = rawService.volumes;
      if (Array.isArray(volumeEntries)) {
        volumeEntries.forEach((entry, index) => {
          if (typeof entry === "string" && entry.startsWith(`${resourceName}:`)) {
            addReference(references, sourceService, `services.${sourceService}.volumes.${index}`, entry);
            return;
          }

          if (
            isRecord(entry)
            && entry.source === resourceName
            && (entry.type === undefined || entry.type === "volume")
          ) {
            addReference(references, sourceService, `services.${sourceService}.volumes.${index}.source`, resourceName);
          }
        });
      }
    }

    if (kind === "configs" || kind === "secrets") {
      const entries = rawService[kind];
      if (Array.isArray(entries)) {
        collectArrayResourceReferences(references, sourceService, kind, entries, resourceName);
      }

      if (kind === "secrets") {
        const build = isRecord(rawService.build) ? rawService.build : undefined;
        const buildSecrets = build?.secrets;
        if (Array.isArray(buildSecrets)) {
          collectArrayResourceReferences(
            references,
            sourceService,
            "secrets",
            buildSecrets,
            resourceName,
            `services.${sourceService}.build.secrets`,
            "build",
          );
        }
      }
    }
  }

  return references;
}

export function findTopLevelResourceReferences(
  source: string,
  kind: TopLevelResourceKind,
  resourceName: string,
): TopLevelResourceReference[] {
  const { document } = requireValidDocument(source);
  return collectResourceReferences(document, kind, resourceName);
}

function rewriteNamedArrayEntries(
  entries: unknown[],
  resourceName: string,
  replacementName: string | null,
): unknown[] {
  return entries.flatMap((entry) => {
    if (entry === resourceName) {
      return replacementName === null ? [] : [replacementName];
    }

    if (isRecord(entry) && entry.source === resourceName) {
      if (replacementName === null) return [];
      return [{ ...entry, source: replacementName }];
    }

    return [entry];
  });
}

function rewriteResourceReferences(
  document: ParsedDocument,
  kind: TopLevelResourceKind,
  resourceName: string,
  replacementName: string | null,
): void {
  for (const [sourceService, rawService] of Object.entries(services(document))) {
    if (!isRecord(rawService)) continue;
    const sourcePath = ["services", sourceService];

    if (kind === "networks") {
      const networkEntries = rawService.networks;
      if (Array.isArray(networkEntries)) {
        const nextNetworks = networkEntries.flatMap((entry) => {
          if (entry !== resourceName) return [entry];
          return replacementName === null ? [] : [replacementName];
        });

        if (nextNetworks.length === 0) {
          document.deleteIn([...sourcePath, "networks"]);
        } else if (
          nextNetworks.length !== networkEntries.length
          || nextNetworks.some((entry, index) => entry !== networkEntries[index])
        ) {
          document.setIn([...sourcePath, "networks"], nextNetworks);
        }
      } else if (isRecord(networkEntries) && resourceName in networkEntries) {
        const nextNetworks = { ...networkEntries };
        const networkValue = nextNetworks[resourceName];
        delete nextNetworks[resourceName];
        if (replacementName !== null && !(replacementName in nextNetworks)) {
          nextNetworks[replacementName] = networkValue;
        }

        if (Object.keys(nextNetworks).length === 0) {
          document.deleteIn([...sourcePath, "networks"]);
        } else {
          document.setIn([...sourcePath, "networks"], nextNetworks);
        }
      }

      const build = isRecord(rawService.build) ? rawService.build : undefined;
      if (build?.network === resourceName) {
        if (replacementName === null) {
          document.deleteIn([...sourcePath, "build", "network"]);
        } else {
          document.setIn([...sourcePath, "build", "network"], replacementName);
        }
      }
    }

    if (kind === "volumes") {
      const volumeEntries = rawService.volumes;
      if (Array.isArray(volumeEntries)) {
        const nextVolumes = volumeEntries.flatMap((entry) => {
          if (typeof entry === "string" && entry.startsWith(`${resourceName}:`)) {
            if (replacementName === null) return [];
            return [`${replacementName}${entry.slice(resourceName.length)}`];
          }

          if (
            isRecord(entry)
            && entry.source === resourceName
            && (entry.type === undefined || entry.type === "volume")
          ) {
            if (replacementName === null) return [];
            return [{ ...entry, source: replacementName }];
          }

          return [entry];
        });

        if (nextVolumes.length === 0) {
          document.deleteIn([...sourcePath, "volumes"]);
        } else if (
          nextVolumes.length !== volumeEntries.length
          || nextVolumes.some((entry, index) => entry !== volumeEntries[index])
        ) {
          document.setIn([...sourcePath, "volumes"], nextVolumes);
        }
      }
    }

    if (kind === "configs" || kind === "secrets") {
      const entries = rawService[kind];
      if (Array.isArray(entries)) {
        const nextEntries = rewriteNamedArrayEntries(entries, resourceName, replacementName);
        if (nextEntries.length === 0) {
          document.deleteIn([...sourcePath, kind]);
        } else if (
          nextEntries.length !== entries.length
          || nextEntries.some((entry, index) => entry !== entries[index])
        ) {
          document.setIn([...sourcePath, kind], nextEntries);
        }
      }

      if (kind === "secrets") {
        const build = isRecord(rawService.build) ? rawService.build : undefined;
        const buildSecrets = build?.secrets;
        if (Array.isArray(buildSecrets)) {
          const nextBuildSecrets = rewriteNamedArrayEntries(buildSecrets, resourceName, replacementName);
          if (nextBuildSecrets.length === 0) {
            document.deleteIn([...sourcePath, "build", "secrets"]);
          } else if (
            nextBuildSecrets.length !== buildSecrets.length
            || nextBuildSecrets.some((entry, index) => entry !== buildSecrets[index])
          ) {
            document.setIn([...sourcePath, "build", "secrets"], nextBuildSecrets);
          }
        }
      }
    }
  }
}

export function createTopLevelResource(
  source: string,
  kind: TopLevelResourceKind,
  requestedName: string,
): { yaml: string; selection: TopLevelResourceSelection } {
  const { document } = requireValidDocument(source);
  const resourceName = assertResourceName(requestedName);

  ensureResourceCollection(document, kind);
  assertResourceAvailable(document, kind, resourceName);
  document.setIn([kind, resourceName], TOP_LEVEL_RESOURCE_SAMPLES[kind]);

  return {
    yaml: serialize(document),
    selection: { kind, name: resourceName },
  };
}

export function cloneTopLevelResource(
  source: string,
  kind: TopLevelResourceKind,
  sourceName: string,
  requestedName: string,
): { yaml: string; selection: TopLevelResourceSelection } {
  const { document } = requireValidDocument(source);
  const resourceName = assertResourceName(requestedName);

  assertResourceExists(document, kind, sourceName);
  assertResourceAvailable(document, kind, resourceName);

  const node = document.getIn([kind, sourceName], true) as CloneableYamlNode | undefined;
  if (!node) throw new Error(`${sourceName} konnte nicht gelesen werden.`);

  document.setIn([kind, resourceName], node.clone());
  return {
    yaml: serialize(document),
    selection: { kind, name: resourceName },
  };
}

export function renameTopLevelResource(
  source: string,
  kind: TopLevelResourceKind,
  currentName: string,
  requestedName: string,
): { yaml: string; selection: TopLevelResourceSelection; updatedReferences: number } {
  const { document } = requireValidDocument(source);
  const resourceName = assertResourceName(requestedName);

  assertResourceExists(document, kind, currentName);
  if (resourceName === currentName) {
    return {
      yaml: source,
      selection: { kind, name: resourceName },
      updatedReferences: 0,
    };
  }
  assertResourceAvailable(document, kind, resourceName);

  const references = collectResourceReferences(document, kind, currentName);
  const node = document.getIn([kind, currentName], true) as CloneableYamlNode | undefined;
  if (!node) throw new Error(`${currentName} konnte nicht gelesen werden.`);

  document.setIn([kind, resourceName], node.clone());
  document.deleteIn([kind, currentName]);
  rewriteResourceReferences(document, kind, currentName, resourceName);

  return {
    yaml: serialize(document),
    selection: { kind, name: resourceName },
    updatedReferences: references.length,
  };
}

export function deleteTopLevelResource(
  source: string,
  kind: TopLevelResourceKind,
  resourceName: string,
  cleanupReferences = false,
): { yaml: string; removedReferences: number } {
  const { document } = requireValidDocument(source);
  assertResourceExists(document, kind, resourceName);

  const references = collectResourceReferences(document, kind, resourceName);
  if (references.length > 0 && !cleanupReferences) {
    throw new Error(
      `${resourceName} wird noch ${references.length}-mal referenziert. Aktiviere die Referenzbereinigung oder passe die Services zuerst an.`,
    );
  }

  if (cleanupReferences) {
    rewriteResourceReferences(document, kind, resourceName, null);
  }

  document.deleteIn([kind, resourceName]);

  return {
    yaml: serialize(document),
    removedReferences: cleanupReferences ? references.length : 0,
  };
}

export function uniqueTopLevelResourceName(
  existingNames: string[],
  requestedBase: string,
): string {
  const base = assertResourceName(requestedBase);
  if (!existingNames.includes(base)) return base;

  let suffix = 2;
  while (existingNames.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
