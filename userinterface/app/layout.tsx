import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@meyermedia/ui/theme";

import "./globals.css";
import "./structured-editor.css";
import "./service-manager.css";

export const metadata: Metadata = {
  title: "Genposed — Compose Configuration Workbench",
  description: "Schema-driven Docker Compose, Traefik, Caddy, Coolify and Swarm editor.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de" data-theme="animus-found" suppressHydrationWarning>
      <body>
        <ThemeProvider forcedTheme="animus-found">{children}</ThemeProvider>
      </body>
    </html>
  );
}
