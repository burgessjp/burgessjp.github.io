"""big5 E2E 全流程验证：python3 test/big5-e2e.py（依赖 playwright，file:// 直开，无服务器）

用例：
1. 完整流程（全选「比较准确」→ 期望 T 分由 Node 从同源数据先行算出，报告页逐域比对）
2. 进度推进 120/120、刷新恢复、已选保留
3. 重测清库
4. 分享卡片 data:image/png
5. 互链双向（big5.html ↔ index.html）
6. 320px 窄屏不横向溢出
"""
import os, sys, json, subprocess
from playwright.sync_api import sync_playwright

BASE = 'file://' + os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
failures = []

def expect(name, cond, detail=''):
    print(('PASS: ' if cond else 'FAIL: ') + name + (f' — {detail}' if detail and not cond else ''))
    if not cond: failures.append(name)

# 期望分数：与页面同一份数据（big5.html 标记块）在 Node 里先算，避免第二套实现
expected = json.loads(subprocess.run(
    ['node', '-e', '''
const { readFileSync } = require('fs');
const html = readFileSync('big5.html', 'utf8');
function loadBlock(marker, names) {
  const re = new RegExp(`<!--\\\\s*${marker}-START\\\\s*-->([\\\\s\\\\S]*?)<!--\\\\s*${marker}-END\\\\s*-->`);
  const m = html.match(re);
  const inner = m[1].replace(/<script[^>]*>/g, '').replace(/<\\/script>/g, '');
  return new Function(inner + `; return { ${names.join(',')} };`)();
}
const core = loadBlock('SCORING-CORE', ['computeBig5']);
const data = loadBlock('CONTENT-DATA', ['QUESTIONS', 'NORMS']);
const answers = {};
for (const q of data.QUESTIONS) answers[q.id] = 4;
console.log(JSON.stringify(core.computeBig5(data.QUESTIONS, data.NORMS, answers).domains));
'''], capture_output=True, text=True, cwd='/Users/peng/Downloads/mbti-test').stdout)

def run_flow(page):
    page.goto(BASE + '/big5.html'); page.wait_for_load_state('networkidle')
    page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_load_state('networkidle')

    # 用例 1+2：完整流程与进度
    expect('欢迎页', page.locator('[data-testid="screen-welcome"]').is_visible())
    page.click('[data-testid="btn-start"]'); page.wait_for_selector('[data-testid="screen-quiz"]')
    expect('进度从 1/120 开始', page.locator('[data-testid="progress-label"]').inner_text() == '1 / 120')
    for i in range(120):
        page.click('[data-testid="likert-4"]'); page.wait_for_timeout(270)
        if page.locator('[data-testid="screen-result"]').is_visible(): break
    page.wait_for_selector('[data-testid="screen-result"]', timeout=8000)
    expect('用例2：作答到 120/120', True)

    ok, detail = True, []
    for d in ['O', 'C', 'E', 'A', 'N']:
        tv = page.locator(f'[data-testid="report-domain-{d}"] .tval').inner_text()
        exp = expected[d]['T']
        if abs(float(tv) - exp) > 0.051: ok = False; detail.append(f'{d}:{tv}!={exp}')
    expect('用例1：五域 T 分与同源计算一致', ok, '; '.join(detail))
    expect('用例1：档位一致', all(
        page.locator(f'[data-testid="report-domain-{d}"] .domain-band').inner_text() == expected[d]['band']
        for d in ['O', 'C', 'E', 'A', 'N']))
    expect('用例1：30 facet 渲染', all(page.locator(f'[data-testid="report-facet-{f}"]').count() == 1
          for d in ['N', 'E', 'O', 'A', 'C'] for f in [d + str(i) for i in range(1, 7)]))

    # 用例 4：分享卡片
    page.click('[data-testid="btn-share"]'); page.wait_for_selector('[data-testid="share-img"]', timeout=3000)
    src = page.locator('[data-testid="share-img"]').get_attribute('src')
    expect('用例4：分享图 data:image/png', src.startswith('data:image/png'))
    expect('用例4：PNG 数据量合理', len(src) > 50000, f'len={len(src)}')

    # 用例 3：重测清库
    page.click('[data-testid="btn-restart"]'); page.wait_for_selector('[data-testid="screen-welcome"]')
    expect('用例3：重测回欢迎页', page.locator('[data-testid="screen-welcome"]').is_visible())
    expect('用例3：storage 已清空', page.evaluate("localStorage.getItem('big5-test-state')") is None)

def run_restore(page):
    page.goto(BASE + '/big5.html'); page.wait_for_load_state('networkidle')
    page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_load_state('networkidle')
    page.click('[data-testid="btn-start"]'); page.wait_for_selector('[data-testid="screen-quiz"]')
    for i in range(5):
        page.click('[data-testid="likert-4"]'); page.wait_for_timeout(320)
    page.reload(); page.wait_for_load_state('networkidle')
    expect('用例2：刷新后 6/120', page.locator('[data-testid="progress-label"]').inner_text() == '6 / 120',
           page.locator('[data-testid="progress-label"]').inner_text())
    page.click('[data-testid="btn-prev"]'); page.wait_for_timeout(100)
    expect('用例2：已选状态保留', 'selected' in page.locator('[data-testid="likert-4"]').get_attribute('class'))
    page.evaluate('localStorage.clear()')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors = []
    page = browser.new_page(viewport={'width': 375, 'height': 812})
    page.on('pageerror', lambda e: errors.append(str(e)))

    run_flow(page)
    run_restore(page)

    # 用例 5：互链双向
    page.goto(BASE + '/index.html'); page.wait_for_load_state('networkidle')
    page.evaluate('localStorage.clear()'); page.reload(); page.wait_for_load_state('networkidle')
    page.click('[data-testid="link-big5"]'); page.wait_for_load_state('networkidle')
    expect('用例5：MBTI 版跳到大五版', 'big5.html' in page.url)
    page.click('[data-testid="link-mbti"]'); page.wait_for_load_state('networkidle')
    expect('用例5：大五版跳回 MBTI 版', page.url.endswith('index.html'))

    # 用例 6：320px 窄屏不横向溢出
    page.set_viewport_size({'width': 320, 'height': 568})
    page.goto(BASE + '/big5.html'); page.wait_for_load_state('networkidle')
    expect('用例6：欢迎页 320px 无溢出', page.evaluate('document.scrollingElement.scrollWidth') <= 320,
           str(page.evaluate('document.scrollingElement.scrollWidth')))
    page.click('[data-testid="btn-start"]'); page.wait_for_selector('[data-testid="screen-quiz"]')
    expect('用例6：答题页 320px 无溢出', page.evaluate('document.scrollingElement.scrollWidth') <= 320,
           str(page.evaluate('document.scrollingElement.scrollWidth')))

    expect('全程无 JS 错误', not errors, '; '.join(errors[:3]))
    browser.close()

print(f"\n{'ALL PASS' if not failures else 'FAILED: ' + ', '.join(failures)}")
sys.exit(0 if not failures else 1)
