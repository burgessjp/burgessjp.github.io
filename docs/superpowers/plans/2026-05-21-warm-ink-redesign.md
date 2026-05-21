# Warm Ink Theme Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark cyberpunk theme with a warm paper-texture style using cream backgrounds, dark green accents, serif headings, and stream-list layouts.

**Architecture:** Global CSS theme swap in `global.css`, then update each component/page to use new tokens, remove animations, and switch to stream-list layout. No structural changes to content or routing.

**Tech Stack:** Astro 6, Tailwind CSS v4 (CSS-first `@theme` config), Google Fonts (Noto Serif SC)

---

## Task 1: Update global CSS theme

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace entire global.css with warm ink theme**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-bg: #f2efe9;
  --color-bg-card: #e4dfd6;
  --color-text: #2c2c2c;
  --color-text-muted: #6b6358;
  --color-accent: #4a6741;
  --color-border: #d9d2c7;

  --font-serif: 'Noto Serif SC', Georgia, 'Times New Roman', serif;
  --font-sans: -apple-system, 'Helvetica Neue', 'Noto Sans SC', system-ui, sans-serif;
}

html {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}
```

No grid-bg, no terminal, no card-glow, no cursor-blink, no hero-glow. All removed.

- [ ] **Step 2: Verify dev server renders with new colors**

Run: `cd /Users/peng/Documents/burgessjp.github.io && npm run dev -- --host`
Expected: Page loads with cream background, no grid overlay, no dark theme colors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: replace dark cyberpunk theme with warm ink palette"
```

---

## Task 2: Update BaseLayout fonts and remove grid overlay

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Update font import and remove grid-bg div**

Replace the full content of `src/layouts/BaseLayout.astro`:

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Mobile Dev | AI Explorer' } = Astro.props;
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
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet" />
    <title>{title} | _SOLID</title>
  </head>
  <body class="min-h-screen overflow-x-hidden">
    <slot />
  </body>
</html>
```

Changes: Replace Inter + JetBrains Mono with Noto Serif SC. Remove `<div class="grid-bg"></div>`.

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: update fonts to Noto Serif SC, remove grid overlay"
```

---

## Task 3: Update Navbar to classic top bar

**Files:**
- Modify: `src/components/Navbar.astro`

- [ ] **Step 1: Replace Navbar with clean top bar**

Replace the full content of `src/components/Navbar.astro`:

```astro
---
const currentPath = Astro.url.pathname;

const links = [
  { href: '/', label: '首页' },
  { href: '/blog/', label: '博客' },
  { href: '/projects/', label: '项目' },
  { href: '/about/', label: '关于' },
];
---

<nav class="border-b border-border">
  <div class="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
    <a href="/" class="font-serif font-bold text-lg text-text no-underline">
      _SOLID
    </a>
    <div class="flex gap-6">
      {links.map(({ href, label }) => (
        <a
          href={href}
          class:list={[
            'text-sm no-underline transition-colors',
            currentPath === href ? 'text-accent font-medium' : 'text-text-muted hover:text-accent',
          ]}
        >
          {label}
        </a>
      ))}
    </div>
  </div>
</nav>
```

Changes: Remove fixed positioning and backdrop-blur. Use `font-serif` for logo. Chinese nav labels. Active state uses accent color. Max-width matches content (`max-w-3xl`).

- [ ] **Step 2: Commit**

```bash
git add src/components/Navbar.astro
git commit -m "feat: simplify navbar to classic top bar with warm ink colors"
```

---

## Task 4: Replace Hero with simple intro

**Files:**
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Replace Hero with simple text intro**

Replace the full content of `src/components/Hero.astro`:

```astro
---

---

<section class="max-w-3xl mx-auto px-6 pt-16 pb-10">
  <h1 class="font-serif text-3xl font-bold mb-2">JIA PENG</h1>
  <p class="text-text-muted text-base leading-relaxed">
    Mobile Dev · AI Explorer — 10 年移动端开发，目前在探索 React Native 和 AI 辅助开发
  </p>
</section>
```

Changes: Remove terminal window, glow effect, cursor animation, CTA buttons. Simple name + one-liner.

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: replace terminal hero with simple intro text"
```

---

## Task 5: Create PostRow component (stream list item)

**Files:**
- Create: `src/components/PostRow.astro`

- [ ] **Step 1: Create PostRow component**

```astro
---
interface Props {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
}

const { title, excerpt, date, slug } = Astro.props;
---

<a href={`/blog/${slug}/`} class="flex gap-4 py-4 border-b border-border no-underline group last:border-b-0">
  <span class="text-xs text-accent whitespace-nowrap pt-0.5 font-medium">{date}</span>
  <div class="min-w-0">
    <h3 class="font-serif text-base font-bold text-text mb-1 group-hover:text-accent transition-colors">{title}</h3>
    <p class="text-sm text-text-muted leading-relaxed line-clamp-2">{excerpt}</p>
  </div>
</a>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PostRow.astro
git commit -m "feat: add PostRow stream list component"
```

---

## Task 6: Update homepage to stream list layout

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace homepage with stream list**

Replace the full content of `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Navbar from '../components/Navbar.astro';
import Hero from '../components/Hero.astro';
import PostRow from '../components/PostRow.astro';
import Footer from '../components/Footer.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('blog'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  .slice(0, 6);
---

<BaseLayout title="Home">
  <Navbar />
  <main class="max-w-3xl mx-auto px-6 pb-16">
    <Hero />
    <div class="text-xs text-text-muted uppercase tracking-wider mb-4">最新文章</div>
    <div>
      {posts.map((post) => (
        <PostRow
          title={post.data.title}
          excerpt={post.data.excerpt}
          date={post.data.date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' }).replace(/\//g, '.')}
          slug={post.id}
        />
      ))}
    </div>
  </main>
  <Footer />
</BaseLayout>
```

Changes: Replace BlogCard grid with PostRow stream list. Remove `z-10` relative positioning. Max-width `3xl`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: homepage stream list layout with PostRow"
```

---

## Task 7: Update blog listing page to stream list

**Files:**
- Modify: `src/pages/blog/index.astro`

- [ ] **Step 1: Replace blog listing with stream list + updated tag pills**

Replace the full content of `src/pages/blog/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Navbar from '../../components/Navbar.astro';
import PostRow from '../../components/PostRow.astro';
import Footer from '../../components/Footer.astro';
import { getCollection } from 'astro:content';

const allPosts = (await getCollection('blog'))
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

const allTags = [...new Set(allPosts.flatMap((p) => p.data.tags))].sort();
---

<BaseLayout title="Blog">
  <Navbar />
  <main class="max-w-3xl mx-auto px-6 pt-16 pb-16">
    <h1 class="font-serif text-2xl font-bold mb-8">博客</h1>

    <div class="flex flex-wrap gap-2 mb-8" id="tag-filter">
      <button
        class="tag-btn text-xs px-3 py-1 rounded-full bg-bg-card text-accent font-medium transition-colors active"
        data-tag="all"
      >
        All
      </button>
      {allTags.map((tag) => (
        <button
          class="tag-btn text-xs px-3 py-1 rounded-full bg-bg-card text-text-muted transition-colors hover:text-accent"
          data-tag={tag}
        >
          {tag}
        </button>
      ))}
    </div>

    <div id="posts-list">
      {allPosts.map((post) => (
        <div class="post-item" data-tags={post.data.tags.join(',')}>
          <PostRow
            title={post.data.title}
            excerpt={post.data.excerpt}
            date={post.data.date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' }).replace(/\//g, '.')}
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
    filterContainer.querySelectorAll('.tag-btn').forEach((b) => {
      b.classList.remove('active', 'text-accent');
      b.classList.add('text-text-muted');
    });
    btn.classList.add('active', 'text-accent');
    btn.classList.remove('text-text-muted');

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

Changes: Replace BlogCard grid with PostRow stream list. Tag pills use `bg-bg-card` background instead of border. Active tag gets accent color.

- [ ] **Step 2: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat: blog listing page stream list with warm ink tag pills"
```

---

## Task 8: Update projects page

**Files:**
- Modify: `src/pages/projects.astro`

- [ ] **Step 1: Simplify projects page**

Replace the full content of `src/pages/projects.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Navbar from '../components/Navbar.astro';
import Footer from '../components/Footer.astro';

const projects: { title: string; description: string; tags: string[] }[] = [];
---

<BaseLayout title="Projects">
  <Navbar />
  <main class="max-w-3xl mx-auto px-6 pt-16 pb-16">
    <h1 class="font-serif text-2xl font-bold mb-8">项目</h1>
    <div>
      {projects.map((project) => (
        <div class="py-4 border-b border-border last:border-b-0">
          <h3 class="font-serif text-base font-bold text-text mb-1">{project.title}</h3>
          <p class="text-sm text-text-muted leading-relaxed mb-2">{project.description}</p>
          <div class="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span class="text-xs px-2 py-0.5 rounded bg-bg-card text-accent">{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </main>
  <Footer />
</BaseLayout>
```

Changes: Remove ProjectCard dependency, inline stream list. Remove grid layout. Remove `z-10` and emoji icons.

- [ ] **Step 2: Commit**

```bash
git add src/pages/projects.astro
git commit -m "feat: projects page stream list with warm ink style"
```

---

## Task 9: Update about page

**Files:**
- Modify: `src/pages/about.astro`

- [ ] **Step 1: Update about page with warm ink tokens**

Replace the full content of `src/pages/about.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Navbar from '../components/Navbar.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout title="About">
  <Navbar />
  <main class="max-w-3xl mx-auto px-6 pt-16 pb-16">
    <h1 class="font-serif text-2xl font-bold mb-8">关于</h1>

    <div class="space-y-5 text-text-muted leading-relaxed">
      <p class="text-lg text-text">
        Hi, I'm <span class="text-accent font-semibold">_SOLID</span> (burgessjp).
      </p>

      <p>
        我是一名移动端工程师，10 年 Android/Kotlin/Java 老兵，目前在做 React Native 跨端开发。
      </p>

      <p>
        这十年一直在和复杂客户端问题打交道，从原生 Android 到跨端架构，从性能优化到工程体系建设，更享受"把复杂问题拆开，再系统性解决"的过程。现在主要精力放在 AI 方向——用 Claude Code 辅助日常编码，研究 Prompt Engineering 和 AI Agent 工作流，探索大模型如何真正融入开发者的日常。
      </p>

      <p>
        我相信好的技术不只是解决眼前的问题，更应该沉淀成可复用、可扩展的能力。
      </p>

      <p>
        不只是用 AI 写代码，更在思考 AI 时代工程师的核心竞争力是什么——Prompt 工程能力、AI 协作思维、自动化工作流设计，这些正在成为新的基本功。
      </p>

      <div class="mt-10">
        <h2 class="text-xs text-accent uppercase tracking-wider mb-4">Skills</h2>
        <div class="flex flex-wrap gap-2">
          {['Android', 'React Native', 'Kotlin', 'Claude Code', 'Prompt Engineering', 'AI Agents', 'LLM', '性能优化', '跨端架构'].map((skill) => (
            <span class="text-xs px-3 py-1 rounded-full bg-bg-card text-accent">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div class="mt-10">
        <h2 class="text-xs text-accent uppercase tracking-wider mb-4">Find me</h2>
        <div class="flex gap-4">
          <a href="https://github.com/burgessjp" target="_blank" rel="noopener" class="text-accent hover:underline text-sm">
            GitHub &rarr;
          </a>
        </div>
      </div>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

Changes: Section headings from `font-mono // prefix` to small uppercase accent. Skills tags use `bg-bg-card text-accent`. Remove `font-mono` from all elements. Remove `z-10`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: about page warm ink style with serif headings"
```

---

## Task 10: Update blog post layout

**Files:**
- Modify: `src/layouts/BlogPost.astro`

- [ ] **Step 1: Update BlogPost layout with warm ink typography**

Replace the full content of `src/layouts/BlogPost.astro`:

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
  <main class="max-w-3xl mx-auto px-6 pt-16 pb-16">
    <article>
      <header class="mb-10">
        <div class="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span class="text-xs px-3 py-0.5 rounded-full bg-bg-card text-accent">
              {tag}
            </span>
          ))}
        </div>
        <h1 class="font-serif text-3xl font-bold mb-3">{title}</h1>
        <time class="text-sm text-text-muted">
          {date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
      </header>
      <div class="prose prose-neutral prose-pre:bg-bg-card prose-pre:border prose-pre:border-border prose-code:text-accent prose-a:text-accent prose-headings:font-serif max-w-none">
        <slot />
      </div>
    </article>
  </main>
  <Footer />
</BaseLayout>
```

Changes: Title uses `font-serif`. Tags use `bg-bg-card text-accent`. Prose switches from `prose-invert` to `prose-neutral`. Heading font is serif.

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BlogPost.astro
git commit -m "feat: blog post layout warm ink typography"
```

---

## Task 11: Update Footer

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Simplify footer**

Replace the full content of `src/components/Footer.astro`:

```astro
---
const year = new Date().getFullYear();
---

<footer class="border-t border-border py-8 text-center text-text-muted text-sm">
  <p>&copy; {year} _SOLID</p>
</footer>
```

Changes: Remove heart icon and accent color. Remove `z-10`. Simple copyright line.

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: simplify footer to minimal copyright"
```

---

## Task 12: Clean up unused components

**Files:**
- Delete: `src/components/BlogCard.astro`
- Delete: `src/components/ProjectCard.astro`

- [ ] **Step 1: Delete BlogCard and ProjectCard**

These components are no longer imported anywhere after Tasks 6, 7, 8.

```bash
rm src/components/BlogCard.astro src/components/ProjectCard.astro
```

- [ ] **Step 2: Verify no broken imports**

Run: `npm run build`
Expected: Build succeeds with no import errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused BlogCard and ProjectCard components"
```

---

## Task 13: Final verification and dev server test

- [ ] **Step 1: Run dev server and visually verify all pages**

Run: `npm run dev -- --host`

Check each page:
- `/` — Cream background, serif heading in Hero, stream list of posts, green accent dates
- `/blog/` — Tag filter pills, stream list, filtering works
- `/projects/` — Stream list (empty but styled correctly)
- `/about/` — Serif headings, skill tags, link styling
- Click into a blog post — Serif title, readable prose, code blocks with card background

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final adjustments for warm ink theme"
```
