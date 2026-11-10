// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServiceManager } from "../components/service-manager";
import type { ServiceReference } from "../lib/compose-document";

afterEach(cleanup);

const references: ServiceReference[] = Array.from({ length: 6 }, (_, index) => ({
  sourceService: "worker",
  path: `services.worker.depends_on.${index}`,
  kind: "depends_on",
  value: "app",
  autoFixable: true,
}));

function renderManager(overrides: Partial<ComponentProps<typeof ServiceManager>> = {}) {
  const props: ComponentProps<typeof ServiceManager> = {
    services: ["app", "worker"],
    selectedService: "app",
    references: [],
    onSelect: vi.fn(),
    onCreate: vi.fn(() => true),
    onRename: vi.fn(() => true),
    onClone: vi.fn(() => true),
    onDelete: vi.fn(() => true),
    ...overrides,
  };
  render(<ServiceManager {...props} />);
  return props;
}

describe("ServiceManager", () => {
  it("creates validated service names and keeps the form open after callback failure", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    renderManager({ onCreate });
    await user.click(screen.getByRole("button", { name: "Neu" }));
    const input = screen.getByLabelText("Service anlegen");
    expect(input).toHaveValue("service");
    await user.clear(input);
    await user.type(input, "bad name");
    expect(screen.getByText(/Erlaubt sind/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Service anlegen" })).toBeDisabled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreate).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, "api");
    await user.click(screen.getByRole("button", { name: "Service anlegen" }));
    expect(onCreate).toHaveBeenCalledWith("api");
    expect(input).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByLabelText("Service anlegen")).not.toBeInTheDocument();
  });

  it("shows duplicate-name errors, permits renaming to itself, and submits on Enter", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn(() => true);
    renderManager({ onRename });
    await user.click(screen.getByRole("button", { name: "Umbenennen" }));
    const input = screen.getByLabelText("Service umbenennen");
    expect(input).toHaveValue("app");
    await user.clear(input);
    await user.type(input, "worker");
    expect(screen.getByText("Dieser Servicename existiert bereits.")).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, "app");
    expect(screen.getByRole("button", { name: "Service umbenennen" })).toBeEnabled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRename).toHaveBeenCalledWith("app");
    expect(screen.queryByLabelText("Service umbenennen")).not.toBeInTheDocument();
  });

  it("clones services and resets pending actions when selection changes", async () => {
    const user = userEvent.setup();
    const props = renderManager({ services: ["app", "worker", "app-copy"], onClone: vi.fn(() => true) });
    await user.click(screen.getByRole("button", { name: "Klonen" }));
    expect(screen.getByLabelText("Service klonen")).toHaveValue("app-copy-2");
    await user.selectOptions(screen.getByLabelText("Aktiver Service"), "worker");
    expect(props.onSelect).toHaveBeenCalledWith("worker");
    expect(screen.queryByLabelText("Service klonen")).not.toBeInTheDocument();
  });

  it("confirms deletion, previews references, and retains confirmation after callback failure", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
    renderManager({ references, onDelete });
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getByText("+ 1 weitere")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Löschen und bereinigen" });
    await user.click(confirm);
    expect(onDelete).toHaveBeenCalledWith(true);
    expect(confirm).toBeInTheDocument();
    await user.click(confirm);
    expect(screen.queryByText("app wirklich löschen?")).not.toBeInTheDocument();
  });

  it("deletes an unreferenced service and supports disabled and empty states", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn(() => true);
    renderManager({ services: [], selectedService: "", disabled: true, onDelete });
    expect(screen.getByText(/Service-Aktionen sind gesperrt/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Neu" })).toBeDisabled();
    expect(screen.getByLabelText("Aktiver Service")).toBeDisabled();

    cleanup();
    renderManager({ onDelete });
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getByText("Der Service wird aus dem Compose-Dokument entfernt.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Service löschen" }));
    expect(onDelete).toHaveBeenCalledWith(false);
    expect(screen.queryByText("app wirklich löschen?")).not.toBeInTheDocument();
  });

  it("cancels a pending action and deletion confirmation", async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByRole("button", { name: "Neu" }));
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByLabelText("Service anlegen")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByText("app wirklich löschen?")).not.toBeInTheDocument();
  });

  it("shows all five references without an extra-count label", async () => {
    const user = userEvent.setup();
    renderManager({ references: references.slice(0, 5) });
    await user.click(screen.getByRole("button", { name: "Löschen" }));
    expect(screen.getAllByText(/^services\.worker\.depends_on\./)).toHaveLength(5);
    expect(screen.queryByText(/weitere/)).not.toBeInTheDocument();
  });
});
