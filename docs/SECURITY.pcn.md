# 安全政策

[中文](../SECURITY.md) | [English](SECURITY.en.md) | [日本語](SECURITY.ja.md) | 偽中国語

## 支持版本

本插件 DeepSeek Harness（DSH）宿主上動作、**最新 `main` 分支限定** 安全修正受。
過去 commit 個別 保守 不——旧版 必要 場合 自 責任 fork 保守 願。

## 脆弱性報告

security 問題 **公開 issue 報告 不可**。GitHub
[非公開脆弱性報告](https://github.com/Kihara777/dsh-api-balance/security/advisories/new)
channel、或 mail 維護者 連絡 願。

報告 可能 範囲 以下 含 願：影響 version／commit、再現手順、期待値 與 実際 結果、
想定 脅威 model（誰 起動 可、如何 前提条件 必要）。

## 応答時間

維護者（狐莉）一級視覚障害 持、日常 視覚支援 agent 與 協働 開発。**七 日以内** 一次回答
目指、複雑 問題 完全 評価 更 時間 場合 有——但 **全報告 回答**。

## 既知 設計境界

以下 **脆弱性 非** 意図 挙動。報告前 確認 願：

| 項 | 説明 |
|---|---|
| browser Local Storage 依 platform token 読取 | 「platform token」**local browser login 状態 自動 scan** 取得、**既定 有効・設定 無効化 可能**。読取 token 限定、browser 内 他 data 収集 不、token `0600` disk 保存 |
| token scan 六 時間 throttle | `config.browserScanIntervalMs` 既定 六 時間。window 内 再 scan 不、前回 scan 報告 返 |
| 残高／使用量 照会 外部 API 到達 | `/user/balance` 與 使用量統計、plugin 設定 token 依 DeepSeek 公式 endpoint 要求——本 plugin **中核機能**、data 漏洩 非 |
| endpoint DSH `/api` channel 経由 | 本 plugin HTTP endpoint、認証 與 Host authority（`trustedHosts`）境界 **DSH 宿主** 得到。plugin 自身 認証層 持 不 |

## 評価済 外部 報告（close 済 含）

以下 報告 全部 **項目 毎 確認**、根拠 與 公開 回答 済。**掲載 理由 後続 報告者 同種
問題 重複 提出 不要**——結論 誤 思 場合 指摘 願。再評価。

| 番号 | 報告内容 | 結論 | 根拠 |
|------|---------|------|------|
| PR #4 / #5（@anupamme、scanner 自動生成） | `/token`、`/token/clear`、`/voicepack`、`/tts` rate limit 無 主張 | **誤検知、未 merge** | 下記「rate limit 欠如 報告」参照 |
| PR #4 / #5 付随 主張 | `/query` request body size 上限 無 主張 | **誤検知、未 merge** | 該防御 既 `readJsonBody` **64 KiB** 上限（`lib/index.js`）提供済。追加 `content-length` 検査 chunked encoding 迂回 可、`text.length` byte 数 非 UTF-16 code 単位 |

### rate limit 欠如 報告 就

複数 scanner 報告 一部 endpoint rate limit 無 主張。**項目 毎 確認 結果 誤検知 判断**。
理由 以下：

**① 記述 與 diff 一致 不。** PR `/token`、`/token/clear`、`/voicepack`、`/tts` 四
endpoint 影響 主張、但 **diff 変更 `/query` 一 path 限定**。

**② 該制限 key 本 deploy 形態 成立 不。** PR `x-forwarded-for` client 識別子 使用、
但 此 header **client 任意 偽装 可能**。更 重要 事、本 plugin 呼出 **同一 origin page
依 DSH `/api` RPC channel 経由**、該経路 **`x-forwarded-for` 伴 不**——故 全 local
要求 同一 `"unknown"` bucket 入、**正常 user 自身 制限 先 当**。

**③ 主要 endpoint 既 throttle 有。** `/token` 既 **六 時間** server 側 throttle
（`browserScanIntervalMs`）有、音声 announcement **三十 分** 限制 有。

**④ 本 plugin 高頻度 polling 無。** source 中 唯一 三十 秒 `setInterval` 実行
`isPeakPricing()`（**純粋 local 時刻 判定** peak／off-peak 料金 hint）、**network
要求 一切 発行 不**。他 十五 分 間隔 polling 有。人間 操作 速度 見積、最 活発 使方
**毎分 五〜十 回** 程度——scanner 推奨 毎分 三十 回 既 其 三〜六 倍、人間 操作 到達
不可。

**⑤ 真 境界 application 層 無。** endpoint 到達可否 **DSH 宿主 認証 與 Host authority**
決定。該境界 突破 可 者 毎分 三十 回 制限 止 不、一方 此 制限 通常 更新 操作 害
（残高更新 待 間 連続 click 正常 行為）。

**結論 與 trade-off**：此 件 **code 変更 不**。将来 真 防御層 必要 場合 正 方法
**IP 非 認証主体 毎** rate limit（IP 偽装 可能）、閾値 **如何 人間 操作 與 比較 十分
高**（例：毎分 六十〜百二十 回）、「暴走 script 対策」位置 付。且 application 層 誰
止 不 実 user 害 可 制限 足 前、host 側 境界 先 強化 可。

> **上記 結論 誤 有 場合、再現可能 根拠 與 指摘 願。** 我々 「先 確認、次 回答、
> 根拠 添」手順 処理、報告 鵜呑 非。

### 重複 提出 就

**上表 既出 同一 結論、新 根拠 無 再提出 場合、本節 指 直接 close。**

| 受理 | 直接 close |
|---------|-------------|
| 上表 無 **新規** 問題 | 上表 與 同一 結論、新 根拠 無 重複 報告 |
| 上表 何 結論 **誤** 有 事 再現可能 根拠 付 示 物 | 既存 結論 述直 限定 物 |
| 同一 主題 但 **異** 脅威 model 或 悪用 経路 | 同一 rule 再度 自動 scan 出力 |

## Supply chain 就

- 本 repo **secret 一切 含 不**。platform token 実行時 設定 或 local browser login
  状態 取得、user 目録 `0600` 保存
- npm package 公開 不（維護者 視覚障害 有、npm 提出手順 単独 完了 不能 為）。GitHub
  source 依 install、或 [NixKits](https://github.com/Kihara777/NixKits) 薄 wrapper 依
  宣言 install 利用 願

## 謝辞

丁寧 確認 報告 全 研究者 感謝。報告 最終的 誤検知 判断 場合 也、**確認 過程 本身
実際 改善 生**——上表 size 上限 確認 其 一例。
