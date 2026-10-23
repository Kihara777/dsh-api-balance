// 全屏侧栏抽屉的结构契约（2026-10-21 第五版）。
//
// 四版的演进各留一条判据：
//   · 第一版把 rail 变 fixed 覆盖层 → 收起后仍占位；
//   · 第二版改父容器全部 grid 列 → 页面被弄坏；
//   · 第三版读 computed 中间值 + removeProperty 删 React 的声明 → 点了收不回；
//   · 第四版按 `split(/\s+/)` 数 grid 段数 → `minmax(400px, 1fr)` 内部自带
//     空格，三列被拆成五段，frame 永远找不到（headless 实测抓到的）。
// 这一版只允许：官方 `layout.toggleSidebar()`、把 frame 第一列压成 0px、
// 用 MutationObserver 跟随官方折叠标记，且**只写不删** React 管的内联样式。
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { CLIENT_PATH } from "./voice-toolkit.mjs";

const source = readFileSync(CLIENT_PATH, "utf8");

test("折叠必须走官方 layout.toggleSidebar()，且插件声明依赖 layout", () => {
	assert.ok(source.includes("layout.toggleSidebar()"), "没有调用官方折叠接口");
	assert.ok(
		source.includes('const inject = ["slots", "connection", "locale", "layout"]'),
		"inject 未声明 layout 服务",
	);
});

test("frame 靠「内联 grid 列 + 首列像素值」定位，折叠标记只作状态判据", () => {
	// `[data-sidebar-collapsed]` 只在折叠时存在，展开时没有句柄——不能拿它定位。
	assert.ok(
		!source.includes('document.querySelector("[data-sidebar-collapsed]")'),
		"仍在用只在折叠时存在的选择器定位 frame",
	);
	assert.match(source, /function layoutFrame\(\)/);
	assert.ok(source.includes('value.indexOf("minmax(")'), "未按内联列宽特征定位");
	assert.ok(source.includes("function sidebarCollapsedNow(frame)"), "缺少折叠状态判据");
});

test("列宽不得按空白拆分：minmax(400px, 1fr) 内部自带空格", () => {
	assert.ok(!source.includes("gridTemplateColumns.split("), "仍按空白拆列，minmax 会被拆碎");
	assert.ok(!source.includes("inline.split(/\\s+/)"), "仍在按空白拆内联列值");
});

test("只压第一列：用正则替换首个像素值，其余列原样", () => {
	assert.ok(source.includes('inline.replace(/^\\s*[0-9.]+px/, "0px")'), "不是「只改第一列」的写法");
	assert.ok(!source.includes('.map(() => "minmax(0, 1fr)")'), "不得重写所有列");
	assert.ok(!source.includes('parts[1] = "minmax(0, 1fr)"'), "不得改第二列");
});

test("覆盖用 !important 写内联样式，React 的普通重写压不住它", () => {
	assert.ok(source.includes('inline.replace(/^\\s*[0-9.]+px/, "0px"), "important"'), "覆盖没带 !important");
});

test("反证：不得读 computed 几何（折叠动画中的中间值会把动画钉死）", () => {
	assert.ok(!source.includes("getComputedStyle(frame)"), "仍在读 computed grid-template-columns");
	assert.ok(
		!/getComputedStyle\((frame|node)\)\s*\.\s*gridTemplateColumns/.test(source),
		"仍在从 computed 读列宽（折叠动画中的中间值会把动画钉死）",
	);
});

test("反证：不得 removeProperty 删 React 管的列声明（会让列宽退回 auto）", () => {
	assert.ok(!source.includes('frame.style.removeProperty("grid-template-columns")'), "仍在删除 React 管理的列声明");
	assert.ok(
		source.includes('frame.style.setProperty("grid-template-columns", reactValue)'),
		"展开时没有把官方值写回",
	);
});

test("状态由 MutationObserver 跟随官方折叠标记（不再靠 setTimeout 后读一次）", () => {
	assert.ok(source.includes("new MutationObserver("), "缺少 MutationObserver");
	assert.ok(
		source.includes('attributeFilter: ["style", "data-sidebar-collapsed"]'),
		"observer 未同时盯内联样式与折叠标记",
	);
	assert.ok(source.includes("const folded = frame.hasAttribute"), "未从 frame 读折叠状态");
});

test("退出全屏的还原：记进全屏前的状态，在常驻 fullscreenchange 里做", () => {
	assert.ok(source.includes("mineRef"), "缺少 mineRef 记账");
	assert.ok(source.includes("let preFullscreenCollapsed = null"), "缺少「进全屏前是否折叠」的记录");
	assert.ok(
		source.includes("preFullscreenCollapsed = sidebarCollapsedNow(layoutFrame())"),
		"没有在切换动作之前记录状态",
	);
	assert.ok(source.includes('document.addEventListener("fullscreenchange"'), "缺少常驻全屏监听");
	assert.ok(source.includes("if (preFullscreenCollapsed !== false) return;"), "还原没有按记录判断");
	// headless 实测：把 toggle 塞进组件卸载清理会静默失效，侧栏停在 56px rail。
	assert.ok(
		!source.includes("if (mineRef.current === true && sidebarCollapsedNow(layoutFrame()))"),
		"仍在卸载清理里 toggle",
	);
});

test("反证：不得再给 rail 加 fixed 覆盖层（第一版的问题所在）", () => {
	assert.ok(!source.includes("[data-dsh-ab-rail='drawer']{position:fixed"), "旧的 fixed 覆盖层仍在");
	assert.ok(!source.includes('rail.setAttribute("data-dsh-ab-rail"'), "仍在给 rail 打标记");
});

test("抽屉挂在常驻 shell.overlay 上（手机窄屏的 header 槽位不渲染）", () => {
	assert.ok(source.includes('ctx.slots.inject("shell.overlay"'), "抽屉没有挂在常驻槽位");
	assert.ok(source.includes("function RailOverlay("), "缺少常驻挂载组件");
	// headless 手机视口实测：会话头部的 utilities 槽位不渲染，把手整个消失。
	assert.ok(!source.includes("const drawer ="), "header 槽位仍在渲染抽屉");
});

test("全屏时用 visualViewport 顶住根元素高度（移动端键盘不缩布局视口）", () => {
	assert.ok(source.includes("window.visualViewport"), "缺少 visualViewport 适配");
	assert.ok(source.includes('root.style.setProperty("height"'), "没设根元素高度");
	assert.ok(
		source.includes('document.fullscreenElement === null') && source.includes('root.style.removeProperty("height")'),
		"退出全屏没有撤掉高度覆盖",
	);
});

test("把手只切换图标条显隐，从不把会话列表铺开", () => {
	assert.ok(source.includes("const wantHide = folded && hideRef.current === true"), "压列没有和「折叠态」绑定");
	assert.ok(source.includes("hideRef.current = hideRef.current !== true"), "把手没有切换图标条显隐");
	assert.ok(!source.includes("const drawer ="), "header 槽位仍在渲染抽屉");
});

test("全屏隐藏图标栏后左右留白对称（差额补到左侧）", () => {
	assert.ok(source.includes("--dsh-ab-gutter"), "缺少左侧补偿变量");
	assert.ok(
		source.includes("gutter = Math.max(0, Math.round(window.innerWidth - rect.right - rect.left))"),
		"没有按内容列实测左右留白",
	);
	assert.ok(
		source.includes("[data-sidebar-collapsed] .pI_x6G_centerCol{padding-left:var(--dsh-ab-gutter,0px)}"),
		"缺少补偿样式",
	);
});

test("图标栏显隐走非线性缓动（属性挂在 frame 自身，且尊重减少动效）", () => {
	assert.ok(
		source.includes("[data-dsh-ab-rail-animating].pI_x6G_frame{transition:grid-template-columns"),
		"过渡没有挂在 frame 自身（带空格的派生选择器匹配不到）",
	);
	assert.ok(source.includes("cubic-bezier(0.22,1,0.36,1)"), "缺少非线性曲线");
	assert.ok(source.includes("prefers-reduced-motion:reduce"), "没有尊重减少动效偏好");
	assert.ok(source.includes("const animateColumns = (target) =>"), "缺少动画开关");
	assert.ok(source.includes('target.removeAttribute("data-dsh-ab-rail-animating")'), "动画属性没有摘掉");
});

test("把手：button + aria-expanded + 可访问标签（管图标条显隐）", () => {
	assert.ok(source.includes('"data-api-balance-handle": "rail"'));
	assert.ok(source.includes('"aria-expanded": !hidden'));
	assert.ok(source.includes('t(hidden ? "rail.open" : "rail.close")'));
});

test("收起图标条不再限定全屏；把手只在需要时出现", () => {
	assert.ok(source.includes("fullscreen: active"), "没有把全屏状态传下去");
	assert.ok(source.includes("if (!enabled || !fullscreenSupported() || !layout) return null;"), "抽屉仍然只在全屏时渲染");
	assert.ok(source.includes("const hideRef = react.useRef(fullscreen !== false);"), "初始隐藏态没有跟着全屏走");
	assert.ok(!source.includes("if (hidden === false && fullscreen !== true) return null;"), "把手不该因为「图标条露着」就消失");
});

test("把手贴在侧栏右边缘，而不是钉在屏幕左缘", () => {
	assert.ok(source.includes("function inlineFirstPx(frame)"), "缺少第一列宽度读取");
	assert.ok(source.includes("setEdge((prev) => (prev === firstPx ? prev : firstPx))"), "sync 里没有跟随列宽");
	assert.ok(source.includes("left: `${edge}px`,"), "把手位置没有跟着列宽走");
});
