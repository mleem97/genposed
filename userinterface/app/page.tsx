import { ComposeEditor } from "@/components/compose-editor";
import { SchemaCompatibilityPanel } from "@/components/schema-compatibility-panel";

export default function HomePage() {
  return (
    <>
      <ComposeEditor />
      <SchemaCompatibilityPanel />
    </>
  );
}
