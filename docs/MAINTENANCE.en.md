# Maintenance Log

[中文](../MAINTENANCE.md) | English | [日本語](MAINTENANCE.ja.md) | [偽中国語](MAINTENANCE.pcn.md)

dsh-api-balance package update changelog.

## 2026-10-05T14:20:10+09:00

**Summary**: fix(client): the question dialog's fades become **scroll-aware** (both ends of the prompt)

- Both prompt edges fade, and a side only fades when content actually remains there (`none` / `start` / `end` / `middle`)
- The card fades its top edge only — masking the whole card would fade the pinned buttons too; the strip below the buttons is closed off with a same-colour filler
- Criteria: the 14 UI checks (including the three scroll-state assertions) pass against the built artifact

| Commit | Description |
|------|------|
| `f39c816` | fix(client): fades become **scroll-aware** (top and bottom), and the gap below the buttons is filled |

## 2026-10-05T13:58:13+09:00

**Summary**: fix(client): fade masks at the question dialog's bottom — the prompt's lower edge and the strip above the pinned buttons are no longer sliced

- The prompt's lower edge fades via `mask`; above the pinned buttons a `::before` gradient band does the same
- The gradient colour is sampled from the card's **actual background** (light `rgb(255,255,255)` / dark `rgb(44,44,46)`) — a hardcoded colour would give itself away in dark mode
- Criteria: the prompt's bottom 30px go from 59.93 to 45.92 average luminance (~23% darker) while the band above is unchanged; the same assertions measure FAIL on the deployed build

| Commit | Description |
|------|------|
| `4cf04a0` | fix(client): fade masks at the question dialog's bottom — no more hard cuts at the prompt's lower edge and above the pinned buttons |

## 2026-10-05T13:22:34+09:00

**Summary**: fix(client): the bottom stats bar's horizontal scroll is **retired**; a long prompt no longer hides the options

- Stats bar: dsh 0.2.0 already turns every metric into a **clickable pill** (opening the "session stats" dialog), so in-place scrolling no longer applies and fights the pill's gestures
- No style is injected any more, the settings row is greyed out with the official solution spelled out, and the old injection is cleaned up by `retireStatsScrollCss()`
- Question dialog: with a long prompt the header measured 948px against a 398px visible card area, so the pinned opaque header acted as a shield
- The header is now height-capped (≤40vh), scrolls itself and is no longer pinned; the options are back in the viewport

| Commit | Description |
|------|------|
| `e6d638c` | fix(client): retire the stats-bar horizontal scroll; a long question prompt no longer hides the options |

## 2026-10-05T07:13:39+09:00

**Summary**: fix(mobile): the keyboard guard now works by "never letting focus land on an editable element"

- Measurement showed a real `focusin` is **not cancelable** (the old `preventDefault` was dead code)
- The soft keyboard is requested the moment `focus` lands — a session switch focuses twice in a row, so blurring afterwards only patches things up
- The composer now stays non-editable until the user taps it; tapping or typing restores it immediately, and losing focus re-arms the block
- Criteria: during a session switch the number of focus events landing on an editable composer is 0 (2 on the old build), and typing still works after a tap

| Commit | Description |
|------|------|
| `7adb94a` | fix(mobile): keyboard guard rewritten as "never let focus land on an editable element" |

## 2026-10-03T07:18:53+09:00

**Summary**: fix(client): two UI improvements had **silently died**

- The stats-bar horizontal scroll **had not worked since dsh 0.1.5**: upstream renamed the style module from `StatsLine.module.css` to `StatsPills.module.css`, the plugin only knew the old name → could not find the style tag → retried five times and removed itself, while the settings row kept showing On
- Three tokens no longer exist in 0.2.0: `--dsw-alias-separator-primary` has no fallback → degrading to `currentColor`, i.e. the text colour; danger / warning were held up by hardcoded values
- Both module names are now tried, and the tokens chain to their 0.2.0 counterparts (hardcoded values kept last for 0.1.x)

| Commit | Description |
|------|------|
| `8dab668` | fix(client): two silent failures — renamed style module and three tokens that no longer exist |

## 2026-10-03T06:24:10+09:00

**Summary**: fix(client): panel / dialog materials rewritten to the native 0.2.0 recipe; the Enter-swap installation moved out of the component lifecycle

- 0.2.0 turned `--dsw-specific-menu` from a solid colour into a **translucent fill**, and native surfaces only take shape with `backdrop-filter: var(--dsw-menu-backdrop-filter)` on top — the old recipe left the panel genuinely transparent
- Modal dialogs now use the opaque `--dsw-alias-bg-layer-2` plus elevation; the two materials must not be mixed
- After the composer became chained slots, a question / approval / subagent taking over the composer unmounted the ring component and took the Enter-swap with it while the UI still looked perfectly normal
- It is now installed in `apply()`

| Commit | Description |
|------|------|
| `cc89c43` | fix(client): move the Enter-swap installation out of the component lifecycle |
| `700fbbc` | fix(client): panel/dialog materials rewritten to the native 0.2.0 recipe — menus are no longer transparent |

## 2026-09-28T13:06:27+09:00

**Summary**: fix(voice): voice selection now follows the variant of the utterance

- A Mandarin request no longer picks a Cantonese voice
- Ships with the regression test `test/voice-selection.test.mjs`

| Commit | Description |
|------|------|
| `76ea584` | fix(voice): pick the voice by the variant of the utterance — Mandarin requests no longer land on a Cantonese voice |

## 2026-09-16T14:49:41+09:00

**Summary**: dsh-api-balance 0.1.1 — new package: an API usage & balance plugin

- A Usage / Balance tab switch inside the web UI's context-ring popover
- Account balance, usage breakdown, automatic platform token discovery, speech announcements

| Commit | Description |
|------|------|
| `c47f857` | feat: dsh-api-balance — API usage and balance plugin |

| Package | Version |
|--------|------|
| dsh-api-balance | new in v0.1.1 |
