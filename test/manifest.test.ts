import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readManifest(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "openclaw.plugin.json"), "utf8")) as Record<
    string,
    unknown
  >;
}

describe("OpenClaw plugin manifest", () => {
  it("declares the PLaMo API key in descriptor-first setup metadata", () => {
    const manifest = readManifest();

    expect(manifest).toMatchObject({
      providerAuthEnvVars: {
        plamo: ["PLAMO_API_KEY"],
      },
      setup: {
        providers: [
          {
            id: "plamo",
            authMethods: ["api-key"],
            envVars: ["PLAMO_API_KEY"],
          },
        ],
        requiresRuntime: false,
      },
    });
  });
});
