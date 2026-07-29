import { parseDocument } from "yaml";

import type { ComposeField } from "@/lib/catalog";

export type ComposeScalar = string | number | boolean | null;
export type ComposeValue = ComposeScalar | ComposeValue[] | { [key: string]: ComposeValue };

type ParsedDocument = ReturnType<typeof parseDocument>;

export interface ComposeDocumentAnalysis {
  document: ParsedDocument;
  services: string[];
  errors: string[];
  warnings: string[];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function analyzeComposeDocument(source: string): ComposeDocumentAnalysis {
  const document = parseDocument(source, {
    keepSourceTokens: true,
    prettyErrors: true,
    uniqueKeys: true,
  });

  const errors = document.errors.map((error) => error.message);
  const warnings = document.warnings.map((warning) => warning.message);

  if (errors.length > 0) {
    return { document, services: [], errors, warnings };
  }

  const value = document.toJS() as Record<string, unknown> | null;
  const servicesValue = isRecord(value?.services) ? value.services : {};

  return {
    document,
    services: Object.keys(servicesValue),
    errors,
    warnings,
  };
}

export function getFieldPath(selectedService: string, field: ComposeField): string[] {
  if (field.target === "top-level") return field.path;

  const servicePath = ["services", selectedService];

  if (field.target === "service-labels") return [...servicePath, "labels"];
  if (field.target === "deploy-labels") return [...servicePath, "deploy", "labels"];

  return [...servicePath, ...field.path];
}

export function readFieldValue(source: string, selectedService: string, field: ComposeField): ComposeValue | undefined {
  const { document, errors } = analyzeComposeDocument(source);
  if (errors.length > 0) return undefined;

  const node = document.getIn(getFieldPath(selectedService, field), true) as
    | { toJS(doc: ParsedDocument): unknown }
    | undefined;

  return node?.toJS(document) as ComposeValue | undefined;
}

export function writeFieldValue(
  source: string,
  selectedService: string,
  field: ComposeField,
  value: ComposeValue,
): string {
  const { document, errors } = analyzeComposeDocument(source);
  if (errors.length > 0) {
    throw new Error("Das YAML muss zuerst syntaktisch gültig sein.");
  }

  document.setIn(getFieldPath(selectedService, field), value);
  return document.toString({ lineWidth: 0 });
}

export function applyFieldSample(source: string, selectedService: string, field: ComposeField): string {
  const { document, errors } = analyzeComposeDocument(source);
  if (errors.length > 0) {
    throw new Error("Das YAML muss zuerst syntaktisch gültig sein.");
  }

  const servicePath = ["services", selectedService];

  if (field.target === "top-level") {
    document.setIn(field.path, field.sample);
    return document.toString({ lineWidth: 0 });
  }

  if (field.target === "service-labels" || field.target === "deploy-labels") {
    const labelsPath =
      field.target === "service-labels"
        ? [...servicePath, "labels"]
        : [...servicePath, "deploy", "labels"];

    if (!isRecord(field.sample)) {
      throw new Error("Das Feld enthält keine gültige Label-Map.");
    }

    for (const [key, value] of Object.entries(field.sample)) {
      document.setIn([...labelsPath, key], value);
    }

    return document.toString({ lineWidth: 0 });
  }

  if (field.path.length === 0 && isRecord(field.sample)) {
    for (const [key, value] of Object.entries(field.sample)) {
      document.setIn([...servicePath, key], value);
    }
  } else {
    document.setIn([...servicePath, ...field.path], field.sample);
  }

  return document.toString({ lineWidth: 0 });
}

export function removeFieldValue(source: string, selectedService: string, field: ComposeField): string {
  const { document, errors } = analyzeComposeDocument(source);
  if (errors.length > 0) {
    throw new Error("Das YAML muss zuerst syntaktisch gültig sein.");
  }

  const servicePath = ["services", selectedService];

  if ((field.target === "service-labels" || field.target === "deploy-labels") && isRecord(field.sample)) {
    const labelsPath = field.target === "service-labels"
      ? [...servicePath, "labels"]
      : [...servicePath, "deploy", "labels"];

    for (const key of Object.keys(field.sample)) {
      document.deleteIn([...labelsPath, key]);
    }

    return document.toString({ lineWidth: 0 });
  }

  if (field.target === "service" && field.path.length === 0 && isRecord(field.sample)) {
    for (const key of Object.keys(field.sample)) {
      document.deleteIn([...servicePath, key]);
    }

    return document.toString({ lineWidth: 0 });
  }

  document.deleteIn(getFieldPath(selectedService, field));
  return document.toString({ lineWidth: 0 });
}

export function asComposeValue(value: unknown): ComposeValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) return value.map(asComposeValue);

  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, asComposeValue(item)]));
  }

  return String(value);
}

export function cloneComposeValue(value: ComposeValue): ComposeValue {
  if (Array.isArray(value)) return value.map(cloneComposeValue);

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneComposeValue(item as ComposeValue)]),
    );
  }

  return value;
}

export function createBlankLike(template: ComposeValue | undefined): ComposeValue {
  if (template === undefined || template === null) return "";
  if (Array.isArray(template)) return [];

  if (isRecord(template)) {
    return Object.fromEntries(
      Object.entries(template).map(([key, item]) => [key, createBlankLike(item as ComposeValue)]),
    );
  }

  if (typeof template === "boolean") return false;
  if (typeof template === "number") return 0;
  return "";
}

export function uniqueMapKey(value: Record<string, ComposeValue>, base = "new_key"): string {
  if (!(base in value)) return base;

  let suffix = 2;
  while (`${base}_${suffix}` in value) suffix += 1;
  return `${base}_${suffix}`;
}
