"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import {
  ACTIVE_COMPOSE_CONTENT_KEY,
  COMPOSE_WORKSPACE_STORAGE_KEY,
  composeEnvironmentLabel,
  createWorkspaceFile,
  isComposeFileName,
  parseWorkspaceState,
  removeWorkspaceFile,
  renameWorkspaceFileLabel,
  selectWorkspaceFile,
  syncActiveFileContent,
  upsertWorkspaceFiles,
  type ComposeFileWorkspaceState,
} from "@/lib/compose-file-workspace";

function persistWorkspace(workspace: ComposeFileWorkspaceState) {
  window.localStorage.setItem(COMPOSE_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
}

function downloadFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "application/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ComposeFileWorkspacePanel() {
  const [workspace, setWorkspace] = useState<ComposeFileWorkspaceState>({ version: 1, files: [] });
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState("No Compose files imported");

  useEffect(() => {
    setWorkspace(parseWorkspaceState(window.localStorage.getItem(COMPOSE_WORKSPACE_STORAGE_KEY)));
  }, []);

  const activeFile = useMemo(
    () => workspace.files.find((file) => file.id === workspace.activeFileId),
    [workspace.activeFileId, workspace.files],
  );

  function captureCurrentContent(currentWorkspace = workspace): ComposeFileWorkspaceState {
    const currentContent = window.localStorage.getItem(ACTIVE_COMPOSE_CONTENT_KEY) ?? "";
    return syncActiveFileContent(currentWorkspace, currentContent);
  }

  function saveWorkspace(nextWorkspace: ComposeFileWorkspaceState) {
    setWorkspace(nextWorkspace);
    persistWorkspace(nextWorkspace);
  }

  function captureCurrentAsBase() {
    const content = window.localStorage.getItem(ACTIVE_COMPOSE_CONTENT_KEY) ?? "services: {}\n";
    const capturedFile = createWorkspaceFile("compose.yaml", content);
    const nextWorkspace = upsertWorkspaceFiles(captureCurrentContent(), [capturedFile]);
    const storedFile = nextWorkspace.files.find((file) => file.name.toLowerCase() === "compose.yaml");
    const selectedWorkspace = storedFile
      ? selectWorkspaceFile(nextWorkspace, storedFile.id)
      : nextWorkspace;
    saveWorkspace(selectedWorkspace);
    setNotice("Current editor document captured as compose.yaml");
  }

  async function importComposeFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = [...(event.target.files ?? [])];
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    const rejectedFiles = selectedFiles.filter((file) => !isComposeFileName(file.name));
    const composeFiles = selectedFiles.filter((file) => isComposeFileName(file.name));

    if (composeFiles.length === 0) {
      setNotice("No recognized Compose file names were selected");
      return;
    }

    const importedFiles = await Promise.all(composeFiles.map(async (file) => {
      return createWorkspaceFile(file.name, await file.text());
    }));

    const capturedWorkspace = captureCurrentContent();
    let nextWorkspace = upsertWorkspaceFiles(capturedWorkspace, importedFiles);

    if (!nextWorkspace.activeFileId && importedFiles[0]) {
      const storedImportedFile = nextWorkspace.files.find(
        (file) => file.name.toLowerCase() === importedFiles[0].name.toLowerCase(),
      );
      if (storedImportedFile) {
        nextWorkspace = selectWorkspaceFile(nextWorkspace, storedImportedFile.id);
      }
    }

    saveWorkspace(nextWorkspace);
    setNotice(
      `${importedFiles.length} Compose file${importedFiles.length === 1 ? "" : "s"} imported`
      + (rejectedFiles.length > 0 ? `; ${rejectedFiles.length} ignored` : ""),
    );
  }

  function activateFile(fileId: string) {
    const capturedWorkspace = captureCurrentContent();
    const nextWorkspace = selectWorkspaceFile(capturedWorkspace, fileId);
    const nextFile = nextWorkspace.files.find((file) => file.id === fileId);
    if (!nextFile) return;

    persistWorkspace(nextWorkspace);
    window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, nextFile.content);
    window.location.reload();
  }

  function updateDisplayName(fileId: string, displayName: string) {
    const nextWorkspace = renameWorkspaceFileLabel(captureCurrentContent(), fileId, displayName);
    saveWorkspace(nextWorkspace);
  }

  function deleteFile(fileId: string) {
    const capturedWorkspace = captureCurrentContent();
    const nextWorkspace = removeWorkspaceFile(capturedWorkspace, fileId);
    const nextActiveFile = nextWorkspace.files.find((file) => file.id === nextWorkspace.activeFileId);

    persistWorkspace(nextWorkspace);
    if (nextActiveFile) {
      window.localStorage.setItem(ACTIVE_COMPOSE_CONTENT_KEY, nextActiveFile.content);
    }
    setWorkspace(nextWorkspace);
    setNotice("Compose file removed from the local workspace");

    if (fileId === workspace.activeFileId && nextActiveFile) {
      window.location.reload();
    }
  }

  return (
    <aside className={expanded ? "file-workspace-panel expanded" : "file-workspace-panel"} aria-label="Compose-Dateien">
      <button
        type="button"
        className="file-workspace-toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span>{activeFile?.displayName ?? "Compose files"}</span>
        <strong>{workspace.files.length} files</strong>
      </button>

      {expanded ? (
        <div className="file-workspace-content">
          <div className="file-workspace-heading">
            <div>
              <span>Multi-file workspace</span>
              <h2>Compose Environments</h2>
            </div>
            <button type="button" onClick={() => setExpanded(false)} aria-label="Panel schließen">×</button>
          </div>

          <div className="file-workspace-actions">
            <label>
              <input
                type="file"
                accept=".yaml,.yml,application/yaml,text/yaml,text/plain"
                multiple
                onChange={importComposeFiles}
              />
              Import Compose files
            </label>
            <button type="button" onClick={captureCurrentAsBase}>Capture current document</button>
          </div>

          <p className="file-workspace-notice">{notice}</p>

          <div className="file-workspace-list">
            {workspace.files.map((file) => (
              <article key={file.id} className={file.id === workspace.activeFileId ? "workspace-file active" : "workspace-file"}>
                <div className="workspace-file-heading">
                  <div>
                    <strong>{file.name}</strong>
                    <span>{composeEnvironmentLabel(file.environment)}</span>
                  </div>
                  {file.id === workspace.activeFileId ? <em>active</em> : null}
                </div>

                <label>
                  <span>UI action name</span>
                  <input
                    type="text"
                    value={file.displayName}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => updateDisplayName(file.id, event.target.value)}
                  />
                </label>

                <div className="workspace-file-actions">
                  <button type="button" onClick={() => activateFile(file.id)} disabled={file.id === workspace.activeFileId}>
                    Open
                  </button>
                  <button type="button" onClick={() => downloadFile(file.name, file.content)}>Export</button>
                  <button type="button" className="danger" onClick={() => deleteFile(file.id)}>Remove</button>
                </div>
              </article>
            ))}

            {workspace.files.length === 0 ? (
              <div className="file-workspace-empty">
                Import files such as `compose.yaml`, `compose.local.yml`, or `compose.production.yml`.
              </div>
            ) : null}
          </div>

          <p className="file-workspace-footnote">
            Switching files stores the current document first and reloads the editor with the selected file. Compose merging and deployment profiles are handled in a later slice.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
