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

await Promise.all([mkdir(schemaDirectory, { recursive: true }), mkdir(docsDirectory, { recursive: true })]);

const manifest = [];

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

  manifest.push({
    name: source.name,
    source: source.url,
    bytes: Buffer.byteLength(content),
    syncedAt: new Date().toISOString(),
  });

  console.log(`synced ${source.name}`);
}

await writeFile(
  new URL("manifest.json", schemaDirectory),
  `${JSON.stringify({ sources: manifest }, null, 2)}\n`,
  "utf8",
);
