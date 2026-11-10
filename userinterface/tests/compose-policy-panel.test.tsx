// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const forcedPolicyFailure = vi.hoisted(() => ({ message: null as string | null }));
const forcedPolicyReport = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("../lib/compose-policy", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/compose-policy")>();
  return {
    ...actual,
    analyzeComposePolicies: (source: string) => forcedPolicyReport.value ?? actual.analyzeComposePolicies(source),
    applyComposePolicyFix: (...args: Parameters<typeof actual.applyComposePolicyFix>) => {
      if (forcedPolicyFailure.message !== null) {
        const message = forcedPolicyFailure.message;
        forcedPolicyFailure.message = null;
        throw message;
      }
      return actual.applyComposePolicyFix(...args);
    },
  };
});

import { ComposePolicyPanel } from "../components/compose-policy-panel";
import { ACTIVE_COMPOSE_CONTENT_KEY } from "../lib/compose-file-workspace";

afterEach(() => { cleanup(); window.localStorage.clear(); vi.useRealTimers(); forcedPolicyFailure.message = null; forcedPolicyReport.value = null; });

describe("ComposePolicyPanel", () => {
  it("reads editor content, refreshes and filters policy results", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, "services:\n  web:\n    image: nginx\n");
    render(<ComposePolicyPanel />);
    await user.click(screen.getByRole("button", { name: /Compose policies/ }));
    expect(screen.getByText("Policy Report")).toBeInTheDocument();
    expect(screen.getByText("findings", { exact: true })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Information/ }));
    expect(screen.getByText("No findings with this severity.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(screen.getByText("Policy report refreshed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Panel schließen" }));
    expect(screen.queryByText("Policy Report")).not.toBeInTheDocument();
  });

  it("shows parse failures and applies a safe restart policy autofix", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, "services: [");
    const { unmount } = render(<ComposePolicyPanel />);
    await user.click(screen.getByRole("button", { name: /Compose policies/ }));
    expect(screen.getByText("YAML parsing failed")).toBeInTheDocument();
    unmount(); window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, "services:\n  web:\n    image: nginx:1.27\n");
    render(<ComposePolicyPanel />);
    await user.click(screen.getByRole("button", { name: /Compose policies/ }));
    await user.click(screen.getByRole("button", { name: /Reliability/ }));
    await user.click(screen.getByRole("button", { name: "Set restart: unless-stopped" }));
    expect(window.localStorage.getItem(ACTIVE_COMPOSE_CONTENT_KEY)).toContain("restart: unless-stopped");
    expect(screen.getByText("reliability.restart-policy fixed; reloading editor")).toBeInTheDocument();
  });

  it("refreshes its analysis when another editor tab changes local storage", () => {
    vi.useFakeTimers();
    window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, "services:\n  web:\n    image: nginx:1.27\n");
    render(<ComposePolicyPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Compose policies/ }));
    act(() => { vi.advanceTimersByTime(750); });
    window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, "services: [");
    act(() => { vi.advanceTimersByTime(750); });
    expect(screen.getByText("YAML parsing failed")).toBeInTheDocument();
  });

  it("handles empty storage and a non-Error autofix failure", async () => {
    const user = userEvent.setup();
    render(<ComposePolicyPanel />);
    await user.click(screen.getByRole("button", { name: /Compose policies/ }));
    expect(screen.getByText("No findings with this severity.")).toBeInTheDocument();
    cleanup();
    window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, "services:\n  web:\n    image: nginx:1.27\n");
    forcedPolicyFailure.message = "rejected fix";
    render(<ComposePolicyPanel />);
    await user.click(screen.getByRole("button", { name: /Compose policies/ }));
    await user.click(screen.getByRole("button", { name: /Reliability/ }));
    await user.click(screen.getByRole("button", { name: "Set restart: unless-stopped" }));
    expect(screen.getByText("Autofix failed")).toBeInTheDocument();
  });

  it("uses the default button label when a rule omits its fix label", async () => {
    const user = userEvent.setup();
    forcedPolicyReport.value = {
      parseErrors: [],
      results: [{ ruleId: "test.fix", severity: "reliability", path: "services.web.restart", serviceName: "web", message: "Test fix", explanation: "Safe test fix", canAutoFix: true }],
    };
    render(<ComposePolicyPanel />);
    await user.click(screen.getByRole("button", { name: /Compose policies/ }));
    await user.click(screen.getByRole("button", { name: /Reliability/ }));
    expect(screen.getByRole("button", { name: "Apply autofix" })).toBeInTheDocument();
  });
});
