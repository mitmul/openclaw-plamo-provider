import type { Context, Model } from "@mariozechner/pi-ai";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const responses: Response[] = [];
  const fetch = vi.fn(async () => {
    const response = responses.shift();
    if (!response) {
      throw new Error("No queued PLaMo response");
    }
    return response;
  });
  return { responses, fetch };
});

vi.mock("openclaw/plugin-sdk/provider-auth-runtime", () => ({
  resolveEnvApiKey: vi.fn(() => ({ apiKey: "test-plamo-api-key" })),
}));

vi.mock("openclaw/plugin-sdk/provider-transport-runtime", () => ({
  buildGuardedModelFetch: vi.fn(() => mocks.fetch),
}));

const model: Model<"openai-completions"> = {
  id: "plamo-test",
  name: "PLaMo Test",
  api: "openai-completions",
  provider: "plamo",
  baseUrl: "https://api.example.test/v1",
  reasoning: false,
  input: ["text"],
  cost: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
  },
  contextWindow: 65536,
  maxTokens: 1024,
};

const context: Context = {
  messages: [
    {
      role: "user",
      content: "hello",
      timestamp: 0,
    },
  ],
};

function sseResponse(...payloads: Array<Record<string, unknown> | "[DONE]">): Response {
  const body = payloads
    .map((payload) => `data: ${payload === "[DONE]" ? payload : JSON.stringify(payload)}\n\n`)
    .join("");
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

async function runNativePlamoStream() {
  const { createPlamoToolCallWrapper } = await import("../src/stream.js");
  const stream = createPlamoToolCallWrapper(undefined)(model, context, {});
  const events = [];
  for await (const event of stream) {
    events.push(event);
  }
  return {
    events,
    message: await stream.result(),
  };
}

describe("PLaMo native stream handling", () => {
  afterEach(() => {
    mocks.responses.length = 0;
    mocks.fetch.mockClear();
  });

  it("treats a clean stream close with assistant output as stop when finish_reason is missing", async () => {
    mocks.responses.push(
      sseResponse({
        id: "chatcmpl-missing-finish",
        choices: [
          {
            delta: { content: "hello from plamo" },
            finish_reason: null,
          },
        ],
      }),
    );

    const { events, message } = await runNativePlamoStream();

    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(events.at(-1)).toMatchObject({ type: "done", reason: "stop" });
    expect(message).toMatchObject({
      stopReason: "stop",
      content: [{ type: "text", text: "hello from plamo" }],
    });
  });

  it("retries once when the stream ends before assistant output and finish_reason", async () => {
    mocks.responses.push(
      sseResponse("[DONE]"),
      sseResponse(
        {
          id: "chatcmpl-retry",
          choices: [
            {
              delta: { content: "retry ok" },
              finish_reason: null,
            },
          ],
        },
        {
          id: "chatcmpl-retry",
          choices: [
            {
              delta: {},
              finish_reason: "stop",
            },
          ],
        },
        "[DONE]",
      ),
    );

    const { message } = await runNativePlamoStream();

    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(message).toMatchObject({
      stopReason: "stop",
      content: [{ type: "text", text: "retry ok" }],
    });
  });
});
