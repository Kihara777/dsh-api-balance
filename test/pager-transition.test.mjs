// 过渡与「打断」的判据测试：node test/pager-transition.test.mjs
//
// 覆盖三个动画点：翻页区（Pager）的高度与位移、弹出面板（「用量 ↔ 余额」
// 切换）的高度——两处高度共用 `heightTransition`，所以这里测的是那份唯一
// 来源，两处都跟着受约束。
//
// 为什么需要这个测试：高度过渡这条要求有一半是**无障碍**——系统开了
// 「减少动态效果」时必须直接跳变。如果只测「过渡字符串里有 height」，
// 一个永远返回 "height 220ms ease" 的实现也能过，而那正是因为
// 「用户要求减少动态效果却被动画冒犯」的那种 bug。所以规约的两端都要钉：
// 普通情况有过渡、reduce 情况必须是 "none"，且 media query 读不到/抛异常
// 时不能把功能关掉。
//
// 另外两条要求也在这里钉住：
// - **非线性**：曲线必须是 cubic-bezier（不是默认 ease）；
// - **支持打断**：拖动要能在切页动画中途接续，而不是先跳回整数页
//   （`translateXOf` + `pagerOffset` 的数学）。
//
// 覆盖范围（不冒充）：这里只验证纯逻辑（媒体查询读取 + 过渡字符串 +
// 位移换算）。真实浏览器里高度确实会插值、动画是否顺滑，要靠页面实测，
// 不在本文件内。

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { CLIENT_PATH, extractFunction } from "./voice-toolkit.mjs";

const source = readFileSync(CLIENT_PATH, "utf8");

/** 常量值从源码里取（单一来源）；取不到直接抛错，不许静默。 */
function constValue(name) {
	const match = new RegExp(`const ${name} = "([^"]+)";`).exec(source);
	if (match === null) throw new Error(`抽取失败：找不到 const ${name}`);
	return match[1];
}

/** 数字常量（如 PANEL_MOTION_MS）——单独一个提取器，别和字符串混。 */
function constNumber(name) {
	const match = new RegExp(`const ${name} = (\\d+);`).exec(source);
	if (match === null) throw new Error(`抽取失败：找不到 const ${name}`);
	return Number(match[1]);
}

const EASE_OUT = constValue("EASE_OUT");
const PANEL_MOTION_MS = constNumber("PANEL_MOTION_MS");

function load() {
	const text = `
		const EASE_OUT = ${JSON.stringify(EASE_OUT)};
		const PANEL_MOTION_MS = ${PANEL_MOTION_MS};
		${extractFunction(source, "prefersReducedMotion")}
		${extractFunction(source, "heightTransition")}
		${extractFunction(source, "pagerSlideTransition")}
		${extractFunction(source, "panelMotionTransition")}
		${extractFunction(source, "translateXOf")}
		${extractFunction(source, "pagerOffset")}
		return {
			prefersReducedMotion,
			heightTransition,
			pagerSlideTransition,
			panelMotionTransition,
			translateXOf,
			pagerOffset,
		};
	`;
	return new Function(text)();
}

/** 假 window：只需要 matchMedia。 */
function withWindow(win, fn) {
	const previous = globalThis.window;
	if (win === undefined) delete globalThis.window;
	else globalThis.window = win;
	try {
		return fn();
	} finally {
		if (previous === undefined) delete globalThis.window;
		else globalThis.window = previous;
	}
}

const mediaWindow = (matches) => ({ matchMedia: () => ({ matches }) });

// ── 媒体查询读取 ─────────────────────────────────────────────────────
test("系统要求减少动态效果时返回 true", () => {
	const { prefersReducedMotion } = load();
	withWindow(mediaWindow(true), () => assert.equal(prefersReducedMotion(), true));
});

test("系统未要求时返回 false（默认要有过渡）", () => {
	const { prefersReducedMotion } = load();
	withWindow(mediaWindow(false), () => assert.equal(prefersReducedMotion(), false));
});

test("反证：matchMedia 缺失或抛异常时按「不减少」处理（不能因读不到偏好就关掉过渡）", () => {
	const { prefersReducedMotion } = load();
	withWindow({}, () => assert.equal(prefersReducedMotion(), false));
	withWindow({ matchMedia: () => { throw new Error("SecurityError"); } }, () =>
		assert.equal(prefersReducedMotion(), false),
	);
	const previous = globalThis.window;
	delete globalThis.window;
	try {
		assert.equal(prefersReducedMotion(), false, "无 window（非浏览器）时不应抛 ReferenceError");
	} finally {
		if (previous !== undefined) globalThis.window = previous;
	}
});

// ── 过渡字符串 ───────────────────────────────────────────────────────
test("普通情况：高度与位移都带 220ms 过渡", () => {
	const { heightTransition, pagerSlideTransition } = load();
	assert.match(heightTransition(false), /^height 220ms /);
	assert.match(pagerSlideTransition(false), /^transform 220ms /);
});

test("非线性：两条过渡都用 cubic-bezier，而不是默认的 ease", () => {
	const { heightTransition, pagerSlideTransition } = load();
	for (const [name, value] of [
		["height", heightTransition(false)],
		["transform", pagerSlideTransition(false)],
	]) {
		assert.match(value, /cubic-bezier\(0\.22, 1, 0\.36, 1\)/, `${name} 应当使用统一曲线`);
		assert.doesNotMatch(value, /\bease\s*$/, `${name} 不应退回默认 ease`);
	}
});

test("反证：减少动态效果时**两者都**是 none（不能只关掉一半）", () => {
	const { heightTransition, pagerSlideTransition } = load();
	assert.equal(heightTransition(true), "none");
	assert.equal(pagerSlideTransition(true), "none");
});

// ── 打断：从当前视觉位置接续 ─────────────────────────────────────────
test("translateXOf：2D / 3D 矩阵取 translateX，none 与垃圾值按 0", () => {
	const { translateXOf } = load();
	assert.equal(translateXOf("none"), 0);
	assert.equal(translateXOf("matrix(1, 0, 0, 1, -220, 0)"), -220);
	assert.equal(translateXOf("matrix(1, 0, 0, 1, 37.5, 0)"), 37.5);
	assert.equal(
		translateXOf("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -220, 0, 0, 1)"),
		-220,
	);
	assert.equal(translateXOf("rotate(30deg)"), 0, "不认识的 transform 不能当数字");
	assert.equal(translateXOf(""), 0);
	assert.equal(translateXOf(undefined), 0);
});

test("pagerOffset：打断切页动画时从当前位置接续，不跳回整数页", () => {
	const { pagerOffset } = load();
	// 静止：当前页基准位
	assert.equal(pagerOffset(1, 300, null), -300);
	// 普通拖动：基准 + 手指位移
	assert.equal(pagerOffset(1, 300, { base: 0, dx: 40 }), -260);
	// 打断：按下时动画停在 -180（相对基准 +120），再拖 -30 → -210
	assert.equal(pagerOffset(1, 300, { base: 120, dx: -30 }), -210);
});

// ── 面板显隐 / 尺寸扩张 ──────────────────────────────────────────────
test("面板显隐：高度/宽度/透明度/缩放共用同一时长与曲线", () => {
	const { panelMotionTransition } = load();
	const value = panelMotionTransition(false);
	for (const prop of ["height", "width", "opacity", "transform"]) {
		assert.match(
			value,
			new RegExp(`${prop} ${PANEL_MOTION_MS}ms cubic-bezier\\(0\\.22, 1, 0\\.36, 1\\)`),
			`${prop} 应当与其它三条共用同一时间轴`,
		);
	}
});

test("反证：减少动态效果时面板显隐也直接跳变（不在淡出里播缩放）", () => {
	const { panelMotionTransition } = load();
	assert.equal(panelMotionTransition(true), "none");
});
