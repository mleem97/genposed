import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ComposeEditor } from "@/components/compose-editor";
import { ComposeFileWorkspacePanel } from "@/components/compose-file-workspace-panel";
import { ComposePolicyPanel } from "@/components/compose-policy-panel";
import { SchemaCompatibilityPanel } from "@/components/schema-compatibility-panel";
import { getAuth } from "@/lib/auth";

export default async function HomePage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <>
      <ComposeEditor />
      <ComposeFileWorkspacePanel />
      <ComposePolicyPanel />
      <SchemaCompatibilityPanel />
    </>
  );
}
