# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro static blog deployed to GitHub Pages at `burgessjp.github.io`. Chinese-language content about AI-assisted development. No Hexo source — this is the source of truth.

## Commands

```bash
npm run dev       # Dev server (localhost:4321)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

Requires Node >= 22.12.0.

## Architecture

**Astro 6 + Tailwind CSS 4** with content collections.

```
src/
├── components/    # Navbar, Hero, Footer, PostRow
├── layouts/       # BaseLayout (shell), BlogPost (article + comments)
├── pages/         # Routes: /, /about, /projects, /blog, /blog/[slug]
├── content/blog/  # Markdown posts (YYYY-MM-DD-title.md)
└── styles/        # global.css — Tailwind + theme variables
```

**Routing**: File-based. Blog posts use `[...slug].astro` catch-all with content collection `blog`.

**Content schema** (`content.config.ts`): `title`, `date`, `tags[]`, `category` (default 'AI'), `excerpt`.

## Design System

Warm ink theme defined in `global.css` `@theme` block:
- Background `#f2efe9`, card `#e4dfd6`, text `#2c2c2c`, accent `#4a6741`, border `#d9d2c7`
- Headings: serif (Songti SC). Body: system sans-serif.
- Content area: `max-w-3xl mx-auto px-6`

## External Integrations

- **Giscus** — GitHub Discussions comments (repo: `burgessjp/burgessjp.github.io`, theme: `noborder_light`, lang: zh-CN)
- **Busuanzi** — page view counter (busuanzi.ibruce.info)
- Both loaded via inline scripts in `BlogPost.astro`

## 文章工作流

所有文章操作由 Claude Code 完成，用户只需提供完整 markdown 内容。

**发布新文章**：用户提供 markdown + 标题 → 创建 `src/content/blog/YYYY-MM-DD-title.md`（补 frontmatter）→ `npm run build` 验证 → commit + push

**更新文章**：用户提供完整 markdown + 哪篇文章 → 替换文件内容（保留原 frontmatter 的 date，更新其他字段）→ `npm run build` 验证 → commit + push

**删除文章**：用户告知标题 → 确认后删除文件 → `npm run build` 验证 → commit + push

## 工具项目（mbti-test）

`mbti-test/` 是独立维护的单文件 Web 应用（MBTI + 大五人格测试），有自己的 CLAUDE.md——在那个目录下工作遵守它的约定，验证命令也在该目录内运行。

- **唯一事实源是 `mbti-test/`**；`public/mbti-test/` 由 `scripts/sync-mbti.mjs` 在 `predev`/`prebuild` 时自动同步，已 gitignore，不要手工编辑或提交
- 改动 `mbti-test/*.html` 后：进入 `mbti-test/` 跑它 CLAUDE.md 里的验证命令 → 回根目录 `npm run build` → commit + push
- 站内入口在 `src/pages/tools.astro`（卡片文案与链接）

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`): push to `master` → `npm ci && npm run build` → deploy `dist/` to GitHub Pages.
