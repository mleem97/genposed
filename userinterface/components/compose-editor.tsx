"use client";

import { Badge, Button, Input, NativeSelect } from "@meyermedia/ui/primitives";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { parseDocument } from "yaml";

import {
  categoryLabels,
  composeFields,
  fieldCountByCategory,
  type ComposeField,
  type FieldCategory,
} from "@/lib/catalog";
import { initialCompose } from "@/lib/sample-compose";
import { YamlEditor } from "@/components/yaml-editor";

const STORAGE_KEY = "genposed.compose.v1";
const ALL_CATEGORIES = Object.keys(categoryLabels) as FieldCategory[];

type DiagnosticTone = "error" | "warning" | "info";

interface Diagnostic {
  tone: DiagnosticTone;
  title: string;
  detail: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function setFieldValue(source: string, selectedService: string, field: ComposeField): string {
  const document = parseDocument(source);
  if (document.errors.length > 0) {
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

function analyzeCompose(source: string): { services: string[]; diagnostics: Diagnostic[] } {
  const document = parseDocument(source);
  const diagnostics: Diagnostic[] = [];

  for (const error of document.errors) {
    diagnostics.push({ tone: "error", title: "YAML-Fehler", detail: error.message });
  }

  for (const warning of document.warnings) {
    diagnostics.push({ tone: "warning", title: "YAML-Warnung", detail: warning.message });
  }

  if (document.errors.length > 0) {
    return { services: [], diagnostics };
  }

  const value = document.toJS() as Record<string, unknown> | null;
  const servicesValue = isRecord(value?.services) ? value.services : {};
  const services = Object.keys(servicesValue);

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

  return { services, diagnostics };
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
  const [notice, setNotice] = useState("Katalog bereit");
  const [isPending, startTransition] = useTransition();

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
    if (analysis.services.length > 0 && !analysis.services.includes(selectedService)) {
      setSelectedService(analysis.services[0]);
    }
  }, [analysis.services, selectedService]);

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

  function addSelectedField(field: ComposeField) {
    try {
      const nextValue = setFieldValue(yaml, selectedService, field);
      startTransition(() => {
        setYaml(nextValue);
        setSelectedField(field);
        setNotice(`${field.title} wurde auf ${field.target === "top-level" ? "Projektebene" : selectedService} angewendet.`);
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Feld konnte nicht eingefügt werden.");
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

        <section className="editor-panel" aria-label="Compose YAML Editor">
          <div className="editor-toolbar">
            <div className="document-tab">
              <span className="file-indicator" />
              <span>compose.yaml</span>
              <span className="dirty-indicator" title="Automatisch lokal gespeichert">autosave</span>
            </div>
            <div className="editor-toolbar-actions">
              <button type="button" onClick={resetYaml}>Beispiel zurücksetzen</button>
              <button type="button" onClick={() => setYaml("")}>Leeren</button>
            </div>
          </div>
          <div className="editor-canvas">
            <YamlEditor value={yaml} onChange={setYaml} />
          </div>
          <div className="editor-statusbar">
            <span>YAML · UTF-8 · Spaces: 2</span>
            <span>{isPending ? "Aktualisiere …" : notice}</span>
          </div>
        </section>

        <aside className="inspector-panel" aria-label="Feldinspektor">
          <div className="panel-header inspector-heading">
            <div>
              <span className="panel-kicker">Inspector</span>
              <h2>{selectedField.title}</h2>
            </div>
            <Badge>{categoryLabels[selectedField.category]}</Badge>
          </div>

          <div className="inspector-section">
            <label htmlFor="service-select">Zielservice</label>
            <NativeSelect
              id="service-select"
              value={selectedService}
              onChange={(event) => setSelectedService(event.target.value)}
              disabled={analysis.services.length === 0}
            >
              {analysis.services.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </NativeSelect>
            <p>Top-Level-Felder ignorieren diese Auswahl.</p>
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
            <Button type="button" onClick={() => addSelectedField(selectedField)} disabled={analysis.services.length === 0 && selectedField.target !== "top-level"}>
              Feld anwenden
            </Button>
            <p>Bestehende Werte am Zielpfad werden ersetzt; Label-Maps werden zusammengeführt.</p>
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
