// 全屏侧栏抽屉的结构契约（2026-10-21 第三版）。
//
// 前两版分别留下「收起后仍占位」与「页面被弄坏」。这一版只允许两种动作：
// 官方 `layout.toggleSidebar()`，以及把 frame 的第一列压成 0px（其余列原样）。
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

test("frame 用官方 data-sidebar-collapsed 定位（不是几何猜测）", () => {
	assert.ok(source.includes('document.querySelector("[data-sidebar-collapsed]")'));
	assert.ok(source.includes("function sidebarCollapsed()"));
});

test("只改第一列与第二列：其余列必须原样保留（上一版把其余列也改 1fr，弄坏了布局）", () => {
	assert.ok(source.includes('parts[0] = "0px";'));
	assert.ok(source.includes('parts[1] = "minmax(0, 1fr)";'));
	assert.ok(!source.includes('.map(() => "minmax(0, 1fr)")'), "不得重写所有列");
});

test("覆盖用 !important 写内联样式，React 重渲染覆盖不了它", () => {
	assert.match(source, /setProperty\("grid-template-columns", parts\.join\(" "\), "important"\)/);
});

test("清理时移除内联 grid-template-columns（退出全屏不留副作用）", () => {
	assert.ok(source.includes('frame.style.removeProperty("grid-template-columns")'));
});

test("只还原自己折叠的侧栏：用户原本折叠的不替他展开", () => {
	assert.ok(source.includes("mineRef"), "缺少 mineRef 记账");
	assert.match(source, /if \(mineRef\.current === true && sidebarCollapsed\(\)\)/);
});

test("反证：不得再给 rail 加 fixed 覆盖层（那是前两版的问题所在）", () => {
	assert.ok(!source.includes("[data-dsh-ab-rail='drawer']{position:fixed"), "旧的 fixed 覆盖层仍在");
	assert.ok(!source.includes('rail.setAttribute("data-dsh-ab-rail"'), "仍在给 rail 打标记");
});

test("把手：button + aria-expanded + 可访问标签", () => {
	assert.ok(source.includes('"data-api-balance-handle": "rail"'));
	assert.ok(source.includes('"aria-expanded": !collapsed'));
	assert.ok(source.includes('t(collapsed ? "rail.open" : "rail.close")'));
});
