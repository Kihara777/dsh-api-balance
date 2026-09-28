// 从 lib/client.js 抽取音色选择相关的纯函数，供测试求值。
//
// client.js 是浏览器 ESM（依赖 react / window），测试与浏览器探针都拿不到可直接
// import 的入口，故按源码抽取。抽取失败一律抛错 —— 判据宁可吵，不许静默通过。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const CLIENT_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "client.js");

/** 从 `{` 的位置找到配对的 `}`；字符串/模板/注释内的括号不计入。 */
function matchBrace(source, openIndex) {
	let depth = 0;
	let quote = "";
	for (let i = openIndex; i < source.length; i += 1) {
		const ch = source[i];
		const next = source[i + 1];
		if (quote !== "") {
			if (ch === "\\") {
				i += 1;
				continue;
			}
			if (ch === quote) quote = "";
			continue;
		}
		if (ch === "/" && next === "/") {
			const end = source.indexOf("\n", i);
			i = end < 0 ? source.length : end;
			continue;
		}
		if (ch === "/" && next === "*") {
			const end = source.indexOf("*/", i);
			i = end < 0 ? source.length : end + 1;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === "`") {
			quote = ch;
			continue;
		}
		if (ch === "{") depth += 1;
		else if (ch === "}") {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	throw new Error("抽取失败：括号不闭合");
}

/** 抽出 `const <name> = {` … 的平衡括号片段（含声明前缀）。 */
export function extractConst(source, name) {
	const start = source.indexOf(`const ${name} = {`);
	if (start < 0) throw new Error(`抽取失败：找不到 const ${name}`);
	return source.slice(start, matchBrace(source, source.indexOf("{", start)) + 1);
}

/** 抽出 `function <name>(` … 的平衡括号片段。 */
export function extractFunction(source, name) {
	const start = source.indexOf(`function ${name}(`);
	if (start < 0) throw new Error(`抽取失败：找不到 function ${name}`);
	return source.slice(start, matchBrace(source, source.indexOf("{", start)) + 1);
}

/** 抽取可被求值的源码片段（浏览器探针把它内联进页面）。 */
export function voiceToolkitSource(source = readFileSync(CLIENT_PATH, "utf8")) {
	return [
		extractConst(source, "ZH_VARIETY_TAGS"),
		extractFunction(source, "normalizeLangTag"),
		extractFunction(source, "zhVarietyOf"),
		extractFunction(source, "rankVoices"),
		extractFunction(source, "chooseVoice"),
	].join("\n");
}

/** 在 node 里求值并返回 { ZH_VARIETY_TAGS, normalizeLangTag, zhVarietyOf, rankVoices, chooseVoice }。 */
export function loadVoiceToolkit(source) {
	return new Function(`${voiceToolkitSource(source)}
return { ZH_VARIETY_TAGS, normalizeLangTag, zhVarietyOf, rankVoices, chooseVoice };`)();
}
