import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../big5.html', import.meta.url), 'utf8');

function loadBlock(marker, names) {
  const re = new RegExp(`<!--\\s*${marker}-START\\s*-->([\\s\\S]*?)<!--\\s*${marker}-END\\s*-->`);
  const m = html.match(re);
  if (!m) throw new Error(`marker ${marker} not found in big5.html`);
  const inner = m[1].replace(/<script[^>]*>/g, '').replace(/<\/script>/g, '');
  return new Function(`${inner}\n; return { ${names.join(',')} };`)();
}

let passed = 0;
function check(name, cond, detail = '') {
  if (!cond) { console.error(`FAIL: ${name}${detail ? ' — ' + detail : ''}`); process.exit(1); }
  passed++;
}

const { DIM5, FACETS, LIKERT5, bandOf, computeBig5, shuffle } =
  loadBlock('SCORING-CORE', ['DIM5', 'FACETS', 'LIKERT5', 'bandOf', 'computeBig5', 'shuffle']);

check('DIM5 五域', DIM5.join('') === 'OCEAN');
check('FACETS 每域 6 个', DIM5.every(d => FACETS[d].length === 6));
check('LIKERT5 五点', LIKERT5.length === 5 && LIKERT5[0].v === 1 && LIKERT5[4].v === 5);
check('bandOf 边界', bandOf(29.9) === '很低' && bandOf(30) === '低' && bandOf(44.9) === '低'
  && bandOf(45) === '中' && bandOf(55) === '中' && bandOf(55.1) === '高' && bandOf(70) === '高'
  && bandOf(70.1) === '很高');

// ── 计分数学 fixture（手算）──
// f1 正向, f2 反向（同 facet）；f3 正向（同 facet）
// answers: f1=5, f2=5(反→1), f3=4 → facet raw = 5+1+4 = 10；M=8, SD=2 → T = 50+10*(10-8)/2 = 60.0 → 高
const FX = [
  { id: 'f1', dim: 'O', facet: 'O1', rev: 0 },
  { id: 'f2', dim: 'O', facet: 'O1', rev: 1 },
  { id: 'f3', dim: 'O', facet: 'O1', rev: 0 },
];
// fixture 常模需覆盖全部 30 facet + 5 域（computeBig5 全遍历）；默认 M=8/SD=2，域 M=20/SD=6
const FN = {
  domains: Object.fromEntries(DIM5.map(d => [d, { M: 20, SD: 6 }])),
  facets: Object.fromEntries(DIM5.flatMap(d => FACETS[d]).map(f => [f, { M: 8, SD: 2 }])),
};
const r1 = computeBig5(FX, FN, { f1: 5, f2: 5, f3: 4 });
check('fixture facet raw=10', r1.facets.O1.raw === 10, `got ${r1.facets.O1.raw}`);
check('fixture facet T=60.0', r1.facets.O1.T === 60, `got ${r1.facets.O1.T}`);
check('fixture facet band=高', r1.facets.O1.band === '高');
// 域 raw = 同 3 题（fixture 无其余题）= 10；M=20, SD=6 → T = 50+10*(10-20)/6 = 33.3
check('fixture 域 T=33.3', r1.domains.O.T === 33.3, `got ${r1.domains.O.T}`);

// 反向钳制与缺省：f1=9→5；f2 缺省 3→反 3；f3=0→1
const r2 = computeBig5(FX, FN, { f1: 9, f3: 0 });
check('钳制/缺省/反向', r2.facets.O1.raw === 5 + 3 + 1, `got ${r2.facets.O1.raw}`);

check('确定性', JSON.stringify(computeBig5(FX, FN, { f1: 3 })) === JSON.stringify(computeBig5(FX, FN, { f1: 3 })));
const arr = [1, 2, 3, 4, 5, 6, 7, 8];
const before = arr.join(',');
const sh = shuffle(arr);
check('shuffle 守恒', arr.join(',') === before && sh.slice().sort().join(',') === '1,2,3,4,5,6,7,8');

console.log(`OK: ${passed} checks passed`);

// ── 题库与常模 ──
const { QUESTIONS, NORMS, REVERSE_COUNT } =
  loadBlock('CONTENT-DATA', ['QUESTIONS', 'NORMS', 'REVERSE_COUNT']);

check('共 120 题', QUESTIONS.length === 120, `got ${QUESTIONS.length}`);
check('id 唯一', new Set(QUESTIONS.map(q => q.id)).size === 120);
check('英文原文非空唯一', new Set(QUESTIONS.map(q => q.en)).size === 120);
check('中文译文非空唯一', new Set(QUESTIONS.map(q => q.zh)).size === 120);
check('译文长度 4-60 字', QUESTIONS.every(q => q.zh.length >= 4 && q.zh.length <= 60));
for (const d of DIM5) {
  const dq = QUESTIONS.filter(q => q.dim === d);
  check(`${d} 域 24 题`, dq.length === 24, `got ${dq.length}`);
  for (const f of FACETS[d]) {
    check(`${f} facet 恰 4 题`, QUESTIONS.filter(q => q.facet === f).length === 4);
  }
}
check('反向题数与官方键一致', QUESTIONS.filter(q => q.rev === 1).length === REVERSE_COUNT,
  `got ${QUESTIONS.filter(q => q.rev === 1).length}, want ${REVERSE_COUNT}`);

// 常模 35 项 + 单源推导自洽：每域 facet M 之和 === 域 M
for (const d of DIM5) {
  const n = NORMS.domains[d];
  check(`常模 ${d} 域合法`, n && n.M >= 24 && n.M <= 120 && n.SD > 0 && n.SD < 60);
  const sum = FACETS[d].reduce((s, f) => s + NORMS.facets[f].M, 0);
  check(`常模自洽 ${d} 域M=ΣfacetM`, Math.abs(sum - n.M) < 0.05, `Σfacet=${sum.toFixed(2)} domain=${n.M}`);
}
for (const d of DIM5) for (const f of FACETS[d]) {
  const n = NORMS.facets[f];
  check(`常模 ${f} 合法`, n && n.M >= 4 && n.M <= 20 && n.SD > 0 && n.SD < 10);
}

// 全「既不准确也不不准确」→ 每题 3 分 → facet raw 12、域 raw 72（结构级不变式）
const neutral = {};
for (const q of QUESTIONS) neutral[q.id] = 3;
const rn = computeBig5(QUESTIONS, NORMS, neutral);
check('全中性 facet raw=12', DIM5.every(d => FACETS[d].every(f => rn.facets[f].raw === 12)));
check('全中性 域 raw=72', DIM5.every(d => rn.domains[d].raw === 72));

// ── 报告文案 ──
const { REPORT_TEXT } = loadBlock('CONTENT-DATA', ['QUESTIONS', 'NORMS', 'REVERSE_COUNT', 'REPORT_TEXT']);
for (const d of DIM5) {
  const t = REPORT_TEXT.domains[d];
  check(`${d} 域三档文案`, t && [t.high, t.mid, t.low].every(s => typeof s === 'string' && s.length >= 60 && s.length <= 300),
    `${d}: ${t ? [t.high, t.mid, t.low].map(s => s.length).join('/') : 'missing'}`);
}
for (const d of DIM5) for (const f of FACETS[d]) {
  const t = REPORT_TEXT.facets[f];
  check(`${f} 高低两档文案`, t && [t.high, t.low].every(s => typeof s === 'string' && s.length >= 25 && s.length <= 120),
    `${f}: ${t ? [t.high, t.low].map(s => s.length).join('/') : 'missing'}`);
}
check('facet 通用中档说明', typeof REPORT_TEXT.facetMid === 'string' && REPORT_TEXT.facetMid.length >= 25);

console.log(`OK: ${passed} checks passed`);
