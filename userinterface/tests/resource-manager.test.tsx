// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourceManager } from "../components/resource-manager";
import type { TopLevelResourceKind } from "../lib/top-level-resources";

afterEach(cleanup);

function renderManager(overrides: Partial<ComponentProps<typeof ResourceManager>> = {}) {
  const props: ComponentProps<typeof ResourceManager> = {
    resources: { networks: ["frontend", "backend"], volumes: ["data"], configs: [], secrets: [] },
    activeKind: "networks", selectedName: "frontend", references: [],
    onSelect: vi.fn(), onCreate: vi.fn(() => true), onRename: vi.fn(() => true),
    onClone: vi.fn(() => true), onDelete: vi.fn(() => true), onEdit: vi.fn(), ...overrides,
  };
  render(<ResourceManager {...props} />);
  return props;
}

describe("ResourceManager", () => {
  it("creates, validates, and retries after callback failure", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    renderManager({ onCreate });
    await user.click(screen.getByRole("button", { name: "Neu" }));
    const input = screen.getByLabelText("Ressource anlegen");
    expect(input).toHaveValue("network");
    await user.clear(input); await user.type(input, "bad name");
    expect(screen.getByText(/Erlaubt sind/)).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreate).not.toHaveBeenCalled();
    await user.clear(input); await user.type(input, "cache");
    await user.click(screen.getByRole("button", { name: "Ressource anlegen" }));
    expect(input).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ressource anlegen" }));
    expect(onCreate).toHaveBeenCalledWith("networks", "cache");
    expect(screen.queryByLabelText("Ressource anlegen")).not.toBeInTheDocument();
  });

  it("renames to itself, rejects duplicates, clones and handles keyboard", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn(); const onClone = vi.fn();
    renderManager({ resources: { networks: ["frontend", "backend", "frontend-copy"], volumes: ["data"], configs: [], secrets: [] }, onRename, onClone });
    await user.click(screen.getByRole("button", { name: "Umbenennen" }));
    const input = screen.getByLabelText("Ressource umbenennen");
    await user.clear(input); await user.type(input, "backend");
    expect(screen.getByText("Dieser Ressourcenname existiert bereits.")).toBeInTheDocument();
    await user.clear(input); await user.type(input, "frontend"); fireEvent.keyDown(input, { key: "Enter" });
    expect(onRename).toHaveBeenCalledWith("frontend");
    await user.click(screen.getByRole("button", { name: "Klonen" }));
    expect(screen.getByLabelText("Ressource klonen")).toHaveValue("frontend-copy-2");
    fireEvent.keyDown(screen.getByLabelText("Ressource klonen"), { key: "Escape" });
    expect(screen.queryByLabelText("Ressource klonen")).not.toBeInTheDocument();
  });

  it("changes kind and selection, edits, and deletes with references", async () => {
    const user = userEvent.setup();
    const refs = Array.from({ length: 6 }, (_, i) => ({ sourceService: "web", kind: "service" as const, path: `services.web.networks.${i}`, value: "frontend" }));
    const props = renderManager({ references: refs, onDelete: vi.fn().mockReturnValueOnce(false).mockReturnValue(true) });
    await user.click(screen.getByRole("button", { name: "Bearbeiten" }));
    expect(props.onEdit).toHaveBeenCalled();
    await user.selectOptions(screen.getByLabelText("Ressource"), "backend");
    expect(props.onSelect).toHaveBeenCalledWith("networks", "backend");
    await user.selectOptions(screen.getByLabelText("Typ"), "volumes");
    expect(props.onSelect).toHaveBeenCalledWith("volumes", "data");
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getByText("+ 1 weitere")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Löschen und bereinigen" });
    await user.click(confirm); expect(confirm).toBeInTheDocument();
    await user.click(confirm); expect(screen.queryByText("frontend wirklich löschen?")).not.toBeInTheDocument();
  });

  it("supports an empty resource kind and unreferenced deletion", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderManager({ activeKind: "configs" as TopLevelResourceKind, selectedName: "", onDelete });
    expect(screen.getByLabelText("Ressource")).toBeDisabled();
    expect(screen.getByText("Keine Ressourcen")).toBeInTheDocument();
    cleanup();
    renderManager({ onDelete });
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getByText("Die Ressource wird aus dem Compose-Dokument entfernt.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ressource löschen" }));
    expect(onDelete).toHaveBeenCalledWith(false);
  });

  it("cancels a resource action and its delete confirmation", async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByRole("button", { name: "Neu" }));
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByLabelText("Ressource anlegen")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByText("frontend wirklich löschen?")).not.toBeInTheDocument();
  });

  it("shows five resource references without an overflow label", async () => {
    const user = userEvent.setup();
    const refs = Array.from({ length: 5 }, (_, i) => ({ sourceService: "web", kind: "service" as const, path: `services.web.networks.${i}`, value: "frontend" }));
    renderManager({ references: refs });
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getAllByText(/^services\.web\.networks\./)).toHaveLength(5);
    expect(screen.queryByText(/weitere/)).not.toBeInTheDocument();
  });
});
