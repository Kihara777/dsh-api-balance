// 音色选择的行为测试：node test/voice-selection.test.mjs
//
// 为什么需要：2026-09-28 实测「界面是中文、播报却念粤语」。旧实现只按主语言
// 前缀取第一个 `zh*` 音色，而 `zh-HK`（粤语）与 `zh-CN`（普通话）同属 `zh`
// 主语言 —— 音色表里粤语排在前的系统必然念错话，且**文本、界面全对**，不看
// 声音就发现不了。
//
// 判据的区分度靠**反证**保证：本文件先用旧算法在「粤语在前」的表上跑一遍，
// 断言它**确实会选到粤语**（证明这个夹具能暴露该缺陷），再断言新算法不选它。
// 没有这条反证，下面的 ✓ 只能说明"没报错"，不能说明"挑对了话"。
//
// 测试从 lib/client.js 抽取纯函数求值（不引入 react/浏览器），抽取失败即报错
// ——判据脚本宁可吵，也不许静默通过。

import { loadVoiceToolkit } from "./voice-toolkit.mjs";

const { chooseVoice, rankVoices, zhVarietyOf } = loadVoiceToolkit();

/** 旧实现（2026-09-28 之前）：只按主语言前缀取第一个音色 —— 反证用。 */
function legacyPick(voices, lang) {
	const prefix = lang.toLowerCase().split("-")[0];
	return voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));
}

// ── 夹具 ─────────────────────────────────────────────────────────────────
const voice = (lang, name) => ({ lang, name, voiceURI: name });
/** 这台 NixOS 上 Edge 真实返回的顺序（普通话在前）。 */
const realOrder = [
	voice("en-US", "Microsoft Aria Online (Natural) - English (United States)"),
	voice("en-US", "Microsoft Guy Online (Natural) - English (United States)"),
	voice("zh-CN", "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)"),
	voice("zh-CN", "Microsoft Yunyang Online (Natural) - Chinese (Mainland)"),
	voice("zh-TW", "Microsoft HanHan Online - Chinese (Taiwan)"),
	voice("zh-HK", "Microsoft Tracy Online - Chinese (Hong Kong)"),
	voice("ja-JP", "Microsoft Nanami Online (Natural) - Japanese (Japan)"),
];
/** 反证夹具：粤语排在普通话之前（Windows/Android 上常见）。 */
const cantoneseFirst = [
	voice("zh-HK", "Microsoft Tracy Online - Chinese (Hong Kong)"),
	voice("zh-TW", "Microsoft HanHan Online - Chinese (Taiwan)"),
	voice("zh-CN", "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)"),
];

let failed = 0;
function check(label, actual, expected) {
	if (actual === expected) {
		console.log(`  ✓ ${label}`);
		return;
	}
	failed += 1;
	console.log(`  ✗ ${label}\n      期望 ${JSON.stringify(expected)}，实得 ${JSON.stringify(actual)}`);
}

console.log("变体归类");
check("zh-CN → 普通话", zhVarietyOf("zh-CN"), "mandarin");
check("zh-Hans → 普通话", zhVarietyOf("zh-Hans"), "mandarin");
check("zh-Hant → 普通话（繁体字，仍说普通话）", zhVarietyOf("zh-Hant"), "mandarin");
check("zh-TW → 普通话", zhVarietyOf("zh-TW"), "mandarin");
check("zh-HK → 粤语", zhVarietyOf("zh-HK"), "cantonese");
check("yue → 粤语", zhVarietyOf("yue"), "cantonese");
check("zh-yue → 粤语", zhVarietyOf("zh-yue"), "cantonese");
check("en-US → 非中文", zhVarietyOf("en-US"), "");

console.log("反证：旧算法在「粤语在前」的表上确实会念错话");
check(
	"旧算法选粤语（证明夹具能暴露缺陷）",
	legacyPick(cantoneseFirst, "zh-CN").name,
	"Microsoft Tracy Online - Chinese (Hong Kong)",
);

console.log("选择：普通话请求");
check(
	"粤语在前的表 → 选普通话音色，不选粤语",
	chooseVoice(cantoneseFirst, "zh-CN", "").voice.name,
	"Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)",
);
check(
	"真实顺序的表 → 选普通话音色",
	chooseVoice(realOrder, "zh-CN", "").voice.name,
	"Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)",
);
check("真实顺序无回落", chooseVoice(realOrder, "zh-CN", "").mismatch, false);
check(
	"只有粤语音色 → 用粤语但**标记为回落**（上层要告警，不许静默）",
	chooseVoice([voice("zh-HK", "Tracy")], "zh-CN", "").mismatch,
	true,
);
check(
	"zh-TW 请求 → 选台湾普通话音色",
	chooseVoice(realOrder, "zh-TW", "").voice.name,
	"Microsoft HanHan Online - Chinese (Taiwan)",
);

console.log("选择：粤语请求");
check(
	"zh-HK 请求 → 选粤语音色",
	chooseVoice(realOrder, "zh-HK", "").voice.name,
	"Microsoft Tracy Online - Chinese (Hong Kong)",
);
check("zh-HK 请求在真实表上无回落", chooseVoice(realOrder, "zh-HK", "").mismatch, false);

console.log("选择：其它语言");
check("ja 请求 → 日语", chooseVoice(realOrder, "ja", "").voice.name.includes("Nanami"), true);
check("en 请求 → 英语", chooseVoice(realOrder, "en", "").voice.lang, "en-US");

console.log("指定音色（escape hatch）");
check(
	"按 name 指定 → 就用它（即使不是自动首选）",
	chooseVoice(realOrder, "zh-CN", "Microsoft Yunyang Online (Natural) - Chinese (Mainland)").voice.name,
	"Microsoft Yunyang Online (Natural) - Chinese (Mainland)",
);
check(
	"按 voiceURI 指定 → 就用它",
	chooseVoice(realOrder, "zh-CN", "Microsoft Tracy Online - Chinese (Hong Kong)").voice.name,
	"Microsoft Tracy Online - Chinese (Hong Kong)",
);
check(
	"指定失效 → 静默回落自动（且仍挑对变体）",
	chooseVoice(realOrder, "zh-CN", "不存在的音色").voice.name,
	"Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)",
);

console.log("边界");
check("空音色表 → 无音色可用（上层交出 lang 并告警）", chooseVoice([], "zh-CN", "").voice, null);
check("音色表里没有中文 → 不误挑英语", chooseVoice([voice("en-US", "Aria")], "zh-CN", "").voice, null);
rankVoices(realOrder, "zh-CN");
check("排序不修改入参（长度不变）", realOrder.length, 7);
check("排序不修改入参（顺序不变）", realOrder[0].lang, "en-US");

console.log();
if (failed > 0) {
	console.log(`音色选择测试：失败 ${failed} 条`);
	process.exit(1);
}
console.log("音色选择测试：全部通过");
