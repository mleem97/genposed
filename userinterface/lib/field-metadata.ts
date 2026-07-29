import type { ComposeField, FieldCategory } from "@/lib/catalog";

export type FieldValueKind = "string" | "number" | "boolean" | "map" | "list" | "null" | "preset";
export type FieldSupportStatus = "supported" | "unsupported" | "deprecated" | "extension" | "unknown";

export interface ComposeFieldMetadata {
  valueKind: FieldValueKind;
  repeatable: boolean;
  minimumComposeVersion?: string;
  deprecated: boolean;
  extension: boolean;
  source: "catalog" | "compose-schema" | "platform-extension";
}

export interface FieldSupportResult {
  status: FieldSupportStatus;
  reason: string;
  metadata: ComposeFieldMetadata;
}

const PLATFORM_CATEGORIES = new Set<FieldCategory>([
  "traefik",
  "caddy",
  "coolify",
  "framework",
]);

const VERSION_OVERRIDES: Record<string, string> = {
  "top.include": "2.20.0",
  "service.label_file": "2.32.0",
};

const DEPRECATED_FIELD_IDS = new Set([
  "top.version",
  "network.links",
  "network.external_links",
  "storage.volumes_from",
]);

function inferValueKind(field: ComposeField): FieldValueKind {
  if (field.path.length === 0 && (field.category === "framework" || field.target.endsWith("labels"))) {
    return "preset";
  }

  if (field.sample === null) return "null";
  if (Array.isArray(field.sample)) return "list";
  if (typeof field.sample === "object") return "map";
  if (typeof field.sample === "number") return "number";
  if (typeof field.sample === "boolean") return "boolean";
  return "string";
}

function versionFromCompatibility(compatibility?: string): string | undefined {
  if (!compatibility) return undefined;
  const match = compatibility.match(/Compose\s+(\d+)\.(\d+)(?:\.(\d+))?\+/i);
  if (!match) return undefined;
  return `${match[1]}.${match[2]}.${match[3] ?? "0"}`;
}

function normalizeVersion(version: string): [number, number, number] {
  const parts = version.trim().replace(/^v/i, "").split(".");
  return [0, 1, 2].map((index) => {
    const value = Number.parseInt(parts[index] ?? "0", 10);
    return Number.isFinite(value) ? value : 0;
  }) as [number, number, number];
}

export function compareComposeVersions(left: string, right: string): number {
  const leftParts = normalizeVersion(left);
  const rightParts = normalizeVersion(right);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }

  return 0;
}

export function deriveFieldMetadata(field: ComposeField): ComposeFieldMetadata {
  const compatibility = field.compatibility?.toLowerCase() ?? "";
  const deprecated = DEPRECATED_FIELD_IDS.has(field.id)
    || compatibility.includes("deprecated")
    || compatibility.includes("legacy");
  const extension = PLATFORM_CATEGORIES.has(field.category)
    || compatibility.includes("extension")
    || field.id.startsWith("top.x-");
  const valueKind = inferValueKind(field);

  return {
    valueKind,
    repeatable: valueKind === "list" || valueKind === "map" || valueKind === "preset",
    minimumComposeVersion: VERSION_OVERRIDES[field.id] ?? versionFromCompatibility(field.compatibility),
    deprecated,
    extension,
    source: extension ? "platform-extension" : "catalog",
  };
}

export function getFieldSupport(
  field: ComposeField,
  targetComposeVersion: string,
): FieldSupportResult {
  const metadata = deriveFieldMetadata(field);

  if (metadata.deprecated) {
    return {
      status: "deprecated",
      reason: "Das Feld ist veraltet oder wird nur aus Kompatibilitätsgründen angeboten.",
      metadata,
    };
  }

  if (metadata.extension) {
    return {
      status: "extension",
      reason: "Das Feld gehört zu einer Plattform-, Proxy- oder Tool-Erweiterung und nicht zum portablen Compose-Kern.",
      metadata,
    };
  }

  if (!metadata.minimumComposeVersion) {
    return {
      status: "unknown",
      reason: "Für dieses Feld ist noch keine verlässliche Mindestversion hinterlegt.",
      metadata,
    };
  }

  if (compareComposeVersions(targetComposeVersion, metadata.minimumComposeVersion) < 0) {
    return {
      status: "unsupported",
      reason: `Benötigt Docker Compose ${metadata.minimumComposeVersion} oder neuer.`,
      metadata,
    };
  }

  return {
    status: "supported",
    reason: `Für Docker Compose ${targetComposeVersion} freigegeben.`,
    metadata,
  };
}

export function summarizeFieldSupport(
  fields: ComposeField[],
  targetComposeVersion: string,
): Record<FieldSupportStatus, number> {
  return fields.reduce<Record<FieldSupportStatus, number>>((counts, field) => {
    counts[getFieldSupport(field, targetComposeVersion).status] += 1;
    return counts;
  }, {
    supported: 0,
    unsupported: 0,
    deprecated: 0,
    extension: 0,
    unknown: 0,
  });
}
