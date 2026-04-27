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
  it("declares the PLaMo API key only in descriptor-first setup metadata", () => {
    const manifest = readManifest();

    expect(manifest).toMatchObject({
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
    expect(manifest).not.toHaveProperty("providerAuthEnvVars");
  });

  it("keeps package and manifest security metadata aligned for ClawHub", () => {
    const manifest = readManifest();
    const packageJson = readPackageJson();

    expect(packageJson.version).toBe(manifest.version);
    expect(packageJson.files).toContain("SECURITY.md");
    expect(packageJson.files).not.toContain("SKILL.md");
    expect(packageJson).toMatchObject({
      openclaw: {
        runtimeExtensions: ["./dist/index.js"],
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

  it("documents code-plugin credential metadata for ClawHub scanners", () => {
    const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
    const security = fs.readFileSync(path.join(repoRoot, "SECURITY.md"), "utf8");

    expect(readme).toContain("This repository publishes an OpenClaw code plugin");
    expect(readme).toContain("openclaw.plugin.json");
    expect(readme).toContain("package.json");
    expect(security).toContain("not a user-invocable ClawHub skill");
    expect(security).toContain("PLAMO_API_KEY");
  });

  it("does not retain the removed local model-payload file write contract", () => {
    const streamSource = fs.readFileSync(path.join(repoRoot, "src", "stream.ts"), "utf8");

    expect(streamSource).not.toContain("appendFileSync");
    expect(streamSource).not.toContain("mkdirSync");
    expect(streamSource).not.toContain("PayloadDump");
  });
});
