// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchemaCompatibilityPanel } from "../components/schema-compatibility-panel";

afterEach(() => { cleanup(); window.localStorage.clear(); });

describe("SchemaCompatibilityPanel", () => {
  it("restores stored target version and filters compatibility categories", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("genposed.compose.target-version.v1", "2.10.0");
    render(<SchemaCompatibilityPanel />);
    await user.click(screen.getByRole("button", { name: /Compose 2.10.0/ }));
    const version = screen.getByRole("textbox", { name: /Docker Compose version/ });
    expect(version).toHaveValue("2.10.0");
    fireEvent.change(version, { target: { value: " 2.32.0" } });
    expect(version).toHaveValue("2.32.0");
    expect(window.localStorage.getItem("genposed.compose.target-version.v1")).toBe("2.32.0");
    await user.click(screen.getByRole("button", { name: /Supported/ }));
    expect(screen.getByText(/\d+ fields/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Panel schließen" }));
    expect(screen.queryByText("Target Compose Version")).not.toBeInTheDocument();
  });

  it("uses the default version when storage is empty and handles a cleared version", async () => {
    const user = userEvent.setup();
    render(<SchemaCompatibilityPanel />);
    await user.click(screen.getByRole("button", { name: /Compose 2\.32\.0/ }));
    const version = screen.getByRole("textbox", { name: /Docker Compose version/ });
    await user.clear(version);
    expect(screen.getByRole("button", { name: /Compose \?/ })).toBeInTheDocument();
    expect(window.localStorage.getItem("genposed.compose.target-version.v1")).toBe("");
    await user.click(screen.getByRole("button", { name: /Unclassified/ }));
    expect(screen.getAllByText("unknown", { exact: true }).length).toBeGreaterThan(0);
  });
});
