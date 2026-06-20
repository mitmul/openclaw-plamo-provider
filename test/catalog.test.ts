import { describe, expect, it } from "vitest";
import { buildPlamoCatalogModels, PLAMO_DEFAULT_MODEL_ID } from "../src/model-definitions.js";
import {
  buildPlamoProvider,
  hasConfiguredPlamoAuthHeaders,
  hasConfiguredPlamoProviderAuth,
} from "../src/provider-catalog.js";

describe("PLaMo provider catalog", () => {
  it("builds the default PLaMo provider metadata", () => {
    const provider = buildPlamoProvider();

    expect(provider.api).toBe("openai-completions");
    expect(provider.baseUrl).toBe("https://api.platform.preferredai.jp/v1");
    expect(provider.models.map((model) => model.id)).toEqual([PLAMO_DEFAULT_MODEL_ID]);
    expect(provider.models[0]).toMatchObject({
      reasoning: true,
      compat: {
        supportsReasoningEffort: true,
        reasoningEffortMap: {
          off: "none",
          medium: "medium",
          max: "medium",
        },
      },
    });
  });

  it("returns fresh model input arrays for callers", () => {
    const first = buildPlamoCatalogModels();
    const second = buildPlamoCatalogModels();

    expect(first[0]?.input).toEqual(["text"]);
    expect(first[0]?.input).not.toBe(second[0]?.input);
  });

  it("detects configured request auth without exposing secret values", () => {
    expect(
      hasConfiguredPlamoProviderAuth({
        request: {
          auth: {
            mode: "header",
            headerName: "X-Api-Key",
            value: "secret",
          },
        },
      }),
    ).toBe(true);

    expect(hasConfiguredPlamoAuthHeaders({ Authorization: "" })).toBe(false);
  });
});
