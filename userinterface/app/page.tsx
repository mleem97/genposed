import { ComposeEditor } from "@/components/compose-editor";
import { ComposeFileWorkspacePanel } from "@/components/compose-file-workspace-panel";
import { SchemaCompatibilityPanel } from "@/components/schema-compatibility-panel";

export default function HomePage() {
  return (
    <>
      <ComposeEditor />
      <ComposeFileWorkspacePanel />
      <SchemaCompatibilityPanel />
    </>
  );
}
