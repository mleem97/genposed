# Handoff: genposed — Stand und weitere Umsetzung

**Stand:** 10. November 2026  
**Projekt:** `/mnt/win/Repositories/genposed`  
**Adressat:** Entwickler oder Folgeagent mit Zugriff auf das Projekt  
**Auftrag:** Die bestehende Planung mit EGM und Graphify schrittweise zu einer vollständig implementierten, getesteten und deduplizierten Plattform umsetzen.

## Verbindliche Abnahmekriterien des Auftraggebers

- **100 % Test-Coverage:** Für den gesamten maßgeblichen produktiven Anwendungscode 100 % Statement-, Branch-, Function- und Line-Coverage erreichen und als verbindliche CI-Schranke messen. Die genaue Instrumentierung und der Geltungsbereich aller Repositories und Laufzeitkomponenten sind noch zu definieren; nicht messbare Infrastruktur und generierte Dateien müssen explizit dokumentiert und durch geeignete Integrations-, Sicherheits- oder Systemtests geprüft werden. Keine pauschalen Ausschlüsse, bloß um den Wert zu erreichen. **Aktuell nicht erreicht oder gemessen.**
- **Alle vereinbarten Funktionen zu 100 % umgesetzt:** Für jede verbindliche Anforderung nachvollziehbare Akzeptanzkriterien, Implementierung, Dokumentation und positive sowie negative Tests bereitstellen. Der Umfang muss aus den Anforderungen und Entscheidungen rekonstruiert und bei Widersprüchen präzisiert werden; keine Platzhalter, Scheinimplementierungen oder als fertig ausgegebene Prototypen. **Aktuell bei Weitem nicht erreicht.**
- **Dedupliziert:** Doppelte Implementierungen, konkurrierende Wahrheitsquellen und unnötige Abstraktionen über Anwendungscode, Integrationen, Tests und Dokumentation identifizieren und konsolidieren. Git-Historie und bestehende Nutzerdaten bewahren; sinnvolle unabhängige Sicherheitsprüfungen und Tests nicht allein wegen äußerlicher Ähnlichkeit entfernen. **Vollständige Prüfung steht aus.**
- Diese drei Anforderungen gelten als Pflicht für die Fertigstellung, nicht als Nachweis, dass sie bereits erfüllt sind. Coverage allein beweist weder Funktionsvollständigkeit noch Sicherheit.

## Produktziel und Prioritäten

Eine wirksame, selbst hostbare Alternative zu Coolify für Personen mit Homelab, Betreiber eigener Projekte sowie Webhosts und deren Kunden. **UX und Usability stehen an erster Stelle:** einfacher Einstieg, wenige notwendige Seiten, übersichtliche Abläufe, weitgehende Automatisierung und wenig Wartung. Sicherheit ist die oberste technische Priorität.

Die erste nutzbare Version soll eigene Projekte und Kundenprojekte unterscheiden. Der Betreiber entscheidet je Kunde, ob ein eigener Zugang zur Oberfläche freigeschaltet wird. Kunden sollen bei entsprechender Berechtigung grundlegende Aktionen wie Start, Stopp und Neustart ausführen können; weitergehende Fähigkeiten werden über RBAC geregelt. GitHub und Forgejo/Gitea sind gewünschte Deployment-Quellen. Cloudflare-DNS-Automatisierung ist ausdrücklich gewünscht; weitere sinnvolle Cloudflare-Funktionen sowie Doppler und Infisical sind zu planen und umzusetzen, soweit deren endgültiger Umfang festgelegt ist.

Der Betreiber möchte praktisch alle durch Compose ausdrückbaren Anwendungsfälle abdecken. Dies ist eine Produktanforderung und kein Nachweis, dass jede Compose-Eigenschaft auf jedem Betriebssystem oder rootless ausführbar ist: Zielplattform, Sicherheitsgrenzen, konkrete Fehlermeldungen und sichere Alternativen müssen sichtbar und überprüfbar definiert werden.

## Architekturentscheidungen und Sicherheitsvorgaben

- **Rootless-first:** Runtime und Builds soweit möglich rootless betreiben. Falls nötige Funktionen erhöhte Rechte erfordern, müssen sie getrennt, isoliert und abgesichert werden. Kein stiller Wechsel auf einen weniger sicheren oder rootful Betrieb.
- **Ausführungsprofile:** Berechtigte konfigurieren Profile und geeignete Ziele je Kunde oder Projekt, darunter dedizierte Server oder VMs. Ist kein geeignetes Ziel vorhanden, muss die Ausführung sicher abgelehnt werden. Isolationseinheit, Standardprofile, Ressourcenlimits und Provisionierung sind noch offen.
- **Incus und Proxmox:** mögliche Anbieter für Ausführungsumgebungen, noch nicht verpflichtend ausgewählt. VM und Systemcontainer haben unterschiedliche Grenzen; insbesondere teilen Systemcontainer den Host-Kernel. Backend-spezifische Rechte, Netzwerk-, Storage-, Backup- und Ausfallpfade bewerten.
- **Privilegierte Ausnahmen:** durch Support/Admin freigeben oder durch explizite Instanzkonfiguration regeln. Konkrete Berechtigungsprüfung, Umfang, Zielbindung, Grund, Ablauf, Widerruf, Audit und sichere technische Durchsetzung müssen noch ausgearbeitet werden.
- **Kundensicherheit:** Rootless und UI-RBAC allein isolieren einander nicht vertrauende Kunden nicht ausreichend. Scope-Prüfung an jeder relevanten API und ausführenden Grenze, kontrollierte Agentenbefehle und nachweisbare Trennung der Kundendaten, Secrets, Workloads und Ressourcen vorsehen. Bestehende Roadmap schließt feindliche Mandanten auf einem gemeinsamen rootful Docker-Daemon ausdrücklich aus.
- **Control Plane und Agenten:** Bestehende [ADR 0001](docs/ADR/0001-control-plane-and-agents.md) trennt Steuerung und Ausführung; Agenten verbinden sich ausgehend. [ADR 0002](docs/ADR/0002-canonical-compose-model.md) verlangt ein kanonisches Compose-Modell mit YAML-AST/CST. [ADR 0003](docs/ADR/0003-builder-isolation.md) behandelt Builder als Isolationsgrenzen. Abweichungen erst nach bewusster Entscheidung in aktualisierten ADRs festhalten.
- **Backups und Restore:** Vor einer produktiven Freigabe Wiederherstellung von Control Plane, Schlüsseln, Agentenidentität und unterstützten Anwendungsdaten einschließlich konsistenter Datenbank-Backups tatsächlich testen. RPO/RTO, Speicherziele und Scope sind noch offen.

## Luna und Repository-Grenze

**Lunexor Luna**, früher Lunexor-WHMCS, ist das separate Produkt für Webhostmanagement und den späteren Verkauf von Diensten; es soll auch Grundlage für Lunexor.de werden. Lokaler Checkout: `/mnt/win/Repositories/Webapps/Lunexor/lnxr-luna`. Dort existiert bereits ein pnpm-/Turborepo mit Anwendungen, Packages und einem dokumentierten Installer. Die dortigen Aussagen zur Funktionalität wurden nicht vollständig gegen Code oder Laufzeit geprüft.

Planungsrichtung: **getrennte Repositories, eigenständige Installation, Versionierung und Releases; Integration über versionierte Verträge**. Luna behält sein vorhandenes Turborepo. Genposed muss ohne Luna-Billing und -Hosting-Funktionen nutzbar sein. Luna-Oberfläche und Setup können als Grundlage oder Integration dienen; konkrete Grenzen für Auth, Tenant-Mapping, API, Berechtigungen, CI und Kompatibilität sind noch zu entwerfen und verifizieren. Vercel-CI ist ein Ziel, aber daraus folgt keine Entscheidung, Worker oder Agenten auf Vercel zu betreiben. Keine Repository-Zusammenführung oder Änderungen an Luna wurden ausgeführt.

## Tatsächlicher Implementierungsstand

Auf Branch `main` war zu Beginn nur Dokumentation vorhanden. Der Next.js-Prototyp wurde aus `origin/in-dev-v1` als Dateien nach `userinterface/` übernommen; das ist **kein Merge und kein Commit**. Die ursprüngliche Abhängigkeit `@meyermedia/ui` war öffentlich nicht installierbar; im Prototyp wurden native HTML-Elemente mit lokalem Styling eingesetzt.

Vorhanden im Prototyp:

- Next.js-/React-Oberfläche mit Monaco-YAML-Editor, Feldkatalog, Suche, Vorschau ausgewählter Felder, grundlegender YAML-Diagnose, Kopieren und Export.
- Browserlokale Projektliste: Projekte anlegen und wechseln; pro Projekt ein Compose-Dokument. Neue Projekte starten mit `services:`. Browserdaten des vorherigen Einzeldokuments werden beim Laden übernommen; der alte Schlüssel bleibt bestehen.
- Lokale Speicherung ist **keine** serverseitige Persistenz, Mandantentrennung oder Datensicherung. Sensible Werte werden nicht geschützt; Browserdaten sind für Personen mit Zugriff auf das Browserprofil zugänglich.
- Ungültige YAML-Wurzelwerte und Fehler bei YAML-Konvertierung erzeugen Diagnosen statt eines Editor-Absturzes. Feldanwendung prüft den Zielservice auch bei Doppelklick. Leeren und Zurücksetzen verlangen Bestätigung.
- Beschädigter Projektspeicher wird nicht mit Standardwerten überschrieben. Speicherfehler und konkurrierende Tabs erzeugen Warnungen; Wechsel/Anlage wird dann gesperrt, aktuelle Inhalte bleiben im Speicher exportierbar.
- Ein kleiner automatisierter Test prüft Migration leerer/ungültiger YAML-Daten und Ablehnung beschädigter oder inkonsistenter Projektlisten. Die GitHub-Actions-Datei führt Test, Typprüfung und Build aus.

**Fehlt:** serverseitige Projekte/Datenbank, sichere Anmeldung und RBAC, Kundenscopes, Agenten, Runtime-/Build-Isolation, Compose-Ausführung, Deployments, Git-Anbindungen, DNS/Secrets-Integrationen, sichere Freigaben, Audit, Backup/Restore, Luna-Schnittstelle, vollständiges visuelles Compose-Modell und ein überprüfter vollständiger Setup-Prozess. Die aktuelle Oberfläche ist ausdrücklich kein produktionsreifes Deployment-Werkzeug.

## Verifikation bisher

Im letzten Implementierungsschritt erfolgreich: `pnpm test`, `pnpm typecheck`, `pnpm build`; Browserprüfung für Projekt anlegen, wechseln und nach Reload erhalten; Next.js-MCP meldete keine Konfigurations- oder Sitzungsfehler. Zuvor wurden leeres YAML, ungültige skalare YAML-Wurzel und Service-Feldaktion ohne Zielservice im Browser geprüft. Kein aktueller Coverage-Bericht, keine 100-%-Coverage-Schranke, kein Ende-zu-Ende-Test für reale Deployments und kein unabhängiger Penetrationstest vorhanden.

Lokale Ausführung:

```bash
cd userinterface
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm dev
```

Die Projekt-README nennt `pnpm schema:sync`; dies lädt externe Schemata und ist für die oben genannten Checks nicht erforderlich. Die Tool-Versionen und der Lockfile-Stand müssen bei erneuter Ausführung überprüft werden.

## EGM-Review und bestehende Artefakte

- [Concepts Brief](concepts_brief.md): Anforderungen und erste Entscheidungen.
- [Goldfish Review](goldfish_review_report.md): sieben unabhängige Perspektiven; Hauptbefunde sind Kundentrennung und produktionsreife Wiederherstellung als Blocker, dazu Compose-Kompatibilität, Freigaben, UX und Release-Scope.
- [Designentwurf](design_draft.md): vertiefter Entwurf und grobe Umsetzungsschritte, ergänzt um Luna und unabhängige Releases. Er enthält bewusst offene Entscheidungen; einige frühere Aussagen zur ausschließlich dokumentierten Codebasis sind seit Übernahme des Prototyps überholt.
- [Rootless-Planung](docs/ROOTLESS_PLANNING.md): ursprünglicher Arbeitsstand und offene Fragen.
- [Graphify-Graph](graphify-out/graph.html), [Graphdaten](graphify-out/graph.json) und [Bericht](graphify-out/GRAPH_REPORT.md): vorliegende Planung und extrahierter Code. Graph zuerst abfragen, Aussagen in Quelldateien verifizieren, nach relevanten Änderungen aktualisieren. Automatisch vergebene Community-Namen sind teilweise generisch; der Graph ist kein Beweis für Implementierung oder Sicherheit.

EGM weiterhin einsetzen: Elephant hält Kontext und Entscheidungen, unabhängige Goldfish prüfen Entwürfe und kritische Änderungen in frischen Kontexten. Review-Befunde dokumentieren, umsetzen und erneut prüfen; offene Punkte nicht als entschieden darstellen.

## Offene Themen und empfohlene Reihenfolge

1. **Ist-Analyse und Konsolidierung:** Projekt und Entwicklungszweige anhand des Graphen prüfen; bestehende Arbeit wiederverwenden. Veraltete Behauptungen im Designentwurf, README und Roadmap korrigieren. Bestehende unversionierte Änderungen bewahren. Code und Konfiguration auf Duplikate und tote Abhängigkeiten untersuchen.
2. **Vollständige Anforderungsmatrix:** Alle Nutzeranforderungen, bestehende Dokumente und erkannten Widersprüche zu einem nachvollziehbaren Backlog mit Scope, Abnahmekriterien, Abhängigkeiten, Testfällen und Status zusammenführen. Prioritäten und tatsächlich unterstützte Varianten festlegen, ohne zugesagte Funktionen stillschweigend zu streichen.
3. **Test- und Coverage-Fundament:** Tooling für 100 % Lines, Branches, Statements und Functions auswählen, produktive Dateien erfassen und in CI erzwingen. Funktionstests für Speicherfehler, Migration, mehrere Tabs, Wechsel, Export und Editoroperationen ergänzen; danach Integration, E2E, Security, Restore und reale Zielumgebungen ergänzen. Coverage und Deduplizierung als kontinuierliche Gates führen.
4. **Daten- und Sicherheitsmodell:** Installation/Kunde/Projekt/Umgebung/Ziel eindeutig modellieren. Authentifizierung, serverseitiges RBAC, scoped Datenzugriff, Agentenidentität und Ausnahmefreigaben mit negativ getesteten Grenzen definieren und implementieren. Browserlokale Projekte mit verlustfreier Migration in sichere persistente Projekte überführen.
5. **Compose Studio:** Kanonisches typisiertes Modell plus YAML-AST/CST, Import/Export, Round-Trip, unbekannte Felder, Kommentare und Zielkompatibilität umsetzen. Sonderfälle und alle unterstützten Compose-Funktionen erfassen und testen; Diagnose und Policy sind nicht gleichbedeutend mit Runtime-Ausführung.
6. **Runtime, Profile und Deployments:** Rootless Setup und Capability-Probes; sichere Agentenkommunikation, Berechtigungsdurchsetzung, Ziele, VM/Server-Profile, zielgebundene Compose-Validierung, durable Jobs, Rollback, Beobachtbarkeit und Ausfallbehandlung. Feindliche Mandanten erst nach nachweisbar geeigneter Isolierung zulassen.
7. **Git, DNS und Secrets:** GitHub sowie Forgejo/Gitea mit sicheren Zugangsdaten, Webhooks, Fehlerfällen und idempotenten Deployments; Cloudflare-DNS mit eng begrenzten Rechten und Fehlerbehandlung. Doppler/Infisical und weitere Cloudflare-Funktionen konkretisieren und implementieren.
8. **Luna-Integration und UX:** Code und Laufzeit von Luna gezielt prüfen; versionierten Vertrag und unabhängige Releases festlegen. Installation für Genposed allein und optional mit Luna umsetzen; Kunden- und Adminansichten anhand echter Aufgaben testen. CI einschließlich gewünschter Vercel-Integration planen, ohne Self-Hosting auszuschließen.
9. **Wiederherstellung und Release:** Verschlüsselte Backups, dokumentierte Schlüssel- und Identitätswiederherstellung, Restore-Übungen, Upgrade/Rollback, sichere Logs, Bedrohungsmodell und Sicherheitsprüfung. Erst nach allen verbindlichen Funktions-, 100-%-Coverage-, Deduplizierungs- und Sicherheitskriterien als fertig bezeichnen.

## Offene Entscheidungen

- Welche konkreten Compose-Workloads, Linux-Distributionen, Architekturen, Docker-/Compose-Versionen und Einschränkungen bilden den ersten Supportumfang?
- Gilt die technische Isolationsgrenze pro Kunde, Projekt oder konfigurierbar; welche vertrauenswürdigen und nicht vertrauenswürdigen Workloads sind erlaubt?
- Wie werden VMs/Server bereitgestellt, und welche Incus-/Proxmox-Backendversionen sind wann unterstützt?
- Welche Standardrollen, Rechte, Freigabedauer und Widerrufsmechanismen gelten?
- Wie sehen die Luna/genposed-Verträge, das Identitätsmapping und die Kompatibilitätsmatrix aus?
- Welche konkreten Integrationsfunktionen, Migrationswege von Coolify und Wiederherstellungsziele sind für welche Releases verbindlich?
- Wie werden 100 % Coverage über Frontend, Backend, Agenten und Integrationen instrumentiert und überprüfbar in CI erzwungen?

## Arbeitsverzeichnis und Schutz bestehender Änderungen

`git status --short` zeigte zum Handoff unversionierte Planungsartefakte, `graphify-out/`, `.github/workflows/` und `userinterface/`. Diese Arbeiten sind nicht committed. Sie gehören zur aktuellen Arbeit und dürfen nicht durch Reset, Clean, Checkout oder Überschreiben verloren gehen. Insbesondere Änderungen oder Migrationen an Luna nur nach Prüfung seiner eigenen `AGENTS.md` und seines Arbeitsstands ausführen. Es wurde nichts deployed oder veröffentlicht.
