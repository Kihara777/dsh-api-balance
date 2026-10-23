// 语音播报不重复：新一轮播报要让旧队列收手，页签连点要防抖。
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { CLIENT_PATH } from "./voice-toolkit.mjs";

const source = readFileSync(CLIENT_PATH, "utf8");

test("播报带令牌：旧队列在下一段之前退出", () => {
	assert.ok(source.includes("let speechToken = 0;"), "缺少播报令牌");
	assert.ok(source.includes("const token = ++speechToken;"), "没有递增令牌");
	assert.ok(
		source.includes("playParts(parts, lang, config, pack, () => token === speechToken)"),
		"playParts 没有拿到「是否仍当前」的判断",
	);
	assert.ok(
		source.includes('if (typeof isCurrent === "function" && !isCurrent()) return;'),
		"播放循环里没有中途退出",
	);
});

test("按日 / 按月的播报有防抖，连点不会叠两句", () => {
	assert.ok(source.includes("let lastChartSpeakAt = 0;"), "缺少防抖时间戳");
	assert.ok(source.includes("if (now - lastChartSpeakAt < 350) return;"), "没有挡住连点");
});

test("一句里每个片段只播一次（pack 与 tts 互斥）", () => {
	const playBlock = source.slice(
		source.indexOf("async function playParts(parts, lang, config, pack, isCurrent)"),
		source.indexOf("function speakHungry"),
	);
	assert.ok(playBlock.includes("} else if (typeof part.fallbackText"), "pack 缺片段时的兜底不是 else-if");
	assert.ok(!playBlock.includes("await ttsSpeak(part.fallbackText, lang, config);\n\t\t\t\t\tawait"), "pack 与 tts 被串行播了两遍");
});

test("片段之间有预取，不让「数字 → 个 token」空等加载", () => {
	assert.ok(source.includes("const prepare = (index) => {"), "缺少预取函数");
	assert.ok(source.includes("prepare(0);"), "没有预取第一段");
	assert.ok(source.includes("prepare(i + 1);"), "播放当前段时没有预取下一段");
	assert.ok(source.includes('audio.preload = "auto";'), "语音包片段没有预加载");
	assert.ok(source.includes("function playAudioElement(audio, timeoutMs"), "没有复用已加载的 Audio 元素");
	assert.ok(
		source.includes("ready.objectUrl !== void 0"),
		"自定义 TTS 没有复用预合成的音频",
	);
});
