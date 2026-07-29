"use client";

import { useState } from "react";

import {
  SERVICE_NAME_PATTERN,
  type ServiceReference,
  uniqueServiceName,
} from "@/lib/compose-document";

type ServiceAction = "create" | "rename" | "clone";

interface ServiceManagerProps {
  services: string[];
  selectedService: string;
  references: ServiceReference[];
  disabled?: boolean;
  onSelect: (serviceName: string) => void;
  onCreate: (serviceName: string) => boolean;
  onRename: (serviceName: string) => boolean;
  onClone: (serviceName: string) => boolean;
  onDelete: (cleanupReferences: boolean) => boolean;
}

function actionLabel(action: ServiceAction): string {
  if (action === "create") return "Service anlegen";
  if (action === "rename") return "Service umbenennen";
  return "Service klonen";
}

export function ServiceManager({
  services,
  selectedService,
  references,
  disabled = false,
  onSelect,
  onCreate,
  onRename,
  onClone,
  onDelete,
}: ServiceManagerProps) {
  const [action, setAction] = useState<ServiceAction | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const normalizedDraft = draftName.trim();
  const isDraftValid = SERVICE_NAME_PATTERN.test(normalizedDraft);
  const serviceExists = services.includes(normalizedDraft);
  const canSubmit = !disabled && isDraftValid && (
    action === "rename"
      ? normalizedDraft === selectedService || !serviceExists
      : !serviceExists
  );

  function beginAction(nextAction: ServiceAction) {
    if (disabled) return;

    setConfirmDelete(false);
    setAction(nextAction);

    if (nextAction === "create") {
      setDraftName(uniqueServiceName(services, "service"));
      return;
    }

    if (nextAction === "clone") {
      setDraftName(uniqueServiceName(services, `${selectedService || "service"}-copy`));
      return;
    }

    setDraftName(selectedService);
  }

  function submitAction() {
    if (!action || !canSubmit) return;

    const succeeded = action === "create"
      ? onCreate(normalizedDraft)
      : action === "rename"
        ? onRename(normalizedDraft)
        : onClone(normalizedDraft);

    if (succeeded) {
      setAction(null);
      setDraftName("");
    }
  }

  function selectService(serviceName: string) {
    onSelect(serviceName);
    setAction(null);
    setDraftName("");
    setConfirmDelete(false);
  }

  function deleteSelectedService() {
    if (disabled) return;

    const succeeded = onDelete(references.length > 0);
    if (succeeded) setConfirmDelete(false);
  }

  return (
    <section className="service-manager" aria-label="Service-Verwaltung">
      <div className="service-manager-heading">
        <div>
          <span className="panel-kicker">Compose project</span>
          <h3>Services</h3>
        </div>
        <span>{services.length}</span>
      </div>

      {disabled ? (
        <p className="service-manager-disabled">Service-Aktionen sind gesperrt, bis die YAML-Syntax korrigiert wurde.</p>
      ) : null}

      <label className="service-selector" htmlFor="managed-service-select">
        <span>Aktiver Service</span>
        <select
          id="managed-service-select"
          value={selectedService}
          onChange={(event) => selectService(event.target.value)}
          disabled={disabled || services.length === 0}
        >
          {services.length === 0 ? <option value="">Keine Services</option> : null}
          {services.map((service) => (
            <option key={service} value={service}>{service}</option>
          ))}
        </select>
      </label>

      <div className="service-actions">
        <button type="button" onClick={() => beginAction("create")} disabled={disabled}>Neu</button>
        <button type="button" onClick={() => beginAction("rename")} disabled={disabled || !selectedService}>Umbenennen</button>
        <button type="button" onClick={() => beginAction("clone")} disabled={disabled || !selectedService}>Klonen</button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            setAction(null);
            setConfirmDelete(true);
          }}
          disabled={disabled || !selectedService}
        >
          Löschen
        </button>
      </div>

      {action ? (
        <div className="service-action-form">
          <label htmlFor="service-name-input">
            <span>{actionLabel(action)}</span>
            <input
              id="service-name-input"
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitAction();
                if (event.key === "Escape") setAction(null);
              }}
              disabled={disabled}
              autoFocus
            />
          </label>

          {!isDraftValid ? (
            <p className="service-form-error">Erlaubt sind Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche.</p>
          ) : serviceExists && !(action === "rename" && normalizedDraft === selectedService) ? (
            <p className="service-form-error">Dieser Servicename existiert bereits.</p>
          ) : null}

          <div className="service-form-actions">
            <button type="button" onClick={() => setAction(null)}>Abbrechen</button>
            <button type="button" className="primary" onClick={submitAction} disabled={!canSubmit}>
              {actionLabel(action)}
            </button>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="service-delete-confirmation">
          <strong>{selectedService} wirklich löschen?</strong>
          <p>
            {references.length > 0
              ? `${references.length} Referenzen werden zusammen mit dem Service bereinigt.`
              : "Der Service wird aus dem Compose-Dokument entfernt."}
          </p>

          {references.length > 0 ? (
            <div className="service-reference-list">
              {references.slice(0, 5).map((reference) => (
                <code key={`${reference.path}-${reference.value}`}>{reference.path}</code>
              ))}
              {references.length > 5 ? <span>+ {references.length - 5} weitere</span> : null}
            </div>
          ) : null}

          <div className="service-form-actions">
            <button type="button" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
            <button type="button" className="danger" onClick={deleteSelectedService} disabled={disabled}>
              {references.length > 0 ? "Löschen und bereinigen" : "Service löschen"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
