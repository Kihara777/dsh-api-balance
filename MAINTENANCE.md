# 维护日志

中文 | [English](docs/MAINTENANCE.en.md) | [日本語](docs/MAINTENANCE.ja.md) | [偽中国語](docs/MAINTENANCE.pcn.md)

dsh-api-balance 软件更新维护日志。

## 2026-10-19T08:29:50+09:00

**摘要**：fix(client): 关闭设置后宽度不回缩（测量把设置视图宽度写进 panelWidth）

- 根因：宽度测量与定位共用 effect，设置视图期间因 `balance`/resize 重跑时，把设置视图的 scrollWidth（约 520）写进了 `panelWidth`，关闭后宽度卡住
- 修复：内容宽度只在**非设置视图**测量；依赖加 `settingsOpen`，关闭时重测普通视图并过渡回原宽
- 判据：四个套件全过；**同样没有单测覆盖**（React 测量时序），如实记录
- 验证限制：无浏览器控制，需刷新后「开设置 → 返回」实测

| 提交 | 说明 |
|------|------|
| `a2a0a0a` | fix(client): 关闭设置后宽度不回缩 —— 测量把设置视图宽度写进了 panelWidth |

## 2026-10-19T08:16:41+09:00

**摘要**：fix(client): 面板首次打开位置错位（定位 effect 缺 `panelMounted` 依赖）

- 根因：上一轮延迟挂载后，首次 `open` 时 DOM 尚未出现，`panelRef` 为 null → effect 早退，位置停在 `0/0`
- 修复：effect 依赖加 `panelMounted`；位置初值改 null，未定位时 `visibility: hidden`（宁可晚一帧，不显示错位面板）
- 判据：现有四个套件全过；**这类时序缺陷没有单测覆盖**，如实记录
- 验证限制：无浏览器控制，刷新后首次打开仍需维护者实测

| 提交 | 说明 |
|------|------|
| `4a0ac8a` | fix(client): 面板首次打开位置错位 —— 定位 effect 缺 panelMounted 依赖 |

## 2026-10-18T12:46:23+09:00

**摘要**：feat(client): 设置内联进面板并扩张尺寸；面板显隐改为可打断的过渡

- `SettingsModal` → `SettingsContent`：去掉 overlay/外壳，⚙ 时面板原地扩张到 `min(520, 可用宽)`，返回缩回
- 关闭面板时不立即切回常规视图——收起动画期间内容不变，卸载后再复位，避免淡出里闪回
- 显隐：打开先以隐藏态挂载、双 rAF 后切可见（否则无可插值起点）；关闭保留 DOM 到过渡结束，快速开关从当前值接续
- 焦点：设置视图 autoFocus「返回」、关闭后还给 ⚙；⚙ 改用 `aria-expanded`
- 判据：`pager-transition` 10/10、其余 6/6、5/5、6/6、音色全过；**观感未实测**

| 提交 | 说明 |
|------|------|
| `02484c8` | feat(client): 设置内联进面板并扩张尺寸；面板显隐改为可打断的过渡 |
| `ae4ac31` | docs: 四语同步 —— 设置内联 + 面板显隐动画 |

## 2026-10-18T12:42:14+09:00

**摘要**：fix(usage): 平台接口回 HTTP 200 空 body 时给出可读错误

- 根因不是令牌失效：网关偶发回 200 + 空 body，旧实现 `response.json()` 抛出「Unexpected end of JSON input」
- `readJsonSafely` 三态解析；用量窗口空响应先重试一次（400ms）再给可读文案
- 历史月份与余额同样处理；`verifyPlatformToken` 改三态，无法判定时乐观保留
- 顺手修 `fetchWithTimeout`：外部 signal 一传就吞掉超时，改用 `AbortSignal.any`
- 判据：`usage-body` 6/6，其余套件全过；**真实平台空响应未复现**

| 提交 | 说明 |
|------|------|
| `d8f8be3` | fix(usage): 平台接口回 HTTP 200 空 body 时给出可读错误 |

## 2026-10-18T12:25:46+09:00

**摘要**：feat(client): 动画统一非线性缓动 + 切页动画可打断

- 统一 `EASE_OUT = cubic-bezier(0.22, 1, 0.36, 1)`；旋转加载圈**刻意 linear**（匀速才是对的）
- 打断：pointerdown 读 computed transform 当基准（`translateXOf` 解析矩阵），位移走 `pagerOffset`——按下不再跳回整数页
- 高度过渡本由 CSS transition 承载，目标值再变即从当前插值续
- 判据：`pager-transition` 8/8（cubic-bezier 必须、矩阵解析、打断不跳回），其余 6/6、5/5、音色全过；**观感与真机手感未实测**

| 提交 | 说明 |
|------|------|
| `fb9ff2b` | feat(client): 动画统一改为非线性缓动，并让切页动画可被打断 |
| `26f672f` | docs: 四语同步 —— 非线性缓动 + 可打断 |

## 2026-10-18T11:55:18+09:00

**摘要**：验证：高度过渡「看不到」是误判——已生效，无代码改动

- 判据 1：dsh 已重启（`ActiveEnterTimestamp` 02:15:38 UTC，正是上一轮排的那次）
- 判据 2：用 `launch-token` 经 curl 取服务端实际 bundle，`panelContentRef` / `usePrefersReducedMotion` 均在（`rev=e34c17081b65`）——刷新即新代码
- 维护者确认「已生效，刚才误判」；预设的两项增强（280ms + tab 同步测量）无证据支撑，未实施
- 文档：新增「所有过渡都刻意尊重减少动态效果」的集中说明，并写明排查顺序

| 提交 | 说明 |
|------|------|
| `56b10aa` | docs: 补充「减少动态效果」的集中说明（所有过渡都刻意尊重它） |

## 2026-10-18T11:11:11+09:00

**摘要**：feat(client): 「用量 ↔ 余额」切换的面板高度也加 220ms 过渡

- 面板改显式 height + 过渡；ResizeObserver 观察内容层，余额数据到达/换行也跟随，不只标签切换
- 高度 = 内容实测 + computed padding，按 maxHeight 钳制；首帧自然高度落位不产生动画，关闭清回 null
- `pagerHeightTransition` 改名 `heightTransition`、reduce 订阅抽成 `usePrefersReducedMotion`——两处动画共用一份策略
- 判据：`pager-transition` 5/5、`fullscreen-menu` 6/6、`header-menu-toggle` 5/5、音色全过；**真实插值与真机观感未实测**

| 提交 | 说明 |
|------|------|
| `041cae1` | feat(client): 「用量 ↔ 余额」切换的面板高度也加 220ms 过渡 |
| `b462928` | docs: 四语同步 —— 面板高度过渡 |

## 2026-10-18T10:50:13+09:00

**摘要**：feat(client): 翻页区高度变化加 220ms 过渡，并尊重「减少动态效果」

- 视口容器 `transition: height 220ms ease`，与页位移同长；首帧 auto→数值不可插值，故不产生动画
- 订阅 `prefers-reduced-motion`（含旧 Safari 回退），reduce 时高度与位移**同时**直接跳变
- 判据：`test/pager-transition.test.mjs` 5/5（含「只关一半」的反证），另两个测试 6/6、5/5；**真实插值与真机观感未实测**

| 提交 | 说明 |
|------|------|
| `2c6a833` | feat(client): 翻页区高度变化加 220ms 过渡，并尊重「减少动态效果」 |
| `1cd453d` | docs: 四语同步 —— 翻页区高度过渡 |

## 2026-10-18T08:53:18+09:00

**摘要**：feat(client): 设置里加「右上菜单切换全屏」开关；开关区自适应 1/2/3 列

- 开关默认开，关掉后菜单那一行直接不出现（不留死项）；本页即时生效靠自派发 CustomEvent——`storage` 只在别的标签页触发
- 开关区改 grid：弹窗 520px 下 3 列需 470px、4 列需 630px，故宽屏 3 / 中等 2 / 手机 1，最多 3 列
- 每项改卡片（标题与开关同行、说明在下），按钮补 `aria-labelledby`——屏幕阅读器不再只读「开/关」
- 判据：`test/header-menu-toggle.test.mjs` 5/5（含两条反证），旧 6/6 仍绿；**视觉与真机旋转未实测**

| 提交 | 说明 |
|------|------|
| `b30dd88` | feat(client): 设置里加「右上菜单切换全屏」开关；开关区改为自适应 1/2/3 列 |
| `6af1a53` | docs: 四语同步 —— 开关 + 自适应列数 |

## 2026-10-18T08:22:45+09:00

**摘要**：feat(client): 右上「更多操作」菜单新增「**切换全屏**」

- 菜单的行与开合状态归 `@deepseek-ai/dsh-session-log-export`，slots 契约里没有 menu-item 贡献点——只能**注入**：菜单打开时把一行 primitives `MenuItemButton` portal 进它的 items 容器
- 落点是 `role="presentation"` 的 viewport，**不是**第一个子元素（那是 `aria-hidden` 的材质层）；认菜单靠 anchor 的 `aria-busy`（该插件恒设）或 `aria-label` 匹配 /更多|more/，两条都不中就不注入（不往 open-in-app 的下拉里塞一行）
- 键盘一行没写：官方 Menu 用 `querySelectorAll("button:not(:disabled)")` 实时查 DOM，注入行自动进入 ArrowUp/Down、Home/End、Tab 选中与 Escape 关闭；关菜单仍归 owner——点一次 anchor（onClick 即 toggle）再把焦点还给它，避免菜单卸载后焦点掉到 body
- 文案随 `fullscreenchange` 在「切换全屏 / 退出全屏」间切换；`documentElement.requestFullscreen` 不存在（如 iOS Safari）时该项不出现，而不是给一个点了没反应的行
- 判据：`node test/fullscreen-menu.test.mjs` 6/6——用上游 DOM 结构驱动判据，含两条反证（无 `aria-busy` 且 label 不符的菜单必须被拒绝；缺 viewport 必须放弃而非塞进材质层）
- **验证限制**：没有浏览器控制，视觉与真机手势**未实测**；上游结构契约来自源码核对而非运行时观测——升级 dsh 后若这项静默消失，先查那四条判据

| 提交 | 说明 |
|------|------|
| `8169254` | feat(client): 右上「更多操作」菜单新增「切换全屏」 |

## 2026-10-08T16:38:01+09:00

**摘要**：fix(mobile): 键盘守护改成「**默认不可编辑** + 吞掉程序性 focus」

- 她报「又失效了」：上一版「focusout 才武装、聚焦落空后压回」**时序上追不上**——React 一次 commit 就能写回 `contenteditable` 再 `focus()`，而键盘在 focus 那一刻已被请求
- 程序性 `focus()` 直接吞掉（窄补丁：只吞输入框及其子节点、只在无用户意图时；异常路径放行走原逻辑）
- 意图窗口 700ms：点按 / 按键 / 输入打开并续期；**正在编辑的绝不压回**（否则当场断输入）
- 判据：新增 **C12 · 同帧竞态**——ON 臂焦点未落入且属性压回 `false`，OFF 臂聚焦成功并有 2 条可编辑焦点事件；全量 15/15

| 提交 | 说明 |
|------|------|
| `a463488` | fix(mobile): 键盘守护改成「默认不可编辑 + 吞掉程序性 focus」 |
| `43f4d18` | docs: 四语同步守护机制（顺带清掉 pcn 里两处游离假名） |

## 2026-10-05T14:20:10+09:00

**摘要**：fix(client): 疑问窗口渐隐改为**滚动感知**（题干上下两端）

- 题干上下边界都渐隐，且只有那一侧真有内容时才淡（`none` / `start` / `end` / `middle` 四态）
- 卡片只淡顶边——整块 mask 会把吸附按钮一起淡掉；按钮下方另用同底色补片收口
- 判据：构建产物跑 14 条界面判据（含滚动三态断言）全过

| 提交 | 说明 |
|------|------|
| `f39c816` | fix(client): 疑问窗口渐隐改为**滚动感知**（顶部 + 底部），并补上按钮下方的缝 |

## 2026-10-05T13:58:13+09:00

**摘要**：fix(client): 疑问窗口底部加渐隐遮罩 —— 题干下边界与吸附按钮上方不再「一刀切」

- 题干下边界用 `mask` 渐隐；吸附按钮上方用 `::before` 画一条渐变带
- 渐变色取卡片**实际底色**（浅 `rgb(255,255,255)` / 深 `rgb(44,44,46)`）——写死会在深色下露馅
- 判据：题干下边界 30px 平均亮度 59.93 → 45.92（约暗 23%），渐隐区之上不变；部署版同断言实测 FAIL

| 提交 | 说明 |
|------|------|
| `4cf04a0` | fix(client): 疑问窗口底部加渐隐遮罩 —— 题干下边界与吸附按钮上方不再「一刀切」 |

## 2026-10-05T13:22:34+09:00

**摘要**：fix(client): 底部统计条横向滚动**停用**；疑问窗口长题干不再遮挡选项

- 统计条：dsh 0.2.0 已把每个指标做成**可点击的 pill**（点开是「会话统计」对话框），行内滚动不再适用且会与 pill 的手势相抢
- 不再注入样式、设置行置灰并写明官方方案；旧注入由 `retireStatsScrollCss()` 清理
- 疑问窗口：长题干下 header 实测 948px 而卡片可见区仅 398px，吸顶的不透明 header 成了挡板
- 改为 header 限高（≤40vh）自滚、不吸顶，选项回到视口内

| 提交 | 说明 |
|------|------|
| `e6d638c` | fix(client): 统计条横向滚动停用 + 疑问窗口题干不再遮挡选项 |

## 2026-10-05T07:13:39+09:00

**摘要**：fix(mobile): 键盘守护改成「不让 focus 落在可编辑元素上」

- 实测真实 `focusin` **不可取消**（原 `preventDefault` 是死代码）
- 软键盘在 `focus` 那一刻就被请求——一次会话切换应用会连续聚焦两次，事后的 blur 只是补救
- 现让输入框在用户点按前保持不可编辑；点按/按键即刻恢复，焦点离开重新武装
- 判据：切换会话期间「focus 落到可编辑输入框」次数 0（旧版 2），点按后仍可输入

| 提交 | 说明 |
|------|------|
| `7adb94a` | fix(mobile): 键盘守护改成「不让 focus 落在可编辑元素上」 |

## 2026-10-03T07:18:53+09:00

**摘要**：fix(client): 界面改进两项**静默失效**

- 统计条横向滚动**自 dsh 0.1.5 起就没生效过**：上游把样式模块由 `StatsLine.module.css` 改名为 `StatsPills.module.css`，插件只认旧名 → 找不到样式标签 → 重试 5 次后自我移除，而设置里那行仍显示 On
- 三个 token 在 0.2.0 已不存在：`--dsw-alias-separator-primary` 无 fallback → 退化成 `currentColor`＝文字色；danger / warning 靠硬编码兜住
- 现两个模块名都试，并按 0.2.0 原生对应补链（硬编码值保留给 0.1.x）

| 提交 | 说明 |
|------|------|
| `8dab668` | fix(client): 界面改进两项失效修复 —— 统计条模块改名 + 三个已不存在的 token |

## 2026-10-03T06:24:10+09:00

**摘要**：fix(client): 面板 / 弹窗材质按 0.2.0 原生配方重写；回车交换的安装移出组件生命周期

- 0.2.0 把 `--dsw-specific-menu` 从实色换成**半透明 fill**，原生浮层还要叠 `backdrop-filter: var(--dsw-menu-backdrop-filter)` 才成形——沿用旧配方等于面板真的透明
- 模态弹窗改用不透明 `--dsw-alias-bg-layer-2` + elevation；两种材质不可混用
- composer 改成链式槽位后，提问 / 审批 / 子代理接管 composer 时圆圈组件随槽位卸载、交换器被一并摘掉，而界面看着完全正常
- 现改为在 `apply()` 中安装

| 提交 | 说明 |
|------|------|
| `cc89c43` | fix(client): 回车交换的安装移出组件生命周期 |
| `700fbbc` | fix(client): 面板/弹窗材质按 0.2.0 的原生配方重写 —— 菜单不再透明 |

## 2026-09-28T13:06:27+09:00

**摘要**：fix(voice): 音色按「话的变体」选择

- 请求普通话时不再挑到粤语音色
- 带回归测试 `test/voice-selection.test.mjs`

| 提交 | 说明 |
|------|------|
| `76ea584` | fix(voice): 音色按「话的变体」选择 —— 普通话请求不再挑到粤语音色 |

## 2026-09-16T14:49:41+09:00

**摘要**：dsh-api-balance 0.1.1 — 新包：API 用量余额插件

- webui 用量圆圈弹出面板内的「用量 / 余额」标签切换
- 账户余额、用量明细、平台令牌自动获取、语音播报

| 提交 | 说明 |
|------|------|
| `c47f857` | feat: dsh-api-balance — API 用量余额插件 |

| 软件名 | 版本 |
|--------|------|
| dsh-api-balance | 新增 v0.1.1 |
