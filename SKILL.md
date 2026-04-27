---
name: openclaw-plamo-provider
description: OpenClaw provider plugin for Preferred Networks PLaMo.
user-invocable: false
disable-model-invocation: true
metadata:
  {
    "openclaw":
      {
        "requires": { "env": ["PLAMO_API_KEY"] },
        "primaryEnv": "PLAMO_API_KEY"
      }
  }
---

# OpenClaw PLaMo Provider

This package is an OpenClaw code plugin, not an agent skill. This `SKILL.md`
is included so ClawHub and human reviewers can read the same credential
metadata in the skill frontmatter format.

## Required credential

Primary credential: `PLAMO_API_KEY`.

The API key can be configured with `openclaw onboard --plamo-api-key <key>` or
by setting `PLAMO_API_KEY` in the OpenClaw runtime environment.

## Runtime behavior

The provider registers the `plamo` model provider and sends model requests to
the Preferred Networks PLaMo API. It does not define debug environment
variables for writing model payloads to disk and does not write prompts, tool
payloads, or responses to local export files.
