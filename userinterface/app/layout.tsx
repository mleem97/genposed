import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

import "./globals.css";
import "./structured-editor.css";
import "./service-manager.css";
import "./resource-manager.css";
import "./schema-compatibility.css";
import "./compose-file-workspace.css";
import "./compose-policy.css";
import "./login.css";

export const metadata: Metadata = {
  title: "Genposed — Compose Configuration Workbench",
  description: "Schema-driven Docker Compose, Traefik, Caddy, Coolify and Swarm editor.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de" data-theme="light" suppressHydrationWarning>
      <body>
        <Theme theme={neutralTheme} mode="system">{children}</Theme>
      </body>
    </html>
  );
}
