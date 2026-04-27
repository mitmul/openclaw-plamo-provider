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

## Debugging

Payload dumping is an optional debugging feature. To enable it, set both
`OPENCLAW_PLAMO_DEBUG_PAYLOAD_DUMP=1` and
`OPENCLAW_PLAMO_PAYLOAD_DUMP_PATH` to a local file path. The provider then
appends one JSON record per PLaMo streaming payload to that file. Normal
provider use does not require setting either variable.

Payload dumps can include prompts, tool call payloads, tool results, and model
responses. Leave these variables unset during normal use, and review or redact
dump files before sharing them or attaching them to issues.

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
