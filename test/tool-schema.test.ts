import { describe, expect, it } from "vitest";
import { normalizeOpenAICompatibleToolParameters } from "../src/tool-schema.js";

describe("PLaMo tool schema normalization", () => {
  it("promotes empty schemas to object-root schemas", () => {
    expect(normalizeOpenAICompatibleToolParameters({})).toEqual({
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    });
  });

  it("fills object schema defaults for parameter-free tools", () => {
    expect(normalizeOpenAICompatibleToolParameters({ type: "object" })).toEqual({
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    });
  });
});
