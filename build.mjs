import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const partsDir = join(root, 'parts');

const head = readFileSync(join(src, 'head.html'), 'utf8');
const top = readFileSync(join(src, 'top.html'), 'utf8');
const end = readFileSync(join(src, 'end.html'), 'utf8');

const parts = readdirSync(partsDir)
  .filter(f => f.endsWith('.html'))
  .sort()
  .map(f => readFileSync(join(partsDir, f), 'utf8'));

const styleBody = head.split('<style>')[1].split('</style>')[0];

const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${head.split('<style>')[0]}
<style>${styleBody}</style>
</head>
<body>
${top}
${parts.join('\n\n')}
${end}
</body>
</html>`;

writeFileSync(join(root, '神经网络讲义.html'), page, 'utf8');
console.log(`built 神经网络讲义.html — ${parts.length} parts, ${(page.length / 1024).toFixed(1)} KB`);
