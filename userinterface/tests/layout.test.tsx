// @vitest-environment jsdom
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@astryxdesign/core/theme", () => ({ Theme: ({ children }: { children: ReactNode }) => <div data-testid="theme-provider">{children}</div> }));
vi.mock("@astryxdesign/theme-neutral/built", () => ({ neutralTheme: { name: "neutral" } }));

import RootLayout, { metadata } from "../app/layout";

describe("RootLayout", () => {
  it("sets German document metadata and applies the Astryx neutral theme", () => {
    const tree = RootLayout({ children: <main>application</main> });
    expect(metadata.title).toContain("Genposed");
    expect(tree.type).toBe("html");
    expect(tree.props).toMatchObject({ lang: "de", "data-theme": "light", suppressHydrationWarning: true });
    const body = tree.props.children;
    expect(body.type).toBe("body");
    expect(body.props.children.props).toMatchObject({ theme: { name: "neutral" }, mode: "system" });
  });
});
