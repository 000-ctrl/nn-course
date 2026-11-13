import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);

const tmp = join(root, '.check');
mkdirSync(tmp, { recursive: true });
let bad = 0;
scripts.forEach((code, i) => {
  const f = join(tmp, `s${i}.js`);
  writeFileSync(f, code, 'utf8');
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    bad++;
    console.log(`\n✗ script #${i} 语法错误:\n${e.stderr?.toString() || e.message}`);
  }
});
console.log(`${scripts.length} 个内联脚本,${bad} 个语法错误`);

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const dup = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
if (dup.length) console.log('✗ 重复 id:', dup.join(', '));

const demos = [...html.matchAll(/<div class="demo"[^>]*\sid="([^"]+)"/g)].map(m => m[1]);
const registered = [...html.matchAll(/defineDemo\('([^']+)'/g)].map(m => m[1]);
const missing = demos.filter(d => !registered.includes(d));
const orphan = registered.filter(r => !demos.includes(r));
if (missing.length) console.log('✗ 演示未注册:', missing.join(', '));
if (orphan.length) console.log('✗ 注册无元素:', orphan.join(', '));

const sections = [...html.matchAll(/<section class="ch"[^>]*id="([^"]+)"/g)].map(m => m[1]);
console.log(`\n章节 ${sections.length} 个: ${sections.join(' / ')}`);

// 逐章统计
const headCss = readFileSync(join(root, 'src/head.html'), 'utf8');
const known = new Set([...headCss.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
['is-active','is-done','is-open','is-ok','is-bad','is-got','ok','bad','primary','ghost','sm','line','num','acc'].forEach(c => known.add(c));

const partsDir = join(root, 'parts');
const files = readdirSync(partsDir).filter(f => f.endsWith('.html')).sort();
console.log('\n章  文件                    字数   演示 测验 问题');
for (const f of files) {
  const src = readFileSync(join(partsDir, f), 'utf8');
  const sec = src.match(/<section class="ch"[^>]*id="([^"]+)"/);
  const text = src.replace(/<script[\s\S]*?<\/script>/g, ' ')
                   .replace(/<style[\s\S]*?<\/style>/g, ' ')
                   .replace(/<[^>]+>/g, ' ');
  const han = (text.match(/[一-龥]/g) || []).length;
  const demoN = (src.match(/<div class="demo"/g) || []).length;
  const quizN = (src.match(/class="quiz"/g) || []).length;
  const issues = [];
  if (han < 1200) issues.push('字数偏少');
  if (demoN < 2) issues.push('演示<2');
  if (quizN < 2) issues.push('测验<2');
  if (/<style/.test(src)) issues.push('含<style>');
  if (/style="/.test(src)) issues.push('内联style');
  if (/<script[^>]+src=/.test(src)) issues.push('外部脚本');
  if (/\b(alert|confirm|prompt)\(/.test(src)) issues.push('对话框');
  if (/localStorage/.test(src)) issues.push('localStorage');
  if (/[\u{1F300}-\u{1FAFF}]/u.test(src)) issues.push('emoji');
  const classes = new Set();
  for (const m of src.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && classes.add(c));
  const unknown = [...classes].filter(c => !known.has(c));
  if (unknown.length) issues.push('未知class:' + unknown.join(','));
  console.log(`${(sec ? sec[1] : f).padEnd(16)} ${String(han).padStart(5)} ${String(demoN).padStart(5)} ${String(quizN).padStart(4)}  ${issues.join(' | ') || 'ok'}`);
}

const quizIds = [...html.matchAll(/class="quiz"\s+data-id="([^"]+)"/g)].map(m => m[1]);
const qdup = [...new Set(quizIds.filter((v, i) => quizIds.indexOf(v) !== i))];
if (qdup.length) console.log('\n✗ 重复测验 id:', qdup.join(', '));

rmSync(tmp, { recursive: true, force: true });
