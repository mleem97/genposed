export const schemaDirectory: URL;
export const docsDirectory: URL;
export const sources: Array<{ name: string; url: string; target: URL }>;

export function resolveLocalReference(schema: unknown, reference: unknown): unknown;
export function resolveSchemaNode(schema: unknown, node: unknown, visited?: Set<string>): unknown;
export function collectNodeTypes(schema: unknown, node: unknown): string[];
export function fieldEntry(schema: unknown, scope: string, name: string, rawNode: unknown): Record<string, unknown>;
export function propertyIndex(schema: unknown, scope: string, properties: unknown): Array<Record<string, unknown>>;
export function buildComposeFieldIndex(schema: Record<string, unknown>): {
  schemaId: unknown;
  schemaTitle: unknown;
  generatedAt: string;
  fields: Array<Record<string, unknown>>;
};

interface SyncSource {
  name: string;
  url: string;
  target: URL;
}

interface SyncResponse {
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
}

export function syncSchemas(options?: {
  schemaTarget?: URL;
  docsTarget?: URL;
  inputSources?: SyncSource[];
  fetchImpl?: (url: string, init: { headers: Record<string, string> }) => Promise<SyncResponse>;
  mkdirImpl?: (target: URL, options: { recursive: true }) => Promise<unknown>;
  writeFileImpl?: (target: URL, content: string, encoding: "utf8") => Promise<unknown>;
  log?: (message: string) => void;
}): Promise<{ composeFieldIndex: ReturnType<typeof buildComposeFieldIndex>; manifest: Array<Record<string, unknown>> }>;

export function runCli(options?: {
  scriptPath?: string;
  schemaTarget?: URL;
  docsTarget?: URL;
  inputSources?: SyncSource[];
  fetchImpl?: (url: string, init: { headers: Record<string, string> }) => Promise<SyncResponse>;
  mkdirImpl?: (target: URL, options: { recursive: true }) => Promise<unknown>;
  writeFileImpl?: (target: URL, content: string, encoding: "utf8") => Promise<unknown>;
  log?: (message: string) => void;
}): Promise<void>;
