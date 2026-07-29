"use client";

import { Button } from "@meyermedia/ui/primitives";

import {
  asComposeValue,
  createBlankLike,
  type ComposeValue,
  uniqueMapKey,
} from "@/lib/compose-document";

interface StructuredFieldEditorProps {
  fieldTitle: string;
  value: ComposeValue | undefined;
  sample: unknown;
  onChange: (value: ComposeValue) => void;
  onApplyExample: () => void;
  onRemove: () => void;
}

interface ValueNodeEditorProps {
  value: ComposeValue;
  template?: ComposeValue;
  label?: string;
  depth?: number;
  onChange: (value: ComposeValue) => void;
}

function valueType(value: ComposeValue): string {
  if (Array.isArray(value)) return "list";
  if (value === null) return "null";
  if (typeof value === "object") return "map";
  return typeof value;
}

function renameMapKey(
  value: Record<string, ComposeValue>,
  oldKey: string,
  nextKey: string,
): Record<string, ComposeValue> {
  if (!nextKey || nextKey === oldKey || nextKey in value) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key === oldKey ? nextKey : key, item]),
  );
}

function ScalarEditor({
  value,
  label,
  onChange,
}: Pick<ValueNodeEditorProps, "value" | "label" | "onChange">) {
  const type = valueType(value);

  if (typeof value === "boolean") {
    return (
      <label className="structured-scalar">
        {label ? <span>{label}</span> : null}
        <select value={String(value)} onChange={(event) => onChange(event.target.value === "true")}>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <label className="structured-scalar">
        {label ? <span>{label}</span> : null}
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  }

  if (value === null) {
    return (
      <div className="structured-null">
        <span>{label ?? "Value"}</span>
        <code>null</code>
        <button type="button" onClick={() => onChange("")}>In Text umwandeln</button>
      </div>
    );
  }

  const isMultiline = value.includes("\n") || value.length > 90;

  return (
    <label className="structured-scalar">
      {label ? <span>{label}</span> : null}
      {isMultiline ? (
        <textarea value={value} rows={Math.min(10, Math.max(3, value.split("\n").length + 1))} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      <small>{type}</small>
    </label>
  );
}

function ListEditor({ value, template, label, depth = 0, onChange }: ValueNodeEditorProps & { value: ComposeValue[] }) {
  const templateItems = Array.isArray(template) ? template : [];
  const itemTemplate = templateItems[0] ?? value[0];

  return (
    <section className="structured-group" data-depth={Math.min(depth, 3)}>
      <div className="structured-group-heading">
        <div>
          <strong>{label ?? "List"}</strong>
          <span>{value.length} Einträge</span>
        </div>
        <button
          type="button"
          onClick={() => onChange([...value, createBlankLike(itemTemplate)])}
        >
          + Zeile
        </button>
      </div>

      <div className="structured-list">
        {value.map((item, index) => (
          <div className="structured-list-item" key={index}>
            <div className="structured-item-index">{index + 1}</div>
            <div className="structured-item-content">
              <ValueNodeEditor
                value={item}
                template={itemTemplate}
                label={`Eintrag ${index + 1}`}
                depth={depth + 1}
                onChange={(nextValue) => {
                  const next = [...value];
                  next[index] = nextValue;
                  onChange(next);
                }}
              />
            </div>
            <button
              className="structured-remove"
              type="button"
              aria-label={`Eintrag ${index + 1} entfernen`}
              onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
            >
              ×
            </button>
          </div>
        ))}

        {value.length === 0 ? (
          <div className="structured-empty">Noch keine Einträge. Füge eine neue Zeile hinzu.</div>
        ) : null}
      </div>
    </section>
  );
}

function MapEditor({
  value,
  template,
  label,
  depth = 0,
  onChange,
}: ValueNodeEditorProps & { value: Record<string, ComposeValue> }) {
  const templateMap = template && !Array.isArray(template) && typeof template === "object"
    ? template as Record<string, ComposeValue>
    : {};
  const fallbackTemplate = Object.values(templateMap)[0] ?? Object.values(value)[0];

  return (
    <section className="structured-group" data-depth={Math.min(depth, 3)}>
      <div className="structured-group-heading">
        <div>
          <strong>{label ?? "Map"}</strong>
          <span>{Object.keys(value).length} Felder</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const nextKey = uniqueMapKey(value);
            onChange({ ...value, [nextKey]: createBlankLike(fallbackTemplate) });
          }}
        >
          + Feld
        </button>
      </div>

      <div className="structured-map">
        {Object.entries(value).map(([key, item]) => (
          <div className="structured-map-row" key={key}>
            <div className="structured-key-cell">
              <label>
                <span>Schlüssel</span>
                <input
                  type="text"
                  value={key}
                  onChange={(event) => onChange(renameMapKey(value, key, event.target.value))}
                />
              </label>
            </div>
            <div className="structured-value-cell">
              <ValueNodeEditor
                value={item}
                template={templateMap[key] ?? fallbackTemplate}
                label="Wert"
                depth={depth + 1}
                onChange={(nextValue) => onChange({ ...value, [key]: nextValue })}
              />
            </div>
            <button
              className="structured-remove"
              type="button"
              aria-label={`${key} entfernen`}
              onClick={() => onChange(Object.fromEntries(Object.entries(value).filter(([entryKey]) => entryKey !== key)))}
            >
              ×
            </button>
          </div>
        ))}

        {Object.keys(value).length === 0 ? (
          <div className="structured-empty">Noch keine Felder. Füge eine neue Zeile hinzu.</div>
        ) : null}
      </div>
    </section>
  );
}

function ValueNodeEditor({ value, template, label, depth = 0, onChange }: ValueNodeEditorProps) {
  if (Array.isArray(value)) {
    return <ListEditor value={value} template={template} label={label} depth={depth} onChange={onChange} />;
  }

  if (value !== null && typeof value === "object") {
    return <MapEditor value={value} template={template} label={label} depth={depth} onChange={onChange} />;
  }

  return <ScalarEditor value={value} label={label} onChange={onChange} />;
}

export function StructuredFieldEditor({
  fieldTitle,
  value,
  sample,
  onChange,
  onApplyExample,
  onRemove,
}: StructuredFieldEditorProps) {
  const sampleValue = asComposeValue(sample);

  if (value === undefined) {
    return (
      <div className="structured-field-empty">
        <div className="structured-empty-icon">+</div>
        <h3>{fieldTitle} ist noch nicht konfiguriert</h3>
        <p>Lege das Feld anhand der Compose-Vorlage an und bearbeite anschließend alle Werte zeilenweise.</p>
        <Button type="button" onClick={onApplyExample}>Feld hinzufügen</Button>
      </div>
    );
  }

  return (
    <div className="structured-field-editor">
      <div className="structured-field-toolbar">
        <div>
          <span>Visueller Feldeditor</span>
          <strong>{fieldTitle}</strong>
        </div>
        <div>
          <button type="button" onClick={onApplyExample}>Beispiel wiederherstellen</button>
          <button type="button" className="danger" onClick={onRemove}>Feld entfernen</button>
        </div>
      </div>

      <div className="structured-field-body">
        <ValueNodeEditor value={value} template={sampleValue} onChange={onChange} />
      </div>
    </div>
  );
}
