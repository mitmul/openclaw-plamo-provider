export function normalizeOpenAICompatibleToolParameters(schema: unknown): unknown {
  return normalizeOpenAIStrictCompatSchema(schema ?? {});
}

function normalizeOpenAIStrictCompatSchema(schema: unknown): unknown {
  return normalizeOpenAIStrictCompatSchemaRecursive(schema, { promoteEmptyObject: true });
}

type NormalizeOpenAIStrictCompatOptions = {
  promoteEmptyObject: boolean;
};

const OPENAI_STRICT_COMPAT_SCHEMA_MAP_KEYS = new Set([
  "$defs",
  "definitions",
  "dependentSchemas",
  "patternProperties",
  "properties",
]);

const OPENAI_STRICT_COMPAT_SCHEMA_NESTED_KEYS = new Set([
  "additionalProperties",
  "allOf",
  "anyOf",
  "contains",
  "else",
  "if",
  "items",
  "not",
  "oneOf",
  "prefixItems",
  "propertyNames",
  "then",
  "unevaluatedItems",
  "unevaluatedProperties",
]);

function normalizeOpenAIStrictCompatSchemaMap(schema: unknown): unknown {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return schema;
  }

  let changed = false;
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    const next = normalizeOpenAIStrictCompatSchemaRecursive(value, {
      promoteEmptyObject: false,
    });
    normalized[key] = next;
    changed ||= next !== value;
  }
  return changed ? normalized : schema;
}

function normalizeOpenAIStrictCompatSchemaRecursive(
  schema: unknown,
  options: NormalizeOpenAIStrictCompatOptions,
): unknown {
  if (Array.isArray(schema)) {
    let changed = false;
    const normalized = schema.map((entry) => {
      const next = normalizeOpenAIStrictCompatSchemaRecursive(entry, {
        promoteEmptyObject: false,
      });
      changed ||= next !== entry;
      return next;
    });
    return changed ? normalized : schema;
  }
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  const record = schema as Record<string, unknown>;
  let changed = false;
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const next = OPENAI_STRICT_COMPAT_SCHEMA_MAP_KEYS.has(key)
      ? normalizeOpenAIStrictCompatSchemaMap(value)
      : OPENAI_STRICT_COMPAT_SCHEMA_NESTED_KEYS.has(key)
        ? normalizeOpenAIStrictCompatSchemaRecursive(value, {
            promoteEmptyObject: false,
          })
        : value;
    normalized[key] = next;
    changed ||= next !== value;
  }

  if (Object.keys(normalized).length === 0) {
    if (!options.promoteEmptyObject) {
      return schema;
    }
    return {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    };
  }

  const hasObjectShapeHints =
    !("type" in normalized) &&
    ((normalized.properties &&
      typeof normalized.properties === "object" &&
      !Array.isArray(normalized.properties)) ||
      Array.isArray(normalized.required));
  if (hasObjectShapeHints) {
    normalized.type = "object";
    changed = true;
  }
  if (normalized.type === "object" && !("properties" in normalized)) {
    normalized.properties = {};
    changed = true;
  }

  const hasEmptyProperties =
    normalized.properties &&
    typeof normalized.properties === "object" &&
    !Array.isArray(normalized.properties) &&
    Object.keys(normalized.properties as Record<string, unknown>).length === 0;

  if (normalized.type === "object" && !Array.isArray(normalized.required) && hasEmptyProperties) {
    normalized.required = [];
    changed = true;
  }

  if (
    normalized.type === "object" &&
    hasEmptyProperties &&
    !("additionalProperties" in normalized)
  ) {
    normalized.additionalProperties = false;
    changed = true;
  }

  return changed ? normalized : schema;
}
