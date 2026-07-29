import { parseDocument } from "yaml";

import type { ComposeField } from "@/lib/catalog";

export type ComposeScalar = string | number | boolean | null;
export type ComposeValue = ComposeScalar | ComposeValue[] | { [key: string]: ComposeValue };

type ParsedDocument = ReturnType<typeof parseDocument>;

type CloneableYamlNode = {
  clone(): unknown;
};

export interface ComposeDocumentAnalysis {
  document: ParsedDocument;
  services: string[];
  errors: string[];
  warnings: string[];
}

export interface ServiceReference {
  sourceService: string;
  path: string;
  kind:
    | "depends_on"
    | "service_namespace"
    | "link"
    | "volumes_from"
    | "build_context"
    | "extends";
  value: string;
  autoFixable: boolean;
}

export const SERVICE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

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

function requireValidDocument(source: string): ComposeDocumentAnalysis {
  const analysis = analyzeComposeDocument(source);
  if (analysis.errors.length > 0) {
    throw new Error("Das YAML muss zuerst syntaktisch gültig sein.");
  }

  return analysis;
}

function getComposeRoot(document: ParsedDocument): Record<string, unknown> {
  const root = document.toJS() as Record<string, unknown> | null;
  return isRecord(root) ? root : {};
}

function getServices(document: ParsedDocument): Record<string, unknown> {
  const root = getComposeRoot(document);
  return isRecord(root.services) ? root.services : {};
}

function normalizeServiceName(name: string): string {
  return name.trim();
}

function assertServiceName(name: string): string {
  const normalized = normalizeServiceName(name);

  if (!normalized) {
    throw new Error("Der Servicename darf nicht leer sein.");
  }

  if (!SERVICE_NAME_PATTERN.test(normalized)) {
    throw new Error("Servicenamen dürfen nur Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche enthalten.");
  }

  return normalized;
}

function assertServiceExists(document: ParsedDocument, serviceName: string): void {
  if (!(serviceName in getServices(document))) {
    throw new Error(`Der Service ${serviceName} existiert nicht.`);
  }
}

function assertServiceAvailable(document: ParsedDocument, serviceName: string): void {
  if (serviceName in getServices(document)) {
    throw new Error(`Der Service ${serviceName} existiert bereits.`);
  }
}

function ensureServicesCollection(document: ParsedDocument): void {
  const root = getComposeRoot(document);
  if (!isRecord(root.services)) {
    document.set("services", {});
  }
}

function serializeDocument(document: ParsedDocument): string {
  return document.toString({ lineWidth: 0 });
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
  const { document } = requireValidDocument(source);

  document.setIn(getFieldPath(selectedService, field), value);
  return serializeDocument(document);
}

export function applyFieldSample(source: string, selectedService: string, field: ComposeField): string {
  const { document } = requireValidDocument(source);
  const servicePath = ["services", selectedService];

  if (field.target === "top-level") {
    document.setIn(field.path, field.sample);
    return serializeDocument(document);
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

    return serializeDocument(document);
  }

  if (field.path.length === 0 && isRecord(field.sample)) {
    for (const [key, value] of Object.entries(field.sample)) {
      document.setIn([...servicePath, key], value);
    }
  } else {
    document.setIn([...servicePath, ...field.path], field.sample);
  }

  return serializeDocument(document);
}

export function removeFieldValue(source: string, selectedService: string, field: ComposeField): string {
  const { document } = requireValidDocument(source);
  const servicePath = ["services", selectedService];

  if ((field.target === "service-labels" || field.target === "deploy-labels") && isRecord(field.sample)) {
    const labelsPath = field.target === "service-labels"
      ? [...servicePath, "labels"]
      : [...servicePath, "deploy", "labels"];

    for (const key of Object.keys(field.sample)) {
      document.deleteIn([...labelsPath, key]);
    }

    return serializeDocument(document);
  }

  if (field.target === "service" && field.path.length === 0 && isRecord(field.sample)) {
    for (const key of Object.keys(field.sample)) {
      document.deleteIn([...servicePath, key]);
    }

    return serializeDocument(document);
  }

  document.deleteIn(getFieldPath(selectedService, field));
  return serializeDocument(document);
}

function collectServiceReferences(document: ParsedDocument, targetService: string): ServiceReference[] {
  const references: ServiceReference[] = [];
  const services = getServices(document);

  function addReference(
    sourceService: string,
    path: string,
    kind: ServiceReference["kind"],
    value: string,
  ) {
    references.push({ sourceService, path, kind, value, autoFixable: true });
  }

  for (const [sourceService, rawService] of Object.entries(services)) {
    if (!isRecord(rawService)) continue;

    const dependsOn = rawService.depends_on;
    if (Array.isArray(dependsOn)) {
      dependsOn.forEach((dependency, index) => {
        if (dependency === targetService) {
          addReference(sourceService, `services.${sourceService}.depends_on.${index}`, "depends_on", targetService);
        }
      });
    } else if (isRecord(dependsOn) && targetService in dependsOn) {
      addReference(
        sourceService,
        `services.${sourceService}.depends_on.${targetService}`,
        "depends_on",
        targetService,
      );
    }

    for (const field of ["network_mode", "ipc", "pid"] as const) {
      if (rawService[field] === `service:${targetService}`) {
        addReference(
          sourceService,
          `services.${sourceService}.${field}`,
          "service_namespace",
          `service:${targetService}`,
        );
      }
    }

    for (const field of ["links", "volumes_from"] as const) {
      const entries = rawService[field];
      if (!Array.isArray(entries)) continue;

      entries.forEach((entry, index) => {
        if (typeof entry !== "string") return;
        const [serviceName] = entry.split(":");
        if (serviceName !== targetService) return;

        addReference(
          sourceService,
          `services.${sourceService}.${field}.${index}`,
          field === "links" ? "link" : "volumes_from",
          entry,
        );
      });
    }

    const build = isRecord(rawService.build) ? rawService.build : undefined;
    const additionalContexts = build?.additional_contexts;
    if (isRecord(additionalContexts)) {
      for (const [contextName, contextValue] of Object.entries(additionalContexts)) {
        if (contextValue === `service:${targetService}`) {
          addReference(
            sourceService,
            `services.${sourceService}.build.additional_contexts.${contextName}`,
            "build_context",
            String(contextValue),
          );
        }
      }
    } else if (Array.isArray(additionalContexts)) {
      additionalContexts.forEach((context, index) => {
        if (typeof context !== "string") return;
        const separator = context.indexOf("=");
        const contextValue = separator >= 0 ? context.slice(separator + 1) : context;
        if (contextValue !== `service:${targetService}`) return;

        addReference(
          sourceService,
          `services.${sourceService}.build.additional_contexts.${index}`,
          "build_context",
          context,
        );
      });
    }

    const extension = isRecord(rawService.extends) ? rawService.extends : undefined;
    if (extension && !extension.file && extension.service === targetService) {
      addReference(
        sourceService,
        `services.${sourceService}.extends.service`,
        "extends",
        targetService,
      );
    }
  }

  return references;
}

export function findServiceReferences(source: string, targetService: string): ServiceReference[] {
  const { document } = requireValidDocument(source);
  return collectServiceReferences(document, targetService);
}

function rewriteListReference(
  value: string,
  targetService: string,
  replacementService: string | null,
): string | null {
  const [serviceName, ...suffix] = value.split(":");
  if (serviceName !== targetService) return value;
  if (replacementService === null) return null;
  return [replacementService, ...suffix].join(":");
}

function rewriteServiceReferences(
  document: ParsedDocument,
  targetService: string,
  replacementService: string | null,
): void {
  const services = getServices(document);

  for (const [sourceService, rawService] of Object.entries(services)) {
    if (!isRecord(rawService)) continue;

    const sourcePath = ["services", sourceService];
    const dependsOn = rawService.depends_on;

    if (Array.isArray(dependsOn)) {
      const nextDependencies = dependsOn.flatMap((dependency) => {
        if (dependency !== targetService) return [dependency];
        return replacementService === null ? [] : [replacementService];
      });
      if (nextDependencies.length !== dependsOn.length || nextDependencies.some((item, index) => item !== dependsOn[index])) {
        document.setIn([...sourcePath, "depends_on"], nextDependencies);
      }
    } else if (isRecord(dependsOn) && targetService in dependsOn) {
      const nextDependencies = { ...dependsOn };
      const dependencyValue = nextDependencies[targetService];
      delete nextDependencies[targetService];

      if (replacementService !== null && !(replacementService in nextDependencies)) {
        nextDependencies[replacementService] = dependencyValue;
      }

      if (Object.keys(nextDependencies).length === 0) {
        document.deleteIn([...sourcePath, "depends_on"]);
      } else {
        document.setIn([...sourcePath, "depends_on"], nextDependencies);
      }
    }

    for (const field of ["network_mode", "ipc", "pid"] as const) {
      if (rawService[field] !== `service:${targetService}`) continue;

      if (replacementService === null) {
        document.deleteIn([...sourcePath, field]);
      } else {
        document.setIn([...sourcePath, field], `service:${replacementService}`);
      }
    }

    for (const field of ["links", "volumes_from"] as const) {
      const entries = rawService[field];
      if (!Array.isArray(entries)) continue;

      const nextEntries = entries.flatMap((entry) => {
        if (typeof entry !== "string") return [entry];
        const nextEntry = rewriteListReference(entry, targetService, replacementService);
        return nextEntry === null ? [] : [nextEntry];
      });

      if (nextEntries.length !== entries.length || nextEntries.some((item, index) => item !== entries[index])) {
        if (nextEntries.length === 0) {
          document.deleteIn([...sourcePath, field]);
        } else {
          document.setIn([...sourcePath, field], nextEntries);
        }
      }
    }

    const build = isRecord(rawService.build) ? rawService.build : undefined;
    const additionalContexts = build?.additional_contexts;
    if (isRecord(additionalContexts)) {
      const nextContexts = { ...additionalContexts };
      let changed = false;

      for (const [contextName, contextValue] of Object.entries(additionalContexts)) {
        if (contextValue !== `service:${targetService}`) continue;
        changed = true;
        if (replacementService === null) {
          delete nextContexts[contextName];
        } else {
          nextContexts[contextName] = `service:${replacementService}`;
        }
      }

      if (changed) {
        if (Object.keys(nextContexts).length === 0) {
          document.deleteIn([...sourcePath, "build", "additional_contexts"]);
        } else {
          document.setIn([...sourcePath, "build", "additional_contexts"], nextContexts);
        }
      }
    } else if (Array.isArray(additionalContexts)) {
      const nextContexts = additionalContexts.flatMap((context) => {
        if (typeof context !== "string") return [context];
        const separator = context.indexOf("=");
        const prefix = separator >= 0 ? context.slice(0, separator + 1) : "";
        const contextValue = separator >= 0 ? context.slice(separator + 1) : context;
        if (contextValue !== `service:${targetService}`) return [context];
        return replacementService === null ? [] : [`${prefix}service:${replacementService}`];
      });

      if (nextContexts.length !== additionalContexts.length || nextContexts.some((item, index) => item !== additionalContexts[index])) {
        if (nextContexts.length === 0) {
          document.deleteIn([...sourcePath, "build", "additional_contexts"]);
        } else {
          document.setIn([...sourcePath, "build", "additional_contexts"], nextContexts);
        }
      }
    }

    const extension = isRecord(rawService.extends) ? rawService.extends : undefined;
    if (extension && !extension.file && extension.service === targetService) {
      if (replacementService === null) {
        document.deleteIn([...sourcePath, "extends"]);
      } else {
        document.setIn([...sourcePath, "extends", "service"], replacementService);
      }
    }
  }
}

export function createService(source: string, requestedName: string): { yaml: string; serviceName: string } {
  const { document } = requireValidDocument(source);
  const serviceName = assertServiceName(requestedName);

  ensureServicesCollection(document);
  assertServiceAvailable(document, serviceName);
  document.setIn(["services", serviceName], {});

  return { yaml: serializeDocument(document), serviceName };
}

export function cloneService(
  source: string,
  sourceService: string,
  requestedName: string,
): { yaml: string; serviceName: string } {
  const { document } = requireValidDocument(source);
  const serviceName = assertServiceName(requestedName);

  assertServiceExists(document, sourceService);
  assertServiceAvailable(document, serviceName);

  const sourceNode = document.getIn(["services", sourceService], true) as CloneableYamlNode | undefined;
  if (!sourceNode) {
    throw new Error(`Der Service ${sourceService} konnte nicht gelesen werden.`);
  }

  document.setIn(["services", serviceName], sourceNode.clone());
  return { yaml: serializeDocument(document), serviceName };
}

export function renameService(
  source: string,
  currentName: string,
  requestedName: string,
): { yaml: string; serviceName: string; updatedReferences: number } {
  const { document } = requireValidDocument(source);
  const serviceName = assertServiceName(requestedName);

  assertServiceExists(document, currentName);
  if (serviceName === currentName) {
    return { yaml: source, serviceName, updatedReferences: 0 };
  }
  assertServiceAvailable(document, serviceName);

  const references = collectServiceReferences(document, currentName);
  const sourceNode = document.getIn(["services", currentName], true) as CloneableYamlNode | undefined;
  if (!sourceNode) {
    throw new Error(`Der Service ${currentName} konnte nicht gelesen werden.`);
  }

  document.setIn(["services", serviceName], sourceNode.clone());
  document.deleteIn(["services", currentName]);
  rewriteServiceReferences(document, currentName, serviceName);

  return {
    yaml: serializeDocument(document),
    serviceName,
    updatedReferences: references.length,
  };
}

export function deleteService(
  source: string,
  serviceName: string,
  cleanupReferences = false,
): { yaml: string; removedReferences: number } {
  const { document } = requireValidDocument(source);
  assertServiceExists(document, serviceName);

  const references = collectServiceReferences(document, serviceName);
  if (references.length > 0 && !cleanupReferences) {
    throw new Error(
      `${serviceName} wird noch ${references.length}-mal referenziert. Lösche den Service mit Referenzbereinigung oder passe die Abhängigkeiten zuerst an.`,
    );
  }

  if (cleanupReferences) {
    rewriteServiceReferences(document, serviceName, null);
  }

  document.deleteIn(["services", serviceName]);

  return {
    yaml: serializeDocument(document),
    removedReferences: cleanupReferences ? references.length : 0,
  };
}

export function uniqueServiceName(services: string[], requestedBase: string): string {
  const base = assertServiceName(requestedBase);
  if (!services.includes(base)) return base;

  let suffix = 2;
  while (services.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
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
