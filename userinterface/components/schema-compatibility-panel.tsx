"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { composeFields } from "@/lib/catalog";
import {
  getFieldSupport,
  summarizeFieldSupport,
  type FieldSupportStatus,
} from "@/lib/field-metadata";

const VERSION_STORAGE_KEY = "genposed.compose.target-version.v1";
const DEFAULT_COMPOSE_VERSION = "2.32.0";

const STATUS_LABELS: Record<FieldSupportStatus, string> = {
  supported: "Supported",
  unsupported: "Unsupported",
  deprecated: "Deprecated",
  extension: "Extensions",
  unknown: "Unclassified",
};

const REPORT_STATUSES: FieldSupportStatus[] = [
  "unsupported",
  "deprecated",
  "extension",
  "unknown",
  "supported",
];

export function SchemaCompatibilityPanel() {
  const [targetVersion, setTargetVersion] = useState(DEFAULT_COMPOSE_VERSION);
  const [activeStatus, setActiveStatus] = useState<FieldSupportStatus>("unsupported");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const storedVersion = window.localStorage.getItem(VERSION_STORAGE_KEY);
    if (storedVersion) setTargetVersion(storedVersion);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VERSION_STORAGE_KEY, targetVersion);
  }, [targetVersion]);

  const summary = useMemo(
    () => summarizeFieldSupport(composeFields, targetVersion),
    [targetVersion],
  );

  const report = useMemo(() => {
    return composeFields
      .map((field) => ({ field, support: getFieldSupport(field, targetVersion) }))
      .filter((entry) => entry.support.status === activeStatus)
      .sort((left, right) => left.field.id.localeCompare(right.field.id));
  }, [activeStatus, targetVersion]);

  function updateVersion(event: ChangeEvent<HTMLInputElement>) {
    setTargetVersion(event.target.value.trimStart());
  }

  return (
    <aside className={expanded ? "schema-panel expanded" : "schema-panel"} aria-label="Compose-Kompatibilität">
      <button
        type="button"
        className="schema-panel-toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span>Compose {targetVersion || "?"}</span>
        <strong>{summary.unsupported} inkompatibel</strong>
      </button>

      {expanded ? (
        <div className="schema-panel-content">
          <div className="schema-panel-heading">
            <div>
              <span>Schema & compatibility</span>
              <h2>Target Compose Version</h2>
            </div>
            <button type="button" onClick={() => setExpanded(false)} aria-label="Panel schließen">×</button>
          </div>

          <label className="schema-version-input" htmlFor="target-compose-version">
            <span>Docker Compose version</span>
            <input
              id="target-compose-version"
              type="text"
              inputMode="decimal"
              value={targetVersion}
              onChange={updateVersion}
              placeholder="2.32.0"
            />
            <small>Used for catalogue compatibility checks. It does not modify the Compose document.</small>
          </label>

          <div className="schema-status-grid">
            {REPORT_STATUSES.map((status) => (
              <button
                type="button"
                key={status}
                className={activeStatus === status ? `schema-status ${status} active` : `schema-status ${status}`}
                onClick={() => setActiveStatus(status)}
              >
                <strong>{summary[status]}</strong>
                <span>{STATUS_LABELS[status]}</span>
              </button>
            ))}
          </div>

          <div className="schema-report-heading">
            <strong>{STATUS_LABELS[activeStatus]}</strong>
            <span>{report.length} fields</span>
          </div>

          <div className="schema-report-list">
            {report.slice(0, 80).map(({ field, support }) => (
              <article key={field.id} className={`schema-report-item ${support.status}`}>
                <div>
                  <strong>{field.title}</strong>
                  <code>{field.id}</code>
                </div>
                <p>{support.reason}</p>
                <dl>
                  <div>
                    <dt>Type</dt>
                    <dd>{support.metadata.valueKind}</dd>
                  </div>
                  <div>
                    <dt>Repeatable</dt>
                    <dd>{support.metadata.repeatable ? "yes" : "no"}</dd>
                  </div>
                  <div>
                    <dt>Minimum</dt>
                    <dd>{support.metadata.minimumComposeVersion ?? "unknown"}</dd>
                  </div>
                </dl>
              </article>
            ))}

            {report.length === 0 ? (
              <div className="schema-report-empty">No fields in this category for the selected version.</div>
            ) : null}
          </div>

          <p className="schema-panel-note">
            Unknown fields are not assumed to be supported. Runtime validation against the connected Docker Compose binary remains authoritative.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
