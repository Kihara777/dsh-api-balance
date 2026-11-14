// 朗读按钮的判据（2026-11-15）
//
// 跑法：node --test test/speak-button.test.mjs
//
// ## 这份测试防的是什么
//
// 喇叭按钮要念「这条回复的正文」。但操作栏在消息底部，正文在上面，
// **没有稳定的 data 属性**——只能从操作栏往上找第一个文本够长的容器，
// 再剥掉底部那行「复制/赞/踩 + 用量 5.1M tok + 06:14」。
//
// 剥不干净会怎样：**把用量数字一起念出来**。那比不念更糟——
// 听的人会以为那是正文的一部分。
//
// 所以这里的判据只有一条：**清理之后，不该剩任何操作栏/用量/时间的残留。**
//
// （清理函数从 client.js 复制而来。**不 import**：client.js 是浏览器 bundle，
// 顶层就有 `document` 引用，Node 里跑不起来。复制会漂——所以下面有一条
// 「与源码一致」的检查，源码改了这里没改就会红。）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/** 与 client.js 里 `messageTextOf` 的清理段保持一致。 */
function clean(raw) {
	let text = (raw ?? '').trim()
	text = text
		.replace(/\s*(用量\s*[\d.]+\s*[kKmM]?\s*tok[^\n]*)$/u, '')
		.replace(/\s*\d{2}:\d{2}\s*$/u, '')
		.replace(/^\s*(复制|Copy|赞|踩|分享|Like|Dislike|Share)\s*$/gmu, '')
		.trim()
	return text
}

const RESIDUE = /用量|tok|^\s*\d{2}:\d{2}\s*$|^(复制|赞|踩|分享)$/mu

test('真实样本：带用量与时间的尾部被剥掉', () => {
	const raw = '还有一件要你点头\n\n参考文本要不要也进 Nix 配置？\n\n用量 5.1M tok 06:14'
	const out = clean(raw)
	assert.ok(!RESIDUE.test(out), `残留：${JSON.stringify(out)}`)
	assert.ok(out.includes('参考文本要不要也进 Nix 配置？'), '正文不能一起被剥掉')
})

test('正文里本来就提到「用量」时，不该误伤', () => {
	// 这条容易犯错：正则如果写宽了，会把这句正文也吃掉。
	const raw = '这是一条普通回复，没有用量行。'
	assert.equal(clean(raw), raw)
})

test('操作栏文字逐个剥掉', () => {
	const raw = '回复正文\n\n复制\n赞\n踩\n分享\n用量 1.2M tok 03:02'
	assert.equal(clean(raw), '回复正文')
})

test('纯时间结尾也被剥掉', () => {
	assert.equal(clean('一句很短的话，但够长了。 06:14'), '一句很短的话，但够长了。')
})

test('清理逻辑与 client.js 的源码一致（防复制漂移）', () => {
	const src = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
	// 三个正则的关键片段必须都在源码里
	assert.ok(src.includes('用量\\s*[\\d.]+\\s*[kKmM]?\\s*tok'), '用量正则不在源码里')
	assert.ok(src.includes('(复制|Copy|赞|踩|分享|Like|Dislike|Share)'), '操作栏正则不在源码里')
	assert.ok(src.includes('SPEECH_URL = "/api/api-balance/speech"'), '端点常量不在源码里')
})
