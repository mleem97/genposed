"use client";

import { useEffect, useMemo, useState } from "react";

import { ACTIVE_COMPOSE_CONTENT_KEY } from "@/lib/compose-file-workspace";
import {
  analyzeComposePolicies,
  applyComposePolicyFix,
  summarizePolicyResults,
  type ComposePolicyResult,
  type PolicySeverity,
} from "@/lib/compose-policy";

const SEVERITY_LABELS: Record<PolicySeverity, string> = {
  blocker: "Blockers",
  security: "Security",
  reliability: "Reliability",
  performance: "Performance",
  maintenance: "Maintenance",
  info: "Information",
};

const SEVERITIES: PolicySeverity[] = [
  "blocker",
  "security",
  "reliability",
  "performance",
  "maintenance",
  "info",
];

function activeComposeContent(): string {
  return window.localStorage.getItem(ACTIVE_COMPOSE_CONTENT_KEY) ?? "";
}

export function ComposePolicyPanel() {
  const [source, setSource] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [activeSeverity, setActiveSeverity] = useState<PolicySeverity>("blocker");
  const [notice, setNotice] = useState("Policy report ready");

  useEffect(() => {
    setSource(activeComposeContent());

    const interval = window.setInterval(() => {
      const currentSource = activeComposeContent();
      setSource((previous) => previous === currentSource ? previous : currentSource);
    }, 750);

    return () => window.clearInterval(interval);
  }, []);

  const report = useMemo(() => analyzeComposePolicies(source), [source]);
  const summary = useMemo(() => summarizePolicyResults(report.results), [report.results]);
  const activeResults = useMemo(
    () => report.results.filter((result) => result.severity === activeSeverity),
    [activeSeverity, report.results],
  );
  const fixableCount = report.results.filter((result) => result.canAutoFix).length;

  function applyFix(result: ComposePolicyResult) {
    try {
      const nextSource = applyComposePolicyFix(source, result);
      window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, nextSource);
      setSource(nextSource);
      setNotice(`${result.ruleId} fixed; reloading editor`);
      window.location.reload();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Autofix failed");
    }
  }

  function refreshReport() {
    setSource(activeComposeContent());
    setNotice("Policy report refreshed");
  }

  return (
    <aside className={expanded ? "policy-panel expanded" : "policy-panel"} aria-label="Compose-Policies">
      <button
        type="button"
        className="policy-panel-toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span>Compose policies</span>
        <strong>{summary.blocker + summary.security} security findings</strong>
      </button>

      {expanded ? (
        <div className="policy-panel-content">
          <div className="policy-panel-heading">
            <div>
              <span>Best practices & security</span>
              <h2>Policy Report</h2>
            </div>
            <button type="button" onClick={() => setExpanded(false)} aria-label="Panel schließen">×</button>
          </div>

          <div className="policy-panel-summary">
            <div>
              <strong>{report.results.length}</strong>
              <span>findings</span>
            </div>
            <div>
              <strong>{fixableCount}</strong>
              <span>safe autofixes</span>
            </div>
            <button type="button" onClick={refreshReport}>Refresh</button>
          </div>

          {report.parseErrors.length > 0 ? (
            <div className="policy-parse-error">
              <strong>YAML parsing failed</strong>
              <p>{report.parseErrors[0]}</p>
            </div>
          ) : (
            <>
              <div className="policy-severity-tabs">
                {SEVERITIES.map((severity) => (
                  <button
                    type="button"
                    key={severity}
                    className={activeSeverity === severity ? `policy-severity ${severity} active` : `policy-severity ${severity}`}
                    onClick={() => setActiveSeverity(severity)}
                  >
                    <strong>{summary[severity]}</strong>
                    <span>{SEVERITY_LABELS[severity]}</span>
                  </button>
                ))}
              </div>

              <div className="policy-result-list">
                {activeResults.map((result) => (
                  <article key={`${result.ruleId}-${result.path}`} className={`policy-result ${result.severity}`}>
                    <div className="policy-result-heading">
                      <div>
                        <strong>{result.message}</strong>
                        <code>{result.path}</code>
                      </div>
                      <span>{result.ruleId}</span>
                    </div>
                    <p>{result.explanation}</p>
                    {result.canAutoFix ? (
                      <button type="button" onClick={() => applyFix(result)}>
                        {result.fixLabel ?? "Apply autofix"}
                      </button>
                    ) : null}
                  </article>
                ))}

                {activeResults.length === 0 ? (
                  <div className="policy-result-empty">No findings with this severity.</div>
                ) : null}
              </div>
            </>
          )}

          <p className="policy-panel-notice">{notice}</p>
        </div>
      ) : null}
    </aside>
  );
}
