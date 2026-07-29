import { parseDocument } from "yaml";

import { isRecord } from "@/lib/compose-document";

export type PolicySeverity =
  | "blocker"
  | "security"
  | "reliability"
  | "performance"
  | "maintenance"
  | "info";

export interface ComposePolicyResult {
  ruleId: string;
  severity: PolicySeverity;
  path: string;
  serviceName?: string;
  message: string;
  explanation: string;
  canAutoFix: boolean;
  fixLabel?: string;
}

export interface ComposePolicyReport {
  parseErrors: string[];
  results: ComposePolicyResult[];
}

const DATABASE_PORTS = new Set([3306, 5432, 6379, 9200, 11211, 27017]);
const SECRET_KEY_PATTERN = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|credential)/i;
const DANGEROUS_CAPABILITIES = new Set(["ALL", "SYS_ADMIN", "SYS_MODULE", "SYS_PTRACE", "DAC_READ_SEARCH"]);
const SEVERITY_ORDER: PolicySeverity[] = [
  "blocker",
  "security",
  "reliability",
  "performance",
  "maintenance",
  "info",
];

function addResult(
  results: ComposePolicyResult[],
  result: ComposePolicyResult,
): void {
  results.push(result);
}

function composeServices(document: ReturnType<typeof parseDocument>): Record<string, unknown> {
  const value = document.toJS() as Record<string, unknown> | null;
  return isRecord(value?.services) ? value.services : {};
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return [value];
  return [];
}

function volumeSource(entry: unknown): string | undefined {
  if (typeof entry === "string") {
    const separatorIndex = entry.indexOf(":");
    if (separatorIndex < 0) return undefined;
    return entry.slice(0, separatorIndex);
  }

  if (isRecord(entry) && typeof entry.source === "string") return entry.source;
  return undefined;
}

function volumeTarget(entry: unknown): string | undefined {
  if (typeof entry === "string") {
    const parts = entry.split(":");
    return parts.length >= 2 ? parts[1] : undefined;
  }

  if (isRecord(entry) && typeof entry.target === "string") return entry.target;
  return undefined;
}

function publishedPort(entry: unknown): { published?: number; target?: number } {
  if (typeof entry === "number") return { target: entry };

  if (typeof entry === "string") {
    const withoutProtocol = entry.split("/")[0];
    const parts = withoutProtocol.split(":");
    const target = Number.parseInt(parts.at(-1) ?? "", 10);
    const published = parts.length >= 2
      ? Number.parseInt(parts.at(-2) ?? "", 10)
      : undefined;
    return {
      target: Number.isFinite(target) ? target : undefined,
      published: published !== undefined && Number.isFinite(published) ? published : undefined,
    };
  }

  if (isRecord(entry)) {
    const target = typeof entry.target === "number"
      ? entry.target
      : Number.parseInt(String(entry.target ?? ""), 10);
    const published = typeof entry.published === "number"
      ? entry.published
      : Number.parseInt(String(entry.published ?? ""), 10);
    return {
      target: Number.isFinite(target) ? target : undefined,
      published: Number.isFinite(published) ? published : undefined,
    };
  }

  return {};
}

function hasResourceLimits(service: Record<string, unknown>): boolean {
  const deploy = isRecord(service.deploy) ? service.deploy : undefined;
  const resources = isRecord(deploy?.resources) ? deploy.resources : undefined;
  const limits = isRecord(resources?.limits) ? resources.limits : undefined;
  return Boolean(limits && (limits.cpus !== undefined || limits.memory !== undefined || limits.pids !== undefined));
}

function hasLogRotation(service: Record<string, unknown>): boolean {
  const logging = isRecord(service.logging) ? service.logging : undefined;
  const options = isRecord(logging?.options) ? logging.options : undefined;
  if (!logging) return false;
  if (logging.driver === "none" || logging.driver === "journald" || logging.driver === "syslog") return true;
  return Boolean(options && (options["max-size"] !== undefined || options["max-file"] !== undefined));
}

function imageIsMutable(image: string): boolean {
  if (image.includes("@sha256:")) return false;
  const lastSlash = image.lastIndexOf("/");
  const lastColon = image.lastIndexOf(":");
  if (lastColon <= lastSlash) return true;
  return image.slice(lastColon + 1).toLowerCase() === "latest";
}

function environmentEntries(value: unknown): Array<[string, unknown]> {
  if (isRecord(value)) return Object.entries(value);
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry !== "string") return [];
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex < 0) return [[entry, undefined] as [string, unknown]];
    return [[entry.slice(0, separatorIndex), entry.slice(separatorIndex + 1)] as [string, unknown]];
  });
}

export function analyzeComposePolicies(source: string): ComposePolicyReport {
  const document = parseDocument(source, {
    prettyErrors: true,
    uniqueKeys: true,
  });
  const parseErrors = document.errors.map((error) => error.message);
  if (parseErrors.length > 0) return { parseErrors, results: [] };

  const results: ComposePolicyResult[] = [];

  for (const [serviceName, rawService] of Object.entries(composeServices(document))) {
    if (!isRecord(rawService)) continue;
    const servicePath = `services.${serviceName}`;

    if (rawService.privileged === true) {
      addResult(results, {
        ruleId: "security.no-privileged",
        severity: "blocker",
        path: `${servicePath}.privileged`,
        serviceName,
        message: `${serviceName} runs as privileged`,
        explanation: "Privileged containers receive broad host capabilities and should require an explicit administrative exception.",
        canAutoFix: false,
      });
    }

    for (const namespaceField of ["network_mode", "pid", "ipc"] as const) {
      if (rawService[namespaceField] !== "host") continue;
      addResult(results, {
        ruleId: `security.no-host-${namespaceField}`,
        severity: "blocker",
        path: `${servicePath}.${namespaceField}`,
        serviceName,
        message: `${serviceName} uses the host ${namespaceField.replace("_", " ")}`,
        explanation: "Host namespace sharing weakens isolation and can expose host services or process state.",
        canAutoFix: false,
      });
    }

    const capabilities = stringArray(rawService.cap_add).map((capability) => capability.toUpperCase());
    const dangerousCapabilities = capabilities.filter((capability) => DANGEROUS_CAPABILITIES.has(capability));
    if (dangerousCapabilities.length > 0) {
      addResult(results, {
        ruleId: "security.restrict-capabilities",
        severity: "blocker",
        path: `${servicePath}.cap_add`,
        serviceName,
        message: `${serviceName} adds dangerous Linux capabilities`,
        explanation: `Review and remove: ${dangerousCapabilities.join(", ")}.`,
        canAutoFix: false,
      });
    }

    const volumes = Array.isArray(rawService.volumes) ? rawService.volumes : [];
    volumes.forEach((entry, index) => {
      const sourcePath = volumeSource(entry);
      const targetPath = volumeTarget(entry);
      const normalizedSource = sourcePath?.replaceAll("\\", "/");
      const normalizedTarget = targetPath?.replaceAll("\\", "/");

      if (
        normalizedSource?.endsWith("/docker.sock")
        || normalizedTarget?.endsWith("/docker.sock")
      ) {
        addResult(results, {
          ruleId: "security.no-docker-socket",
          severity: "blocker",
          path: `${servicePath}.volumes.${index}`,
          serviceName,
          message: `${serviceName} mounts a Docker socket`,
          explanation: "Docker socket access commonly provides effective root-level control over the host.",
          canAutoFix: false,
        });
      }

      if (
        normalizedSource === "/proc"
        || normalizedSource?.startsWith("/proc/")
        || normalizedSource === "/sys"
        || normalizedSource?.startsWith("/sys/")
        || normalizedSource === "/dev"
        || normalizedSource?.startsWith("/dev/")
      ) {
        addResult(results, {
          ruleId: "security.restrict-host-mounts",
          severity: "blocker",
          path: `${servicePath}.volumes.${index}`,
          serviceName,
          message: `${serviceName} mounts a sensitive host path`,
          explanation: `Review host mount ${sourcePath}. Sensitive kernel and device paths should not be exposed by default.`,
          canAutoFix: false,
        });
      }
    });

    const build = isRecord(rawService.build) ? rawService.build : undefined;
    if (build?.privileged === true) {
      addResult(results, {
        ruleId: "security.no-privileged-build",
        severity: "blocker",
        path: `${servicePath}.build.privileged`,
        serviceName,
        message: `${serviceName} enables privileged builds`,
        explanation: "Privileged build execution requires a dedicated trusted builder and explicit policy approval.",
        canAutoFix: false,
      });
    }

    const entitlements = stringArray(build?.entitlements);
    const unsafeEntitlements = entitlements.filter((entry) => ["network.host", "security.insecure", "device"].some((unsafe) => entry.startsWith(unsafe)));
    if (unsafeEntitlements.length > 0 || build?.network === "host") {
      addResult(results, {
        ruleId: "security.restrict-build-entitlements",
        severity: "security",
        path: `${servicePath}.build`,
        serviceName,
        message: `${serviceName} requests elevated build access`,
        explanation: "Host networking, insecure security modes, and device entitlements must be restricted to trusted builders.",
        canAutoFix: false,
      });
    }

    if (typeof rawService.user === "string" && ["0", "0:0", "root", "root:root"].includes(rawService.user.toLowerCase())) {
      addResult(results, {
        ruleId: "security.non-root-user",
        severity: "security",
        path: `${servicePath}.user`,
        serviceName,
        message: `${serviceName} explicitly runs as root`,
        explanation: "Use an application-specific UID and GID when the image supports non-root execution.",
        canAutoFix: false,
      });
    }

    for (const [key] of environmentEntries(rawService.environment)) {
      if (!SECRET_KEY_PATTERN.test(key)) continue;
      addResult(results, {
        ruleId: "security.secrets-not-environment",
        severity: "security",
        path: `${servicePath}.environment.${key}`,
        serviceName,
        message: `${serviceName} exposes a likely secret through environment variables`,
        explanation: "Prefer Compose secrets or an external secret manager for sensitive values.",
        canAutoFix: false,
      });
    }

    if (!rawService.healthcheck || (isRecord(rawService.healthcheck) && rawService.healthcheck.disable === true)) {
      addResult(results, {
        ruleId: "reliability.healthcheck",
        severity: "reliability",
        path: `${servicePath}.healthcheck`,
        serviceName,
        message: `${serviceName} has no active health check`,
        explanation: "Readiness and rollout decisions require an application-specific health signal.",
        canAutoFix: false,
      });
    }

    if (!rawService.restart && !isRecord(rawService.deploy)) {
      addResult(results, {
        ruleId: "reliability.restart-policy",
        severity: "reliability",
        path: `${servicePath}.restart`,
        serviceName,
        message: `${serviceName} has no restart policy`,
        explanation: "A restart policy improves recovery after process or host restarts for long-running services.",
        canAutoFix: true,
        fixLabel: "Set restart: unless-stopped",
      });
    }

    if (rawService.init !== true) {
      addResult(results, {
        ruleId: "reliability.init-process",
        severity: "maintenance",
        path: `${servicePath}.init`,
        serviceName,
        message: `${serviceName} does not enable a small init process`,
        explanation: "An init process improves signal forwarding and reaps orphaned child processes.",
        canAutoFix: true,
        fixLabel: "Enable init",
      });
    }

    if (!hasResourceLimits(rawService)) {
      addResult(results, {
        ruleId: "performance.resource-limits",
        severity: "performance",
        path: `${servicePath}.deploy.resources.limits`,
        serviceName,
        message: `${serviceName} has no CPU or memory limits`,
        explanation: "Define limits based on measured workload requirements to reduce noisy-neighbor and runaway-process risk.",
        canAutoFix: false,
      });
    }

    if (!hasLogRotation(rawService)) {
      addResult(results, {
        ruleId: "maintenance.log-rotation",
        severity: "maintenance",
        path: `${servicePath}.logging`,
        serviceName,
        message: `${serviceName} has no explicit log rotation`,
        explanation: "Unbounded local container logs can exhaust host storage.",
        canAutoFix: true,
        fixLabel: "Add local log rotation",
      });
    }

    if (typeof rawService.image === "string" && imageIsMutable(rawService.image)) {
      addResult(results, {
        ruleId: "maintenance.immutable-image",
        severity: "maintenance",
        path: `${servicePath}.image`,
        serviceName,
        message: `${serviceName} uses a mutable image reference`,
        explanation: "Pin an explicit version or immutable digest to make deployments reproducible.",
        canAutoFix: false,
      });
    }

    const ports = Array.isArray(rawService.ports) ? rawService.ports : [];
    ports.forEach((entry, index) => {
      const port = publishedPort(entry);
      if (!port.published || !port.target || !DATABASE_PORTS.has(port.target)) return;
      addResult(results, {
        ruleId: "security.database-port-exposure",
        severity: "security",
        path: `${servicePath}.ports.${index}`,
        serviceName,
        message: `${serviceName} publishes a common database or cache port`,
        explanation: `Port ${port.target} should normally remain on an internal Compose network unless external access is explicitly required.`,
        canAutoFix: false,
      });
    });
  }

  results.sort((left, right) => {
    const severityDifference = SEVERITY_ORDER.indexOf(left.severity) - SEVERITY_ORDER.indexOf(right.severity);
    return severityDifference || left.path.localeCompare(right.path);
  });

  return { parseErrors, results };
}

export function applyComposePolicyFix(
  source: string,
  result: ComposePolicyResult,
): string {
  if (!result.canAutoFix || !result.serviceName) {
    throw new Error("Für diese Regel ist kein sicherer Autofix verfügbar.");
  }

  const document = parseDocument(source, {
    prettyErrors: true,
    uniqueKeys: true,
  });
  if (document.errors.length > 0) {
    throw new Error("Das YAML muss zuerst syntaktisch gültig sein.");
  }

  const servicePath = ["services", result.serviceName];

  switch (result.ruleId) {
    case "reliability.restart-policy":
      document.setIn([...servicePath, "restart"], "unless-stopped");
      break;
    case "reliability.init-process":
      document.setIn([...servicePath, "init"], true);
      break;
    case "maintenance.log-rotation":
      document.setIn([...servicePath, "logging", "driver"], "json-file");
      document.setIn([...servicePath, "logging", "options", "max-size"], "10m");
      document.setIn([...servicePath, "logging", "options", "max-file"], "3");
      break;
    default:
      throw new Error("Der Autofix ist nicht implementiert.");
  }

  return document.toString({ lineWidth: 0 });
}

export function summarizePolicyResults(
  results: ComposePolicyResult[],
): Record<PolicySeverity, number> {
  return results.reduce<Record<PolicySeverity, number>>((counts, result) => {
    counts[result.severity] += 1;
    return counts;
  }, {
    blocker: 0,
    security: 0,
    reliability: 0,
    performance: 0,
    maintenance: 0,
    info: 0,
  });
}
