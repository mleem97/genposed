// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComposeFileWorkspacePanel } from "../components/compose-file-workspace-panel";
import { ACTIVE_COMPOSE_CONTENT_KEY, COMPOSE_WORKSPACE_STORAGE_KEY, createWorkspaceFile } from "../lib/compose-file-workspace";

afterEach(() => { cleanup(); window.localStorage.clear(); vi.restoreAllMocks(); });

function storeWorkspace(names: Array<[string, string]>) {
  const files = names.map(([name, content]) => createWorkspaceFile(name, content));
  window.localStorage.setItem(COMPOSE_WORKSPACE_STORAGE_KEY, JSON.stringify({ version: 1, activeFileId: files[0]?.id, files }));
  return files;
}

describe("ComposeFileWorkspacePanel", () => {
  it("captures current content, renames display label, and removes an inactive file", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, "services:\n  web: {}\n");
    render(<ComposeFileWorkspacePanel />);
    await user.click(screen.getByRole("button", { name: /Compose files/ }));
    await user.click(screen.getByRole("button", { name: "Capture current document" }));
    expect(screen.getByText("Current editor document captured as compose.yaml")).toBeInTheDocument();
    expect(screen.getByText("compose.yaml")).toBeInTheDocument();
    const label = screen.getByRole("textbox", { name: "UI action name" });
    await user.clear(label); await user.type(label, "Production");
    expect(screen.getByRole("button", { name: /Production/ })).toBeInTheDocument();
    const files = storeWorkspace([["compose.yaml", "services: {}\n"], ["compose.dev.yaml", "services: {}\n"]]);
    cleanup(); render(<ComposeFileWorkspacePanel />);
    await user.click(screen.getByRole("button", { name: /Base/ }));
    await user.click(screen.getAllByRole("button", { name: "Remove" })[1]);
    expect(screen.getByText("Compose file removed from the local workspace")).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem(COMPOSE_WORKSPACE_STORAGE_KEY) ?? "{}");
    expect(saved.files).toHaveLength(1);
    expect(saved.files[0].id).toBe(files[0].id);
  });

  it("reports unsupported imports and imports recognized files alongside rejected files", async () => {
    const user = userEvent.setup();
    const files = storeWorkspace([["compose.yaml", "services: {}\n"]]);
    render(<ComposeFileWorkspacePanel />);
    await user.click(screen.getByRole("button", { name: /Base/ }));
    const input = screen.getByLabelText("Import Compose files");
    fireEvent.change(input, { target: { files: [new File(["x"], "notes.txt"), new File(["services: {}"], "compose.dev.yml"), new File(["services: {}"], "compose.production.yml")] } });
    expect(await screen.findByText("2 Compose files imported; 1 ignored")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(COMPOSE_WORKSPACE_STORAGE_KEY) ?? "{}").files).toHaveLength(3);
    expect(files).toHaveLength(1);
    fireEvent.change(input, { target: { files: [new File(["x"], "notes.txt")] } });
    expect(await screen.findByText("No recognized Compose file names were selected")).toBeInTheDocument();
  });

  it("switches active environments and updates local editor content before reloading", async () => {
    const user = userEvent.setup();
    const files = storeWorkspace([
      ["compose.yaml", "services:\n  base: {}\n"],
      ["compose.production.yaml", "services:\n  prod: {}\n"],
    ]);
    window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, "services:\n  unsaved: {}\n");
    render(<ComposeFileWorkspacePanel />);
    await user.click(screen.getByRole("button", { name: /Base/ }));
    await user.click(screen.getAllByRole("button", { name: "Open" })[1]);
    expect(window.localStorage.getItem(ACTIVE_COMPOSE_CONTENT_KEY)).toBe("services:\n  prod: {}\n");
    expect(JSON.parse(window.localStorage.getItem(COMPOSE_WORKSPACE_STORAGE_KEY) ?? "{}").files[0].content).toBe("services:\n  unsaved: {}\n");
    expect(files).toHaveLength(2);
    cleanup(); render(<ComposeFileWorkspacePanel />);
    await user.click(screen.getByRole("button", { name: /Production/ }));
    await user.click(screen.getAllByRole("button", { name: "Remove" })[1]);
    expect(window.localStorage.getItem(ACTIVE_COMPOSE_CONTENT_KEY)).toBe("services:\n  unsaved: {}\n");
    expect(JSON.parse(window.localStorage.getItem(COMPOSE_WORKSPACE_STORAGE_KEY) ?? "{}").files).toHaveLength(1);
  });

  it("activates the first imported file when the workspace has no active document", async () => {
    const user = userEvent.setup();
    render(<ComposeFileWorkspacePanel />);
    await user.click(screen.getByRole("button", { name: /Compose files/ }));
    fireEvent.change(screen.getByLabelText("Import Compose files"), {
      target: { files: [new File(["services:\n  first: {}\n"], "compose.yaml")] },
    });
    expect(await screen.findByText("1 Compose file imported")).toBeInTheDocument();
    expect(window.localStorage.getItem(ACTIVE_COMPOSE_CONTENT_KEY)).toBe("services:\n  first: {}\n");
  });

  it("uses the default document when capturing and supports file export and close", async () => {
    const user = userEvent.setup();
    render(<ComposeFileWorkspacePanel />);
    await user.click(screen.getByRole("button", { name: /Compose files/ }));
    const input = screen.getByLabelText("Import Compose files");
    fireEvent.change(input, { target: { files: null } });
    fireEvent.change(input, { target: { files: [] } });
    await user.click(screen.getByRole("button", { name: "Capture current document" }));
    expect(JSON.parse(window.localStorage.getItem(COMPOSE_WORKSPACE_STORAGE_KEY) ?? "{}").files[0].content).toBe("services: {}\n");
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:workspace");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:workspace");
    await user.click(screen.getByRole("button", { name: "Panel schließen" }));
    expect(screen.queryByText("Compose Environments")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Base/ }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("Compose file removed from the local workspace")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(COMPOSE_WORKSPACE_STORAGE_KEY) ?? "{}").files).toHaveLength(0);
  });
});
