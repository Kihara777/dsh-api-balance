// 全屏侧栏抽屉的结构契约（2026-10-21 第四版）。
//
// 三版的演进各留一条判据：
//   · 第一版把 rail 变 fixed 覆盖层 → 收起后仍占位；
//   · 第二版改父容器全部 grid 列 → 页面被弄坏；
//   · 第三版读 computed 中间值 + removeProperty 删 React 的声明 → 点把手后
//     侧栏展不开/收不起。
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

test("frame 靠「内联三列 grid-template-columns」定位，折叠标记只作状态判据", () => {
	// `[data-sidebar-collapsed]` 只在折叠时存在，展开时没有句柄——不能拿它定位。
	assert.ok(
		!source.includes('document.querySelector("[data-sidebar-collapsed]")'),
		"仍在用只在折叠时存在的选择器定位 frame",
	);
	assert.match(source, /function layoutFrame\(\)/);
	assert.ok(source.includes("node.style.gridTemplateColumns === "), "未按内联列宽特征定位");
	assert.ok(source.includes("parts.length === 3"), "未校验三列结构");
	assert.ok(source.includes("function sidebarCollapsedNow(frame)"), "缺少折叠状态判据");
});

test("只压第一列：其余列必须原样保留（第二版把其余列也改 1fr，弄坏了布局）", () => {
	assert.ok(source.includes('["0px"].concat(parts.slice(1))'), "不是「只改第一列」的写法");
	assert.ok(!source.includes('.map(() => "minmax(0, 1fr)")'), "不得重写所有列");
	assert.ok(!source.includes('parts[1] = "minmax(0, 1fr)"'), "不得改第二列");
});

test("覆盖用 !important 写内联样式，React 的普通重写压不住它", () => {
	assert.match(source, /setProperty\("grid-template-columns", \["0px"\]\.concat\(parts\.slice\(1\)\)\.join\(" "\), "important"\)/);
});

test("反证：不得读 computed 几何（折叠动画中的中间值会把动画钉死）", () => {
	assert.ok(!source.includes("getComputedStyle(frame)"), "仍在读 computed grid-template-columns");
	assert.ok(!source.includes(".gridTemplateColumns;"), "仍在读计算后的列宽");
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

test("只还原自己折叠的侧栏：用户原本折叠的不替他展开", () => {
	assert.ok(source.includes("mineRef"), "缺少 mineRef 记账");
	assert.match(source, /if \(mineRef\.current === true && sidebarCollapsedNow\(layoutFrame\(\)\)\)/);
});

test("反证：不得再给 rail 加 fixed 覆盖层（第一版的问题所在）", () => {
	assert.ok(!source.includes("[data-dsh-ab-rail='drawer']{position:fixed"), "旧的 fixed 覆盖层仍在");
	assert.ok(!source.includes('rail.setAttribute("data-dsh-ab-rail"'), "仍在给 rail 打标记");
});

test("把手：button + aria-expanded + 可访问标签", () => {
	assert.ok(source.includes('"data-api-balance-handle": "rail"'));
	assert.ok(source.includes('"aria-expanded": !collapsed'));
	assert.ok(source.includes('t(collapsed ? "rail.open" : "rail.close")'));
});
