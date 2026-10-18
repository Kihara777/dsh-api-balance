# 維護記録

[中文](../MAINTENANCE.md) | [English](MAINTENANCE.en.md) | [日本語](MAINTENANCE.ja.md) | 偽中国語

dsh-api-balance 軟件更新維護記録。

## 2026-10-19T08:16:41+09:00

**摘要**：fix(client): panel 初回開時 位置偏移（定位 effect `panelMounted` 依存 欠落）

- 原因：前回 遅延 mount 後、最初 `open` 時 DOM 未存在 `panelRef` null、定位 effect 早期 return、位置 `0/0` 残留
- 修正：effect 依存 `panelMounted` 追加；位置初期値 null、配置迄 `visibility: hidden`（一 frame 遅 方、偏移 panel 良）
- 判据：既存 4 suite 全通過；**此種 timing 不具合 unit test 無**（其儘 記録）
- 検証限界：browser 制御 無、再読込後 初回 open 実機確認 要

| 提交 | 説明 |
|------|------|
| `4a0ac8a` | fix(client): 初回 open 位置偏移 —— 定位 effect `panelMounted` 欠落 |

## 2026-10-18T12:46:23+09:00

**摘要**：feat(client): 設定 panel 内 内聯化 拡張；panel 表示/非表示 中斷可能 遷移 化

- `SettingsModal` → `SettingsContent`：overlay 與 外殻 廃止；⚙ 同一 panel `min(520, 利用可能幅)` 迄 拡張、戻 縮
- panel 閉時 即座 通常 view 戻 不——fade-out 中 内容 保持、unmount 後 reset
- 表示/非表示：非表示状態 mount、二重 rAF 後 可視 切替（否則 補間起点 無）；閉時 遷移終了迄 DOM 残置、急速 開閉 現在値 続
- focus：設定 view「戻」autoFocus、閉後 ⚙ 帰；⚙ `aria-expanded` 使用
- 判据：`pager-transition` 10/10、他 6/6・5/5・6/6・音色 全通過；**見栄 未実測**

| 提交 | 説明 |
|------|------|
| `02484c8` | feat(client): 設定 panel 内 内聯化 拡張；中斷可能 表示/非表示 |
| `ae4ac31` | docs: 四語同期 —— 設定内聯化 與 panel 表示/非表示 |

## 2026-10-18T12:42:14+09:00

**摘要**：fix(usage): platform HTTP 200 + 空 body 返時 読可能 error 表示

- 原因 token 失効 非：gateway 時折 200 + 空 body 返、旧 `response.json()` 「Unexpected end of JSON input」投
- `readJsonSafely` 三態解析；用量 window 空応答 一度 retry（400ms）後 読可能 文案
- 履歴月 與 余額 endpoint 同様 処理；`verifyPlatformToken` 三態 化、判定不能時 local token 保持
- 併 `fetchWithTimeout` 修正：signal 渡時 timeout 無効化、`AbortSignal.any` 使用
- 判据：`usage-body` 6/6、他 suite 通過；**実際 空応答 再現 無**

## 2026-10-18T12:25:46+09:00

**摘要**：feat(client): 全 animation 非線形 easing 統一 + 頁切替 animation 中斷 可

- `EASE_OUT = cubic-bezier(0.22, 1, 0.36, 1)` 高度・移動・dot・録音 pulse 統一；回転 loader **意図的 linear 維持**（等速回転 正解）
- 中斷：pointerdown computed transform 読取 drag 基準（`translateXOf` matrix/matrix3d 解析）、`pagerOffset` = 頁基準 + base + dx——押時 整数頁 跳戻 不
- 高度 transition（頁切替・面板）元々 CSS transition、目標値 変時 現在補間値 続——文書 與 test 注記 明記
- 判据：`pager-transition` 8/8（「cubic-bezier 必須・ease 不可」「2D/3D/none/不正値」「中斷 跳戻 不」含）、他 6/6・5/5、音色 全通過；**曲線 見栄 與 実機 中斷感 未実測**

| 提交 | 説明 |
|------|------|
| `fb9ff2b` | feat(client): 全 animation 非線形、頁切替 中斷 可 |
| `26f672f` | docs: 四語同期 —— 非線形 easing 與 中斷 |

## 2026-10-18T11:55:18+09:00

**摘要**：検証：高度 transition「見 不」誤認——実際 有効、code 変更 無

- 判据 1：dsh 再起動済（`ActiveEnterTimestamp` 02:15:38 UTC、前回 仕掛 再起動 其物）
- 判据 2：`launch-token` 以 curl 配信中 bundle 取得——`panelContentRef` / `usePrefersReducedMotion` 存在（`rev=e34c17081b65`）。即 再読込 以 新 code
- 維護者「既 有効、先程 誤認」確認；予定 二強化（280ms・tab 同期計測）根拠 無 故 未実施
- 文書：「全 transition 視差軽減 意図的尊重」集約説明 追加、確認順 明記

| 提交 | 説明 |
|------|------|
| `56b10aa` | docs: 「減少動態効果」集約説明（全 transition 意図的尊重） |

## 2026-10-18T11:11:11+09:00

**摘要**：feat(client): 「用量 ↔ 余額」切替時 面板高度 220ms transition 追加

- 面板 明示 height + transition 化；ResizeObserver 内容層 監視、余額數據到着・折返 追従（標籤切替 限定 非）
- 高度 = 実測内容 + computed padding、maxHeight clamp；初回 自然高度 維持（animation 不）、閉時 null 戻
- `pagerHeightTransition` → `heightTransition` 改名、reduce 購読 `usePrefersReducedMotion` 抽出——二 animation 点 同一方針 共有
- 判据：`pager-transition` 5/5、`fullscreen-menu` 6/6、`header-menu-toggle` 5/5、音色選択 全通過；**実際 補間 與 実機 見栄 未実測**

| 提交 | 説明 |
|------|------|
| `041cae1` | feat(client): 「用量 ↔ 余額」切替時 面板高度 220ms transition |
| `b462928` | docs: 四語同期 —— 面板高度 transition |

## 2026-10-18T10:50:13+09:00

**摘要**：feat(client): 翻頁区域 高度変化 220ms transition 追加、「減少動態効果」尊重

- viewport 容器 `transition: height 220ms ease`、頁移動 同長；初回 auto→数値 補間 不能 故 animation 不
- `prefers-reduced-motion` 購読（旧 Safari fallback 付）；reduce 時 高度 與 移動 **両方** 即時 jump
- 判据：`test/pager-transition.test.mjs` 5/5（「片側 丈 無効」反例 含）、他 suite 6/6・5/5；**実際 補間 與 実機 見栄 未実測**

| 提交 | 説明 |
|------|------|
| `2c6a833` | feat(client): 翻頁区域 高度 220ms animation、「減少動態効果」尊重 |
| `1cd453d` | docs: 四語同期 —— 翻頁 高度 transition |

## 2026-10-18T08:53:18+09:00

**摘要**：feat(client): 設定 内 右上 menu 全屏行 switch 追加；switch 区域 1/2/3 列 自動可変

- 預設有効、off 時 menu 行 全 消失（無反応項目 残 不）；同 page 即時反映 自前 CustomEvent 発行——`storage` 他 tab 限定 発火
- switch 区域 grid 化：dialog 520px 下 3 列 470px・4 列 630px 必要、故 広 3 / 中間 2 / 手機 1、最大 3 列
- 各項目 card 化（title 與 switch 同行、説明 下）、`aria-labelledby` 追加——screen reader「開/関」丈 読 事 無
- 判据：`test/header-menu-toggle.test.mjs` 5/5（反例 2 件 含）、既存 6/6 緑；**見栄 與 実機回転 未実測**

| 提交 | 説明 |
|------|------|
| `b30dd88` | feat(client): 設定 内 右上 menu 全屏行 switch；switch 区域 1/2/3 列 自動可変 |
| `6af1a53` | docs: 四語同期 —— switch 與 自動列数 |

## 2026-10-18T08:22:45+09:00

**摘要**：feat(client): 右上「更多操作」menu **全屏切替** 一行 追加

- menu 行 與 開閉状態 `@deepseek-ai/dsh-session-log-export` 所有、slots 契約 内 menu-item contribution point 不存在——故**注入**：menu 開時 primitives `MenuItemButton` 一行 items container portal
- 落点 `role="presentation"` viewport、最初子要素 **不**（其 `aria-hidden` 材質層）。menu 認識 anchor `aria-busy`（該 plugin 常時設定）或 `aria-label` /更多|more/ 一致 以 行、両者 不合時 注入不（open-in-app dropdown 行 紛込 不）
- keyboard 一行 書 不：官方 Menu `querySelectorAll("button:not(:disabled)")` DOM 都度走査、注入行 自動 ArrowUp/Down・Home/End・Tab 選択・Escape 閉鎖 参加。閉仍 owner 責務——anchor 一度 click（onClick toggle 其）、focus anchor 帰（menu unmount 時 focus body 落 不）
- 表示 `fullscreenchange` 以「全屏切替 / 全屏終了」切替；`documentElement.requestFullscreen` 不存在時（iOS Safari 等）click 無反応行 出 不、行自身 出現 不
- 判据：`node test/fullscreen-menu.test.mjs` 6/6——上流 DOM 構造 以 判据 駆動、反例 2 件 含（`aria-busy` 無 且 label 不合 menu 拒否 事；viewport 無 場合 材質層 入 不 諦 事）
- **検証限界**：browser 制御 無、見栄 與 実機 gesture **未実測**。上流 構造契約 実行時観測 非 而 源码読解 基、dsh 更新後 此項目 静 消 場合、先 上記 4 判据 確認

| 提交 | 説明 |
|------|------|
| `8169254` | feat(client): 右上「…」menu「全屏切替」一行 追加 |

## 2026-10-08T16:38:01+09:00

**摘要**：fix(mobile): keyboard guard 「**既定 編集不可** + 程序性 focus 飲込」方式 変更

- 彼女 報告「又 失效」：前版 `focusout` 武装、聚焦漏後 押戻 —— **該競合 追 不及**。React 一 commit 即 `contenteditable` true 書戻 + `focus()` 呼出 可能、keyboard 於 focus 瞬間 要求（同一敵対入力 旧版 対：聚焦 **編集可能入力欄 着地**）
- 程序性 `focus()` 直接 飲込：狭 patch、入力欄 及 其子要素 限定・guard 有効 且 戸用意図 無時 限定；想定外 経路 元 logic 素通（余分 keyboard 一 回 > 入力欄 固 死）
- 700ms 戸用意図 window：tap / 按鍵 / 入力 開放、輸入中 更新継続；**編集中要素 絶対 押戻 不**（輸入 途中 断）
- 判据：新反例 **C12 · 同一 frame 競合** —— ON 臂 聚焦 不入 且 属性 `false` 押戻、OFF 臂（開関 OFF）聚焦成功 且 可編集聚焦 event 2 件；全量 15/15 通過

| 提交 | 説明 |
|------|------|
| `a463488` | fix(mobile): keyboard guard 「既定 編集不可 + 程序性 focus 飲込」方式 変更 |
| `43f4d18` | docs: guard 機構 四語同期（pcn 游离仮名 2 処 除去） |

## 2026-10-05T14:20:10+09:00

**摘要**：fix(client): 疑問 window 漸隠 **scroll 連動** 変更（題干上下両端）

- 題干上下両端 漸隠、且 該側 実際 内容 残時 限定 淡化（`none` / `start` / `end` / `middle` 四状態）
- 札 上端 限定 漸隠 —— 札全体 mask 追従按鈕 共 淡 成；按鈕下方 同色 埋 塞
- 判据：build 産物 対 14 項目 UI 判据（scroll 三状態 assertion 含）全通過

| 提交 | 説明 |
|------|------|
| `f39c816` | fix(client): 漸隠 **scroll 連動**（上下両端）変更、按鈕下方 隙間 塞 |

## 2026-10-05T13:58:13+09:00

**摘要**：fix(client): 疑問 window 下端 漸隠 mask 追加 —— 題干下端 與 追従按鈕上方 一刀切 不

- 題干下端 `mask` 漸隠；追従按鈕上方 `::before` 漸変帯
- 漸変色 札**実際底色** 取得（light `rgb(255,255,255)` / dark `rgb(44,44,46)`）—— 固定色 dark 露見
- 判据：題干下端 30px 平均輝度 59.93 → 45.92（約 23% 暗）、其上 帯 不変；部署版 同 assertion 実測 FAIL

| 提交 | 説明 |
|------|------|
| `4cf04a0` | fix(client): 疑問 window 下端 漸隠 mask 追加 —— 題干下端 與 追従按鈕上方 一刀切 不 |

## 2026-10-05T13:22:34+09:00

**摘要**：fix(client): 底部統計条 横 scroll **停用**；長題干 選択肢 遮蔽不

- 統計条：dsh 0.2.0 各指標 **click 可能 pill** 化（開即「session 統計」dialog）、行内 scroll 不要 且 pill gesture 競合
- style 注入不、設定行 置灰 官方方案 明記；旧注入 `retireStatsScrollCss()` 清掃
- 疑問 window：長題干 header 実測 948px 対 札可視域 僅 398px、吸頂 不透明 header 遮蔽板 成
- header 高 制限（≤40vh）自身 scroll 化 吸頂 廃止、選択肢 視口内 復帰

| 提交 | 説明 |
|------|------|
| `e6d638c` | fix(client): 統計条 横 scroll 停用 + 長題干 選択肢 遮蔽不 |

## 2026-10-05T07:13:39+09:00

**摘要**：fix(mobile): keyboard 守護 「focus 編集可能要素 落下不」方式 変更

- 実測 実際 `focusin` **cancel 不可**（旧 `preventDefault` 死 code）
- 軟 keyboard `focus` 瞬間 要求 —— session 切替 二度連続 focus、後 blur 事後処理 過
- 入力欄 戸用 tap 以前 編集不可；tap / 按鍵 即時復帰、焦点離脱 再武装
- 判据：session 切替中「編集可能入力欄 focus 落下」回数 0（旧版 2）、tap 後 入力可

| 提交 | 説明 |
|------|------|
| `7adb94a` | fix(mobile): keyboard 守護 「focus 編集可能要素 落下不」方式 変更 |

## 2026-10-03T07:18:53+09:00

**摘要**：fix(client): UI 改善 二件 **静 死**

- 統計条 横 scroll **dsh 0.1.5 以降 一度 不効**：上流 style module `StatsLine.module.css` → `StatsPills.module.css` 改名、插件 旧名 限定 認識 → style tag 発見不能 → 5 回 retry 後 自己削除、設定行 依然 On 表示
- 三 token 0.2.0 存在不：`--dsw-alias-separator-primary` fallback 無 → `currentColor`＝文字色 退化；danger / warning 固定値 凌
- 両 module 名 試行、0.2.0 対応 token 連結（固定値 0.1.x 用 末尾 残置）

| 提交 | 説明 |
|------|------|
| `8dab668` | fix(client): UI 改善 二件 静 失敗 修正 —— style module 改名 與 存在不 三 token |

## 2026-10-03T06:24:10+09:00

**摘要**：fix(client): panel / dialog 質感 0.2.0 native 配方 書直；Enter 交換 設置 component lifecycle 外 移動

- 0.2.0 `--dsw-specific-menu` 実色 → **半透明 fill** 変更、native 浮層 更 `backdrop-filter: var(--dsw-menu-backdrop-filter)` 重 初 形成 —— 旧配方 維持 panel 真 透明 成
- modal 不透明 `--dsw-alias-bg-layer-2` + elevation 変更；二質感 混用 不可
- composer 鏈式 slot 化後、質問 / 承認 / subagent composer 引継時 ring component 共 unmount、Enter 交換 共 外、画面 完全 正常 見
- 今 `apply()` 内 設置

| 提交 | 説明 |
|------|------|
| `cc89c43` | fix(client): Enter 交換 設置 component lifecycle 外 移動 |
| `700fbbc` | fix(client): panel / dialog 質感 0.2.0 native 配方 書直 —— menu 透明 不 成 |

## 2026-09-28T13:06:27+09:00

**摘要**：fix(voice): 音色 「話 変体」選択

- 普通話 要求 広東語 音色 拾 不
- 回帰 test `test/voice-selection.test.mjs` 付

| 提交 | 説明 |
|------|------|
| `76ea584` | fix(voice): 音色 「話 変体」選択 —— 普通話 要求 広東語 音色 拾 不 |

## 2026-09-16T14:49:41+09:00

**摘要**：dsh-api-balance 0.1.1 — 新規 package：API 使用量・残高 插件

- webui 使用量 ring popover 内「使用量 / 残高」tab 切替
- account 残高、使用量 内訳、platform token 自動取得、音声 播報

| 提交 | 説明 |
|------|------|
| `c47f857` | feat: dsh-api-balance — API 使用量・残高 插件 |

| 軟件名 | 版本 |
|--------|------|
| dsh-api-balance | 新規 v0.1.1 |
