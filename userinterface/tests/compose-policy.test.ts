import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  analyzeComposePolicies,
  applyComposePolicyFix,
  summarizePolicyResults,
  type ComposePolicyResult,
} from "../lib/compose-policy";

const risky = `services:
  app:
    image: example/app:latest
    privileged: true
    network_mode: host
    pid: host
    ipc: host
    cap_add: [all, SYS_ADMIN]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /proc:/host/proc
      - /sys/kernel:/host/sys
      - /dev:/host/dev
      - { source: C:\\host\\docker.sock, target: /run/docker.sock }
    build:
      privileged: true
      entitlements: [network.host, security.insecure, device]
      network: host
    user: ROOT
    environment:
      API_TOKEN: exposed
      NORMAL: ok
    healthcheck:
      disable: true
    ports:
      - 15432:5432
      - 6379
      - 8080:80
      - 5432
      - { target: 27017, published: 27017 }
      - { target: '9200', published: '9200' }
      - invalid
  worker:
    image: example/worker@sha256:deadbeef
    deploy:
      resources:
        limits:
          memory: 1g
    logging:
      driver: journald
    healthcheck: { test: [CMD, true] }
    restart: unless-stopped
    init: true
    cap_add: false
    volumes: [/data]
    ports: [5432]
  untagged:
    image: registry.example:5000/app
    volumes: ["/docker.sock", /dev/null]
  broken: false
`;

function result(ruleId: string, overrides: Partial<ComposePolicyResult> = {}): ComposePolicyResult {
  return {
    ruleId,
    severity: "reliability",
    path: "services.app",
    serviceName: "app",
    message: "test result",
    explanation: "test explanation",
    canAutoFix: true,
    ...overrides,
  };
}

describe("Compose policy analysis", () => {
  it("returns parse failures without policy findings", () => {
    const report = analyzeComposePolicies("services: [");
    expect(report.parseErrors.length).toBeGreaterThan(0);
    expect(report.results).toEqual([]);
    expect(analyzeComposePolicies("services: {}\n")).toEqual({ parseErrors: [], results: [] });
  });

  it("detects risky host access and operational issues", () => {
    const report = analyzeComposePolicies(risky);
    const ids = report.results.map((item) => item.ruleId);
    for (const id of [
      "security.no-privileged", "security.no-host-network_mode", "security.no-host-pid", "security.no-host-ipc",
      "security.restrict-capabilities", "security.no-docker-socket", "security.restrict-host-mounts",
      "security.no-privileged-build", "security.restrict-build-entitlements", "security.non-root-user",
      "security.secrets-not-environment", "security.database-port-exposure", "reliability.healthcheck",
      "reliability.restart-policy", "reliability.init-process", "performance.resource-limits",
      "maintenance.log-rotation", "maintenance.immutable-image",
    ]) expect(ids).toContain(id);
    expect(report.results).toEqual([...report.results].sort((a, b) =>
      ["blocker", "security", "reliability", "performance", "maintenance", "info"].indexOf(a.severity)
        - ["blocker", "security", "reliability", "performance", "maintenance", "info"].indexOf(b.severity)
      || a.path.localeCompare(b.path),
    ));
    expect(report.results.find((item) => item.ruleId === "security.secrets-not-environment")?.path).toContain("API_TOKEN");
  });

  it("supports no-service and mixed environment and port representations", () => {
    expect(analyzeComposePolicies("value: scalar").results).toEqual([]);
    const report = analyzeComposePolicies(`services:
  app:
    environment: [PASSWORD, API_KEY=value, false]
    ports: ["host:bad", "8080:9200/udp", { target: 9200, published: "9200" }, { target: "invalid", published: "bad" }, { target: 5432 }, { published: 5432 }, null]
    volumes: ["/var/run/docker.sock:/var/run/docker.sock", "/dev:/host/dev", { target: /dev/null }, null]
    build: { entitlements: device, network: host }
`);
    expect(report.results.filter((item) => item.ruleId === "security.secrets-not-environment")).toHaveLength(2);
    expect(report.results.filter((item) => item.ruleId === "security.database-port-exposure")).toHaveLength(2);
    expect(report.results.some((item) => item.ruleId === "security.no-docker-socket")).toBe(true);
    expect(report.results.some((item) => item.ruleId === "security.restrict-host-mounts")).toBe(true);
    expect(report.results.some((item) => item.ruleId === "security.restrict-build-entitlements")).toBe(true);
  });

  it("accepts resource limits and log policies through supported forms", () => {
    const source = `services:
  no-limits:
    image: pinned:v1
    logging: { driver: custom }
  cpu:
    deploy: { resources: { limits: { cpus: '1' } } }
    logging: { driver: none }
  memory:
    deploy: { resources: { limits: { memory: 1g } } }
    logging: { driver: syslog }
  pids:
    deploy: { resources: { limits: { pids: 100 } } }
    logging: { options: { max-size: 10m } }
  max-file:
    deploy: { resources: { limits: { memory: 1g } } }
    logging: { options: { max-file: '4' } }
`;
    const results = analyzeComposePolicies(source).results;
    expect(results.filter((item) => item.ruleId === "performance.resource-limits").map((item) => item.serviceName)).toEqual(["no-limits"]);
    expect(results.filter((item) => item.ruleId === "maintenance.log-rotation").map((item) => item.serviceName)).toEqual(["no-limits"]);
    expect(results.some((item) => item.ruleId === "maintenance.immutable-image" && item.serviceName === "no-limits")).toBe(false);
  });

  it("applies each supported safe fix and rejects invalid fixes", () => {
    const source = "services:\n  app: {}\n";
    expect(parse(applyComposePolicyFix(source, result("reliability.restart-policy")))).toMatchObject({ services: { app: { restart: "unless-stopped" } } });
    expect(parse(applyComposePolicyFix(source, result("reliability.init-process")))).toMatchObject({ services: { app: { init: true } } });
    expect(parse(applyComposePolicyFix(source, result("maintenance.log-rotation")))).toMatchObject({ services: { app: { logging: { driver: "json-file", options: { "max-size": "10m", "max-file": "3" } } } } });
    expect(() => applyComposePolicyFix(source, result("security.no-privileged", { canAutoFix: false }))).toThrow("Für diese Regel ist kein sicherer Autofix verfügbar.");
    expect(() => applyComposePolicyFix(source, result("reliability.unknown"))).toThrow("Der Autofix ist nicht implementiert.");
    expect(() => applyComposePolicyFix("services: [", result("reliability.init-process"))).toThrow("Das YAML muss zuerst syntaktisch gültig sein.");
  });

  it("summarizes severities including empty input", () => {
    const report = analyzeComposePolicies(risky);
    const summary = summarizePolicyResults(report.results);
    expect(summary.blocker).toBeGreaterThan(0);
    expect(summary.security).toBeGreaterThan(0);
    expect(summary.reliability).toBeGreaterThan(0);
    expect(summary.performance).toBeGreaterThan(0);
    expect(summary.maintenance).toBeGreaterThan(0);
    expect(summary.info).toBe(0);
    expect(summarizePolicyResults([])).toEqual({ blocker: 0, security: 0, reliability: 0, performance: 0, maintenance: 0, info: 0 });
  });
});
