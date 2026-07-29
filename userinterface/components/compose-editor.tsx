"use client";

import { Badge, Button, Input } from "@meyermedia/ui/primitives";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { ServiceManager } from "@/components/service-manager";
import { StructuredFieldEditor } from "@/components/structured-field-editor";
import { YamlEditor } from "@/components/yaml-editor";
import {
  categoryLabels,
  composeFields,
  fieldCountByCategory,
  type ComposeField,
  type FieldCategory,
} from "@/lib/catalog";
import {
  analyzeComposeDocument,
  applyFieldSample,
  cloneService,
  createService,
  deleteService,
  findServiceReferences,
  isRecord,
  readFieldValue,
  removeFieldValue,
  renameService,
  type ComposeValue,
  writeFieldValue,
} from "@/lib/compose-document";
import { initialCompose } from "@/lib/sample-compose";

const STORAGE_KEY = "genposed.compose.v1";
const ALL_CATEGORIES = Object.keys(categoryLabels) as FieldCategory[];
const DEFAULT_SERVICE_FIELD = composeFields.find((field) => field.id === "service.image") ?? composeFields[0];

type DiagnosticTone = "error" | "warning" | "info";
type EditorMode = "structured" | "yaml";

interface Diagnostic {
  tone: DiagnosticTone;
  title: string;
  detail: string;
}

interface ComposeAnalysis {
  services: string[];
  diagnostics: Diagnostic[];
  syntaxErrorCount: number;
}

function analyzeCompose(source: string): ComposeAnalysis {
  const parsed = analyzeComposeDocument(source);
  const diagnostics: Diagnostic[] = [];

  for (const error of parsed.errors) {
    diagnostics.push({ tone: "error", title: "YAML-Fehler", detail: error });
  }

  for (const warning of parsed.warnings) {
    diagnostics.push({ tone: "warning", title: "YAML-Warnung", detail: warning });
  }

  if (parsed.errors.length > 0) {
    return {
      services: [],
      diagnostics,
      syntaxErrorCount: parsed.errors.length,
    };
  }

  const value = parsed.document.toJS() as Record<string, unknown> | null;
  const servicesValue = isRecord(value?.services) ? value.services : {};
  const services = parsed.services;

  if (value && "version" in value) {
    diagnostics.push({
      tone: "warning",
      title: "Legacy-Feld version",
      detail: "Die aktuelle Compose Specification ignoriert version. Das Feld bleibt nur für Rückwärtskompatibilität erhalten.",
    });
  }

  for (const [serviceName, rawService] of Object.entries(servicesValue)) {
    if (!isRecord(rawService)) continue;

    const deploy = isRecord(rawService.deploy) ? rawService.deploy : undefined;
    if (rawService.container_name && typeof deploy?.replicas === "number" && deploy.replicas > 1) {
      diagnostics.push({
        tone: "error",
        title: `${serviceName}: Skalierungskonflikt`,
        detail: "container_name kann nicht sinnvoll mit mehreren Replikaten verwendet werden.",
      });
    }

    if (!("image" in rawService) && !("build" in rawService)) {
      diagnostics.push({
        tone: "warning",
        title: `${serviceName}: keine Image-Quelle`,
        detail: "Der Service benötigt normalerweise image oder build, bevor er ausgeführt werden kann.",
      });
    }

    const labels = isRecord(rawService.labels) ? rawService.labels : {};
    const hasTraefik = Object.keys(labels).some((key) => key.startsWith("traefik."));
    const hasCaddy = Object.keys(labels).some((key) => key === "caddy" || key.startsWith("caddy."));
    if (hasTraefik && hasCaddy) {
      diagnostics.push({
        tone: "info",
        title: `${serviceName}: zwei Proxy-Provider`,
        detail: "Traefik- und Caddy-Labels sind gleichzeitig vorhanden. Das ist als Katalog zulässig, in Produktion aber meist bewusst auszuwählen.",
      });
    }

    if (rawService.exclude_from_hc === true) {
      diagnostics.push({
        tone: "info",
        title: `${serviceName}: Coolify Healthcheck-Ausnahme`,
        detail: "exclude_from_hc ist eine Coolify-Erweiterung und kein portables Compose-Standardfeld.",
      });
    }
  }

  if (services.length === 0) {
    diagnostics.push({
      tone: "warning",
      title: "Keine Services",
      detail: "Ein Compose-Anwendungsmodell benötigt normalerweise mindestens einen Service.",
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      tone: "info",
      title: "Struktur plausibel",
      detail: "Das Dokument ist syntaktisch gültig. Eine vollständige Runtime-Prüfung erfolgt zusätzlich mit docker compose config.",
    });
  }

  return {
    services,
    diagnostics,
    syntaxErrorCount: 0,
  };
}

function downloadCompose(source: string) {
  const blob = new Blob([source], { type: "application/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "compose.yaml";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ComposeEditor() {
  const [yaml, setYaml] = useState(initialCompose);
  const [activeCategory, setActiveCategory] = useState<FieldCategory | "all">("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [selectedService, setSelectedService] = useState("web");
  const [selectedField, setSelectedField] = useState<ComposeField>(composeFields[0]);
  const [editorMode, setEditorMode] = useState<EditorMode>("structured");
  const [notice, setNotice] = useState("Katalog bereit");

  useEffect(() => {
    const persisted = window.localStorage.getItem(STORAGE_KEY);
    if (persisted) setYaml(persisted);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, yaml);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [yaml]);

  const analysis = useMemo(() => analyzeCompose(yaml), [yaml]);

  useEffect(() => {
    if (analysis.syntaxErrorCount > 0) return;

    if (analysis.services.length === 0 && selectedService) {
      setSelectedService("");
      return;
    }

    if (analysis.services.length > 0 && !analysis.services.includes(selectedService)) {
      setSelectedService(analysis.services[0]);
    }
  }, [analysis.services, analysis.syntaxErrorCount, selectedService]);

  const filteredFields = useMemo(() => {
    return composeFields.filter((item) => {
      const categoryMatch = activeCategory === "all" || item.category === activeCategory;
      if (!categoryMatch) return false;
      if (!deferredQuery) return true;

      const haystack = [
        item.title,
        item.description,
        item.group,
        item.id,
        item.compatibility ?? "",
        ...(item.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(deferredQuery);
    });
  }, [activeCategory, deferredQuery]);

  const errorCount = analysis.diagnostics.filter((item) => item.tone === "error").length;
  const warningCount = analysis.diagnostics.filter((item) => item.tone === "warning").length;
  const lineCount = yaml.split("\n").length;
  const hasSelectedService = Boolean(selectedService && analysis.services.includes(selectedService));
  const canEditSelectedField = selectedField.target === "top-level" || hasSelectedService;

  const selectedFieldValue = useMemo(() => {
    if (!canEditSelectedField || analysis.syntaxErrorCount > 0) return undefined;
    return readFieldValue(yaml, selectedService, selectedField);
  }, [analysis.syntaxErrorCount, canEditSelectedField, selectedField, selectedService, yaml]);

  const selectedServiceReferences = useMemo(() => {
    if (!hasSelectedService || analysis.syntaxErrorCount > 0) return [];
    return findServiceReferences(yaml, selectedService);
  }, [analysis.syntaxErrorCount, hasSelectedService, selectedService, yaml]);

  function commitYaml(nextValue: string, message: string) {
    setYaml(nextValue);
    setNotice(message);
  }

  function addSelectedField(field: ComposeField) {
    try {
      const nextValue = applyFieldSample(yaml, selectedService, field);
      setSelectedField(field);
      setEditorMode("structured");
      commitYaml(
        nextValue,
        `${field.title} wurde auf ${field.target === "top-level" ? "Projektebene" : selectedService} angewendet.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Feld konnte nicht eingefügt werden.");
    }
  }

  function updateSelectedField(value: ComposeValue) {
    try {
      const nextValue = writeFieldValue(yaml, selectedService, selectedField, value);
      commitYaml(nextValue, `${selectedField.title} wurde aktualisiert.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Feld konnte nicht aktualisiert werden.");
    }
  }

  function removeSelectedField() {
    try {
      const nextValue = removeFieldValue(yaml, selectedService, selectedField);
      commitYaml(nextValue, `${selectedField.title} wurde entfernt.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Feld konnte nicht entfernt werden.");
    }
  }

  function createComposeService(serviceName: string): boolean {
    try {
      const result = createService(yaml, serviceName);
      setSelectedService(result.serviceName);
      setSelectedField(DEFAULT_SERVICE_FIELD);
      setEditorMode("structured");
      commitYaml(result.yaml, `Service ${result.serviceName} wurde angelegt.`);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Service konnte nicht angelegt werden.");
      return false;
    }
  }

  function renameComposeService(serviceName: string): boolean {
    try {
      const previousName = selectedService;
      const result = renameService(yaml, previousName, serviceName);
      setSelectedService(result.serviceName);
      commitYaml(
        result.yaml,
        `${previousName} wurde in ${result.serviceName} umbenannt; ${result.updatedReferences} Referenzen wurden angepasst.`,
      );
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Service konnte nicht umbenannt werden.");
      return false;
    }
  }

  function cloneComposeService(serviceName: string): boolean {
    try {
      const sourceService = selectedService;
      const result = cloneService(yaml, sourceService, serviceName);
      setSelectedService(result.serviceName);
      setSelectedField(DEFAULT_SERVICE_FIELD);
      setEditorMode("structured");
      commitYaml(result.yaml, `${sourceService} wurde als ${result.serviceName} geklont.`);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Service konnte nicht geklont werden.");
      return false;
    }
  }

  function deleteComposeService(cleanupReferences: boolean): boolean {
    try {
      const deletedService = selectedService;
      const result = deleteService(yaml, deletedService, cleanupReferences);
      const nextServices = analyzeComposeDocument(result.yaml).services;
      setSelectedService(nextServices[0] ?? "");
      commitYaml(
        result.yaml,
        `${deletedService} wurde gelöscht; ${result.removedReferences} Referenzen wurden bereinigt.`,
      );
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Service konnte nicht gelöscht werden.");
      return false;
    }
  }

  async function copyYaml() {
    await navigator.clipboard.writeText(yaml);
    setNotice("Compose-YAML wurde kopiert.");
  }

  function resetYaml() {
    setYaml(initialCompose);
    setNotice("Kitchen-sink-Beispiel wurde wiederhergestellt.");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">G</div>
          <div>
            <h1>Genposed</h1>
            <p>Compose Configuration Workbench</p>
          </div>
        </div>

        <div className="topbar-metrics" aria-label="Dokumentstatus">
          <Badge>{analysis.services.length} Services</Badge>
          <Badge>{composeFields.length} Feldvorlagen</Badge>
          <Badge>{lineCount} Zeilen</Badge>
          <span className={errorCount > 0 ? "status-dot status-error" : warningCount > 0 ? "status-dot status-warning" : "status-dot status-ok"} />
          <span className="status-copy">
            {errorCount > 0 ? `${errorCount} Fehler` : warningCount > 0 ? `${warningCount} Hinweise` : "Valide"}
          </span>
        </div>

        <div className="topbar-actions">
          <Button type="button" onClick={copyYaml}>Kopieren</Button>
          <Button type="button" onClick={() => downloadCompose(yaml)}>Exportieren</Button>
        </div>
      </header>

      <section className="workspace">
        <aside className="palette-panel" aria-label="Feldkatalog">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Registry</span>
              <h2>Felder</h2>
            </div>
            <span className="panel-count">{filteredFields.length}</span>
          </div>

          <div className="search-wrap">
            <Input
              aria-label="Felder durchsuchen"
              placeholder="Feld, Label oder Framework …"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="category-strip" aria-label="Kategorien">
            <button
              type="button"
              className={activeCategory === "all" ? "category-button active" : "category-button"}
              onClick={() => setActiveCategory("all")}
            >
              Alle <span>{composeFields.length}</span>
            </button>
            {ALL_CATEGORIES.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? "category-button active" : "category-button"}
                onClick={() => setActiveCategory(category)}
              >
                {categoryLabels[category]} <span>{fieldCountByCategory[category]}</span>
              </button>
            ))}
          </div>

          <div className="field-list">
            {filteredFields.map((item) => (
              <button
                type="button"
                key={item.id}
                className={selectedField.id === item.id ? "field-row selected" : "field-row"}
                onClick={() => setSelectedField(item)}
                onDoubleClick={() => addSelectedField(item)}
              >
                <span className="field-row-topline">
                  <strong>{item.title}</strong>
                  <span className="field-add" aria-hidden="true">+</span>
                </span>
                <span>{item.group}</span>
                <code>{item.id}</code>
              </button>
            ))}
            {filteredFields.length === 0 ? (
              <div className="empty-result">Keine Felder für diese Suche.</div>
            ) : null}
          </div>
        </aside>

        <section className="editor-panel" aria-label="Compose Editor">
          <div className="editor-toolbar">
            <div className="document-tab">
              <span className="file-indicator" />
              <span>compose.yaml</span>
              <span className="dirty-indicator" title="Automatisch lokal gespeichert">autosave</span>
            </div>
            <div className="editor-toolbar-actions">
              <div className="editor-mode-switch" aria-label="Bearbeitungsmodus">
                <button
                  type="button"
                  className={editorMode === "structured" ? "active" : ""}
                  onClick={() => setEditorMode("structured")}
                >
                  Felder
                </button>
                <button
                  type="button"
                  className={editorMode === "yaml" ? "active" : ""}
                  onClick={() => setEditorMode("yaml")}
                >
                  YAML
                </button>
              </div>
              <button type="button" onClick={resetYaml}>Beispiel zurücksetzen</button>
              <button type="button" onClick={() => setYaml("")}>Leeren</button>
            </div>
          </div>

          <div className={editorMode === "yaml" ? "editor-canvas" : "editor-canvas structured-canvas"}>
            {editorMode === "yaml" ? (
              <YamlEditor value={yaml} onChange={setYaml} />
            ) : analysis.syntaxErrorCount > 0 ? (
              <div className="structured-field-empty">
                <div className="structured-empty-icon">!</div>
                <h3>Das YAML enthält Syntaxfehler</h3>
                <p>Behebe die gemeldeten Fehler im YAML-Modus. Danach steht die sichere Feldbearbeitung wieder zur Verfügung.</p>
                <Button type="button" onClick={() => setEditorMode("yaml")}>YAML öffnen</Button>
              </div>
            ) : !canEditSelectedField ? (
              <div className="structured-field-empty">
                <div className="structured-empty-icon">+</div>
                <h3>Kein Service verfügbar</h3>
                <p>Lege rechts einen Service an oder wähle ein Feld auf Projektebene.</p>
              </div>
            ) : (
              <StructuredFieldEditor
                fieldTitle={selectedField.title}
                value={selectedFieldValue}
                sample={selectedField.sample}
                onChange={updateSelectedField}
                onApplyExample={() => addSelectedField(selectedField)}
                onRemove={removeSelectedField}
              />
            )}
          </div>

          <div className="editor-statusbar">
            <span>{editorMode === "yaml" ? "YAML · UTF-8 · Spaces: 2" : "Strukturierter Compose-Feldeditor"}</span>
            <span>{notice}</span>
          </div>
        </section>

        <aside className="inspector-panel" aria-label="Compose-Inspektor">
          <ServiceManager
            services={analysis.services}
            selectedService={selectedService}
            references={selectedServiceReferences}
            disabled={analysis.syntaxErrorCount > 0}
            onSelect={setSelectedService}
            onCreate={createComposeService}
            onRename={renameComposeService}
            onClone={cloneComposeService}
            onDelete={deleteComposeService}
          />

          <div className="panel-header inspector-heading">
            <div>
              <span className="panel-kicker">Inspector</span>
              <h2>{selectedField.title}</h2>
            </div>
            <Badge>{categoryLabels[selectedField.category]}</Badge>
          </div>

          <div className="inspector-section field-description">
            <span className="meta-label">Pfad</span>
            <code>{selectedField.id}</code>
            <p>{selectedField.description}</p>
            {selectedField.compatibility ? (
              <div className="compatibility-note">Kompatibilität: {selectedField.compatibility}</div>
            ) : null}
          </div>

          <div className="inspector-section sample-section">
            <span className="meta-label">Beispielwert</span>
            <pre>{JSON.stringify(selectedField.sample, null, 2)}</pre>
          </div>

          <div className="inspector-action">
            <Button
              type="button"
              onClick={() => addSelectedField(selectedField)}
              disabled={analysis.services.length === 0 && selectedField.target !== "top-level"}
            >
              Beispiel anwenden
            </Button>
            <p>Öffne „Felder“, um vorhandene Werte zeilenweise und ohne manuelle YAML-Einrückung zu bearbeiten.</p>
          </div>

          <div className="diagnostics">
            <div className="diagnostics-heading">
              <h3>Diagnostik</h3>
              <span>{analysis.diagnostics.length}</span>
            </div>
            {analysis.diagnostics.slice(0, 8).map((item, index) => (
              <div className={`diagnostic diagnostic-${item.tone}`} key={`${item.title}-${index}`}>
                <span className="diagnostic-marker" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
