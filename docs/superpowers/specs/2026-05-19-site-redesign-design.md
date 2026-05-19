# Site Redesign Design Spec

## Overview

Redesign burgessjp.github.io from a legacy Hexo static blog into a modern personal homepage + blog, using Astro + Tailwind CSS with a dark hacker/geek aesthetic.

## Goals

- Replace the aging Hexo + NexT Muse (2017) site with a modern stack
- Create a personal homepage with a blog section (not just a blog)
- Dark geek aesthetic with neon cyan (#00e5ff) accent and purple (#7c3aed) secondary
- Deploy to GitHub Pages via GitHub Actions
- Preserve all 32 existing blog posts as Markdown

## Tech Stack

- **Framework**: Astro 5.x with Content Collections
- **Styling**: Tailwind CSS 4.x
- **Fonts**: JetBrains Mono (headings/code), Inter (body)
- **Deployment**: GitHub Pages via GitHub Actions
- **Package Manager**: npm

## Site Structure

```
/                    → Homepage (hero + latest posts)
/blog/               → Blog listing with tag filter
/blog/[slug]/        → Individual blog post
/about/              → Personal intro, skills, contact
/projects/           → Projects showcase
```

## Visual Design

### Color System

| Token        | Value       | Usage                  |
|--------------|-------------|------------------------|
| --bg         | #0a0a0f     | Page background        |
| --bg-card    | #12121a     | Card/panel background  |
| --accent     | #00e5ff     | Primary accent (cyan)  |
| --accent2    | #7c3aed     | Secondary accent (purple) |
| --text       | #e4e4e7     | Body text              |
| --text-muted | #71717a     | Secondary text         |
| --border     | #27272a     | Borders/dividers       |

### Visual Effects

- Fixed grid background with subtle cyan lines (rgba(0,229,255,0.03))
- Hero area: terminal window mockup with blinking cursor + radial gradient glow that pulses
- Cards: glow border on hover (box-shadow with accent color)
- Navbar: frosted glass effect (backdrop-filter: blur)
- Smooth fade-in animations on page load

### Typography

- Headings & code: JetBrains Mono
- Body: Inter (system fallback)
- Code blocks: terminal-window style with colored dots (red/yellow/green)

## Components

1. **Navbar** — Fixed top, frosted glass, logo `_SOLID`, links: Home/Blog/Projects/About
2. **Hero** — Terminal mockup + intro text + CTA buttons
3. **BlogCard** — Tag label + title + excerpt + date, glow hover effect
4. **ProjectCard** — Icon + title + description + tech tags, purple accent
5. **TerminalBlock** — Decorative terminal window for code snippets
6. **Footer** — Minimal, centered

## Content Migration

- Convert 32 existing HTML blog posts to Markdown
- Place in `src/content/blog/` with frontmatter (title, date, tags, category)
- Preserve original categories: Android, Material Design, ORM, RecyclerView, Retrofit, RxJava, 插件化换肤, 项目, 源码分析

## File Structure (Target)

```
src/
  components/     → Navbar, Hero, BlogCard, ProjectCard, Footer, TerminalBlock
  content/
    blog/         → Markdown blog posts
  layouts/
    BaseLayout.astro
    BlogPost.astro
  pages/
    index.astro
    about.astro
    projects.astro
    blog/
      index.astro
      [...slug].astro
  styles/
    global.css
public/
  images/
astro.config.mjs
tailwind.config.mjs
package.json
.github/
  workflows/
    deploy.yml
```
