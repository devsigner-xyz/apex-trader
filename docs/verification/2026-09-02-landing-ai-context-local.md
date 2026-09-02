---
status: current
last_verified: 2026-09-02
owners: product-design-engineering
scope: local
---

# Landing AI context - local verification

## Scope

The public landing adds a contextual AI section between Market primitives and the Devsigner banner.
It explains Apex Trader as a market-analysis workstation and exposes the public capabilities that
the prompt sends to a chosen provider: Candles, Footprint, Step Profile, Volume Profile with POC,
VAH and VAL, liquidity heatmap, DOM, Time & Sales and historical replay.

The section links to ChatGPT, Claude and Perplexity with the same encoded prompt. Gemini, Grok and
Copilot copy that prompt before opening their provider. Each provider action opens a new tab; direct
links use `noreferrer nofollow`. The prompt explicitly distinguishes this personal portfolio demo from
a live trading platform.

## Layout and analytics contract

- The section is a vertical composition: context first, then a wrapped row of provider actions.
- Provider actions retain intrinsic width rather than filling the available row. They remain on one
  row at 1440 px and 390 px, and may wrap only when a narrower viewport cannot fit them.
- It reuses the landing canvas, subtle border, Roboto Mono labels and the existing secondary action
  treatment. It introduces no new token, market color or product runtime.
- A provider click emits `ask_ai` with only `provider` and `context: landing`. It does not emit the
  prompt, market data, cursor state, replay ticks or continuous interaction.

## Local evidence

- `pnpm run check:docs`: passed, 20 required files.
- `pnpm run lint`: passed.
- `pnpm run test:unit`: passed, 20/20 tests.
- `COREPACK_HOME=/tmp/apex-trader-corepack pnpm --config.verify-deps-before-run=false run build`:
  passed for Vite and Storybook.
- Chromium reviewed `http://127.0.0.1:4173/` at 1440 × 1080 and 390 × 844. The accessible tree
  contained one level-two heading, the three named provider links and their encoded contextual
  prompts. It preserved the single landing level-one heading and did not introduce a demo route or
  historical-data request.

This is local evidence only. It does not claim a commit, Railway deployment or public verification.
