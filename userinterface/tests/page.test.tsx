// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../components/compose-editor", () => ({ ComposeEditor: () => <div>compose editor</div> }));
vi.mock("../components/compose-file-workspace-panel", () => ({ ComposeFileWorkspacePanel: () => <div>file workspace</div> }));
vi.mock("../components/compose-policy-panel", () => ({ ComposePolicyPanel: () => <div>policy panel</div> }));
vi.mock("../components/schema-compatibility-panel", () => ({ SchemaCompatibilityPanel: () => <div>schema panel</div> }));
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("../lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

import HomePage from "../app/page";

describe("HomePage", () => {
  it("redirects an unauthenticated visitor to login", async () => {
    getSession.mockResolvedValue(null);
    await expect(HomePage()).rejects.toThrow("REDIRECT:/login");
  });

  it("assembles all primary workbench panels for an authenticated user", async () => {
    getSession.mockResolvedValue({ user: { id: "operator-1" }, session: { id: "session-1" } });
    render(await HomePage());
    expect(screen.getByText("compose editor")).toBeInTheDocument();
    expect(screen.getByText("file workspace")).toBeInTheDocument();
    expect(screen.getByText("policy panel")).toBeInTheDocument();
    expect(screen.getByText("schema panel")).toBeInTheDocument();
  });
});
