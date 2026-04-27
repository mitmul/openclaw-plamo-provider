import { describe, expect, it } from "vitest";
import { resolvePlamoPayloadDumpPath } from "../src/stream.js";

describe("PLaMo payload dump opt-in", () => {
  it("does not enable payload dumps from a path alone", () => {
    expect(
      resolvePlamoPayloadDumpPath({
        OPENCLAW_PLAMO_PAYLOAD_DUMP_PATH: "/tmp/plamo-payloads.jsonl",
      }),
    ).toBe("");
  });

  it("requires the explicit debug flag and a dump path", () => {
    expect(
      resolvePlamoPayloadDumpPath({
        OPENCLAW_PLAMO_DEBUG_PAYLOAD_DUMP: "1",
        OPENCLAW_PLAMO_PAYLOAD_DUMP_PATH: " /tmp/plamo-payloads.jsonl ",
      }),
    ).toBe("/tmp/plamo-payloads.jsonl");
  });
});
