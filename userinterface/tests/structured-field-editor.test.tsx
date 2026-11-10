// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StructuredFieldEditor } from "../components/structured-field-editor";
import type { ComposeValue } from "../lib/compose-document";

afterEach(cleanup);

function renderEditor(value: ComposeValue | undefined, overrides: Partial<React.ComponentProps<typeof StructuredFieldEditor>> = {}) {
  const props = { fieldTitle: "Deploy", value, sample: { mode: "safe", enabled: true, count: 2, note: "", nested: { x: "y" }, args: ["one"] }, onChange: vi.fn(), onApplyExample: vi.fn(), onRemove: vi.fn(), ...overrides };
  render(<StructuredFieldEditor {...props} />);
  return props;
}

describe("StructuredFieldEditor", () => {
  it("applies example for an absent field and shows configurable labels", async () => {
    const user = userEvent.setup();
    const props = renderEditor(undefined, { applyLabel: "Create it", emptyDescription: "Instructions" });
    expect(screen.getByText("Instructions")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create it" }));
    expect(props.onApplyExample).toHaveBeenCalled();
  });

  it("edits maps, adds and removes fields, renames keys and handles collisions", async () => {
    const user = userEvent.setup();
    const initial = { first: "hello", second: null };
    const props = renderEditor(initial);
    const keyInputs = screen.getAllByLabelText("Schlüssel");
    fireEvent.change(keyInputs[0], { target: { value: "renamed" } });
    expect(props.onChange).toHaveBeenCalledWith({ renamed: "hello", second: null });
    fireEvent.change(keyInputs[0], { target: { value: "second" } });
    expect(props.onChange).toHaveBeenLastCalledWith(initial);
    await user.click(screen.getByRole("button", { name: "+ Feld" }));
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ first: "hello", second: null, new_key: "" }));
    await user.click(screen.getByRole("button", { name: "first entfernen" }));
    expect(props.onChange).toHaveBeenCalledWith({ second: null });
  });

  it("edits scalar variants including multiline strings and nested lists", async () => {
    const user = userEvent.setup();
    const long = "x".repeat(91);
    const props = renderEditor({ text: long, truth: false, count: 2, nullable: null, rows: ["a", { name: "item" }], empty: [] });
    expect(screen.getByDisplayValue(long).tagName).toBe("TEXTAREA");
    fireEvent.change(screen.getByDisplayValue(long), { target: { value: "short" } });
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ text: "short" }));
    fireEvent.change(screen.getByDisplayValue("false"), { target: { value: "true" } });
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ truth: true }));
    fireEvent.change(screen.getByDisplayValue("2"), { target: { value: "3" } });
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ count: 3 }));
    await user.click(screen.getByRole("button", { name: "In Text umwandeln" }));
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ nullable: "" }));
    expect(screen.getByText("Noch keine Einträge. Füge eine neue Zeile hinzu.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "+ Zeile" })[1]);
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ empty: [""] }));
    await user.click(screen.getByRole("button", { name: "Eintrag 1 entfernen" }));
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ rows: [{ name: "item" }] }));
    fireEvent.change(screen.getByDisplayValue("item"), { target: { value: "changed" } });
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ rows: ["a", { name: "changed" }] }));
  });

  it("restores examples and removes configured fields when requested", async () => {
    const user = userEvent.setup();
    const props = renderEditor({ value: "hello" }, { kicker: "Custom", restoreLabel: "Restore", removeLabel: "Remove" });
    expect(screen.getByText("Custom")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(props.onApplyExample).toHaveBeenCalled();
    expect(props.onRemove).toHaveBeenCalled();
  });

  it("uses fallback labels for primitive and empty collection values", () => {
    renderEditor(true);
    expect(screen.getByText("boolean")).toBeInTheDocument();
    cleanup();
    renderEditor(42);
    expect(screen.getByText("number")).toBeInTheDocument();
    cleanup();
    renderEditor(null, { onRemove: undefined });
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Feld entfernen" })).not.toBeInTheDocument();
    cleanup();
    renderEditor([]);
    expect(screen.getByText("List")).toBeInTheDocument();
    expect(screen.getByText("Noch keine Einträge. Füge eine neue Zeile hinzu.")).toBeInTheDocument();
    cleanup();
    renderEditor({});
    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Noch keine Felder. Füge eine neue Zeile hinzu.")).toBeInTheDocument();
  });
});
