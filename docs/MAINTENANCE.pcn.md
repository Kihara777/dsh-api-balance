# 維護記録

[中文](../MAINTENANCE.md) | [English](MAINTENANCE.en.md) | [日本語](MAINTENANCE.ja.md) | 偽中国語

dsh-api-balance 軟件更新維護記録。

## 2026-10-23T12:04:04+09:00

**摘要**：fix(speech): segment 間 先読、読込待 無

- 症状：数字 與「token」等 固定 segment 間隔 長 過
- 原因：毎回 其場 読込——音声 pack segment `new Audio` 後 `play()` 初 download 開始、custom TTS 数字 毎回 HTTP 往復 必要。前 segment 終 後 次 開始、間 空白 発生
- 対策：segment i 再生中 i+1 先読（`prepare(i + 1)`）。pack `preload=auto` `load()`、custom TTS 並行取得 objectURL 再利用。`playAudioElement` 追加、読込済 element 15 秒 保険 付 再生
- 判据：`speech-dedupe` 4/4（先読 断言 追加）、他 6/6、5/5、10/10、16/16、7/7、6/6、1/1
- **聴感 実測 無**：headless 環境 実際 聞 判定 不 可。此処 構造 判据 迄

| 提交 | 説明 |
|------|------|
| `ba6bb07` | fix(speech): segment 間 先読 |

## 2026-10-23T09:52:50+09:00

**摘要**：fix(speech): 音声 二重 重 不

- 症状：日別 / 月別 読上「入」「token」「人民元」各 二回 聞
- 原因：`stopActiveSpeech` 現在 音声 與 `speechSynthesis.cancel` 一回 停止 限定。音声 pack 逐次 await queue、前列 終 前 次 開始 二列 交錯——chart tab 早押 必 発生
- 対策：読上 token `speechToken` 導入、`playParts` 各 segment 前 確認 置換 済 場合 return。日別 / 月別 350ms debounce。`speakHungry` 同 token 使用
- 判据：`speech-dedupe` 3/3（token、debounce、pack 與 tts 排他）、他 6/6、5/5、10/10、16/16、7/7、6/6、1/1

| 提交 | 説明 |
|------|------|
| `f0ccb4e` | fix(speech): 音声 二重 再生 解消 |

## 2026-10-23T09:31:37+09:00

**摘要**：fix(client): 連続 tap 與「scroll 不能」再 点滅 不

- 報告「連続 上 押、何度押 一瞬 光 元 戻 只」二 原因：連続 tap 自動 load 再 触发（複数 batch 一度 引）、書込 scrollTop anchor 戻 場合 旧実装 三 frame 書続 毎回 弾
- 対策：load 中 `busyRef` tap 無視。書込 一 frame 後 再確認、届 不 場合 `stuck` 化 button 無効（「此画面 scroll 不能 — 先 手動 scroll」）。一度 scroll 元 戻。更 跳転 token 最新 試行 有効
- 実測（headless 770x834）：最上部 一度押 rows 2→6。次 tap 後 mode=stuck 該 label、行位置 揺 無
- 判据：`turn-jumper` 7/7、他 6/6、5/5、10/10、16/16、6/6、1/1

| 提交 | 説明 |
|------|------|
| `6e7b0b6` | fix(client): 連続 tap 與 stuck 移動 |

## 2026-10-23T09:19:48+09:00

**摘要**：fix(client): 押下 highlight 円 沿、移動 複数 frame 書込

- 見：mobile 既定 tap highlight 四角、丸 button 角 出。system 層 外（`-webkit-tap-highlight-color:transparent`）、押下状態 自前 描、`overflow:hidden` 円 沿 切取
- 移動 三 frame 書込、毎回 其時点 位置 差分 再計算。通常 会話 届
- **未達 継続**：古 履歴 load 後 届 不——`scrollTop = 2500` 書 2569 返、DSH anchor 処理 program scroll 戻。README 既知 制限「再押」→「手動 上 scroll」修正
- 判据：`turn-jumper` 6/6、他 6/6、5/5、10/10、16/16、6/6、1/1

| 提交 | 説明 |
|------|------|
| `3d4e128` | fix(client): 押下 highlight 與 複数 frame 移動 |

## 2026-10-23T07:58:36+09:00

**摘要**：feat(client): 上矢印 折畳履歴 自動 展開、其間 icon 変化

- 会話 長 時 履歴 page 単位 読込（公式「以前 message load」）、以前「前」移動 不
- 上 移動可能 行 無 且 公式 button 使用可能 時、一度 押、900ms 待 再度 移動（自動 load 一層 限定、attempt 上限 1）
- 上 button 二重山形 変化、label「以前 message load」、data-api-balance-mode="load" 付。load 後 単一山形 戻
- 実測（headless 770x834）：最上部 rows=4、公式 button 有効、上 button load mode 二重山形。一度押 rows 4→6、mode jump 戻
- **未達**：load 後 移動 届 不——新行 rowTops -2687 / -1331（scrollTop = 0 上）位置、仮想 list 負 offset 置 為 表示 移動 不 可。README 既知 制限 記載
- 判据：turn-jumper 6/6、他 6/6、5/5、10/10、16/16、6/6、1/1

| 提交 | 説明 |
|------|------|
| `225a791` | feat(client): 上矢印 折畳履歴 自動 展開 |

## 2026-10-23T07:51:21+09:00

**摘要**：feat(client): 跳躍 button 滞留 2.5 秒、fade 図標列 同 easing 共用

- 滞留 0.9 秒 → 2.5 秒：scroll 停止 瞬間 消、見 不
- fade 200ms → 280ms、`var(--dsh-ab-rail-duration)` / `var(--dsh-ab-rail-ease)` 使用、全屏 図標列 同 非線形 curve 統一（別 数値 持 不）
- 実測（headless、frame 単位 sampling）：`data-visible` 2505ms 迄 維持。fade 1→0.75→0.54→0.37→0.25→0.17→0.11→0.07→0.05→0.03→0.02→0.01→0 約 230ms、速 出 徐 止。computed transition `opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1)`
- 判据：`turn-jumper` 5/5、他 6/6、5/5、10/10、16/16、6/6、1/1

| 提交 | 説明 |
|------|------|
| `214c41d` | feat(client): 滞留 2.5 秒 與 図標列 easing 共用 |

## 2026-10-23T07:37:26+09:00

**摘要**：feat(client): 会話 前質問 / 次質問 丸 button 二 追加

- 公式 右下「最下部 戻」丸 button 上下 二 置換：↑ viewport 上 最近 用戸 message、↓ 下 最近 者。次 無 時 滑 最下部
- scroll 中 fade in、停止 900ms fade out。非線形 easing、減少動效 尊重
- 二 落穴：目標行 `scrollIntoView` 必須（仮想 list 書込 `scrollTop` 旧 offset 戻）、公式 button `button[class*="toBottom"]` 精密 選択（`[class*="toBottom"]` `toBottomSlot` 先 拾）
- 実測（headless 770x834、実 mouse 操作）：静止 非表示、scroll 表示、900ms 自動 非表示。↑↓ 共 目標行 viewport 上端 整
- 判据：`turn-jumper` 5/5、他 6/6、5/5、10/10、16/16、6/6、1/1

| 提交 | 説明 |
|------|------|
| `f488031` | feat(client): 前 / 次 質問 button |

## 2026-10-21T12:28:43+09:00

**摘要**：docs: 全屏側欄 条項 緩動・余白・keyboard 補足

- 該条項 以前「隠・引出」迄 記述、最近 三輪 確定 三件 欠：280ms 非線形 easing（速 出 徐 止。減少動效 時 動 不）、隠 時 左余白 自動 補正、手機 keyboard 表示 伴 本文 高 追従
- 用語 整：本文 指 56px 図標列、280px session list 非——以前 此処 取違 有
- 判据：四言語 `###` 見出 数 一致（各 9）、pcn 仮名 残留 無

| 提交 | 説明 |
|------|------|
| `bd6adbd` | docs(README): 全屏側欄 条項 緩動・余白・keyboard 補足 |

## 2026-10-21T12:26:40+09:00

**摘要**：feat(client): 図標列 表示・非表示 非線形 easing

- 280ms、`cubic-bezier(0.22, 1, 0.36, 1)`（速 出 徐 止）。padding 補償 同時 遷移、内容 飛 不
- transition 属性 插件 列幅 書換 360ms 間 限定 付、且 **frame 自身** 付——子孫 selector（空白 有）一致 不、実測 踏。公式 `[data-animating]`／drag 時 別規則 有、付 放 時 drag 粘
- `prefers-reduced-motion: reduce` 時 全体 無効
- frame 単位 実測（headless 770x834）：表示 0→14→26→35→42→46→50→52→53→56、収納 56→42→30→21→14→10→6→4→2→0
- 判据：`rail-drawer` 16/16、他 6/6、5/5、10/10、6/6、1/1

| 提交 | 説明 |
|------|------|
| `980201d` | feat(client): 図標列 非線形 easing |

## 2026-10-21T12:12:30+09:00

**摘要**：fix(client): 全屏 図標列 隠 後、左右 余白 揃

- 症状：図標列 圧縮 後、内容 左 10px・右 17px、左詰 見
- 原因：公式 折畳 layout「左列 0 幅」想定 無——右側 scrollbar 分 與 container 内余白 残、左側 何 残 不
- 改法：圧縮時 内容列 自身 左右余白 測定、差 `--dsh-ab-gutter` 書、折畳状態 `centerCol{padding-left}` 左 補。非表示 解除 時 変数 外。scrollbar 幅 固定 不——差 中 自然 含
- 実測（headless 770x834）：composer 列 10/17 → **13/13**、row 29/33
- 判据：`rail-drawer` 15/15、他 6/6、5/5、10/10、6/6、1/1

| 提交 | 説明 |
|------|------|
| `b65fcae` | fix(client): 図標列 隠 後 左右余白 揃 |

## 2026-10-21T11:31:42+09:00

**摘要**：fix(client): 把手 図標列 只管、session list 展開 不

- 目標 修正：隠・引出 対象 左 56px 図標列（公式 折畳状態）、280px session panel 非。以前 `layout.toggleSidebar()` 一 click 一覧全体 展開
- 把手「先頭列 0px 圧縮」覆蓋 只 切替：非表示 ⟷ 公式 56px 図標列。隠 可能 公式 折畳状態 時 限定、一覧 280px 展開 時 圧縮 不
- 一覧 280px 時、先 図標列 折畳 後 隠
- 実測（headless 770x834 手機視口）：全屏 列 0px / centerLeft 0 → 把手 押 56px / centerLeft 56（図標列 出現）→ 再押 0
- 判据：`rail-drawer` 14/14、他 6/6、5/5、10/10、6/6、1/1

| 提交 | 説明 |
|------|------|
| `6ba8f5b` | fix(client): 把手 図標列 只管 |

## 2026-10-21T10:48:40+09:00

**摘要**：fix(client): drawer 常駐 overlay 搭載、全屏時 keyboard 追従

- 手機窄幅 viewport 再現：session header utilities slot 不描画、drawer 未 mount——全屏 把手 完全不現（headless 770x834 `handle: null`）
- AppFrame 常駐 slot `shell.overlay` 搭載変更、把手 現 page 非依存
- `requestFullscreen` 後 layout viewport keyboard 縮 不、内容 隠。全屏中 `visualViewport.height` 根高固定、解除時 撤去
- 同再現 公式「Collapse sidebar」正常（280→0）、該報告 再現 不、端末側 旧 bundle 推測
- 実測：全屏 後 把手 出現、`centerLeft` 56→0、根高 834px；把手 押 0→280；公式 折畳 280→0；keyboard 模擬（834→534）根高 追従
- 判据：`rail-drawer` 13/13、他 6/6、5/5、10/10、6/6、1/1

| 提交 | 説明 |
|------|------|
| `af105f7` | fix(client): 常駐 overlay 化 與 visualViewport 追従 |

## 2026-10-21T08:52:38+09:00

**摘要**：fix(client): 格子列 解析 與 全屏解除時 復元 修正（headless 実測 通過）

- 実測手段：headless chromium 153 + CDP 本機 GUI 接続、Fetch 插件 bundle 工作区新版 差替、実際「他操作 → 全屏切替」経路 操作
- 錯誤一：`split(/\s+/)` 格子列数 計上——`minmax(400px, 1fr)` 内部 空白 持、三列 五分割、`layoutFrame()` 常 null、drawer 存在 同等 無
- 錯誤二：unmount 後始末 内聯列 snapshot 書戻、React 直後 書 展開状態 折畳値 上書
- 改法：frame「内聯列 `minmax(` 含 且 先頭列 pixel 値」特定；先頭列 圧縮 該一値 正規表現 置換；復元 常駐 `fullscreenchange` 移行、「全屏入前 展開 有無」判断、viewport 1024 以上 復帰 待 後 toggle
- 実測：全屏入 `centerLeft` 280→0、把手 `aria-expanded=false`；把手 0→280、`true`；再押 0；全屏解除 280 復帰
- 判据：`rail-drawer` 11/11、他 6/6、5/5、10/10、6/6、1/1；**実機 広画面 全屏 未確認**（headless 全屏時 viewport 800、窄幅 branch 通過）

| 提交 | 説明 |
|------|------|
| `5a3f3c3` | fix(client): 列解析 與 復元 修正 —— headless 実測済 |

## 2026-10-21T08:35:11+09:00

**摘要**：fix(client): 全屏側欄 drawer「只写不刪」化、官方折畳標記 追従

- 症状（実測 screenshot）：把手 押 時 先 会話 list 展開、再押 也 収納 不能、把手 icon 側欄 実状態 相反
- 錯誤一：`getComputedStyle().gridTemplateColumns` 基数 使用——折畳 animation 進行中 中間値 読取、内聯 `!important` 書戻 等 於 animation 固定
- 錯誤二：`removeProperty("grid-template-columns")` 覆蓋 收回——該 declaration React 管理、削除後 React「値 不変」判断 再書 不、列幅 auto 退行
- 改法：frame 定位「唯一 内聯 三列 `grid-template-columns` 持 div」変更（`[data-sidebar-collapsed]` 折畳時 限定 存在）；折畳状態 `MutationObserver` 該属性 追従；折畳時 第一列 只 `0px` 圧縮、展開時 記録 官方値 書戻
- 判据：`rail-drawer` 10/10（三 反証 含：旧 selector 定位・computed 列幅 読取・`removeProperty`）、他 suite 6/6、5/5、10/10、6/6、1/1 全通過；**画面 観感 與 窄幅 branch 未実測（本機 browser 控制 無）**

| 提交 | 説明 |
|------|------|
| `20d54cd` | fix(client): 全屏側欄 drawer 只写不刪 化、官方折畳標記 追従 |

## 2026-10-21T08:11:13+09:00

**摘要**：feat(client): 全屏側欄 公式折畳 変更 + 第 1 列 丈 0 化

- 公式能力 発見：`dsh-client-ui-layout` `layout.toggleSidebar()` 提供、frame `data-sidebar-collapsed` 付、折畳幅 `collapsedWidth = data-windows-titlebar ? 0 : 56`（此 即「占位条」）
- 折畳 公式 API 経由（inject `layout` 追加）；折畳後 第 1 列 `0px`、第 2 列 `minmax(0,1fr)`、**他列 原様**（全部 1fr 化 前回 layout 破壊 原因）
- 上書 `!important` inline、終了時 `removeProperty`；自 折畳 場合 丈 戻
- 前 2 版 残骸 削除：fixed overlay CSS、rail marker、`RAIL_MOTION_MS`、drag/遅延非表示
- 判据：`rail-drawer` 8/8、他 suite 通過；**狭幅 branch 未実測**

| 提交 | 説明 |
|------|------|
| `f925ce1` | feat(client): 公式折畳 + 第 1 列 0 化 |

## 2026-10-21T08:03:33+09:00

**摘要**：revert(client): grid 列潰 撤回 —— session page layout 破壊

- 症状：内容 viewport 左外 溢出 裁切、rail 内容 覆（screenshot 確認）。前版「親第 1 列 0px」原因
- 原因：`grid-template-columns` 書換 後 内容列 旧列幅 計算 溢出。fixed rail 其上 重
- 対応：該変更 撤回、既知 許容 劣化（畳後 rail 幅 空白 残）保持。開閉・把手・遅延非表示 不変
- 判据：`rail-drawer` 11/11（反証 2 件：`collapseGridColumn` / `data-dsh-ab-rail-host` 再導入 不）、他 suite 通過；**page 復帰 実機確認 要**

| 提交 | 説明 |
|------|------|
| `c797804` | revert(client): grid 列潰 撤回 |

## 2026-10-21T07:55:27+09:00

**摘要**：fix(client): rail 流 外 丈 不足 —— grid 第 1 列 0 潰

- 実測：側欄 畳 成 功、本文 左 移動 不、左 側 rail 幅 空白 残留
- 原因：列幅 親 `grid-template-columns` 在、`position: fixed` rail 流 外 丈、第 1 列 場所 確保 残
- 修正：祖先 最初 grid 容器 求、`0px minmax(0, 1fr) …` 変更；全屏終了時 元値 書戻
- 判据：`rail-drawer` 12/12（潰/復元 2 件 追加）；他 suite 通過；**grid 以外 layout 未対応**

| 提交 | 説明 |
|------|------|
| `ecf3273` | fix(client): grid 第 1 列 潰 本文 幅 一杯 |

## 2026-10-21T07:49:21+09:00

**摘要**：fix(client): 全屏 letterbox 時 rail 発見不能（幾何判据 緩和 + 多点 sampling）

- 原因：全屏 左右 ~44px 黒帯、rail `left` 0 非、`left <= 1` 判据 null 返 → rail 標記 無、把手 無反応
- 修正：純関数 `isRailBox`（高 ≥60%、left ≤ min(72,12%v)、幅 ≤220）、`findLeftRail` 多点 sampling + retry；**rail 無時 把手 描画 不**
- 判据：`rail-drawer` 10/10（幾何 case 3 件 追加）；他 suite 通過；**実際 黒帯幅 未実測**、72px 超時 再調整 要

| 提交 | 説明 |
|------|------|
| `5cadad2` | fix(client): 全屏黒帯時 rail 発見 |

## 2026-10-21T07:40:51+09:00

**摘要**：feat(client): 全屏時 側欄 隠 + 左縁把手 drawer

- 全屏中 rail `position: fixed` 覆層 化、画面外 滑出。本文 即座 幅 一杯 占；終了時 全 属性 原 戻
- 左縁 把手：tap / keyboard / 横 drag 引 出・収納。drag 指 追従、離時 半幅 阈值 決定；CSS transition 中断 可能
- `visibility: hidden` 滑出 終後（否 空殻 滑）；`RAIL_MOTION_MS` 與 CSS 値 同 値 測試 断言
- 新設定「全屏時 側欄 隠」、預設有効、専用 保存 key 與 event
- 判据：`rail-drawer` 7/7、他 suite 通過；**実際 全屏動作 未実測**（browser 制御 無）

| 提交 | 説明 |
|------|------|
| `e9ddca2` | feat(client): 全屏時 側欄 隠 + 把手 drawer |
| `8b9cce8` | docs: 四語同期 —— 全屏時 drawer |

## 2026-10-20T02:56:04+09:00

**摘要**：fix(client): 幅 卡 最終漏口 —— 計測 effect **陳旧 closure**

- `settingsOpen` 依存 除外 後 亦 callback 変数 読：設定表示中 他依存（余額數據、resize）再実行時 旧値 `false` 読、計測 走 520 書戻
- 修正：`settingsOpenRef` 毎 render 同期、effect ref 丈 読——依存 戻 不、旧値 読 不
- 判据：既存 4 suite 全通過；**unit test 無**（React closure timing）、其儘 記録
- 検証限界：設定表示中 再実行 起 状況 実機確認 要

| 提交 | 説明 |
|------|------|
| `3dce8b7` | fix(client): 幅 最終漏口 —— 計測 effect 陳旧 closure |

## 2026-10-20T02:10:12+09:00

**摘要**：fix(client): 幅計測 **内容固有幅** 変更（一時 `width:auto`）

- 根：`el.scrollWidth` 「現在幅 内容 埋 値」返、故 過渡値・設定 view 520 事実 扱 `panelWidth` 書戻
- 修正：計測前 一時 `el.style.width = "auto"`（shrink-to-fit）内容自然幅 読、直後 戻；既存 記録/復元 effect 併用
- 判据：既存 4 suite 全通過；**unit test 依然 無**（browser 計測挙動、Node layout engine 無）、其儘 記録
- 検証限界：browser 制御 無、「設定開 → 戻」実機確認 要

| 提交 | 説明 |
|------|------|
| `1ae40d9` | fix(client): 内容固有幅 計測 —— 過渡値 事実 扱 不 |

## 2026-10-19T08:39:44+09:00

**摘要**：fix(client): 設定閉後 幅 卡住 **自鎖点**（閉瞬間 計測 遷移中値 読取）

- 前版 「設定表示中 書込」 丈 塞；実際 自鎖 閉時：`scrollWidth` 520→旧幅 遷移中間値 読、`panelWidth` 書戻、目標 520 戻
- 修正：計測 effect 依存 `settingsOpen` 除外；記録/復元 effect 追加、閉時 開前 幅 其儘 書戻
- 判据：既存 4 suite 全通過；**unit test 無**（描画 × CSS 遷移 相互作用）、其儘 記録
- 検証限界：browser 制御 無、「設定開 → 戻」実機確認 要

| 提交 | 説明 |
|------|------|
| `63462dd` | fix(client): 幅 卡 自鎖点 —— 閉瞬間 計測 遷移中値 読取 |

## 2026-10-19T08:29:50+09:00

**摘要**：fix(client): 設定閉後 幅 不回縮（計測 設定 view 幅 `panelWidth` 書込）

- 原因：幅計測 定位 effect 同居、設定 view 中 `balance`／resize 再実行時 設定内容 幅（約 520）`panelWidth` 保存、閉後 縮 不
- 修正：内容幅 計測 **設定 view 以外** 限定；依存 `settingsOpen` 追加、閉時 通常 view 再計測 元幅 戻
- 判据：既存 4 suite 全通過；**此亦 unit test 無**（React 計測 timing）——其儘 記録
- 検証限界：browser 制御 無、再読込後「設定開 → 戻」実測 要

| 提交 | 説明 |
|------|------|
| `a2a0a0a` | fix(client): 設定閉後 幅 不回縮 —— 計測 設定幅 漏出 |

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
