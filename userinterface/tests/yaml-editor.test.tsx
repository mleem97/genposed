// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const dynamicOptions = vi.hoisted(() => ({
  loading: undefined as (() => React.ReactNode) | undefined,
  loader: undefined as (() => Promise<unknown>) | undefined,
}));
vi.mock("next/dynamic", async () => {
  const React = await import("react");
  return { default: (loader: () => Promise<unknown>, options: { loading: () => React.ReactNode }) => {
    dynamicOptions.loading = options.loading;
    dynamicOptions.loader = loader;
    return function MonacoStub(props: { value: string; onChange: (value: string | undefined) => void }) {
      return React.createElement("div", null,
        React.createElement("textarea", { "aria-label": "Monaco stub", value: props.value, onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => props.onChange(event.target.value) }),
        React.createElement("button", { type: "button", onClick: () => props.onChange(undefined) }, "Clear Monaco value"),
      );
    };
  } };
});
vi.mock("@astryxdesign/core/theme", () => ({ useTheme: () => ({ mode: "light" }) }));

import { YamlEditor } from "../components/yaml-editor";

describe("YamlEditor", () => {
  it("passes YAML edits to the caller", async () => {
    const onChange = vi.fn();
    render(<YamlEditor value="services: {}" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Monaco stub"), { target: { value: "services: {web: {}}" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear Monaco value" }));
    expect(onChange).toHaveBeenCalledWith("services: {web: {}}");
    expect(onChange).toHaveBeenLastCalledWith("");
    render(dynamicOptions.loading?.());
    expect(screen.getByText("Editor wird geladen …")).toBeInTheDocument();
    await expect(dynamicOptions.loader?.()).resolves.toHaveProperty("default");
  });
});
