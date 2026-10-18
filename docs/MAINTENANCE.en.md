# Maintenance Log

[中文](../MAINTENANCE.md) | English | [日本語](MAINTENANCE.ja.md) | [偽中国語](MAINTENANCE.pcn.md)

dsh-api-balance package update changelog.

## 2026-10-18T11:11:11+09:00

**Summary**: feat(client): the panel height also eases over 220 ms when switching 「Usage ↔ Balance」

- the panel now uses an explicit height plus a transition; a ResizeObserver watches the content layer, so incoming balance data and re-wrapping follow too, not just the tab switch
- height = measured content + computed padding, clamped by maxHeight; the first frame keeps the natural height (no animation), and closing resets it to null
- `pagerHeightTransition` renamed to `heightTransition`, and the reduce-motion subscription extracted into `usePrefersReducedMotion` — one policy shared by both animation points
- criteria: `pager-transition` 5/5, `fullscreen-menu` 6/6, `header-menu-toggle` 5/5, voice selection all pass; **real interpolation and on-device feel not measured**

| Commit | Description |
|------|------|
| `041cae1` | feat(client): the panel height eases over 220 ms on 「Usage ↔ Balance」 switch |
| `b462928` | docs: four-language sync — the panel height transition |

## 2026-10-18T10:50:13+09:00

**Summary**: feat(client): the pager height change animates over 220 ms, respecting reduced motion

- the viewport container gets `transition: height 220ms ease`, the same length as the page slide; the first auto→number change is not interpolable, so no animation on mount
- subscribes to `prefers-reduced-motion` (with a legacy Safari fallback); under reduce, **both** height and slide snap immediately
- criteria: `test/pager-transition.test.mjs` 5/5 (including the 「only half disabled」 counterexample), the other suites 6/6 and 5/5; **real interpolation and on-device feel not measured**

| Commit | Description |
|------|------|
| `2c6a833` | feat(client): animate the pager height over 220 ms, respecting reduced motion |
| `1cd453d` | docs: four-language sync — the pager height transition |

## 2026-10-18T08:53:18+09:00

**Summary**: feat(client): a switch for the header-menu fullscreen row; the switch grid adapts 1/2/3 columns

- on by default; turning it off removes the menu row entirely (no dead entry); same-page immediacy comes from a self-dispatched CustomEvent — `storage` only fires in other tabs
- the switch area became a grid: at the 520px dialog, 3 columns need 470px and 4 need 630px, so wide 3 / medium 2 / phone 1, never more than 3
- each switch is now a card (title and toggle on one line, hint below) with `aria-labelledby` — screen readers no longer hear a bare 「on/off」
- criteria: `test/header-menu-toggle.test.mjs` 5/5 (two counterexamples), the older 6/6 still green; **visuals and real-device rotation not measured**

| Commit | Description |
|------|------|
| `b30dd88` | feat(client): a switch for the header-menu fullscreen row; adaptive 1/2/3-column switch grid |
| `6af1a53` | docs: four-language sync — the switch and the adaptive columns |

## 2026-10-18T08:22:45+09:00

**Summary**: feat(client): the 「…」 (more actions) menu gains a 「**Toggle fullscreen**」 row

- The menu's rows and open state belong to `@deepseek-ai/dsh-session-log-export`, and the slots contract has no menu-item contribution point — so it is **injected**: when the menu opens, one primitives `MenuItemButton` row is portaled into its items container
- The landing spot is the `role="presentation"` viewport, **not** the first child (that is the `aria-hidden` material layer); the menu is recognized by the anchor's `aria-busy` (the plugin always sets it) or by `aria-label` matching /更多|more/, and when neither matches nothing is injected (no row smuggled into the open-in-app dropdown)
- Not one line of keyboard code: the official Menu walks `querySelectorAll("button:not(:disabled)")` live over the DOM, so the injected row joins ArrowUp/Down, Home/End, Tab selection and Escape closing automatically; closing still belongs to the owner — click the anchor once (its onClick is the toggle) and hand focus back to it, so focus never falls to the body when the menu unmounts
- The label follows `fullscreenchange` between 「Toggle fullscreen」 and 「Exit fullscreen」; when `documentElement.requestFullscreen` does not exist (e.g. iOS Safari) the row is absent instead of being dead on click
- Criteria: `node test/fullscreen-menu.test.mjs` 6/6 — driven by the upstream DOM structure, with two counterexamples (a menu without `aria-busy` and with a non-matching label must be refused; a missing viewport must make it give up rather than dropping into the material layer)
- **Verification limit**: no browser control, so the visuals and real-device gesture are **not measured**; the upstream structure contract comes from reading the source, not from runtime observation — if this silently disappears after a dsh upgrade, check those four criteria first

| Commit | Description |
|------|------|
| `8169254` | feat(client): the 「…」 (more actions) menu gains a 「Toggle fullscreen」 row |

## 2026-10-08T16:38:01+09:00

**Summary**: fix(mobile): the keyboard guard now works as "**non-editable by default** + swallow programmatic focus"

- She reported it was failing again: the previous version armed on `focusout` and pressed the block back after a focus slipped through — **it cannot win that race**, since a single React commit can write `contenteditable` back to true and call `focus()`, and the keyboard is requested the instant focus lands (the same adversarial input against the old build: focus **landed on the editable composer**)
- Programmatic `focus()` is swallowed outright: a narrow patch that only swallows for the composer and its children, only while the guard is active and the user has no intent; anything unexpected falls through to the original logic (better one extra keyboard than a locked composer)
- A 700 ms user-intent window: tapped, keyed or typed input opens it, and typing keeps renewing it; **the element being edited is never pressed back** (that would cut off input mid-stroke)
- Criteria: a new counterexample **C12 · same-frame race** builds that exact sequence — the ON arm keeps focus out and the attribute pressed back to `false`, while the OFF arm (guard disabled) focuses successfully and logs 2 editable-focus events; the full suite passes 15/15

| Commit | Description |
|------|------|
| `a463488` | fix(mobile): keyboard guard rewritten as "non-editable by default + swallow programmatic focus" |
| `43f4d18` | docs: four-language sync of the guard mechanism (plus two stray kana removed from pcn) |

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
