// 平台用量/余额响应的「空 body」处理测试：node test/usage-body.test.mjs
//
// 为什么需要：2026-10-18 维护者截图报「用量查询失败 — Unexpected end of
// JSON input」。根因不是令牌失效，而是平台网关回了 **HTTP 200 + 空 body**，
// 而旧实现直接 `response.json()`——那条消息既不可读，也无法区分「令牌坏了」
// 「被 WAF 拦了」「网络断了」。更糟的是同一模式的 `verifyPlatformToken`
// 会把这种情况当成「令牌无效」，把本机已登录的令牌白白删掉。
//
// 这里钉住两个纯函数的契约：三态解析（ok / empty / invalid）与可读错误文案。
// 不冒充的范围：真正发请求、重试时机、平台行为都不在本文件内。

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { extractFunction } from "./voice-toolkit.mjs";

const INDEX_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "index.js");
const source = readFileSync(INDEX_PATH, "utf8");

/**
 * 抽取函数片段并保留 `async` 前缀。
 *
 * `extractFunction` 从 `function <name>(` 开始切片，会丢掉前面的 `async`——
 * 直接拼进 new Function 会得到「await is only valid in async functions」。
 * 这里按源码实际形态补回前缀：将来函数若不再是 async，这段自动不再加。
 */
function extractMaybeAsync(sourceText, name) {
	const prefix = sourceText.includes(`async function ${name}(`) ? "async " : "";
	return `${prefix}${extractFunction(sourceText, name)}`;
}

function load() {
	const text = `
		${extractMaybeAsync(source, "readJsonSafely")}
		${extractFunction(source, "describeUsageBodyProblem")}
		return { readJsonSafely, describeUsageBodyProblem };
	`;
	return new Function(text)();
}

const { readJsonSafely, describeUsageBodyProblem } = load();

/** 假 Response：只需要 text()。 */
const response = (text) => ({ text: async () => text });

// ── 三态解析 ─────────────────────────────────────────────────────────
test("正常 JSON：返回 ok 与解析值", async () => {
	const body = await readJsonSafely(response('{"code":0,"data":{}}'));
	assert.equal(body.kind, "ok");
	assert.equal(body.value.code, 0);
});

test("空 body（网关 200 + 空响应）：返回 empty，而不是抛错", async () => {
	assert.equal((await readJsonSafely(response(""))).kind, "empty");
	assert.equal((await readJsonSafely(response("  \n\t "))).kind, "empty");
});

test("非 JSON（WAF 的 HTML 拦截页）：返回 invalid 并只留 200 字符", async () => {
	const html = `<html>${"blocked ".repeat(100)}</html>`;
	const body = await readJsonSafely(response(html));
	assert.equal(body.kind, "invalid");
	assert.ok(body.text.length <= 200, "错误文本要截断，别把整页 HTML 灌进日志");
});

test("反证：读取 body 本身失败（连接被截断）也按 empty 处理，不向上抛", async () => {
	const broken = {
		text: () => Promise.reject(new Error("ECONNRESET")),
	};
	const body = await readJsonSafely(broken);
	assert.equal(body.kind, "empty");
});

// ── 可读错误文案 ─────────────────────────────────────────────────────
test("空响应给出可读提示，且不再出现 JSON 解析器的原文", () => {
	const message = describeUsageBodyProblem({ kind: "empty" }, { kind: "empty" });
	assert.match(message, /空响应/);
	assert.match(message, /稍后重试/);
	assert.doesNotMatch(message, /Unexpected end of JSON input/);
});

test("非 JSON 与「空响应 + 非 JSON」各有一句对应文案", () => {
	const invalid = describeUsageBodyProblem({ kind: "invalid", text: "" }, { kind: "invalid", text: "" });
	assert.match(invalid, /非 JSON/);
	const mixed = describeUsageBodyProblem({ kind: "empty" }, { kind: "invalid", text: "" });
	assert.match(mixed, /空响应与非 JSON/);
});
