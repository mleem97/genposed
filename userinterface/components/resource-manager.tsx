"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";

import { SERVICE_NAME_PATTERN } from "@/lib/compose-document";
import {
  TOP_LEVEL_RESOURCE_KINDS,
  TOP_LEVEL_RESOURCE_LABELS,
  type TopLevelResourceKind,
  type TopLevelResourceReference,
  uniqueTopLevelResourceName,
} from "@/lib/top-level-resources";

type ResourceAction = "create" | "rename" | "clone";

interface ResourceManagerProps {
  resources: Record<TopLevelResourceKind, string[]>;
  activeKind: TopLevelResourceKind;
  selectedName: string;
  references: TopLevelResourceReference[];
  disabled?: boolean;
  onSelect: (kind: TopLevelResourceKind, resourceName: string) => void;
  onCreate: (kind: TopLevelResourceKind, resourceName: string) => boolean;
  onRename: (resourceName: string) => boolean;
  onClone: (resourceName: string) => boolean;
  onDelete: (cleanupReferences: boolean) => boolean;
  onEdit: () => void;
}

const RESOURCE_BASE_NAMES: Record<TopLevelResourceKind, string> = {
  networks: "network",
  volumes: "volume",
  configs: "config",
  secrets: "secret",
};

function actionLabel(action: ResourceAction): string {
  if (action === "create") return "Ressource anlegen";
  if (action === "rename") return "Ressource umbenennen";
  return "Ressource klonen";
}

export function ResourceManager({
  resources,
  activeKind,
  selectedName,
  references,
  disabled = false,
  onSelect,
  onCreate,
  onRename,
  onClone,
  onDelete,
  onEdit,
}: ResourceManagerProps) {
  const [action, setAction] = useState<ResourceAction | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const resourceNames = resources[activeKind];
  const normalizedDraft = draftName.trim();
  const isDraftValid = SERVICE_NAME_PATTERN.test(normalizedDraft);
  const resourceExists = resourceNames.includes(normalizedDraft);
  const canSubmit = !disabled && isDraftValid && (
    action === "rename"
      ? normalizedDraft === selectedName || !resourceExists
      : !resourceExists
  );

  function changeKind(event: ChangeEvent<HTMLSelectElement>) {
    const kind = event.target.value as TopLevelResourceKind;
    onSelect(kind, resources[kind][0] ?? "");
    setAction(null);
    setConfirmDelete(false);
  }

  function changeResource(event: ChangeEvent<HTMLSelectElement>) {
    onSelect(activeKind, event.target.value);
    setAction(null);
    setConfirmDelete(false);
  }

  function beginAction(nextAction: ResourceAction) {
    if (disabled) return;

    setConfirmDelete(false);
    setAction(nextAction);

    if (nextAction === "create") {
      setDraftName(uniqueTopLevelResourceName(resourceNames, RESOURCE_BASE_NAMES[activeKind]));
      return;
    }

    if (nextAction === "clone") {
      setDraftName(uniqueTopLevelResourceName(resourceNames, `${selectedName || RESOURCE_BASE_NAMES[activeKind]}-copy`));
      return;
    }

    setDraftName(selectedName);
  }

  function submitAction() {
    if (!action || !canSubmit) return;

    const succeeded = action === "create"
      ? onCreate(activeKind, normalizedDraft)
      : action === "rename"
        ? onRename(normalizedDraft)
        : onClone(normalizedDraft);

    if (succeeded) {
      setAction(null);
      setDraftName("");
    }
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") submitAction();
    if (event.key === "Escape") setAction(null);
  }

  function deleteSelectedResource() {
    if (disabled) return;
    const succeeded = onDelete(references.length > 0);
    if (succeeded) setConfirmDelete(false);
  }

  return (
    <section className="resource-manager" aria-label="Top-Level-Ressourcen">
      <div className="resource-manager-heading">
        <div>
          <span className="panel-kicker">Project resources</span>
          <h3>Ressourcen</h3>
        </div>
        <span>{resourceNames.length}</span>
      </div>

      <div className="resource-selectors">
        <label htmlFor="resource-kind-select">
          <span>Typ</span>
          <select
            id="resource-kind-select"
            value={activeKind}
            onChange={changeKind}
            disabled={disabled}
          >
            {TOP_LEVEL_RESOURCE_KINDS.map((kind) => (
              <option key={kind} value={kind}>{TOP_LEVEL_RESOURCE_LABELS[kind]}</option>
            ))}
          </select>
        </label>

        <label htmlFor="resource-name-select">
          <span>Ressource</span>
          <select
            id="resource-name-select"
            value={selectedName}
            onChange={changeResource}
            disabled={disabled || resourceNames.length === 0}
          >
            {resourceNames.length === 0 ? <option value="">Keine Ressourcen</option> : null}
            {resourceNames.map((resourceName) => (
              <option key={resourceName} value={resourceName}>{resourceName}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="resource-actions">
        <button type="button" onClick={() => beginAction("create")} disabled={disabled}>Neu</button>
        <button type="button" onClick={() => beginAction("rename")} disabled={disabled || !selectedName}>Umbenennen</button>
        <button type="button" onClick={() => beginAction("clone")} disabled={disabled || !selectedName}>Klonen</button>
        <button type="button" className="primary" onClick={onEdit} disabled={disabled || !selectedName}>Bearbeiten</button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            setAction(null);
            setConfirmDelete(true);
          }}
          disabled={disabled || !selectedName}
        >
          Löschen
        </button>
      </div>

      {action ? (
        <div className="resource-action-form">
          <label htmlFor="resource-name-input">
            <span>{actionLabel(action)}</span>
            <input
              id="resource-name-input"
              type="text"
              value={draftName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftName(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              disabled={disabled}
              autoFocus
            />
          </label>

          {!isDraftValid ? (
            <p className="resource-form-error">Erlaubt sind Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche.</p>
          ) : resourceExists && !(action === "rename" && normalizedDraft === selectedName) ? (
            <p className="resource-form-error">Dieser Ressourcenname existiert bereits.</p>
          ) : null}

          <div className="resource-form-actions">
            <button type="button" onClick={() => setAction(null)}>Abbrechen</button>
            <button type="button" className="primary" onClick={submitAction} disabled={!canSubmit}>
              {actionLabel(action)}
            </button>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="resource-delete-confirmation">
          <strong>{selectedName} wirklich löschen?</strong>
          <p>
            {references.length > 0
              ? `${references.length} Service-Referenzen werden zusammen mit der Ressource bereinigt.`
              : "Die Ressource wird aus dem Compose-Dokument entfernt."}
          </p>

          {references.length > 0 ? (
            <div className="resource-reference-list">
              {references.slice(0, 5).map((reference) => (
                <code key={`${reference.path}-${reference.value}`}>{reference.path}</code>
              ))}
              {references.length > 5 ? <span>+ {references.length - 5} weitere</span> : null}
            </div>
          ) : null}

          <div className="resource-form-actions">
            <button type="button" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
            <button type="button" className="danger" onClick={deleteSelectedResource} disabled={disabled}>
              {references.length > 0 ? "Löschen und bereinigen" : "Ressource löschen"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
