// 右上菜单全屏项开关的判据测试：node test/header-menu-toggle.test.mjs
//
// 为什么需要这个测试：设置里的开关必须**立刻**影响同一页菜单里的注入行
// （两个组件在同一个 React 树里，互不感知），只靠 localStorage 的 `storage`
// 事件做不到——它只在**其它**标签页写时触发。所以实现自己派发了一个
// CustomEvent。这条链路（默认开启 → 写 off → 派发 → 读回）一旦断了，
// 症状是「设置里关了、菜单里还在」，而设置页看起来一切正常。
//
// 覆盖范围（不冒充）：这里只验证纯逻辑（读写与事件契约）。真实页面里
// 事件有没有被菜单注入组件收到，要靠浏览器实测，不在本文件范围内。
//
// 反证：localStorage 抛异常时默认仍为「开」——存储不可用不能把功能关掉，
// 也不能让设置页崩。

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

const STORE_KEY = constValue("FULLSCREEN_MENU_STORE_KEY");
const EVENT_NAME = constValue("FULLSCREEN_MENU_EVENT");

function load() {
	const text = `
		const FULLSCREEN_MENU_STORE_KEY = ${JSON.stringify(STORE_KEY)};
		const FULLSCREEN_MENU_EVENT = ${JSON.stringify(EVENT_NAME)};
		${extractFunction(source, "headerFullscreenEnabled")}
		${extractFunction(source, "setHeaderFullscreenEnabled")}
		return { headerFullscreenEnabled, setHeaderFullscreenEnabled };
	`;
	return new Function(text)();
}

/** 假 window：只需 localStorage + dispatchEvent 两个能力。 */
function fakeWindow() {
	const store = new Map();
	const events = [];
	return {
		localStorage: {
			getItem: (key) => (store.has(key) ? store.get(key) : null),
			setItem: (key, value) => {
				store.set(key, String(value));
			},
		},
		dispatchEvent: (event) => {
			events.push(event);
			return true;
		},
		store,
		events,
	};
}

function withWindow(win, fn) {
	const previous = globalThis.window;
	globalThis.window = win;
	try {
		return fn();
	} finally {
		if (previous === undefined) delete globalThis.window;
		else globalThis.window = previous;
	}
}

// ── 判据 ─────────────────────────────────────────────────────────────
test("默认开启：localStorage 里没有这个键时返回 true", () => {
	const win = fakeWindow();
	const { headerFullscreenEnabled } = load();
	withWindow(win, () => assert.equal(headerFullscreenEnabled(), true));
});

test("写入 off 后读回 false，写入 on 后读回 true", () => {
	const win = fakeWindow();
	const { headerFullscreenEnabled, setHeaderFullscreenEnabled } = load();
	withWindow(win, () => {
		setHeaderFullscreenEnabled(false);
		assert.equal(win.store.get(STORE_KEY), "off");
		assert.equal(headerFullscreenEnabled(), false);
		setHeaderFullscreenEnabled(true);
		assert.equal(win.store.get(STORE_KEY), "on");
		assert.equal(headerFullscreenEnabled(), true);
	});
});

test("设置器派发带真实状态的事件（本页订阅者靠它即时跟随）", () => {
	const win = fakeWindow();
	const { setHeaderFullscreenEnabled } = load();
	withWindow(win, () => {
		setHeaderFullscreenEnabled(false);
		setHeaderFullscreenEnabled(true);
		assert.equal(win.events.length, 2, "每次写入应当派发一次");
		assert.equal(win.events[0].type, EVENT_NAME);
		assert.equal(win.events[0].detail, false);
		assert.equal(win.events[1].detail, true);
	});
});

test("反证：localStorage 抛异常时仍默认开启（存储坏了不能把功能关掉）", () => {
	const win = fakeWindow();
	win.localStorage.getItem = () => {
		throw new Error("SecurityError: storage disabled");
	};
	const { headerFullscreenEnabled, setHeaderFullscreenEnabled } = load();
	withWindow(win, () => {
		assert.equal(headerFullscreenEnabled(), true);
		assert.doesNotThrow(() => setHeaderFullscreenEnabled(false), "写入失败不应抛出");
	});
});

test("反证：没有 window（SSR / 非浏览器）时返回 true 而不是 ReferenceError", () => {
	const { headerFullscreenEnabled } = load();
	const previous = globalThis.window;
	delete globalThis.window;
	try {
		assert.equal(headerFullscreenEnabled(), true);
	} finally {
		if (previous !== undefined) globalThis.window = previous;
	}
});
