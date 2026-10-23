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
	assert.ok(source.includes("row.scrollIntoView({ block: \"start\", inline: \"nearest\" })"), "没有用原生滚动对齐目标行");
	assert.ok(source.includes("const before = scroller.scrollTop;"), "缺少写入前后对比");
	assert.ok(source.includes("function jumpToRow(scroller, row, isCurrent)"), "缺少对齐函数");
	assert.ok(source.includes("window.requestAnimationFrame(apply)"), "跳转没有多帧写入");
	assert.ok(source.includes("-webkit-tap-highlight-color:transparent"), "没有去掉系统的方形点击高亮");
	assert.ok(source.includes(".dshAbJumper button:active{background:"), "缺少自己的按下态");
});

test("连点与滚不动都有明确处理（不再闪一下弹回）", () => {
	assert.ok(source.includes("if (busyRef.current) return;"), "加载中没有挡住连点");
	assert.ok(source.includes("busyRef.current = true;"), "没有置加载中标记");
	assert.ok(source.includes("const jumpRef = react.useRef(0);"), "缺少跳转令牌");
	assert.ok(source.includes("() => jumpRef.current === token"), "旧跳转链路没有作废");
	assert.ok(source.includes("return Math.abs(scroller.scrollTop - before) > 1;"), "没有检测「写进去被改回」");
	assert.ok(source.includes("if (moved === false) setStuck(true);"), "滚不动时没有停住");
	assert.ok(source.includes("disabled: stuck,"), "滚不动时按钮没有禁用");
	assert.ok(source.includes('"jump.stuck"'), "缺少滚不动的提示文案");
});

test("折叠的历史会被自动加载，且上箭头换成双箭头", () => {
	assert.ok(source.includes("function olderButton()"), "缺少「加载更早」按钮的探测");
	assert.ok(source.includes("loader.click();"), "没有自动点加载");
	assert.ok(source.includes("step(-1, attempt + 1);"), "加载后没有重试跳转");
	assert.ok(source.includes("attempt < 1"), "没有限制只自动加载一层");
	assert.ok(source.includes("const loadMode = loadable && !ascend"), "缺少「需要加载」的图标状态");
	assert.ok(source.includes('"data-api-balance-mode": stuck ? "stuck" : loadMode ? "load" : "jump"'), "缺少图标模式标记");
	assert.ok(source.includes('t(stuck ? "jump.stuck" : loadMode ? "jump.loadEarlier" : "jump.prev")'), "文案没有跟着换");
});

test("两颗圆钮有可访问标签，且走非线性缓动", () => {
	assert.ok(source.includes('t(stuck ? "jump.stuck" : loadMode ? "jump.loadEarlier" : "jump.prev")'), "上一条缺少 aria-label");
	assert.ok(source.includes('t("jump.next")'), "下一条缺少 aria-label");
	assert.ok(source.includes("cubic-bezier(0.22,1,0.36,1)"), "淡入淡出没有缓动");
	assert.ok(source.includes("prefers-reduced-motion:reduce){.dshAbJumper{transition:none}}"), "没有尊重减少动效");
	assert.ok(source.includes("transition:opacity var(--dsh-ab-rail-duration,280ms) var(--dsh-ab-rail-ease,cubic-bezier(0.22,1,0.36,1))"), "淡入淡出没有复用图标栏那套缓动变量");
});

test("设置里有开关，关掉后整组按钮不出现", () => {
	assert.ok(source.includes('const JUMP_STORE_KEY = "dsh-api-balance-jump";'), "缺少存储键");
	assert.ok(source.includes("function jumpEnabled()"), "缺少读取");
	assert.ok(source.includes("function setJumpEnabled(enabled)"), "缺少写入");
	assert.ok(source.includes('settingRow("settings.jumpLabel", jumpOn, onToggleJump, "settings.jumpHint")'), "设置面板没有这一行");
	assert.ok(source.includes("if (!ready || !enabled) return null;"), "关掉后仍然渲染");
});

test("首屏就拿得到滚动容器（不必切一次会话）", () => {
	assert.ok(
		source.includes("setReady(chatScroller() !== null);"),
		"轮询里没有无条件刷新 ready —— bind 在仍为 null 时会直接 return",
	);
});
