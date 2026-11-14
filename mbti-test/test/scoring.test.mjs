import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function loadBlock(marker, names) {
  const re = new RegExp(`<!--\\s*${marker}-START\\s*-->([\\s\\S]*?)<!--\\s*${marker}-END\\s*-->`);
  const m = html.match(re);
  if (!m) throw new Error(`marker ${marker} not found in index.html`);
  const inner = m[1].replace(/<script[^>]*>/g, '').replace(/<\/script>/g, '');
  const fn = new Function(`${inner}\n; return { ${names.join(',')} };`);
  return fn();
}

let passed = 0;
function check(name, cond, detail = '') {
  if (!cond) { console.error(`FAIL: ${name}${detail ? ' — ' + detail : ''}`); process.exit(1); }
  passed++;
}

// ── SCORING-CORE 接口存在性 ──
const { DIMENSIONS, DIM_LABELS, LIKERT, computeResult, shuffle } =
  loadBlock('SCORING-CORE', ['DIMENSIONS', 'DIM_LABELS', 'LIKERT', 'computeResult', 'shuffle']);

check('DIMENSIONS 四维度', DIMENSIONS.length === 4 && DIMENSIONS.join('') === 'EISNTFJP');
check('DIM_LABELS 两极字母', DIM_LABELS.EI[0] === 'E' && DIM_LABELS.EI[1] === 'I');
check('LIKERT 五点', LIKERT.length === 5 && LIKERT[0].v === -2 && LIKERT[4].v === 2);

// ── 计分数学（手算 fixture，不依赖真实题库）──
const FX = [
  { id: 'f1', dim: 'EI', dir:  1, text: 'fx1' },
  { id: 'f2', dim: 'EI', dir: -1, text: 'fx2' },
  { id: 'f3', dim: 'SN', dir:  1, text: 'fx3' },
];
// EI: +2*1 + +1*(-1) = +1 → E, max=4, pct=50+1/4*50=62.5→63
// SN: -1*1 = -1 → N, max=2, pct=50+1/2*50=75
// TF/JP 无题 → raw 0 → tie-break 第二极, pct 50 → type = ENFP
const r1 = computeResult(FX, { f1: 2, f2: 1, f3: -1 });
check('fixture 类型 ENFP', r1.type === 'ENFP', `got ${r1.type}`);
check('fixture EI', r1.dims.EI.pole === 'E' && r1.dims.EI.pct === 63 && r1.dims.EI.raw === 1);
check('fixture SN', r1.dims.SN.pole === 'N' && r1.dims.SN.pct === 75 && r1.dims.SN.raw === -1);
check('fixture TF tie-break', r1.dims.TF.pole === 'F' && r1.dims.TF.pct === 50 && r1.dims.TF.raw === 0);
check('fixture JP tie-break', r1.dims.JP.pole === 'P' && r1.dims.JP.pct === 50);

// 答案钳制与缺省：越界值按最近合法值计，缺失按 0 计
// f1: 9→2 (+2)；f2: -9→-2，dir=-1 → +2；EI raw = 4；f3 缺省 → 0
const r2 = computeResult(FX, { f1: 9, f2: -9 });
check('钳制/缺省', r2.dims.EI.raw === 4 && r2.dims.SN.raw === 0, `got EI=${r2.dims.EI.raw} SN=${r2.dims.SN.raw}`);

// 确定性：同输入两次调用结果一致
check('确定性', JSON.stringify(computeResult(FX, { f1: 2 })) === JSON.stringify(computeResult(FX, { f1: 2 })));

// shuffle：不改入参、元素守恒
const arr = [1, 2, 3, 4, 5, 6, 7, 8];
const before = arr.join(',');
const sh = shuffle(arr);
check('shuffle 守恒', arr.join(',') === before && sh.slice().sort().join(',') === '1,2,3,4,5,6,7,8');

// ── 题库内容 ──
const { QUESTIONS } = loadBlock('CONTENT-DATA', ['QUESTIONS']);

check('共 60 题', QUESTIONS.length === 60, `got ${QUESTIONS.length}`);
const ids = new Set(QUESTIONS.map(q => q.id));
check('id 唯一', ids.size === 60);
check('id 格式', QUESTIONS.every(q => /^q\d+$/.test(q.id)));
const texts = QUESTIONS.map(q => q.text);
check('文本唯一', new Set(texts).size === 60);
check('文本长度 8-45 字', QUESTIONS.every(q => q.text.length >= 8 && q.text.length <= 45));

for (const dim of DIMENSIONS) {
  const dq = QUESTIONS.filter(q => q.dim === dim);
  check(`${dim} 共 15 题`, dq.length === 15, `got ${dq.length}`);
  check(`${dim} dir+1 恰好 8 题`, dq.filter(q => q.dir === 1).length === 8);
  check(`${dim} dir-1 恰好 7 题`, dq.filter(q => q.dir === -1).length === 7);
}

// ── 真实题库上的计分断言（8/7 分布 → 手算期望）──
const allAgree = {};
for (const q of QUESTIONS) allAgree[q.id] = 2;   // 每维 raw = 2*(8-7) = +2 → pct = 50+2/30*50 = 53
const rAgree = computeResult(QUESTIONS, allAgree);
check('全非常同意 → ESTJ', rAgree.type === 'ESTJ', `got ${rAgree.type}`);
check('全非常同意各维 53%', DIMENSIONS.every(d => rAgree.dims[d].pct === 53 && rAgree.dims[d].pole === DIM_LABELS[d][0]));

const allNeutral = {};
for (const q of QUESTIONS) allNeutral[q.id] = 0;  // raw 全 0 → tie-break 全第二极
const rNeutral = computeResult(QUESTIONS, allNeutral);
check('全中立 → INFP', rNeutral.type === 'INFP', `got ${rNeutral.type}`);
check('全中立各维 50%', DIMENSIONS.every(d => rNeutral.dims[d].pct === 50));

// ── 16 类型档案 ──
const { TYPES } = loadBlock('CONTENT-DATA', ['QUESTIONS', 'TYPES']);
const EXPECTED_TYPES = [];
for (const a of 'EI') for (const b of 'SN') for (const c of 'TF') for (const d of 'JP') EXPECTED_TYPES.push(a + b + c + d);
check('16 类型齐全', EXPECTED_TYPES.length === 16 && EXPECTED_TYPES.every(t => TYPES[t]));

for (const t of EXPECTED_TYPES) {
  const p = TYPES[t];
  check(`${t} code 一致`, p.code === t);
  check(`${t} name 2-6 字`, p.name.length >= 2 && p.name.length <= 6);
  check(`${t} tagline ≤15 字`, p.tagline.length > 0 && p.tagline.length <= 15);
  check(`${t} desc 150-250 字`, p.desc.length >= 150 && p.desc.length <= 250, `got ${p.desc.length}`);
  check(`${t} strengths 3-4 条`, p.strengths.length >= 3 && p.strengths.length <= 4);
  check(`${t} weaknesses 恰 3 条`, p.weaknesses.length === 3);
  check(`${t} careers 4-6 个`, p.careers.length >= 4 && p.careers.length <= 6);
  check(`${t} famous 3-4 位`, p.famous.length >= 3 && p.famous.length <= 4);
  check(`${t} relationship 80-150 字`, p.relationship.length >= 80 && p.relationship.length <= 150, `got ${p.relationship.length}`);
}
check('strengths 无空串', EXPECTED_TYPES.every(t => TYPES[t].strengths.every(s => s.trim().length >= 6)));
check('famous 无空串', EXPECTED_TYPES.every(t => TYPES[t].famous.every(f => f.trim().length >= 2)));

console.log(`OK: ${passed} checks passed`);
