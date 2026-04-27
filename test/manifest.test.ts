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

function readPackageJson(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as Record<
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
      security: {
        primaryCredential: "PLAMO_API_KEY",
        requiredEnv: ["PLAMO_API_KEY"],
        optionalEnv: [],
        localPayloadDumps: false,
      },
    });
  });

  it("keeps package and manifest security metadata aligned for ClawHub", () => {
    const manifest = readManifest();
    const packageJson = readPackageJson();

    expect(packageJson.version).toBe(manifest.version);
    expect(packageJson.files).toContain("SKILL.md");
    expect(packageJson).toMatchObject({
      openclaw: {
        security: {
          primaryCredential: "PLAMO_API_KEY",
          requiredEnv: ["PLAMO_API_KEY"],
          optionalEnv: [],
          localPayloadDumps: false,
        },
      },
      clawhub: {
        security: {
          primaryCredential: "PLAMO_API_KEY",
          requiredEnv: ["PLAMO_API_KEY"],
          optionalEnv: [],
          localPayloadDumps: false,
        },
      },
    });
  });

  it("ships skill-frontmatter credential metadata for ClawHub scanners", () => {
    const skill = fs.readFileSync(path.join(repoRoot, "SKILL.md"), "utf8");

    expect(skill).toContain('"requires": { "env": ["PLAMO_API_KEY"] }');
    expect(skill).toContain('"primaryEnv": "PLAMO_API_KEY"');
  });

  it("does not retain the removed local model-payload file write contract", () => {
    const streamSource = fs.readFileSync(path.join(repoRoot, "src", "stream.ts"), "utf8");

    expect(streamSource).not.toContain("appendFileSync");
    expect(streamSource).not.toContain("mkdirSync");
    expect(streamSource).not.toContain("PayloadDump");
  });
});
