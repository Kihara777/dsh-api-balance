// 「上一条 / 下一条提问」跳跃按钮的结构契约。
//
// 官方那颗圆钮只做「回到底部」，且「不跟随尾部」时一直挂着；这里换成上下两颗，
// 滚动时淡入、静置淡出，点击各自滚到最近的一条用户消息。
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { CLIENT_PATH } from "./voice-toolkit.mjs";

const source = readFileSync(CLIENT_PATH, "utf8");

test("按钮组挂在常驻 shell.overlay 上，与页面无关", () => {
	assert.ok(source.includes("function TurnJumper({ t })"), "缺少跳跃按钮组件");
	assert.ok(source.includes('id: "api-balance-turn-jumper"'), "没有注册到 shell.overlay");
	assert.ok(source.includes("[...document.querySelectorAll('[class*=\"userRow\"]')]"), "没有查询用户消息行");
	assert.ok(source.includes('document.querySelector(\'[class*="scrollBody"]\')'), "没有定位会话滚动区");
});

test("官方「回到底部」让位：toBottomSlot 被隐藏", () => {
	assert.ok(source.includes('[class*="toBottomSlot"]{display:none !important}'), "官方圆钮没有被隐藏");
});

test("滚动时显示、静置后隐藏", () => {
	assert.ok(source.includes("setTimeout(() => setVisible(false), 2500)"), "缺少静置隐藏");
	assert.ok(source.includes('addEventListener("scroll", onScroll, { passive: true })'), "没有监听滚动");
	assert.ok(source.includes('"data-visible": visible ? "" : undefined'), "缺少可见性属性");
});

test("上下各滚一条用户消息；没有下一条时退回底部", () => {
	assert.ok(source.includes("row.getBoundingClientRect().top - scrollerTop < -8"), "向上的目标筛选不对");
	assert.ok(source.includes("row.getBoundingClientRect().top - scrollerTop > 8"), "向下的目标筛选不对");
	assert.ok(source.includes("scroller.scrollTo({ top: scroller.scrollHeight, behavior: \"smooth\" })"), "没有兜底回到底部");
	assert.ok(source.includes("scrollIntoView({ block: \"start\", inline: \"nearest\" })"), "没有用原生滚动对齐目标行");
	assert.ok(source.includes("function jumpToRow(scroller, row)"), "缺少对齐函数");
});

test("两颗圆钮有可访问标签，且走非线性缓动", () => {
	assert.ok(source.includes('t("jump.prev")'), "上一条缺少 aria-label");
	assert.ok(source.includes('t("jump.next")'), "下一条缺少 aria-label");
	assert.ok(source.includes("cubic-bezier(0.22,1,0.36,1)"), "淡入淡出没有缓动");
	assert.ok(source.includes("prefers-reduced-motion:reduce){.dshAbJumper{transition:none}}"), "没有尊重减少动效");
	assert.ok(source.includes("transition:opacity var(--dsh-ab-rail-duration,280ms) var(--dsh-ab-rail-ease,cubic-bezier(0.22,1,0.36,1))"), "淡入淡出没有复用图标栏那套缓动变量");
});
