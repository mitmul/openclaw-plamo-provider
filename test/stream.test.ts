import type { Context, Model } from "openclaw/plugin-sdk/llm";
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
  id: "plamo-3.0-prime",
  name: "PLaMo 3.0 Prime",
  api: "openai-completions",
  provider: "plamo",
  baseUrl: "https://api.example.test/v1",
  reasoning: true,
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

async function runNativePlamoStream(options: Record<string, unknown> = {}) {
  const { createPlamoToolCallWrapper } = await import("../src/stream.js");
  const stream = createPlamoToolCallWrapper(undefined)(model, context, options);
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

  it("maps OpenClaw thinking levels to PLaMo reasoning_effort", async () => {
    mocks.responses.push(
      sseResponse({
        id: "chatcmpl-reasoning-effort",
        choices: [
          {
            delta: { content: "ok" },
            finish_reason: "stop",
          },
        ],
      }),
    );

    await runNativePlamoStream({ reasoning: "max" });

    const body = JSON.parse(String(mocks.fetch.mock.calls[0]?.[1]?.body));
    expect(body.reasoning_effort).toBe("medium");
  });

  it("requests detailed reasoning summaries for PLaMo 3.0 Prime", async () => {
    mocks.responses.push(
      sseResponse({
        id: "chatcmpl-reasoning-summary-request",
        choices: [
          {
            delta: { content: "ok" },
            finish_reason: "stop",
          },
        ],
      }),
    );

    await runNativePlamoStream({ reasoning: "medium" });

    const body = JSON.parse(String(mocks.fetch.mock.calls[0]?.[1]?.body));
    expect(body.reasoning).toEqual({ summary: "detailed" });
  });

  it("maps thinking off to PLaMo reasoning_effort none", async () => {
    mocks.responses.push(
      sseResponse({
        id: "chatcmpl-reasoning-off",
        choices: [
          {
            delta: { content: "ok" },
            finish_reason: "stop",
          },
        ],
      }),
    );

    await runNativePlamoStream({ reasoning: "off" });

    const body = JSON.parse(String(mocks.fetch.mock.calls[0]?.[1]?.body));
    expect(body.reasoning_effort).toBe("none");
  });

  it("emits PLaMo reasoning deltas as thinking blocks", async () => {
    mocks.responses.push(
      sseResponse(
        {
          id: "chatcmpl-reasoning",
          choices: [
            {
              delta: { reasoning: "hidden reasoning" },
              finish_reason: null,
            },
          ],
        },
        {
          id: "chatcmpl-reasoning",
          choices: [
            {
              delta: { content: "visible answer" },
              finish_reason: "stop",
            },
          ],
        },
      ),
    );

    const { events, message } = await runNativePlamoStream({ reasoning: "medium" });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "thinking_start" }),
        expect.objectContaining({ type: "thinking_delta", delta: "hidden reasoning" }),
        expect.objectContaining({ type: "thinking_end", content: "hidden reasoning" }),
      ]),
    );
    expect(message.content).toEqual([
      { type: "thinking", thinking: "hidden reasoning", thinkingSignature: "reasoning_content" },
      { type: "text", text: "visible answer" },
    ]);
  });

  it("emits PLaMo reasoning_summary chunks as thinking blocks", async () => {
    mocks.responses.push(
      sseResponse(
        {
          id: "chatcmpl-reasoning-summary",
          choices: [
            {
              delta: { content: null, reasoning: null },
              finish_reason: null,
              reasoning_summary: ["summary reasoning"],
            },
          ],
        },
        {
          id: "chatcmpl-reasoning-summary",
          choices: [
            {
              delta: { content: "visible answer" },
              finish_reason: "stop",
            },
          ],
        },
      ),
    );

    const { events, message } = await runNativePlamoStream({ reasoning: "medium" });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "thinking_start" }),
        expect.objectContaining({ type: "thinking_delta", delta: "summary reasoning" }),
        expect.objectContaining({ type: "thinking_end", content: "summary reasoning" }),
      ]),
    );
    expect(message.content).toEqual([
      { type: "thinking", thinking: "summary reasoning", thinkingSignature: "reasoning_content" },
      { type: "text", text: "visible answer" },
    ]);
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
