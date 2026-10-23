# Maintenance Log

[中文](../MAINTENANCE.md) | English | [日本語](MAINTENANCE.ja.md) | [偽中国語](MAINTENANCE.pcn.md)

dsh-api-balance package update changelog.

## 2026-10-23T22:38:27+09:00

**Summary**: feat(client): a switch for the jump buttons, a collapse that is not fullscreen-only, and buttons that appear on the first screen

- Interface settings gained a 「Conversation previous / next message buttons」 row (on by default); turning it off removes the whole group
- collapsing the sidebar is now a peer of fullscreen: the handle is always there, one click collapses the expanded 280px or the 56px strip to 0; fullscreen keeps only 「collapse on entry」
- fixed 「sometimes the buttons do not appear until a session switch」: the poll now refreshes ready unconditionally — `bind` returns early while the scroller is still null, so the first screen never became ready
- measured (headless 770x834 with real clicks): jumper=true immediately after opening a session; outside fullscreen handle=true with cols 280px → one click → 0px, centerLeft 0
- criteria: `turn-jumper` 9/9, `rail-drawer` 17/17, others 6/6, 5/5, 10/10, 4/4, 6/6, 1/1

| Commit | Description |
|------|------|
| `cae96e9` | feat(client): switch, non-fullscreen collapse, first-screen buttons |

## 2026-10-23T12:04:04+09:00

**Summary**: fix(speech): prefetch between segments instead of waiting on each load

- symptom: the gap between a number and a fixed segment such as 「tokens」 was too long
- cause: everything loaded lazily per segment — a voice-pack segment only starts downloading after `new Audio` + `play()`, and each custom-TTS number costs one HTTP round trip; the next segment started only after the previous finished
- fix: while playing segment i, prefetch segment i+1 (`prepare(i + 1)`) — pack segments are `load()`ed with `preload=auto`, custom-TTS audio is fetched concurrently into an objectURL and reused on playback; `playAudioElement` plays an already-loaded element with a 15s safety timeout
- criteria: `speech-dedupe` 4/4 (prefetch assertions added), others 6/6, 5/5, 10/10, 16/16, 7/7, 6/6, 1/1
- **no listening test**: a headless environment cannot judge the real sound; this stops at structural criteria

| Commit | Description |
|------|------|
| `ba6bb07` | fix(speech): prefetch between segments |

## 2026-10-23T09:52:50+09:00

**Summary**: fix(speech): broadcasts no longer stack twice

- symptom: the daily / monthly broadcast repeated 「in」, 「tokens」 and 「CNY」 twice each
- cause: `stopActiveSpeech` only halted the current audio plus one `speechSynthesis.cancel`, while the voice pack is an awaited queue — the next broadcast started before the previous finished, and the two interleaved, which sounds like every word spoken twice; tapping the two chart tabs quickly triggers it reliably
- fix: a broadcast token `speechToken`; `playParts` checks it before each segment and returns when superseded; a 350ms debounce on the daily / monthly broadcast; `speakHungry` uses the same token
- criteria: `speech-dedupe` 3/3 (token, debounce, pack-vs-tts exclusivity), others 6/6, 5/5, 10/10, 16/16, 7/7, 6/6, 1/1

| Commit | Description |
|------|------|
| `f0ccb4e` | fix(speech): broadcasts no longer stack twice |

## 2026-10-23T09:31:37+09:00

**Summary**: fix(client): no more flashing back after repeated taps or an impossible jump

- the reported 「tapping again and again only flashes and snaps back」 has two sources: repeated taps re-trigger the automatic load (pulling several batches at once), and when a written scrollTop is anchored back the old code kept writing three frames, each one bounced
- fixes: `busyRef` swallows taps during the loading window; the write is re-checked one frame later and, if it did not land, the button goes `stuck` (disabled plus 「Cannot scroll here — scroll by hand first」) until the user scrolls once; a jump token makes only the newest attempt count
- measured (headless 770x834): one tap at the top grows rows 2→6; the next tap leaves mode=stuck with that label and the rows stop jittering
- criteria: `turn-jumper` 7/7, others 6/6, 5/5, 10/10, 16/16, 6/6, 1/1

| Commit | Description |
|------|------|
| `6e7b0b6` | fix(client): repeated taps and stuck jumps |

## 2026-10-23T09:19:48+09:00

**Summary**: fix(client): the pressed highlight follows the circle; previous-message jumps write across frames

- visuals: the mobile tap highlight is a square that pokes out of a round button. The system layer is removed (`-webkit-tap-highlight-color:transparent`), the pressed state is drawn in-house, and `overflow:hidden` clips it to the circle
- jumps now write across three frames, recomputing the drift each time; ordinary conversations land correctly
- **still not achieved**: after loading older history the jump cannot land — writing `scrollTop = 2500` reads back 2569, because DSH anchors programmatic scrolling back. The README limit now says 「scroll up by hand」 instead of 「click again」
- criteria: `turn-jumper` 6/6, others 6/6, 5/5, 10/10, 16/16, 6/6, 1/1

| Commit | Description |
|------|------|
| `3d4e128` | fix(client): pressed highlight and multi-frame jumps |

## 2026-10-23T07:58:36+09:00

**Summary**: feat(client): the up arrow expands collapsed history by itself, and looks different while doing it

- long conversations page older questions in (the official 「Load earlier」), so 「previous」 previously could not move
- when there is nothing to jump to above and the official button is available, one click presses it, waits 900ms, and jumps again (a single automatic load, attempt capped at 1)
- the up button becomes a double chevron with the 「Load earlier messages」 label and data-api-balance-mode="load", returning to a single chevron once loaded
- measured (headless 770x834): at the top rows=4 with the official button enabled and the up button in load mode; one click grows rows 4→6 and flips the mode back to jump
- **not achieved**: the jump after loading does not land — the new rows sit at rowTops -2687 / -1331 (above scrollTop = 0), a negative offset the virtual list never shows or scrolls to. Recorded as a known limit in the README
- criteria: turn-jumper 6/6, others 6/6, 5/5, 10/10, 16/16, 6/6, 1/1

| Commit | Description |
|------|------|
| `225a791` | feat(client): auto-expand collapsed history from the up arrow |

## 2026-10-23T07:51:21+09:00

**Summary**: feat(client): jump buttons linger 2.5s and reuse the icon strip's easing

- idle time 0.9s → 2.5s: the buttons vanished the instant scrolling stopped, which made them hard to see
- fade 200ms → 280ms, driven by `var(--dsh-ab-rail-duration)` / `var(--dsh-ab-rail-ease)` — the same non-linear curve as the fullscreen icon strip rather than a second set of numbers
- measured (headless, frame sampling): `data-visible` holds until 2505ms; the fade runs 1→0.75→0.54→0.37→0.25→0.17→0.11→0.07→0.05→0.03→0.02→0.01→0 in about 230ms, fast then slow; computed transition is `opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1)`
- criteria: `turn-jumper` 5/5, others 6/6, 5/5, 10/10, 16/16, 6/6, 1/1

| Commit | Description |
|------|------|
| `214c41d` | feat(client): linger 2.5s and reuse the icon strip easing |

## 2026-10-23T07:37:26+09:00

**Summary**: feat(client): previous/next message buttons in the conversation

- the official 「back to bottom」 round button becomes two: ↑ jumps to the nearest user message above the viewport, ↓ to the nearest one below, and smoothly to the bottom when there is no next message
- they fade in while scrolling and out after 900ms of stillness, with a non-linear ease that respects reduced-motion
- two traps hit: targets must use `scrollIntoView` (the virtual list folds a written `scrollTop` back to the old offset), and the official button must be matched as `button[class*="toBottom"]` (a bare `[class*="toBottom"]` hits the `toBottomSlot` wrapper first)
- measured (headless 770x834 with real mouse clicks): hidden at rest, shown while scrolling, auto-hidden after 900ms; both arrows align the target row to the viewport top
- criteria: `turn-jumper` 5/5, others 6/6, 5/5, 10/10, 16/16, 6/6, 1/1

| Commit | Description |
|------|------|
| `f488031` | feat(client): previous/next message buttons |

## 2026-10-21T12:28:43+09:00

**Summary**: docs: the fullscreen sidebar entry now covers easing, gaps and the keyboard

- the entry used to stop at 「hidden / pulled out」 and was missing the three things settled over the last three rounds: the 280ms non-linear ease (fast out, slow in; no motion under reduced-motion), the automatic left-gap balancing, and the page height following the on-screen keyboard on phones
- terminology fixed: the text now says explicitly that this is the 56px icon strip, not the 280px session list — a distinction that had been misread before
- criteria: the four languages keep the same `###` section count (9 each), and pcn carries no kana residue

| Commit | Description |
|------|------|
| `bd6adbd` | docs(README): fullscreen sidebar entry covers easing, gaps, keyboard |

## 2026-10-21T12:26:40+09:00

**Summary**: feat(client): non-linear easing for the icon strip

- 280ms with `cubic-bezier(0.22, 1, 0.36, 1)` (fast out, slow in); the padding compensation transitions with it so content never jumps
- the transition attribute is attached only for the 360ms the plugin rewrites the columns, and it must sit on the frame itself — a descendant selector (with a space) silently misses, which the measurement caught; the official `[data-animating]`/drag rules would otherwise make dragging sticky
- disabled entirely under `prefers-reduced-motion: reduce`
- frame-by-frame measurement (headless 770x834): reveal 0→14→26→35→42→46→50→52→53→56; hide 56→42→30→21→14→10→6→4→2→0
- criteria: `rail-drawer` 16/16, others 6/6, 5/5, 10/10, 6/6, 1/1

| Commit | Description |
|------|------|
| `980201d` | feat(client): non-linear easing for the icon strip |

## 2026-10-21T12:12:30+09:00

**Summary**: fix(client): content is centred again after the icon strip is hidden in fullscreen

- symptom: with the strip squeezed away, content sat 10px from the left and 17px from the right
- cause: the official collapsed layout is not prepared for a zero-width left column — the scrollbar gutter and container padding on the right remain while nothing is left on the left
- fix: while squeezing, measure the content column's own left/right gaps and write the difference into `--dsh-ab-gutter`; a collapsed-state `centerCol{padding-left}` applies it, and hiding it removes the variable. No hard-coded scrollbar width — the difference already contains it
- measured (headless 770x834): composer column 10/17 → **13/13**; row 29/33
- criteria: `rail-drawer` 15/15, others 6/6, 5/5, 10/10, 6/6, 1/1

| Commit | Description |
|------|------|
| `b65fcae` | fix(client): balance the content gaps after hiding the strip |

## 2026-10-21T11:31:42+09:00

**Summary**: fix(client): the handle now toggles the icon strip, not the session list

- corrected target: what should be hidden and pulled out is the 56px icon strip on the left (the official collapsed state), not the 280px session panel — the previous `layout.toggleSidebar()` flung the whole list open on the first click
- the handle now toggles only the 「squeeze the first column to 0px」 override: hidden ⟷ the official 56px strip; hiding only makes sense while collapsed, and nothing is squeezed when the list itself is expanded to 280px
- if the list happens to be at 280px, the handle folds it back to the strip first, then hides it
- measured (headless 770x834 phone viewport): fullscreen column 0px / centerLeft 0 → handle click 56px / centerLeft 56 (strip appears) → another click back to 0
- criteria: `rail-drawer` 14/14, others 6/6, 5/5, 10/10, 6/6, 1/1

| Commit | Description |
|------|------|
| `6ba8f5b` | fix(client): handle toggles the icon strip only |

## 2026-10-21T10:48:40+09:00

**Summary**: fix(client): the drawer mounts on the resident overlay, and fullscreen follows the keyboard

- reproduced with a phone viewport: the session header's utilities slot does not render at narrow widths, so the drawer never mounted — fullscreen had no handle at all (headless 770x834 showed `handle: null`)
- the drawer now mounts on AppFrame's resident `shell.overlay`, so the handle no longer depends on the current page
- after `requestFullscreen` the layout viewport does not shrink for the keyboard, so content was covered; while fullscreen the root height is pinned to `visualViewport.height` and removed on exit
- in the same reproduction the official 「Collapse sidebar」 button worked (280→0), so that report does not reproduce; likely a stale bundle on the device
- measured: handle appears, `centerLeft` 56→0, root height 834px; handle click 0→280; official collapse 280→0; simulated keyboard (834→534) moves the root height with it
- criteria: `rail-drawer` 13/13, others 6/6, 5/5, 10/10, 6/6, 1/1

| Commit | Description |
|------|------|
| `af105f7` | fix(client): resident overlay mount + visualViewport fitting |

## 2026-10-21T08:52:38+09:00

**Summary**: fix(client): grid-column parsing and fullscreen restore (verified in a headless browser)

- how it was measured: headless chromium 153 + CDP against the local GUI, with a Fetch interception swapping the plugin bundle for the working-tree version, driving the real 「More actions → Toggle fullscreen」 path
- bug 1: counting grid tracks with `split(/\s+/)` — `minmax(400px, 1fr)` contains spaces of its own, so three columns split into five, `layoutFrame()` was always null, and the whole drawer was inert
- bug 2: the unmount cleanup wrote the inline column snapshot back, overwriting the expanded columns React had just written
- fix: locate the frame by 「inline grid columns containing `minmax(` with a pixel first track」; squeeze the first track by regex-replacing that one value; move the restore into a resident `fullscreenchange` listener keyed on 「was the sidebar expanded before entering fullscreen」, waiting until the viewport is back above 1024 before toggling
- measured: entering fullscreen moves `centerLeft` 280→0 with `aria-expanded=false`; the handle takes it 0→280 with `true`; a second click returns to 0; leaving fullscreen returns to 280
- criteria: `rail-drawer` 11/11, others 6/6, 5/5, 10/10, 6/6, 1/1; **a real wide-screen fullscreen is not covered** (headless sets the viewport to 800, exercising the narrow branch)

| Commit | Description |
|------|------|
| `5a3f3c3` | fix(client): drawer column parsing and restore — verified headless |

## 2026-10-21T08:35:11+09:00

**Summary**: fix(client): the fullscreen sidebar drawer now only writes, never deletes, and follows the official collapse marker

- symptom (measured screenshot): the handle first expanded the session list, a second press could not put it back, and the handle icon was the opposite of the sidebar's real state
- mistake 1: using `getComputedStyle().gridTemplateColumns` as the base — mid-animation the computed value is an intermediate one, so writing it back inline as `!important` pins the animation
- mistake 2: using `removeProperty("grid-template-columns")` to lift the override — that declaration belongs to React, so deleting it makes React believe the value never changed and skip the next write, leaving the column at auto
- fix: locate the frame as 「the only div carrying an inline three-column `grid-template-columns`」 (`[data-sidebar-collapsed]` exists only while collapsed); track the collapse state through `MutationObserver` on that attribute; while collapsed only the first column is squeezed to `0px`, and expanding writes the recorded official value back
- criteria: `rail-drawer` 10/10 (three counter-assertions: the old selector, reading the computed column width, `removeProperty`), other suites 6/6, 5/5, 10/10, 6/6, 1/1 all pass; **the visual result and the narrow-viewport branch are still unmeasured (no browser control on this machine)**

| Commit | Description |
|------|------|
| `20d54cd` | fix(client): drawer only writes, follows the official collapse marker |

## 2026-10-21T08:11:13+09:00

**Summary**: feat(client): fullscreen sidebar now uses the official collapse, and only the first column is zeroed

- found the official capability: `dsh-client-ui-layout` exposes `layout.toggleSidebar()`, the frame carries `data-sidebar-collapsed`, and the collapsed width is `collapsedWidth = data-windows-titlebar ? 0 : 56` (that is the 「placeholder strip」)
- collapsing goes through the official API (added `layout` to inject); after collapsing, the first column becomes `0px` and the second `minmax(0,1fr)`, **all other columns untouched** (rewriting them all to 1fr is what broke the layout before)
- the override is written inline with `!important`; leaving fullscreen calls `removeProperty`; only a collapse this plugin caused is reverted
- removed the leftovers of the two earlier attempts: the fixed-overlay CSS, the rail markers, `RAIL_MOTION_MS`, drag/delayed-hide
- criteria: `rail-drawer` 8/8, other suites pass; **the narrow-viewport branch is not measured**

| Commit | Description |
|------|------|
| `f925ce1` | feat(client): official collapse + only the first column zeroed |

## 2026-10-21T08:03:33+09:00

**Summary**: revert(client): withdraw the grid-column collapse — it broke the session page layout

- symptom: content clipped past the left edge of the viewport and the rail covering the content (confirmed by screenshot); caused by the previous change to the parent's first column
- root cause: after rewriting `grid-template-columns` the content column still laid out against the old width and overflowed; the fixed rail then covered it
- action: revert that change and keep the known-acceptable degradation (a rail-wide gap stays after folding); folding/unfolding, the handle and delayed hiding are unchanged
- criteria: `rail-drawer` 11/11 (two counter-assertions: `collapseGridColumn` / `data-dsh-ab-rail-host` must not reappear), other suites pass; **whether the page is restored needs a real check**

| Commit | Description |
|------|------|
| `c797804` | revert(client): withdraw the grid-column collapse |

## 2026-10-21T07:55:27+09:00

**Summary**: fix(client): taking the rail out of flow is not enough — collapse the grid's first column to 0

- measured: the sidebar folded away but the content did not move left; a rail-wide gap stayed on the left
- root cause: the column width lives on the parent's `grid-template-columns`; `position: fixed` only removes the rail from flow, the first column still reserves space
- fix: walk up to the first grid ancestor and set `0px minmax(0, 1fr) …`; restore the original value when leaving fullscreen
- criteria: `rail-drawer` 12/12 (two new cases: collapse + restore); other suites pass; **non-grid layouts not covered**

| Commit | Description |
|------|------|
| `ecf3273` | fix(client): collapse the grid's first column so the content truly fills the width |

## 2026-10-21T07:49:21+09:00

**Summary**: fix(client): the rail is not found when fullscreen letterboxes the page (looser geometry, multi-point sampling)

- root cause: fullscreen leaves ~44px of black bars, so the rail's `left` is no longer 0 while the criterion still required `left <= 1`; `findLeftRail()` returned null, the rail was never tagged, and the handle did nothing
- fix: a pure `isRailBox` (height ≥60%, left ≤ min(72,12%v), width ≤220), multi-point sampling in `findLeftRail`, and a retry window; **no handle is rendered when the rail is missing**
- criteria: `rail-drawer` 10/10 (three new geometry cases); other suites pass; **the real bar width was not measured** — if it exceeds 72px the threshold needs adjusting

| Commit | Description |
|------|------|
| `5cadad2` | fix(client): find the rail when fullscreen letterboxes the page |

## 2026-10-21T07:40:51+09:00

**Summary**: feat(client): hide the sidebar in fullscreen, with an edge-handle drawer

- in fullscreen the rail becomes a `position: fixed` overlay and slides out of view, so the content fills the width at once; leaving fullscreen restores every attribute
- an edge handle: tap / keyboard / horizontal drag pulls the sidebar out and back; dragging tracks the pointer and the half-width threshold decides on release; the CSS transition stays interruptible
- `visibility: hidden` only after the slide-out ends (otherwise an empty shell slides out); a test asserts `RAIL_MOTION_MS` equals the CSS value
- new setting 「Hide the sidebar in fullscreen」, on by default, with its own storage key and event
- criteria: `rail-drawer` 7/7, other suites pass; **real fullscreen behaviour not measured** (no browser control)

| Commit | Description |
|------|------|
| `e9ddca2` | feat(client): hide the sidebar in fullscreen + edge-handle drawer |
| `8b9cce8` | docs: four-language sync — fullscreen sidebar drawer |

## 2026-10-20T02:56:04+09:00

**Summary**: fix(client): the last leak for the stuck width — a **stale closure** in the measurement effect

- after `settingsOpen` was removed from the dependencies, the callback still read the variable: while settings were open, any other dependency (balance data, resize) re-ran it with the old value `false`, so measurement ran and wrote 520 back
- fix: a `settingsOpenRef` synced on every render; the effect reads only the ref — not in the dependency array, never stale
- criteria: the four suites pass; **no unit test** (React closure timing) — recorded as such
- verification limit: needs a run where a re-run happens while settings stay open

| Commit | Description |
|------|------|
| `3dce8b7` | fix(client): the last width leak — stale closure in the measurement effect |

## 2026-10-20T02:10:12+09:00

**Summary**: fix(client): width measurement now reads the **intrinsic content width** (temporary `width:auto`)

- root cause: `el.scrollWidth` reports the current width filled by content, so transients (mid-transition values, the 520 settings view) were written back into `panelWidth` as fact
- fix: temporarily set `el.style.width = "auto"` (shrink-to-fit) before measuring, restore right after; combined with the existing record/restore effect
- criteria: the four suites pass; **still no unit test** (browser measurement behavior; no layout engine in Node) — recorded as such
- verification limit: no browser control; needs a real 「open settings → Back」 check

| Commit | Description |
|------|------|
| `1ae40d9` | fix(client): measure the intrinsic content width — no more treating transients as fact |

## 2026-10-19T08:39:44+09:00

**Summary**: fix(client): the real self-lock for the stuck width is at close time (measurement reads the in-flight transition)

- the previous fix only blocked writes while settings were open; the actual lock is on close: `scrollWidth` reads the intermediate width of the 520→old transition and stores it as `panelWidth`, so the target snaps back to 520
- fix: `settingsOpen` removed from the measurement effect's dependencies; a record/restore effect remembers the normal-view width on open and writes it back on close
- criteria: the four suites pass; **no unit test** (render × CSS transition interaction) — recorded as such
- verification limit: no browser control; needs a real 「open settings → Back」 check

| Commit | Description |
|------|------|
| `63462dd` | fix(client): the stuck-width self-lock — measurement reads the in-flight transition on close |

## 2026-10-19T08:29:50+09:00

**Summary**: fix(client): the panel keeps its expanded width after closing settings (measurement wrote the settings width into `panelWidth`)

- root cause: width measurement shares the positioning effect; while the settings view was open, a re-run (balance data, resize) measured the settings content (~520) and stored it as `panelWidth`, so closing could not shrink back
- fix: content width is measured only outside the settings view; `settingsOpen` added to the dependencies so closing re-measures the normal view and transitions back
- criteria: the four suites pass; **no unit coverage for this either** (React measurement timing) — recorded as such
- verification limit: no browser control; needs a real 「open settings → Back」 check after refresh

| Commit | Description |
|------|------|
| `a2a0a0a` | fix(client): panel width not restored after closing settings — measurement leaked the settings width |

## 2026-10-19T08:16:41+09:00

**Summary**: fix(client): the panel lands in the wrong place on its first open (missing `panelMounted` dependency)

- root cause: after last round's delayed mount, the first `open` ran the positioning effect while the DOM did not exist yet — `panelRef` was null, the effect bailed out, and the position stayed at `0/0`
- fix: the effect now depends on `panelMounted`; the position starts as null and the panel stays `visibility: hidden` until placed (one frame later beats a mispositioned panel)
- criteria: the four existing suites pass; **this timing bug has no unit coverage** — recorded as such
- verification limit: no browser control, so the first open after a refresh still needs the maintainer to confirm

| Commit | Description |
|------|------|
| `4a0ac8a` | fix(client): wrong first-open position — positioning effect missing `panelMounted` |

## 2026-10-18T12:46:23+09:00

**Summary**: feat(client): settings are inlined into the panel and expand it; panel show/hide is interruptible

- `SettingsModal` → `SettingsContent`: no overlay/shell; ⚙ expands the same panel to `min(520, available width)`, Back shrinks it
- closing the panel does not swap content immediately — the settings view stays through the fade-out and resets after unmount
- show/hide: mounts hidden, then flips visible on a double rAF (otherwise there is no start value); on close the DOM stays until the transition ends, and a quick toggle continues from the current state
- focus: the settings view autoFocuses 「Back」 and hands focus back to ⚙ on close; ⚙ uses `aria-expanded`
- criteria: `pager-transition` 10/10, the rest 6/6, 5/5, 6/6, voice all pass; **the look is not measured**

| Commit | Description |
|------|------|
| `02484c8` | feat(client): inline settings into the panel with expansion; interruptible show/hide |
| `ae4ac31` | docs: four-language sync — inline settings + panel show/hide |

## 2026-10-18T12:42:14+09:00

**Summary**: fix(usage): a readable error when the platform returns HTTP 200 with an empty body

- the root cause is not an invalid token: the gateway sometimes answers 200 + empty body, and the old `response.json()` threw 「Unexpected end of JSON input」
- `readJsonSafely` returns three states; an empty usage-window response is retried once (400 ms) before the readable message
- history months and the balance endpoint are handled the same way; `verifyPlatformToken` is three-state and keeps the local token when it cannot decide
- also fixed `fetchWithTimeout`: passing a signal swallowed the timeout, now `AbortSignal.any`
- criteria: `usage-body` 6/6, other suites pass; **a real platform empty response was not reproduced**

## 2026-10-18T12:25:46+09:00

**Summary**: feat(client): all animations use a non-linear curve, and the page slide is interruptible

- one `EASE_OUT = cubic-bezier(0.22, 1, 0.36, 1)` now drives heights, slide, dots and the recording pulse; the spinner **deliberately stays linear** (constant rotation is the correct look)
- interruption: pointerdown reads the computed transform as the drag base (`translateXOf` parses matrix/matrix3d), and `pagerOffset` = page base + base + dx — pressing no longer snaps back to the integer page
- height transitions (pager and panel) are CSS transitions already, so a new target resumes from the current interpolated value — now documented and pinned in tests
- criteria: `pager-transition` 8/8 (including 「must be cubic-bezier, not ease」, 2D/3D/none/garbage parsing, and 「interruption does not snap back」), the others 6/6, 5/5, voice all pass; **curve feel and on-device interruption not measured**

| Commit | Description |
|------|------|
| `fb9ff2b` | feat(client): non-linear easing everywhere, interruptible page slide |
| `26f672f` | docs: four-language sync — non-linear easing and interruption |

## 2026-10-18T11:55:18+09:00

**Summary**: verification: 「the height transition is missing」 was a misjudgement — it works, no code change

- check 1: dsh did restart (`ActiveEnterTimestamp` 02:15:38 UTC, exactly the restart scheduled the round before)
- check 2: fetched the served bundle with the launch token via curl — `panelContentRef` / `usePrefersReducedMotion` are both present (`rev=e34c17081b65`), so a refresh loads the new code
- the maintainer confirmed 「already working, I misread it」; the two planned enhancements (280 ms and tab-synced measurement) lacked evidence and were not applied
- docs: added one consolidated note that every transition deliberately respects reduced motion, including the order of checks

| Commit | Description |
|------|------|
| `56b10aa` | docs: consolidated note on 「reduced motion」 (all transitions deliberately respect it) |

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

## 2026-10-23T23:14:29+09:00

**Summary**: fix(client): the buttons light up on entering a conversation instead of waiting for a scroll

- symptom: after every refresh the buttons were missing until a session switch
- cause: they were lit only by the scroll event, and entering a conversation usually produces none (content already rendered, position already settled), so visible stayed false and the buttons existed with opacity 0; switching sessions triggers one scroll, which is why a switch seemed to fix it
- fix: light up for 4s after mount (booting, ignoring scrolling during that window); as soon as the scroller appears, set ready and reveal once (shownRef keeps it to once per conversation)
- measured (headless 770x834, with the workspace source intercepted): 250ms after entering data-visible=true (fading in) → 1.35s opacity=1 → 4.5s faded out
- **a harness trap**: earlier "fix has no effect" runs were loading the deployed build (the script had no Fetch interception), so the feature had not been tested at all; this entry supersedes those conclusions
- criteria: turn-jumper 9/9, others 6/6, 5/5, 10/10, 17/17, 4/4, 6/6, 1/1

| Commit | Description |
|------|------|
| 86d7045 | fix(client): light up on entering a conversation |
| e828738 | test: mount-window assertion moved to 4s |


## 2026-10-23T23:22:59+09:00

**Summary**: feat(client): the handle hugs the sidebar's right edge and follows its width

- the handle was pinned to the screen edge; it now sits on the element's edge
- inlineFirstPx() reads the first inline column; sync updates edge (no re-render when unchanged); the handle's left uses edge
- measured (headless 770x834, workspace source intercepted): sidebar open cols=280px with handle left=280; one click collapses to cols=0px with handle left=0
- **not done**: press-and-drag. That version (pointerdown/move/up) broke the component (the handle stopped rendering entirely) and was reverted; only the low-risk edge placement shipped
- criteria: rail-drawer 18/18, others 6/6, 5/5, 10/10, 4/4, 9/9, 6/6, 1/1

| Commit | Description |
|------|------|
| 58ca6ad | feat(client): handle hugs the sidebar edge |


## 2026-10-23T23:43:49+09:00

**Summary**: fix(client): the scroll listener moved to document capture, so one scroll lights the buttons

- symptom: after a refresh the buttons showed briefly, then never again until a session switch
- cause: scroll was bound to scrollBody, but the element that actually scrolls is not necessarily it (writing its scrollTop was already observed to be reverted, i.e. another layer owns scrolling). A finger scroll never reached the listener, so reveal never ran; a session switch remounts and shows the boot window again
- fix: listen for scroll on document at the capture phase (scroll does not bubble, but capture reaches any descendant), which also survives scroller replacement; the poll now only maintains ready and the first reveal
- measured (headless 770x834, source intercepted plus a real wheel event): handle present with left=280; after 4.5s visible=false; one wheel scroll visible=true; one click collapses to cols=0px and left=0
- criteria: turn-jumper 9/9, others 6/6, 5/5, 10/10, 18/18, 4/4, 6/6, 1/1

| Commit | Description |
|------|------|
| 27480b6 | fix(client): scroll listener on document capture |

