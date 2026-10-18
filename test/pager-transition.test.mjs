// 翻页区高度/位移过渡的判据测试：node test/pager-transition.test.mjs
//
// 为什么需要这个测试：高度过渡这条要求有一半是**无障碍**——系统开了
// 「减少动态效果」时必须直接跳变。如果只测「过渡字符串里有 height」，
// 一个永远返回 "height 220ms ease" 的实现也能过，而那正是因为
// 「用户要求减少动态效果却被动画冒犯」的那种 bug。所以规约的两端都要钉：
// 普通情况有过渡、reduce 情况必须是 "none"，且 media query 读不到/抛异常
// 时不能把功能关掉。
//
// 覆盖范围（不冒充）：这里只验证纯逻辑（媒体查询读取 + 过渡字符串）。
// 真实浏览器里高度确实会插值、动画是否顺滑，要靠页面实测，不在本文件内。

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { CLIENT_PATH, extractFunction } from "./voice-toolkit.mjs";

const source = readFileSync(CLIENT_PATH, "utf8");

function load() {
	const text = `
		${extractFunction(source, "prefersReducedMotion")}
		${extractFunction(source, "pagerHeightTransition")}
		${extractFunction(source, "pagerSlideTransition")}
		return { prefersReducedMotion, pagerHeightTransition, pagerSlideTransition };
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
	const { pagerHeightTransition, pagerSlideTransition } = load();
	assert.equal(pagerHeightTransition(false), "height 220ms ease");
	assert.equal(pagerSlideTransition(false), "transform 220ms ease");
});

test("反证：减少动态效果时**两者都**是 none（不能只关掉一半）", () => {
	const { pagerHeightTransition, pagerSlideTransition } = load();
	assert.equal(pagerHeightTransition(true), "none");
	assert.equal(pagerSlideTransition(true), "none");
});
