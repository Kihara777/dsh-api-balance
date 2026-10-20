// 全屏侧栏抽屉的结构契约。
//
// 这些断言不能证明「在浏览器里能用」（没有浏览器控制），但能拦住几类会让它
// 静默失效的改动：时长两处不一致、滑出途中就隐藏、触摸拖拽没声明
// touch-action、rail 不从文档流移除（隐藏后左侧仍留白）、退出全屏不还原。
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { CLIENT_PATH } from "./voice-toolkit.mjs";

const source = readFileSync(CLIENT_PATH, "utf8");

test("过渡时长：JS 常量与 client.css 里的 220ms 必须一致", () => {
	const match = /const RAIL_MOTION_MS = (\d+);/.exec(source);
	assert.ok(match !== null, "找不到 RAIL_MOTION_MS 常量");
	const ms = Number(match[1]);
	assert.ok(
		source.includes(`transition:transform ${ms}ms cubic-bezier(0.22,1,0.36,1)`),
		`CSS 里应当写 ${ms}ms 与同一条曲线，否则「滑出结束才隐藏」的时机和动画对不上`,
	);
});

test("收起动画结束后才 visibility:hidden（否则是空壳滑出）", () => {
	assert.ok(
		source.includes("[data-dsh-ab-rail='drawer'][data-dsh-ab-rail-hidden='1']{visibility:hidden}"),
		"CSS 缺少 hidden 规则",
	);
	assert.match(
		source,
		/setTimeout\(\(\) => \{\s*hideTimer\.current = 0;\s*rail\.setAttribute\("data-dsh-ab-rail-hidden", "1"\);/,
		"JS 里必须用定时器在动画结束后才加 hidden 标记",
	);
});

test("把手：fixed 定位 + touch-action:none（否则触摸拖拽收不到 pointermove）", () => {
	assert.ok(source.includes('"data-api-balance-handle": "rail"'), "找不到把手元素");
	assert.ok(source.includes('touchAction: "none"'), "缺少 touch-action: none");
	assert.ok(source.includes("cursor: \"ew-resize\""), "把手应显示横向拖拽光标");
});

test("rail 必须脱离文档流（fixed），否则收起后左侧仍留白、沉浸效果是假的", () => {
	assert.ok(
		source.includes("[data-dsh-ab-rail='drawer']{position:fixed!important"),
		"CSS 没有把 rail 改成 fixed —— 主内容不会占满宽度",
	);
});

test("开关：默认开启、独立存储键、独立事件（与全屏菜单项互不影响）", () => {
	assert.ok(source.includes('const FS_RAIL_STORE_KEY = "dsh-api-balance-fullscreen-rail"'));
	assert.ok(source.includes("function fullscreenRailEnabled()"));
	assert.match(source, /getItem\(FS_RAIL_STORE_KEY\) !== "off"/);
	assert.ok(source.includes("FS_RAIL_EVENT"));
	// 抽屉不能复用菜单项的事件，否则关掉菜单项会连抽屉一起关。
	assert.ok(
		!source.includes("window.addEventListener(FULLSCREEN_MENU_EVENT, onRailToggle)"),
		"抽屉的开关事件不应是 FULLSCREEN_MENU_EVENT",
	);
});

test("退出全屏即还原：cleanup 逐项移除标记、变量与 transform", () => {
	// 清理是循环移除（四个 data-* 属性），所以断言数组内容 + 移除动作。
	assert.match(
		source,
		/for \(const name of \[\s*"data-dsh-ab-rail",[\s\S]*?"data-dsh-ab-rail-dragging",\s*\]\) \{\s*rail\.removeAttribute\(name\);/,
	);
	assert.match(source, /removeProperty\("--dsh-ab-rail-w"\)/);
	assert.match(source, /removeProperty\("transform"\)/);
});

test("拖拽后浏览器补发的 click 不能再切换一次", () => {
	assert.ok(source.includes("suppressClick"), "缺少 suppressClick 抑制逻辑");
});
