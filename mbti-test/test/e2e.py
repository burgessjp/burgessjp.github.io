"""E2E 全流程验证：python3 test/e2e.py（依赖 playwright，file:// 直开，无服务器）

用例：
1. 完整流程（全选「同意」→ ESTJ）
2. 进度推进与 60/60
3. 刷新恢复
4. 分享卡片 data:image/png
5. 重新测试清 storage
6. 320px 窄屏不横向溢出
"""
import os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file://' + os.path.join(ROOT, 'index.html')
failures = []

def expect(name, cond, detail=''):
    print(('PASS: ' if cond else 'FAIL: ') + name + (f' — {detail}' if detail and not cond else ''))
    if not cond:
        failures.append(name)

def run_flow(page):
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.evaluate('localStorage.clear()')
    page.reload()
    page.wait_for_load_state('networkidle')

    # 用例 1+2：完整流程与进度
    page.click('[data-testid="btn-start"]')
    page.wait_for_selector('[data-testid="screen-quiz"]')
    for i in range(60):
        label = page.locator('[data-testid="progress-label"]').inner_text()
        if i == 0:
            expect('进度从 1/60 开始', label == '1 / 60', label)
        if i == 59:
            expect('最后一题显示 60/60', label == '60 / 60', label)
        page.click('[data-testid="likert-1"]')
        page.wait_for_timeout(280)
        if page.locator('[data-testid="screen-result"]').is_visible():
            break
    page.wait_for_selector('[data-testid="screen-result"]', timeout=5000)
    expect('用例1：全选同意 → ESTJ', page.locator('[data-testid="type-code"]').inner_text() == 'ESTJ',
           page.locator('[data-testid="type-code"]').inner_text())

    # 用例 4：分享卡片
    page.click('[data-testid="btn-share"]')
    page.wait_for_selector('[data-testid="share-img"]', timeout=3000)
    expect('用例4：分享图 data:image/png',
           page.locator('[data-testid="share-img"]').get_attribute('src').startswith('data:image/png'))
    expect('用例4：下载链接 data:image/png',
           page.locator('[data-testid="share-download"]').get_attribute('href').startswith('data:image/png'))

    # 用例 5：重新测试
    page.click('[data-testid="btn-restart"]')
    page.wait_for_selector('[data-testid="screen-welcome"]')
    expect('用例5：回欢迎页', page.locator('[data-testid="screen-welcome"]').is_visible())
    expect('用例5：storage 已清空', page.evaluate("localStorage.getItem('mbti-test-state')") is None)

def run_restore(page):
    # 用例 3：刷新恢复
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.evaluate('localStorage.clear()')
    page.reload()
    page.wait_for_load_state('networkidle')
    page.click('[data-testid="btn-start"]')
    page.wait_for_selector('[data-testid="screen-quiz"]')
    for i in range(5):
        page.click('[data-testid="likert-1"]')
        page.wait_for_timeout(320)
    page.reload()
    page.wait_for_load_state('networkidle')
    expect('用例3：刷新后仍是答题页', page.locator('[data-testid="screen-quiz"]').is_visible())
    expect('用例3：刷新后进度 6/60', page.locator('[data-testid="progress-label"]').inner_text() == '6 / 60',
           page.locator('[data-testid="progress-label"]').inner_text())
    page.click('[data-testid="btn-prev"]')
    page.wait_for_timeout(100)
    expect('用例3：已选状态保留', 'selected' in page.locator('[data-testid="likert-1"]').get_attribute('class'))
    page.evaluate('localStorage.clear()')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors = []
    page = browser.new_page(viewport={'width': 375, 'height': 812})
    page.on('pageerror', lambda e: errors.append(str(e)))

    run_flow(page)
    run_restore(page)

    # 用例 6：320px 窄屏不横向溢出
    page.set_viewport_size({'width': 320, 'height': 568})
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    expect('用例6：320px 无横向溢出', page.evaluate('document.scrollingElement.scrollWidth') <= 320,
           str(page.evaluate('document.scrollingElement.scrollWidth')))
    page.click('[data-testid="btn-start"]')
    page.wait_for_selector('[data-testid="screen-quiz"]')
    expect('用例6：答题页 320px 无溢出', page.evaluate('document.scrollingElement.scrollWidth') <= 320,
           str(page.evaluate('document.scrollingElement.scrollWidth')))

    expect('全程无 JS 错误', not errors, '; '.join(errors[:3]))
    browser.close()

print(f"\n{'ALL PASS' if not failures else 'FAILED: ' + ', '.join(failures)}")
sys.exit(0 if not failures else 1)
