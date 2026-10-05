# 維護記録

[中文](../MAINTENANCE.md) | [English](MAINTENANCE.en.md) | [日本語](MAINTENANCE.ja.md) | 偽中国語

dsh-api-balance 軟件更新維護記録。

## 2026-10-05T14:20:10+09:00

**摘要**：fix(client): 疑問 window 漸隠 scroll 連動 変更 —— 題干 高 制限後、上下両端 與 追従按鈕上方 硬縁「一刀切」成。今 `none/start/end/middle` 四状態 漸隠：最上部 上端 模糊不、最下部 下端 模糊不；卡片 上端 限定 漸隠（卡片全体 mask 追従按鈕 淡 成）、按鈕下方 同色 埋 塞（該段 卡片内側余白 + mobile safe area）。漸変色 卡片実際底色 取得、light / dark 両主題 追従。判据：build 産物 対 14 項目 UI 判据（scroll 三状態 assertion 含）全通過。

| 提交 | 説明 |
|------|------|
| `4cf04a0` | fix(client): 疑問 window 下端 漸隠 mask（題干下端 與 追従按鈕上方 一刀切 不。漸変色 卡片実際底色 取得；題干下端 30px 平均輝度 59.93 → 45.92） |
| `f39c816` | fix(client): 漸隠 **scroll 連動**（上下両端）変更、按鈕下方 隙間 塞 |

## 2026-10-05T13:22:34+09:00

**摘要**：fix(client): 底部統計条 横 scroll **停用** + 疑問 window 長題干 選択肢 遮蔽不 —— ① dsh 0.2.0 統計条 各指標 click 可能 pill 化（開即「session 統計」dialog：模型用時 / TTFT / TPS / token / cache hit）、行内 scroll 不要 且 pill gesture 競合：style 注入不、設定行 置灰 官方方案 明記、旧注入 `retireStatsScrollCss()` 清掃；② 長題干 header 実測 948px 対 卡片可視域 398px、吸頂 不透明 header 遮蔽板 成（選択肢 1216px 押下）：header 高 制限（≤40vh）自身 scroll 化 吸頂 廃止、選択肢 視口内 復帰。

| 提交 | 説明 |
|------|------|
| `e6d638c` | fix(client): 統計条 横 scroll 停用 + 長題干 選択肢 遮蔽不 |

## 2026-10-05T07:13:39+09:00

**摘要**：fix(mobile): keyboard 守護 「focus 編集可能要素 落下不」方式 変更 —— 実測 実際 `focusin` cancel 不可（旧 `preventDefault` 死 code）、軟 keyboard 於 `focus` 瞬間 要求（session 切替 二度連続 focus）。後 blur 事後処理 過。入力欄 用户 tap 以前 編集不可 維持、程序性聚焦 keyboard 喚出不能；tap / 按鍵 即時復帰、焦点離脱 再武装。判据：session 切替中「編集可能入力欄 focus 落下」回数 0（旧版 2）、tap 後 入力可。

| 提交 | 説明 |
|------|------|
| `7adb94a` | fix(mobile): keyboard 守護 「focus 編集可能要素 落下不」方式 変更 |

## 2026-10-03T07:18:53+09:00

**摘要**：fix(client): UI 改善 二件 **静 死** —— ① 「底部統計条 横 scroll」dsh 0.1.5 以降 一度 不効：上流 style module `StatsLine.module.css` → `StatsPills.module.css` 改名、插件 旧名 限定 認識 → style tag 発見不能 → 5 回 retry 後 自己削除、設定行 依然 On 表示；② 三 token 0.2.0 存在不（`--dsw-alias-separator-primary` fallback 無 → `currentColor` ＝文字色 退化；danger / warning 固定値 凌）、0.2.0 対応 token 連結、固定値 0.1.x 用 末尾 残置。

| 提交 | 説明 |
|------|------|
| `8dab668` | fix(client): UI 改善 二件 静 失敗 修正 —— style module 改名 與 存在不 三 token |

## 2026-10-03T06:24:10+09:00

**摘要**：fix(client): panel / dialog 質感 0.2.0 native 配方 書直、Enter 交換 設置 component lifecycle 外 移動 —— ① 0.2.0 `--dsw-specific-menu` 実色 → 半透明 fill 変更、native 浮層 更 `backdrop-filter: var(--dsw-menu-backdrop-filter)` 重 初 形成。旧配方 維持 panel 真 透明 成；modal 不透明 `--dsw-alias-bg-layer-2` + elevation 変更（二質感 混用 不可）。② composer 鏈式 slot 化後、質問 / 承認 / subagent composer 引継時 ring component 共 unmount、Enter 交換 共 外、画面 完全 正常 見。今 `apply()` 内 設置。

| 提交 | 説明 |
|------|------|
| `cc89c43` | fix(client): Enter 交換 設置 component lifecycle 外 移動 |
| `700fbbc` | fix(client): panel / dialog 質感 0.2.0 native 配方 書直 —— menu 透明 不 成 |

## 2026-09-28T13:06:27+09:00

**摘要**：fix(voice): 音色 「話 変体」選択 —— 普通話 要求 広東語 音色 拾 不。回帰 test `test/voice-selection.test.mjs` 付。

| 提交 | 説明 |
|------|------|
| `76ea584` | fix(voice): 音色 「話 変体」選択 —— 普通話 要求 広東語 音色 拾 不 |

## 2026-09-16T14:49:41+09:00

**摘要**：dsh-api-balance 0.1.1 — 新規 package：API 使用量・残高 插件（webui 使用量 ring popover 内「使用量 / 残高」tab 切替、account 残高、使用量 内訳、platform token 自動取得、音声 播報）。

| 提交 | 説明 |
|------|------|
| `c47f857` | feat: dsh-api-balance — API 使用量・残高 插件 |

| 軟件名 | 版本 |
|--------|------|
| dsh-api-balance | 新規 v0.1.1 |
