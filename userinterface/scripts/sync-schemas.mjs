import { mkdir, writeFile } from "node:fs/promises";

const schemaDirectory = new URL("../public/schemas/", import.meta.url);
const docsDirectory = new URL("../public/schemas/source-docs/", import.meta.url);
const gistRevision = "1990774af50522f396b890f105b5adf636190e35";
const gistBase = `https://gist.githubusercontent.com/mleem97/c5700fe7e58f50a02430fdf92e5a9348/raw/${gistRevision}`;

const sources = [
  {
    name: "compose-spec.json",
    url: "https://raw.githubusercontent.com/compose-spec/compose-spec/main/schema/compose-spec.json",
    target: schemaDirectory,
  },
  {
    name: "docker-compose.schemastore.json",
    url: "https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/docker-compose.json",
    target: schemaDirectory,
  },
  ...[
    "caddy-docs.md",
    "coolify-docs.md",
    "docker-guides.md",
    "docker-manuals.md",
    "docker-reference.md",
    "traefik-docs.md",
  ].map((name) => ({ name, url: `${gistBase}/${name}`, target: docsDirectory })),
];

function resolveLocalReference(schema, reference) {
  if (typeof reference !== "string" || !reference.startsWith("#/")) return undefined;

  return reference
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, segment) => value?.[segment], schema);
}

function resolveSchemaNode(schema, node, visited = new Set()) {
  if (!node || typeof node !== "object") return node;
  if (!node.$ref) return node;
  if (visited.has(node.$ref)) return node;

  const referenced = resolveLocalReference(schema, node.$ref);
  if (!referenced) return node;

  const nextVisited = new Set(visited);
  nextVisited.add(node.$ref);
  return {
    ...resolveSchemaNode(schema, referenced, nextVisited),
    ...Object.fromEntries(Object.entries(node).filter(([key]) => key !== "$ref")),
  };
}

function collectNodeTypes(schema, node) {
  const resolved = resolveSchemaNode(schema, node);
  if (!resolved || typeof resolved !== "object") return [];

  const directTypes = Array.isArray(resolved.type)
    ? resolved.type
    : resolved.type
      ? [resolved.type]
      : [];
  const variants = [...(resolved.oneOf ?? []), ...(resolved.anyOf ?? [])];
  const variantTypes = variants.flatMap((variant) => collectNodeTypes(schema, variant));

  return [...new Set([...directTypes, ...variantTypes])];
}

function fieldEntry(schema, scope, name, rawNode) {
  const node = resolveSchemaNode(schema, rawNode);
  const enumValues = Array.isArray(node?.enum) ? node.enum : undefined;
  const types = collectNodeTypes(schema, node);

  return {
    id: `${scope}.${name}`,
    scope,
    name,
    types,
    description: typeof node?.description === "string" ? node.description : undefined,
    default: node?.default,
    examples: node?.examples,
    enum: enumValues,
    deprecated: node?.deprecated === true,
    readOnly: node?.readOnly === true,
    writeOnly: node?.writeOnly === true,
  };
}

function propertyIndex(schema, scope, properties) {
  if (!properties || typeof properties !== "object") return [];
  return Object.entries(properties).map(([name, node]) => fieldEntry(schema, scope, name, node));
}

function buildComposeFieldIndex(schema) {
  const rootProperties = schema.properties ?? {};
  const servicesNode = resolveSchemaNode(schema, rootProperties.services);
  const serviceNode = resolveSchemaNode(schema, servicesNode?.additionalProperties);
  const serviceBuildNode = resolveSchemaNode(schema, serviceNode?.properties?.build);
  const buildNode = serviceBuildNode
    ?? resolveSchemaNode(schema, schema.definitions?.build ?? schema.$defs?.build);

  return {
    schemaId: schema.$id,
    schemaTitle: schema.title,
    generatedAt: new Date().toISOString(),
    fields: [
      ...propertyIndex(schema, "top", rootProperties),
      ...propertyIndex(schema, "service", serviceNode?.properties),
      ...propertyIndex(schema, "build", buildNode?.properties),
    ],
  };
}

await Promise.all([
  mkdir(schemaDirectory, { recursive: true }),
  mkdir(docsDirectory, { recursive: true }),
]);

const manifest = [];
const downloadedContent = new Map();

for (const source of sources) {
  const response = await fetch(source.url, {
    headers: { "user-agent": "genposed-schema-sync" },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${source.name}: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  const destination = new URL(source.name, source.target);
  await writeFile(destination, content, "utf8");
  downloadedContent.set(source.name, content);

  manifest.push({
    name: source.name,
    source: source.url,
    bytes: Buffer.byteLength(content),
    syncedAt: new Date().toISOString(),
  });

  console.log(`synced ${source.name}`);
}

const composeSchemaContent = downloadedContent.get("compose-spec.json");
if (!composeSchemaContent) {
  throw new Error("compose-spec.json was not downloaded");
}

const composeFieldIndex = buildComposeFieldIndex(JSON.parse(composeSchemaContent));
const composeFieldIndexContent = `${JSON.stringify(composeFieldIndex, null, 2)}\n`;
await writeFile(new URL("compose-field-index.json", schemaDirectory), composeFieldIndexContent, "utf8");

manifest.push({
  name: "compose-field-index.json",
  source: "generated from compose-spec.json",
  bytes: Buffer.byteLength(composeFieldIndexContent),
  syncedAt: new Date().toISOString(),
});

await writeFile(
  new URL("manifest.json", schemaDirectory),
  `${JSON.stringify({ sources: manifest }, null, 2)}\n`,
  "utf8",
);

console.log(`generated ${composeFieldIndex.fields.length} Compose field metadata records`);
