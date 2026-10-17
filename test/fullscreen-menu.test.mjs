// 右上「…」菜单里全屏注入项的**判据**测试：node test/fullscreen-menu.test.mjs
//
// 为什么需要：这项增强是**注入**进官方菜单的，判据写错有两种坏结果——
//   (a) 认不出官方菜单 → 全屏项静默消失（用户以为功能没了）；
//   (b) 认错菜单（例如把一行塞进 open-in-app 的下拉）→ 比消失更糟。
// 判据「aria-busy 或 aria-label」正是为区分这两者写的，所以它需要被钉住。
//
// 夹具按上游 DOM 结构还原（dsh 0.2.1-alpha.2 的 primitives 实现）：
//   span.root
//     ├─ button[aria-haspopup="menu"]        ← anchor（Menu 的 trigger）
//     └─ div[role="menu"]                    ← MenuSurface
//          ├─ div[aria-hidden]               ← 材质层（不是 items 容器！）
//          └─ div[role="presentation"]       ← viewport（items 落点）
//               └─ button[role="menuitem"]
//
// 覆盖范围（不冒充）：本文件只验证「判据在给定结构上选对/拒绝对」。
// 上游真的产出这种结构，依据是 lib/client.js 里逐条核对过的源码契约，
// 不是本测试；真实浏览器里的注入效果本测试看不到。
//
// 反证：把 aria-busy 拿掉、aria-label 换成别的菜单文案，断言判据**拒绝**
// 认领它——没有这条，下面「选中了」只能说明没报错。

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { CLIENT_PATH, extractFunction } from "./voice-toolkit.mjs";

// ── 被测判据：从 lib/client.js 抽取（抽取失败即抛错，不许静默通过）──
const source = readFileSync(CLIENT_PATH, "utf8");

function loadPredicate() {
	return new Function(`${extractFunction(source, "findMoreActionsMenu")}
return { findMoreActionsMenu };`)();
}

const { findMoreActionsMenu } = loadPredicate();

// ── 极小 DOM：只实现被测函数用到的选择器 ─────────────────────────────
// 被测函数只用三种：`[role="menu"]`（后代）、`:scope > button[...]`、
// `:scope > div[role="presentation"]`。实现别的一概不需要，也就不实现。
class El {
	constructor(tag, attrs = {}, children = []) {
		this.tagName = tag.toUpperCase();
		this.attrs = { ...attrs };
		this.children = [];
		this.parentElement = null;
		for (const child of children) this.append(child);
	}

	append(child) {
		child.parentElement = this;
		this.children.push(child);
		return child;
	}

	getAttribute(name) {
		return Object.prototype.hasOwnProperty.call(this.attrs, name) ? String(this.attrs[name]) : null;
	}

	hasAttribute(name) {
		return Object.prototype.hasOwnProperty.call(this.attrs, name);
	}

	querySelectorAll(selector) {
		const parsed = parseSelector(selector);
		const out = [];
		const visit = (node) => {
			for (const child of node.children) {
				if (matches(child, parsed)) out.push(child);
				visit(child);
			}
		};
		if (parsed.scopeOnly) {
			for (const child of this.children) if (matches(child, parsed)) out.push(child);
		} else {
			visit(this);
		}
		return out;
	}

	querySelector(selector) {
		return this.querySelectorAll(selector)[0] ?? null;
	}
}

function parseSelector(selector) {
	let rest = selector.trim();
	let scopeOnly = false;
	if (rest.startsWith(":scope")) {
		scopeOnly = true;
		rest = rest.slice(":scope".length).trim();
		if (rest.startsWith(">")) rest = rest.slice(1).trim();
	}
	const tag = (/^[A-Za-z][\w-]*/.exec(rest) ?? [""])[0].toLowerCase();
	const attrs = [];
	const attrPattern = /\[([\w-]+)(?:="([^"]*)")?\]/g;
	for (let m = attrPattern.exec(rest); m !== null; m = attrPattern.exec(rest)) {
		attrs.push({ name: m[1], value: m[2] });
	}
	return { scopeOnly, tag, attrs };
}

function matches(el, parsed) {
	if (parsed.tag !== "" && el.tagName.toLowerCase() !== parsed.tag) return false;
	for (const attr of parsed.attrs) {
		if (!el.hasAttribute(attr.name)) return false;
		if (attr.value !== undefined && el.getAttribute(attr.name) !== attr.value) return false;
	}
	return true;
}

// ── 夹具 ─────────────────────────────────────────────────────────────
/** 一个 Menu 原语的 DOM：root span 内 anchor + MenuSurface（材质层 + viewport）。 */
function menuSurface(anchorAttrs, rowLabels) {
	const viewport = new El(
		"div",
		{ role: "presentation" },
		// 行文案不影响判据（判据只看 anchor 的属性），这里只体现行数。
		rowLabels.map(() => new El("button", { role: "menuitem" }, [new El("span")])),
	);
	const list = new El("div", { role: "menu" }, [
		new El("div", { "aria-hidden": "true", "data-menu-material": "translucent" }),
		viewport,
	]);
	const root = new El("span", { class: "root" }, [
		new El("button", { type: "button", "aria-haspopup": "menu", ...anchorAttrs }),
		list,
	]);
	return { root, list, viewport };
}

/** 会话头部 utilities 容器（SlotOutlet 的 data-slot 包裹层）。 */
function utilitiesContainer(...children) {
	return new El("div", { "data-slot": "conversation.session.header.utilities" }, children);
}

/** 官方「更多操作」菜单：锚点恒带 aria-busy（下载中变 true）。 */
function moreActionsMenu(label = "更多操作", busy = "false") {
	return menuSurface({ "aria-label": label, "aria-expanded": "true", "aria-busy": busy }, [
		"下载 Session 日志",
		"反馈",
	]);
}

/** 同一容器里另一个 Menu 条目（open-in-app 等）：没有 aria-busy。 */
function otherMenu(label = "Open local app") {
	return menuSurface({ "aria-label": label, "aria-expanded": "true" }, ["Open in VS Code"]);
}

/** 我们的探测点在容器内（隐藏 span）——被测函数不读它，但它在真实 DOM 里存在。 */
const probe = new El("span", { hidden: "", "data-api-balance-probe": "fullscreen" });

// ── 判据 ─────────────────────────────────────────────────────────────
test("认领官方「更多操作」菜单，落点是 viewport 而不是材质层", () => {
	const official = moreActionsMenu();
	const container = utilitiesContainer(probe, otherMenu().root, official.root);
	const found = findMoreActionsMenu(container);
	assert.notEqual(found, null, "应当认出带 aria-busy 的官方菜单");
	assert.equal(found.anchor, official.root.children[0], "anchor 应当是 root span 的直接子 button");
	assert.equal(found.viewport, official.viewport, "落点应当是 role=presentation 的 viewport");
	assert.notEqual(found.viewport, official.list.children[0], "材质层（第一个子元素）绝不能当落点");
});

test("aria-busy 缺失时靠 aria-label 认领（中/英两种界面语言）", () => {
	const zh = menuSurface({ "aria-label": "更多操作", "aria-expanded": "true" }, ["下载 Session 日志"]);
	const en = menuSurface({ "aria-label": "More actions", "aria-expanded": "true" }, ["Download session log"]);
	const zhFound = findMoreActionsMenu(utilitiesContainer(zh.root));
	const enFound = findMoreActionsMenu(utilitiesContainer(en.root));
	assert.equal(zhFound?.viewport, zh.viewport);
	assert.equal(enFound?.viewport, en.viewport);
});

test("反证：没有 aria-busy、label 也不是「更多」的菜单不被认领", () => {
	const other = otherMenu();
	const container = utilitiesContainer(probe, other.root);
	assert.equal(findMoreActionsMenu(container), null, "open-in-app 风格的菜单不应被注入");
});

test("反证：只剩其它菜单时返回 null（不误注入到别人的下拉里）", () => {
	const container = utilitiesContainer(probe, otherMenu().root, otherMenu("Open in Finder").root);
	assert.equal(findMoreActionsMenu(container), null);
});

test("反证：菜单里没有 viewport（结构变了）时不认领", () => {
	const official = moreActionsMenu();
	official.list.children.splice(1, 1); // 删掉 role=presentation 的 items 容器
	assert.equal(findMoreActionsMenu(utilitiesContainer(official.root)), null, "结构不符时应当放弃，而不是塞进材质层");
});

test("能力检测：没有 document 时不认为支持全屏（不炸）", () => {
	const { fullscreenSupported } = new Function(
		`${extractFunction(source, "fullscreenSupported")}
return { fullscreenSupported };`,
	)();
	assert.equal(fullscreenSupported(), false);
});
