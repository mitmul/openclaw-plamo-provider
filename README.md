# OpenClaw PLaMo Provider

External OpenClaw provider plugin for Preferred Networks PLaMo.

## Install

```bash
openclaw plugins install @mitmul/openclaw-plamo-provider
```

After ClawHub publication, the same package can be installed explicitly from
ClawHub:

```bash
openclaw plugins install clawhub:@mitmul/openclaw-plamo-provider
```

## Configure

Use the onboarding flag or set `PLAMO_API_KEY`:

```bash
openclaw onboard --plamo-api-key <key>
```

The default model is `plamo/plamo-3.0-prime-beta`. Uncataloged model IDs with
the `plamo-` prefix are accepted through dynamic model resolution so newer
PLaMo model names can be used before the local catalog is refreshed.

## Security and credentials

Required primary credential: `PLAMO_API_KEY`.

Provide it with `openclaw onboard --plamo-api-key <key>` or by setting
`PLAMO_API_KEY` in the OpenClaw runtime environment. The provider sends model
requests to `https://api.platform.preferredai.jp/v1` unless the OpenClaw
provider config overrides the endpoint.

This package has no local prompt or response export feature and does not define
debug environment variables for writing model payloads to disk.

## ClawHub package metadata

This repository publishes an OpenClaw code plugin, not a ClawHub skill. The
package contains built runtime JavaScript under `dist/` because OpenClaw loads
provider plugins as code.

The authoritative credential metadata for this provider is:

- `openclaw.plugin.json` `setup.providers[].envVars`: `PLAMO_API_KEY`
- `openclaw.plugin.json` `providerAuthEnvVars.plamo`: `PLAMO_API_KEY`
- `package.json` `openclaw.security.requiredEnv`: `PLAMO_API_KEY`

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm pack --dry-run
```

## Publish

```bash
pnpm publish --access public
clawhub package publish mitmul/openclaw-plamo-provider --dry-run
clawhub package publish mitmul/openclaw-plamo-provider
```
