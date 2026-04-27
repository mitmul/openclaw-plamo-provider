# Security

This package is an OpenClaw code plugin. It is not a user-invocable ClawHub skill and does not define autonomous skill instructions.

## Credential scope

The PLaMo provider requires one primary credential: `PLAMO_API_KEY`.

The credential is declared in:

- `openclaw.plugin.json` `setup.providers[].envVars`
- `package.json` `openclaw.security.requiredEnv`
- `package.json` `clawhub.security.requiredEnv`

## Runtime scope

The plugin registers the `plamo` provider and sends model requests to the
Preferred Networks PLaMo API endpoint. It has no local prompt or response export
feature and no debug environment variables for writing model payloads to disk.
