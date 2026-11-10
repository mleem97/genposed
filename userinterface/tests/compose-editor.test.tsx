// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const forcedFailure = vi.hoisted(() => ({ operation: null as string | null }));
vi.mock("../lib/compose-document", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/compose-document")>();
  const wrap = <T extends (...args: never[]) => unknown>(name: string, original: T): T => ((...args: Parameters<T>) => {
    if (forcedFailure.operation === name) {
      forcedFailure.operation = null;
      throw new Error(`forced ${name} failure`);
    }
    return original(...args);
  }) as T;
  return {
    ...actual,
    applyFieldSample: wrap("applyFieldSample", actual.applyFieldSample),
    writeFieldValue: wrap("writeFieldValue", actual.writeFieldValue),
    removeFieldValue: wrap("removeFieldValue", actual.removeFieldValue),
    createService: wrap("createService", actual.createService),
    renameService: wrap("renameService", actual.renameService),
    cloneService: wrap("cloneService", actual.cloneService),
    deleteService: wrap("deleteService", actual.deleteService),
  };
});
vi.mock("../lib/top-level-resources", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/top-level-resources")>();
  const wrap = <T extends (...args: never[]) => unknown>(name: string, original: T): T => ((...args: Parameters<T>) => {
    if (forcedFailure.operation === name) {
      forcedFailure.operation = null;
      throw new Error(`forced ${name} failure`);
    }
    return original(...args);
  }) as T;
  return {
    ...actual,
    createTopLevelResource: wrap("createTopLevelResource", actual.createTopLevelResource),
    renameTopLevelResource: wrap("renameTopLevelResource", actual.renameTopLevelResource),
    cloneTopLevelResource: wrap("cloneTopLevelResource", actual.cloneTopLevelResource),
    deleteTopLevelResource: wrap("deleteTopLevelResource", actual.deleteTopLevelResource),
    writeTopLevelResource: wrap("writeTopLevelResource", actual.writeTopLevelResource),
  };
});

import { ComposeEditor } from "../components/compose-editor";

vi.mock("../components/yaml-editor", () => ({
  YamlEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="YAML source" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

afterEach(() => { cleanup(); window.localStorage.clear(); vi.restoreAllMocks(); forcedFailure.operation = null; });

describe("ComposeEditor", () => {
  it("searches and filters fields, applies samples, and edits YAML with diagnostics", async () => {
    const user = userEvent.setup();
    render(<ComposeEditor />);
    expect(screen.getByText("Genposed")).toBeInTheDocument();
    await user.click(within(screen.getByLabelText("Kategorien")).getByRole("button", { name: /Health/ }));
    const field = screen.getAllByRole("button", { name: /Healthcheck/ })[0];
    await user.click(field);
    await user.click(screen.getByRole("button", { name: "Beispiel anwenden" }));
    expect(screen.getByText("Healthcheck wurde auf web angewendet.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Beispiel wiederherstellen" }));
    expect(screen.getByText("Healthcheck wurde auf web angewendet.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Feld entfernen" }));
    expect(screen.getByText("Healthcheck wurde entfernt.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^YAML$/ }));
    const yaml = screen.getByLabelText("YAML source");
    fireEvent.change(yaml, { target: { value: "services: [" } });
    await user.click(screen.getByRole("button", { name: /^Felder$/ }));
    expect(screen.getByText("Das YAML enthält Syntaxfehler")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "YAML öffnen" }));
    await user.click(screen.getByRole("button", { name: "Beispiel zurücksetzen" }));
    expect(screen.getByText("Kitchen-sink-Beispiel wurde wiederhergestellt.")).toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem("genposed.compose.v1")).toContain("services:"));
  });

  it("creates, renames, clones and removes services from the workbench", async () => {
    const user = userEvent.setup();
    render(<ComposeEditor />);
    await user.click(within(screen.getByLabelText("Service-Verwaltung")).getByRole("button", { name: "Neu" }));
    await user.clear(screen.getByLabelText("Service anlegen"));
    await user.type(screen.getByLabelText("Service anlegen"), "api");
    await user.click(screen.getByRole("button", { name: "Service anlegen" }));
    expect(screen.getByText("Service api wurde angelegt.")).toBeInTheDocument();
    const serviceManager = within(screen.getByLabelText("Service-Verwaltung"));
    await user.click(serviceManager.getByRole("button", { name: "Klonen" }));
    await user.click(screen.getByRole("button", { name: "Service klonen" }));
    expect(screen.getByText(/wurde als api-copy geklont/)).toBeInTheDocument();
    await user.click(serviceManager.getByRole("button", { name: "Umbenennen" }));
    const rename = screen.getByLabelText("Service umbenennen");
    await user.clear(rename); await user.type(rename, "worker");
    await user.click(screen.getByRole("button", { name: "Service umbenennen" }));
    expect(screen.getByText(/wurde in worker umbenannt/)).toBeInTheDocument();
    await user.click(serviceManager.getByRole("button", { name: "Löschen" }));
    await user.click(serviceManager.getByRole("button", { name: "Service löschen" }));
    expect(screen.getByText(/wurde gelöscht/)).toBeInTheDocument();
  });

  it("creates and edits a top-level resource", async () => {
    const user = userEvent.setup();
    render(<ComposeEditor />);
    const resourceMode = screen.getByRole("button", { name: /^Ressource$/ });
    expect(resourceMode).toBeEnabled();
    await user.click(within(screen.getByLabelText("Top-Level-Ressourcen")).getByRole("button", { name: "Neu" }));
    await user.click(screen.getByRole("button", { name: "Ressource anlegen" }));
    expect(screen.getByText(/Networks-Ressource network wurde angelegt/)).toBeInTheDocument();
    expect(resourceMode).toBeEnabled();
    await user.click(resourceMode);
    expect(screen.getByText("Networks: network")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bearbeiten" }));
    await user.click(screen.getByRole("button", { name: "Vorlage wiederherstellen" }));
    expect(screen.getByText("network wurde aktualisiert.")).toBeInTheDocument();
    const resourceManager = within(screen.getByLabelText("Top-Level-Ressourcen"));
    await user.click(resourceManager.getByRole("button", { name: "Klonen" }));
    await user.click(resourceManager.getByRole("button", { name: "Ressource klonen" }));
    expect(screen.getByText("network wurde als network-copy geklont.")).toBeInTheDocument();
    await user.click(resourceManager.getByRole("button", { name: "Umbenennen" }));
    const rename = resourceManager.getByLabelText("Ressource umbenennen");
    await user.clear(rename); await user.type(rename, "primary");
    await user.click(resourceManager.getByRole("button", { name: "Ressource umbenennen" }));
    expect(screen.getByText(/network-copy wurde in primary umbenannt/)).toBeInTheDocument();
    await user.click(resourceManager.getByRole("button", { name: "Löschen" }));
    await user.click(resourceManager.getByRole("button", { name: "Ressource löschen" }));
    expect(screen.getByText(/primary wurde gelöscht/)).toBeInTheDocument();
  });

  it("copies and exports the active YAML", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<ComposeEditor />);
    await user.click(screen.getByRole("button", { name: "Kopieren" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("services:"));
    expect(screen.getByText("Compose-YAML wurde kopiert.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Exportieren" }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("reports independent document diagnostics for legacy, service, proxy, and resource issues", async () => {
    window.localStorage.setItem("genposed.compose.v1", [
      "version: '3.8'",
      "custom: !foo bar",
      "services:",
      "  broken:",
      "    image: nginx:1.27",
      "    container_name: fixed-name",
      "    deploy:",
      "      replicas: 2",
      "    labels:",
      "      traefik.enable: 'true'",
      "      caddy: ':80'",
      "    exclude_from_hc: true",
      "  no-image: {}",
      "  scalar: invalid",
      "configs:",
      "  missing-config: {}",
      "  scalar-config: invalid",
      "secrets:",
      "  missing-secret: {}",
    ].join("\n"));
    render(<ComposeEditor />);
    expect(await screen.findByText("Legacy-Feld version")).toBeInTheDocument();
    expect(screen.getByText("broken: Skalierungskonflikt")).toBeInTheDocument();
    expect(screen.getByText("no-image: keine Image-Quelle")).toBeInTheDocument();
    expect(screen.getByText("broken: zwei Proxy-Provider")).toBeInTheDocument();
    expect(screen.getByText("broken: Coolify Healthcheck-Ausnahme")).toBeInTheDocument();
    expect(screen.getByText("missing-config: keine Config-Quelle")).toBeInTheDocument();
    expect(screen.getByText("missing-secret: keine Secret-Quelle")).toBeInTheDocument();
    expect(screen.getByText("YAML-Warnung")).toBeInTheDocument();
  });

  it("reports a clean, plausible Compose document", async () => {
    window.localStorage.setItem("genposed.compose.v1", "services:\n  web:\n    image: nginx:1.27\n");
    render(<ComposeEditor />);
    expect(await screen.findByText("Struktur plausibel")).toBeInTheDocument();
  });

  it("returns from resource mode when switching to a kind with no definitions", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("genposed.compose.v1", "services:\n  web:\n    image: nginx:1.27\nnetworks:\n  frontend:\n    driver: bridge\n");
    render(<ComposeEditor />);
    await user.click(screen.getByRole("button", { name: /^Ressource$/ }));
    await user.selectOptions(screen.getByLabelText("Typ"), "configs");
    expect(screen.getByText("Strukturierter Compose-Feldeditor")).toBeInTheDocument();
  });

  it("returns to structured fields after deleting the final top-level resource", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("genposed.compose.v1", "services:\n  web:\n    image: nginx:1.27\nnetworks:\n  frontend:\n    driver: bridge\n");
    render(<ComposeEditor />);
    await waitFor(() => expect(screen.getByRole("button", { name: /^Ressource$/ })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /^Ressource$/ }));
    const manager = within(screen.getByLabelText("Top-Level-Ressourcen"));
    await user.click(manager.getByRole("button", { name: "Löschen" }));
    await user.click(manager.getByRole("button", { name: "Ressource löschen" }));
    expect(screen.getByText("Strukturierter Compose-Feldeditor")).toBeInTheDocument();
  });

  it("supports deleting the final service and leaves an empty service selection", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("genposed.compose.v1", "services:\n  web:\n    image: nginx:1.27\n");
    render(<ComposeEditor />);
    const manager = within(screen.getByLabelText("Service-Verwaltung"));
    await user.click(manager.getByRole("button", { name: "Löschen" }));
    await user.click(manager.getByRole("button", { name: "Service löschen" }));
    expect(screen.getByText("web wurde gelöscht; 0 Referenzen wurden bereinigt.")).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Keine Services" })).toBeInTheDocument();
  });

  it("handles an empty valid document and allows choosing a project-level field", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("genposed.compose.v1", "services: {}\n");
    render(<ComposeEditor />);
    expect(await screen.findByRole("option", { name: "Keine Services" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Command/ }));
    expect(screen.getByText("Kein Service verfügbar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Alle/ }));
    const projectField = screen.getByRole("button", { name: /Projektname/ });
    await user.click(projectField);
    expect(screen.getByText("Projektname ist noch nicht konfiguriert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Beispiel anwenden" }));
    expect(screen.getByText(/wurde auf Projektebene angewendet/)).toBeInTheDocument();
    const search = screen.getByLabelText("Felder durchsuchen");
    await user.type(search, "no matching field");
    expect(screen.getByText("Keine Felder für diese Suche.")).toBeInTheDocument();
    await user.clear(search);
    const legacyField = screen.getByRole("button", { name: /Legacy-Version/ });
    await user.click(legacyField);
    expect(screen.getByText(/Kompatibilität:/)).toBeInTheDocument();
    await user.dblClick(legacyField);
    expect(screen.getByText(/Legacy-Version wurde auf Projektebene angewendet/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Leeren" }));
    expect(await screen.findByRole("option", { name: "Keine Services" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Beispiel zurücksetzen" }));
    expect(screen.getByText("Kitchen-sink-Beispiel wurde wiederhergestellt.")).toBeInTheDocument();
  });

  it("surfaces domain-operation failures and keeps the editor interactive", async () => {
    const user = userEvent.setup();
    render(<ComposeEditor />);
    forcedFailure.operation = "applyFieldSample";
    await user.click(screen.getByRole("button", { name: "Beispiel anwenden" }));
    expect(screen.getByText("forced applyFieldSample failure")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pull Policy/ }));
    await user.click(screen.getByRole("button", { name: "Beispiel anwenden" }));
    forcedFailure.operation = "removeFieldValue";
    await user.click(screen.getByRole("button", { name: "Feld entfernen" }));
    expect(screen.getByText("forced removeFieldValue failure")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pull Policy/ }));
    await user.click(screen.getByRole("button", { name: "Beispiel anwenden" }));
    forcedFailure.operation = "writeFieldValue";
    fireEvent.change(screen.getByDisplayValue("missing"), { target: { value: "always" } });
    expect(screen.getByText("forced writeFieldValue failure")).toBeInTheDocument();

    const serviceManager = within(screen.getByLabelText("Service-Verwaltung"));
    forcedFailure.operation = "createService";
    await user.click(serviceManager.getByRole("button", { name: "Neu" }));
    const createInput = serviceManager.getByLabelText("Service anlegen");
    await user.clear(createInput); await user.type(createInput, "api");
    await user.click(serviceManager.getByRole("button", { name: "Service anlegen" }));
    expect(screen.getByText("forced createService failure")).toBeInTheDocument();
    await user.click(serviceManager.getByRole("button", { name: "Abbrechen" }));

    forcedFailure.operation = "cloneService";
    await user.click(serviceManager.getByRole("button", { name: "Klonen" }));
    await user.click(serviceManager.getByRole("button", { name: "Service klonen" }));
    expect(screen.getByText("forced cloneService failure")).toBeInTheDocument();
    await user.click(serviceManager.getByRole("button", { name: "Abbrechen" }));

    forcedFailure.operation = "renameService";
    await user.click(serviceManager.getByRole("button", { name: "Umbenennen" }));
    const renameInput = serviceManager.getByLabelText("Service umbenennen");
    await user.clear(renameInput); await user.type(renameInput, "api");
    await user.click(serviceManager.getByRole("button", { name: "Service umbenennen" }));
    expect(screen.getByText("forced renameService failure")).toBeInTheDocument();

    await user.click(serviceManager.getByRole("button", { name: "Löschen" }));
    forcedFailure.operation = "deleteService";
    await user.click(serviceManager.getByRole("button", { name: /Service löschen|Löschen und bereinigen/ }));
    expect(screen.getByText("forced deleteService failure")).toBeInTheDocument();

    const resourceManager = within(screen.getByLabelText("Top-Level-Ressourcen"));
    forcedFailure.operation = "createTopLevelResource";
    await user.click(resourceManager.getByRole("button", { name: "Neu" }));
    await user.click(resourceManager.getByRole("button", { name: "Ressource anlegen" }));
    expect(screen.getByText("forced createTopLevelResource failure")).toBeInTheDocument();
    await user.click(resourceManager.getByRole("button", { name: "Abbrechen" }));

    await user.click(resourceManager.getByRole("button", { name: "Neu" }));
    await user.click(resourceManager.getByRole("button", { name: "Ressource anlegen" }));
    forcedFailure.operation = "writeTopLevelResource";
    await user.click(screen.getByRole("button", { name: "Vorlage wiederherstellen" }));
    expect(screen.getByText("forced writeTopLevelResource failure")).toBeInTheDocument();

    forcedFailure.operation = "cloneTopLevelResource";
    await user.click(resourceManager.getByRole("button", { name: "Klonen" }));
    await user.click(resourceManager.getByRole("button", { name: "Ressource klonen" }));
    expect(screen.getByText("forced cloneTopLevelResource failure")).toBeInTheDocument();
    await user.click(resourceManager.getByRole("button", { name: "Abbrechen" }));

    forcedFailure.operation = "renameTopLevelResource";
    await user.click(resourceManager.getByRole("button", { name: "Umbenennen" }));
    const resourceRename = resourceManager.getByLabelText("Ressource umbenennen");
    await user.clear(resourceRename); await user.type(resourceRename, "primary");
    await user.click(resourceManager.getByRole("button", { name: "Ressource umbenennen" }));
    expect(screen.getByText("forced renameTopLevelResource failure")).toBeInTheDocument();

    await user.click(resourceManager.getByRole("button", { name: "Löschen" }));
    forcedFailure.operation = "deleteTopLevelResource";
    await user.click(resourceManager.getByRole("button", { name: /Ressource löschen|Löschen und bereinigen/ }));
    expect(screen.getByText("forced deleteTopLevelResource failure")).toBeInTheDocument();
  });
});
