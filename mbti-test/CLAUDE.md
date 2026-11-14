# mbti-test 项目约定

## 项目是什么

两个人格测试的单文件 Web 应用，同一「纸感编辑」视觉家族：

- `index.html` — MBTI 十六型（60 题），朋友间分享娱乐场景，朱砂红主色
- `big5.html` — 大五人格专业版（IPIP-NEO-120），T 分对标常模的严肃自评，墨蓝主色

无后端、无构建、无外部依赖，断网双击即用，两版本入口互链。

## 目录结构

```
mbti-test/
├── index.html                 # MBTI 版：题库、16 类型文案、计分、UI、样式
├── big5.html                  # 大五专业版：120 题、常模、报告文案、T 分换算
├── CLAUDE.md                  # 本文件
├── docs/
│   ├── superpowers/
│   │   ├── specs/             # 设计文档
│   │   └── plans/             # 实施计划
│   └── big5-sources.md        # big5 数据溯源（题目/计分键/常模的来源与推导）
└── test/
    ├── scoring.test.mjs       # MBTI 版断言（Node 直接运行）
    ├── e2e.py                 # MBTI 版 E2E
    ├── big5-scoring.test.mjs  # 大五版断言
    └── big5-e2e.py            # 大五版 E2E
```

## 硬性约束

- 单文件交付：两个 html 均不引用任何外部资源（无 CDN、无外链字体、无外链图片、无 API 请求）
- 禁止使用 fonts.googleapis.com；字体只用系统字体栈（PingFang SC / Microsoft YaHei / Songti SC 等）
- 简体中文文案，口语化；代码、变量、文件名用英文
- Canvas 分享卡片必须纯自绘，不 drawImage 任何外部图，避免跨域污染
- **big5 数据红线**：题目、计分键、常模必须可溯源到 `docs/big5-sources.md` 记录的来源；改动任何一项须先更新该文档

## 代码约定

- 计分逻辑必须是纯函数，与 DOM 完全解耦，放在 `<!-- SCORING-CORE-START/END -->` 标记块内（两个 html 同一模式）
- 内容数据（QUESTIONS / TYPES / NORMS / REPORT_TEXT）放在 `<!-- CONTENT-DATA-START/END -->` 标记块内
- 断言脚本通过标记提取执行；UI 挂稳定 `data-testid`，视觉改动不得增删改它们
- 变量 camelCase，常量 UPPER_SNAKE_CASE
- localStorage：MBTI 版 key `mbti-test-state`，大五版 key `big5-test-state`，结构同构

## 验证命令（改完必须跑；改哪个版本跑哪套，动互链跑全部）

```bash
node test/scoring.test.mjs        # MBTI 版断言
python3 test/e2e.py               # MBTI 版 E2E
node test/big5-scoring.test.mjs   # 大五版断言
python3 test/big5-e2e.py          # 大五版 E2E
```

## 何时清理

- 临时调试脚本、截图等产物用完即删，不留在仓库
- `test/` 下的断言脚本是交付物的一部分，保留
