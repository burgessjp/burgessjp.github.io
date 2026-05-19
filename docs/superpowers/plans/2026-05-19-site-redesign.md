# Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild burgessjp.github.io as a modern Astro + Tailwind CSS personal homepage + blog with a dark hacker aesthetic.

**Architecture:** Astro 5.x with Content Collections for blog posts, Tailwind CSS 4.x for styling. Static output deployed to GitHub Pages via GitHub Actions. All 19 existing blog posts migrated from HTML to Markdown.

**Tech Stack:** Astro 5.x, Tailwind CSS 4.x, TypeScript, GitHub Actions

---

## File Map

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `astro.config.mjs` | Astro config with GitHub Pages adapter |
| `tsconfig.json` | TypeScript config |
| `src/styles/global.css` | Tailwind directives + custom CSS vars + grid bg + terminal styles |
| `src/layouts/BaseLayout.astro` | HTML shell: head, navbar slot, footer, global styles |
| `src/layouts/BlogPost.astro` | Blog post layout extending BaseLayout with article styling |
| `src/components/Navbar.astro` | Fixed top navbar with frosted glass |
| `src/components/Hero.astro` | Terminal mockup + intro + CTA buttons |
| `src/components/TerminalBlock.astro` | Reusable terminal-styled code block wrapper |
| `src/components/BlogCard.astro` | Blog post preview card |
| `src/components/ProjectCard.astro` | Project showcase card |
| `src/components/Footer.astro` | Minimal footer |
| `src/components/TagFilter.astro` | Tag filter bar for blog listing |
| `src/content.config.ts` | Content collection schema definition |
| `src/content/blog/*.md` | 19 migrated blog posts |
| `src/pages/index.astro` | Homepage |
| `src/pages/about.astro` | About page |
| `src/pages/projects.astro` | Projects page |
| `src/pages/blog/index.astro` | Blog listing |
| `src/pages/blog/[...slug].astro` | Blog post detail |
| `.github/workflows/deploy.yml` | GitHub Pages deploy action |
| `public/images/` | Static assets |

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`

- [ ] **Step 1: Initialize Astro project from repo root**

Run from the repo root directory. This will overwrite existing static files — the old site will be replaced entirely.

```bash
npm init astro@latest -- --template minimal --no-install --no-git --typescript strict
```

If the interactive prompt still appears, accept defaults. The key requirement: Astro 5.x minimal template lands in the current directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Install Tailwind CSS and Astro integrations**

```bash
npx astro add tailwind --yes
```

- [ ] **Step 4: Verify dev server starts**

```bash
npx astro dev
```

Open `http://localhost:4321` — should see the Astro welcome page. Kill the dev server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: initialize Astro 5.x project with Tailwind CSS"
```

---

### Task 2: Configure Astro for GitHub Pages

**Files:**
- Modify: `astro.config.mjs`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Update astro.config.mjs**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://burgessjp.github.io',
  base: '/',
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Note: The `@tailwindcss/vite` plugin path depends on the Astro + Tailwind integration version. If `npx astro add tailwind` already configured Tailwind, check what it generated and adapt accordingly. The key settings are `site` and `base`.

- [ ] **Step 2: Create deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs .github/workflows/deploy.yml
git commit -m "chore: configure GitHub Pages deployment"
```

---

### Task 3: Set up global styles and design tokens

**Files:**
- Create: `src/styles/global.css`
- Modify: `tailwind.config.mjs` (if exists) or inline in `astro.config.mjs`

- [ ] **Step 1: Create global CSS with Tailwind and design tokens**

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0f;
  --color-bg-card: #12121a;
  --color-bg-card-hover: #1a1a25;
  --color-accent: #00e5ff;
  --color-accent2: #7c3aed;
  --color-text: #e4e4e7;
  --color-text-muted: #71717a;
  --color-border: #27272a;

  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

html {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

/* Grid background */
.grid-bg {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

/* Terminal window */
.terminal {
  background: #0d0d14;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  text-align: left;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--color-border);
}

.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.terminal-dot-red { background: #ff5f57; }
.terminal-dot-yellow { background: #febc2e; }
.terminal-dot-green { background: #28c840; }

.terminal-body {
  padding: 1rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.8;
}

/* Glow card hover */
.card-glow {
  transition: all 0.25s;
}
.card-glow:hover {
  background-color: var(--color-bg-card-hover);
  border-color: rgba(0,229,255,0.25);
  box-shadow: 0 0 30px rgba(0,229,255,0.06);
  transform: translateY(-2px);
}

/* Blinking cursor */
@keyframes blink {
  50% { opacity: 0; }
}
.cursor-blink {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: var(--color-accent);
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

/* Pulse glow */
@keyframes pulse-glow {
  0% { opacity: 0.6; transform: translate(-50%, -60%) scale(1); }
  100% { opacity: 1; transform: translate(-50%, -60%) scale(1.15); }
}
.hero-glow {
  animation: pulse-glow 6s ease-in-out infinite alternate;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add global styles with dark theme design tokens"
```

---

## Phase 2: Layouts and Components

### Task 4: Create BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create BaseLayout**

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Android Developer | Tech Enthusiast' } = Astro.props;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
    <title>{title} | _SOLID</title>
  </head>
  <body class="min-h-screen overflow-x-hidden">
    <div class="grid-bg"></div>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: add BaseLayout with global styles and font loading"
```

---

### Task 5: Create Navbar component

**Files:**
- Create: `src/components/Navbar.astro`

- [ ] **Step 1: Create Navbar**

```astro
---
const currentPath = Astro.url.pathname;

const links = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
];
---

<nav class="fixed top-0 left-0 right-0 z-50 bg-[rgba(10,10,15,0.85)] backdrop-blur-xl border-b border-border">
  <div class="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
    <a href="/" class="font-mono font-bold text-xl text-accent no-underline">
      <span class="text-text">_</span>SOLID
    </a>
    <div class="flex gap-8">
      {links.map(({ href, label }) => (
        <a
          href={href}
          class:list={[
            'text-sm font-medium no-underline transition-colors',
            currentPath === href ? 'text-accent' : 'text-text-muted hover:text-accent',
          ]}
        >
          {label}
        </a>
      ))}
    </div>
  </div>
</nav>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Navbar.astro
git commit -m "feat: add Navbar component with frosted glass effect"
```

---

### Task 6: Create Footer component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Create Footer**

```astro
---
const year = new Date().getFullYear();
---

<footer class="relative z-10 border-t border-border py-8 text-center text-text-muted text-sm">
  <p>Built with <span class="text-accent">&hearts;</span> &mdash; &copy;{year} _SOLID. Powered by Astro.</p>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: add Footer component"
```

---

### Task 7: Create Hero component

**Files:**
- Create: `src/components/Hero.astro`

- [ ] **Step 1: Create Hero**

```astro
---

---

<section class="relative min-h-screen flex items-center justify-center text-center px-6 pt-24 pb-16">
  <!-- Glow -->
  <div class="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.12)_0%,rgba(124,58,237,0.08)_40%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] pointer-events-none hero-glow"></div>

  <div class="relative z-10 max-w-2xl mx-auto">
    <!-- Terminal -->
    <div class="terminal max-w-xl mx-auto mb-8">
      <div class="terminal-header">
        <div class="terminal-dot terminal-dot-red"></div>
        <div class="terminal-dot terminal-dot-yellow"></div>
        <div class="terminal-dot terminal-dot-green"></div>
        <span class="flex-1 text-center font-mono text-xs text-text-muted">zsh — solid@dev</span>
      </div>
      <div class="terminal-body">
        <div><span class="text-accent">~</span> <span class="text-text">whoami</span></div>
        <div class="text-text-muted">burgessjp / _SOLID</div>
        <div><span class="text-accent">~</span> <span class="text-text">cat profile.txt</span></div>
        <div class="text-text-muted">Android Developer | Tech Enthusiast</div>
        <div><span class="text-accent">~</span> <span class="text-text">ls ./interests/</span></div>
        <div class="text-text-muted">rxjava/ retrofit/ kotlin/ material-design/<span class="cursor-blink"></span></div>
      </div>
    </div>

    <p class="text-lg text-text-muted leading-relaxed mb-10">
      Android Developer, exploring the beauty of code.<br/>
      Writing about RxJava, Retrofit, Material Design and more.
    </p>

    <div class="flex gap-4 justify-center">
      <a href="/blog/" class="inline-flex items-center gap-2 bg-accent text-bg px-6 py-3 rounded-lg font-semibold text-sm no-underline transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.35)] hover:-translate-y-px">
        Read Blog &rarr;
      </a>
      <a href="/projects/" class="inline-flex items-center gap-2 bg-transparent text-text px-6 py-3 rounded-lg font-medium text-sm no-underline border border-border transition-all hover:border-accent hover:text-accent">
        View Projects
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: add Hero component with terminal mockup"
```

---

### Task 8: Create BlogCard component

**Files:**
- Create: `src/components/BlogCard.astro`

- [ ] **Step 1: Create BlogCard**

```astro
---
interface Props {
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  slug: string;
}

const { title, excerpt, date, tag, slug } = Astro.props;
---

<a href={`/blog/${slug}/`} class="block bg-bg-card border border-border rounded-xl p-6 no-underline card-glow">
  <span class="inline-block font-mono text-xs text-accent bg-[rgba(0,229,255,0.1)] px-3 py-0.5 rounded-full mb-3">
    {tag}
  </span>
  <h3 class="text-base font-semibold text-text mb-2">{title}</h3>
  <p class="text-sm text-text-muted leading-relaxed mb-4">{excerpt}</p>
  <div class="text-xs text-text-muted">{date}</div>
</a>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BlogCard.astro
git commit -m "feat: add BlogCard component with glow hover"
```

---

### Task 9: Create ProjectCard component

**Files:**
- Create: `src/components/ProjectCard.astro`

- [ ] **Step 1: Create ProjectCard**

```astro
---
interface Props {
  icon: string;
  title: string;
  description: string;
  tags: string[];
}

const { icon, title, description, tags } = Astro.props;
---

<div class="bg-bg-card border border-border rounded-xl p-6 transition-all hover:border-[rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.08)] hover:-translate-y-0.5">
  <div class="text-3xl mb-4">{icon}</div>
  <h3 class="text-base font-semibold mb-2">{title}</h3>
  <p class="text-sm text-text-muted leading-relaxed mb-4">{description}</p>
  <div class="flex flex-wrap gap-2">
    {tags.map((tag) => (
      <span class="font-mono text-xs text-accent2 bg-[rgba(124,58,237,0.1)] px-3 py-0.5 rounded-full">
        {tag}
      </span>
    ))}
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProjectCard.astro
git commit -m "feat: add ProjectCard component with purple accent"
```

---

## Phase 3: Content Collections and Blog Posts

### Task 10: Define content collection schema

**Files:**
- Create: `src/content.config.ts`

- [ ] **Step 1: Create content collection config**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    category: z.string().default('Android'),
    excerpt: z.string().default(''),
  }),
});

export const collections = { blog };
```

- [ ] **Step 2: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add blog content collection schema"
```

---

### Task 11: Migrate blog posts from HTML to Markdown

**Files:**
- Create: `src/content/blog/*.md` (19 files)

This is the largest task. Each blog post HTML must be converted to Markdown with proper frontmatter. The posts are:

| # | Source HTML Path | Target Markdown File |
|---|-----------------|---------------------|
| 1 | `2016/03/26/Android-多媒体之MediaRecorder-MediaPlayer/` | `2016-03-26-android-media-recorder-player.md` |
| 2 | `2016/03/28/Android-多媒体之Camera/` | `2016-03-28-android-camera.md` |
| 3 | `2016/03/31/Android-Material-Design-兼容库的使用详解/` | `2016-03-31-material-design-compat.md` |
| 4 | `2016/04/05/打造一个RecyclerView的万能适配器-减少你的代码冗余/` | `2016-04-05-recyclerview-adapter.md` |
| 5 | `2016/04/11/Android自定义View之高仿QQ健康/` | `2016-04-11-custom-view-qq-health.md` |
| 6 | `2016/04/17/Android主题换肤-无缝切换/` | `2016-04-17-android-theme-switch.md` |
| 7 | `2016/04/26/ThinDownloadManager源码解析/` | `2016-04-26-thin-download-manager.md` |
| 8 | `2016/04/28/Android自定义ViewGroup之仿制一个Windows桌面/` | `2016-04-28-custom-viewgroup-windows.md` |
| 9 | `2016/05/09/比系统自带的更好用的SnackBar/` | `2016-05-09-better-snackbar.md` |
| 10 | `2016/05/23/基于Gank-IO提供的API的第三方客户端.../` | `2016-05-23-gank-io-client.md` |
| 11 | `2016/06/03/Android-关于传感器你需要知道的/` | `2016-06-03-android-sensors.md` |
| 12 | `2016/06/14/仿魅族手机消息通知效果/` | `2016-06-14-meizu-notification.md` |
| 13 | `2016/06/15/是时候学习RxJava了/` | `2016-06-15-learn-rxjava.md` |
| 14 | `2016/07/21/自动抢红包，自动安装原理之AccessibilityService/` | `2016-07-21-accessibility-service.md` |
| 15 | `2016/08/16/聊聊对RxJava与Retrofit的封装/` | `2016-08-16-rxjava-retrofit-wrapper.md` |
| 16 | `2016/09/22/在Android中使用Realm作本地存储/` | `2016-09-22-realm-local-storage.md` |
| 17 | `2016/10/25/分享一种RecyclerView滑动到底部自动加载的实现方案/` | `2016-10-25-recyclerview-loadmore.md` |
| 18 | `2016/12/04/[干货IO-3-0]-一个完全开源的App/` | `2016-12-04-gankio-opensource-app.md` |
| 19 | `2017/04/06/自定义ItemDecoration这个问题你真的注意到了吗/` | `2017-04-06-custom-itemdecoration.md` |

For each post:
1. Open the source `index.html`
2. Extract the article body content from the `.post-body` div
3. Convert HTML to Markdown (headings, code blocks, lists, images, links)
4. Add frontmatter with title, date, tags, category, excerpt
5. Save to `src/content/blog/` with the slug filename

**Example frontmatter for post #13:**

```markdown
---
title: "是时候学习RxJava了"
date: 2016-06-15
tags: ["Android", "RxJava"]
category: "RxJava"
excerpt: "RxJava 入门教程，介绍 Observable、Observer 和常用操作符的核心概念"
---

[converted markdown content here]
```

**Code block conversion rules:**
- HTML `<figure class="highlight">` blocks → fenced code blocks with language tag
- Inline `<code>` → backtick code
- Preserve all Chinese text as-is

This task should be split across multiple subagents for parallelism. Each subagent handles 4-5 posts.

- [ ] **Step 1: Create blog content directory**

```bash
mkdir -p src/content/blog
```

- [ ] **Step 2: Convert all 19 posts**

For each post listed above, read the HTML, extract content, convert to Markdown, write the file. Do this in parallel batches.

- [ ] **Step 3: Verify posts render**

```bash
npm run dev
```

Navigate to `http://localhost:4321/blog/` and spot-check several posts.

- [ ] **Step 4: Commit**

```bash
git add src/content/blog/
git commit -m "feat: migrate 19 blog posts from HTML to Markdown"
```

---

### Task 12: Create BlogPost layout

**Files:**
- Create: `src/layouts/BlogPost.astro`

- [ ] **Step 1: Create BlogPost layout**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Navbar from '../components/Navbar.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  date: Date;
  tags: string[];
}

const { title, date, tags } = Astro.props;
---

<BaseLayout title={title}>
  <Navbar />
  <main class="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-16">
    <article>
      <header class="mb-10">
        <div class="flex gap-2 mb-4">
          {tags.map((tag) => (
            <span class="font-mono text-xs text-accent bg-[rgba(0,229,255,0.1)] px-3 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <h1 class="text-3xl font-bold mb-3">{title}</h1>
        <time class="text-sm text-text-muted">
          {date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
      </header>
      <div class="prose prose-invert prose-pre:bg-[#0d0d14] prose-pre:border prose-pre:border-border prose-code:text-accent prose-a:text-accent prose-headings:font-mono max-w-none">
        <slot />
      </div>
    </article>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Install typography plugin for prose styles**

```bash
npm install @tailwindcss/typography
```

Then add it to `astro.config.mjs` plugins if needed by the Tailwind version, or import in `global.css`:

```css
@import "@tailwindcss/typography";
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BlogPost.astro src/styles/global.css
git commit -m "feat: add BlogPost layout with prose styling"
```

---

## Phase 4: Pages

### Task 13: Create Homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create Homepage**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Navbar from '../components/Navbar.astro';
import Hero from '../components/Hero.astro';
import BlogCard from '../components/BlogCard.astro';
import Footer from '../components/Footer.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('blog'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 6);
---

<BaseLayout title="Home">
  <Navbar />
  <Hero />
  <section class="relative z-10 max-w-5xl mx-auto px-6 pb-16">
    <div class="font-mono text-sm text-accent uppercase tracking-widest mb-8">
      <span class="text-text-muted">// </span>Latest Posts
    </div>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
      {posts.map((post) => (
        <BlogCard
          title={post.data.title}
          excerpt={post.data.excerpt}
          date={post.data.date.toLocaleDateString('zh-CN')}
          tag={post.data.tags[0] || 'Android'}
          slug={post.id}
        />
      ))}
    </div>
  </section>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Verify homepage renders**

```bash
npm run dev
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: create homepage with hero and latest posts"
```

---

### Task 14: Create Blog listing page

**Files:**
- Create: `src/pages/blog/index.astro`

- [ ] **Step 1: Create blog listing**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Navbar from '../../components/Navbar.astro';
import BlogCard from '../../components/BlogCard.astro';
import Footer from '../../components/Footer.astro';
import { getCollection } from 'astro:content';

const allPosts = (await getCollection('blog'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

const allTags = [...new Set(allPosts.flatMap((p) => p.data.tags))].sort();
---

<BaseLayout title="Blog">
  <Navbar />
  <main class="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-16">
    <h1 class="font-mono text-2xl font-bold mb-8">Blog</h1>

    <!-- Tag filter -->
    <div class="flex flex-wrap gap-2 mb-10" id="tag-filter">
      <button
        class="tag-btn font-mono text-xs px-3 py-1 rounded-full border border-border text-text-muted transition-all hover:border-accent hover:text-accent active"
        data-tag="all"
      >
        All
      </button>
      {allTags.map((tag) => (
        <button
          class="tag-btn font-mono text-xs px-3 py-1 rounded-full border border-border text-text-muted transition-all hover:border-accent hover:text-accent"
          data-tag={tag}
        >
          {tag}
        </button>
      ))}
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6" id="posts-grid">
      {allPosts.map((post) => (
        <div class="post-item" data-tags={post.data.tags.join(',')}>
          <BlogCard
            title={post.data.title}
            excerpt={post.data.excerpt}
            date={post.data.date.toLocaleDateString('zh-CN')}
            tag={post.data.tags[0] || 'Android'}
            slug={post.id}
          />
        </div>
      ))}
    </div>
  </main>
  <Footer />
</BaseLayout>

<script>
  const filterContainer = document.getElementById('tag-filter');
  const postItems = document.querySelectorAll('.post-item');

  filterContainer?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.tag-btn');
    if (!btn) return;

    const tag = btn.dataset.tag;
    filterContainer.querySelectorAll('.tag-btn').forEach((b) => b.classList.remove('active', 'border-accent', 'text-accent'));
    btn.classList.add('active', 'border-accent', 'text-accent');

    postItems.forEach((item) => {
      const el = item as HTMLElement;
      if (tag === 'all' || el.dataset.tags?.includes(tag!)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat: add blog listing page with tag filter"
```

---

### Task 15: Create Blog post detail page

**Files:**
- Create: `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Create dynamic blog post page**

```astro
---
import { getCollection, render } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BlogPost title={post.data.title} date={post.data.date} tags={post.data.tags}>
  <Content />
</BlogPost>
```

- [ ] **Step 2: Verify a blog post renders**

```bash
npm run dev
```

Open any blog post URL and verify content displays correctly.

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog/\[...slug\].astro
git commit -m "feat: add blog post detail page with dynamic routing"
```

---

### Task 16: Create About page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Create About page**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Navbar from '../components/Navbar.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout title="About">
  <Navbar />
  <main class="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-16">
    <h1 class="font-mono text-2xl font-bold mb-8">
      <span class="text-text-muted">// </span>About
    </h1>

    <div class="space-y-6 text-text-muted leading-relaxed">
      <p class="text-lg text-text">
        Hi, I'm <span class="text-accent font-semibold">_SOLID</span> (burgessjp).
      </p>

      <p>
        Android developer and tech enthusiast. I write about Android development,
        RxJava, Retrofit, Material Design, and other technologies I find interesting.
      </p>

      <div class="mt-10">
        <h2 class="font-mono text-sm text-accent uppercase tracking-widest mb-4">
          <span class="text-text-muted">// </span>Skills
        </h2>
        <div class="flex flex-wrap gap-2">
          {['Android', 'Java', 'Kotlin', 'RxJava', 'Retrofit', 'Material Design', 'RecyclerView', 'Realm', 'Gradle'].map((skill) => (
            <span class="font-mono text-xs text-accent2 bg-[rgba(124,58,237,0.1)] px-3 py-1 rounded-full">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div class="mt-10">
        <h2 class="font-mono text-sm text-accent uppercase tracking-widest mb-4">
          <span class="text-text-muted">// </span>Find me
        </h2>
        <div class="flex gap-4">
          <a href="https://github.com/burgessjp" target="_blank" rel="noopener" class="text-accent hover:underline font-mono text-sm">
            GitHub &rarr;
          </a>
        </div>
      </div>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: add About page"
```

---

### Task 17: Create Projects page

**Files:**
- Create: `src/pages/projects.astro`

- [ ] **Step 1: Create Projects page**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Navbar from '../components/Navbar.astro';
import ProjectCard from '../components/ProjectCard.astro';
import Footer from '../components/Footer.astro';

const projects = [
  {
    icon: '📱',
    title: 'Android Samples',
    description: 'Android 开发示例合集，涵盖自定义 View、多媒体、网络请求等常用场景。',
    tags: ['Java', 'Android SDK', 'Gradle'],
  },
  {
    icon: '🔧',
    title: 'RxUtils',
    description: 'RxJava 工具类库，封装常用操作符组合，简化线程切换和错误处理。',
    tags: ['RxJava 2', 'Retrofit'],
  },
  {
    icon: '🎨',
    title: 'ThemeEngine',
    description: 'Android 动态换肤框架，支持插件化加载外部资源包实现主题切换。',
    tags: ['Java', 'ClassLoader', 'LayoutInflater'],
  },
];
---

<BaseLayout title="Projects">
  <Navbar />
  <main class="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-16">
    <h1 class="font-mono text-2xl font-bold mb-8">
      <span class="text-text-muted">// </span>Projects
    </h1>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
      {projects.map((project) => (
        <ProjectCard {...project} />
      ))}
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/projects.astro
git commit -m "feat: add Projects page"
```

---

## Phase 5: Cleanup and Deploy

### Task 18: Remove old static site files

**Files:**
- Delete: `2016/`, `2017/`, `archives/`, `categories/`, `tags/`, `css/`, `js/`, `lib/`, `images/`, `page/`, `index.html`, `_preview.html`

- [ ] **Step 1: Remove old Hexo output**

```bash
rm -rf 2016 2017 archives categories tags css js lib images page index.html _preview.html
```

- [ ] **Step 2: Verify dev server still works**

```bash
npm run dev
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove legacy Hexo static site files"
```

---

### Task 19: Build and verify production output

**Files:**
- None (verification only)

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: Build completes with no errors. Output in `dist/` directory.

- [ ] **Step 2: Preview production build**

```bash
npx astro preview
```

Open `http://localhost:4321` and verify:
- Homepage loads with hero + blog cards
- Blog listing shows all posts with tag filter working
- Individual blog posts render correctly
- About and Projects pages work
- Dark theme is consistent
- All links work

- [ ] **Step 3: Commit any fixes**

If fixes were needed:

```bash
git add -A
git commit -m "fix: address build/preview issues"
```

---

### Task 20: Final commit and push

**Files:**
- None

- [ ] **Step 1: Ensure clean state**

```bash
git status
```

Should show clean working tree.

- [ ] **Step 2: Push to trigger deployment**

```bash
git push origin master
```

This triggers the GitHub Actions workflow which builds and deploys to GitHub Pages.

- [ ] **Step 3: Verify deployment**

Check GitHub Actions tab for build status. Once deployed, visit `https://burgessjp.github.io` to verify.
