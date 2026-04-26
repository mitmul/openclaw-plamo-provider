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
