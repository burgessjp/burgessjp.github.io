// 把 mbti-test/ 的交付物（单文件 html）同步到 public/mbti-test/ 供 Astro 托管。
// 源目录是唯一事实源；public 下的拷贝不进 git（见 .gitignore）。
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'mbti-test');
const dest = join(root, 'public', 'mbti-test');

mkdirSync(dest, { recursive: true });
for (const file of ['index.html', 'big5.html']) {
  cpSync(join(src, file), join(dest, file));
  console.log(`synced mbti-test/${file} -> public/mbti-test/${file}`);
}
