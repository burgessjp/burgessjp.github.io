# Blog UI Redesign: Warm Ink Theme

## Overview

Redesign the blog from the current dark cyberpunk theme to a warm paper-texture style ("Warm Ink"). The new design prioritizes readability, content focus, and a calm reading experience that matches the technical blog content.

## Design Decisions

| Dimension | Choice |
|-----------|--------|
| Style | Warm paper texture |
| Palette | Warm Ink (cream background + dark green accent) |
| Typography | Serif headings + sans-serif body |
| Homepage layout | Stream list (date + title + excerpt) |
| Navigation | Classic top navbar |

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#f2efe9` | Page background |
| `--color-bg-card` | `#e4dfd6` | Cards, code blocks, subtle surfaces |
| `--color-text` | `#2c2c2c` | Primary text |
| `--color-text-muted` | `#6b6358` | Secondary text, descriptions |
| `--color-accent` | `#4a6741` | Accent color: links, dates, active nav, tags |
| `--color-border` | `#d9d2c7` | Dividers, card borders |

## Typography

- **Headings**: `Georgia`, `'Noto Serif SC'`, `serif` — used for site logo, page titles, article titles, section headings
- **Body**: `-apple-system`, `'Helvetica Neue'`, `'Noto Sans SC'`, `sans-serif` — used for navigation, body text, descriptions, tags, dates
- **Google Fonts**: Load `Noto Serif SC` (weights 400, 700) for Chinese serif support

## Layout Specifications

### Navbar (Classic Top Bar)

- Fixed top, `border-bottom: 1px solid var(--color-border)`
- Background: `var(--color-bg)` (no blur effect)
- Left: `_SOLID` logo in serif font
- Right: nav links (首页, 博客, 项目, 关于) in sans-serif
- Active link colored with `var(--color-accent)`, others in `var(--color-text-muted)`
- No glow, no backdrop blur, no animation

### Homepage

- No Hero section with terminal animation
- Simple intro: name in serif heading + one-line description
- "最新文章" section label in small uppercase
- Stream list of articles, each row:
  - Left: date in accent color (format: `YYYY.MM`)
  - Right: title in serif bold + excerpt in sans-serif muted
  - Separated by `1px solid var(--color-border)`
- Show latest 6 posts, link to full blog listing

### Blog Listing Page

- Tag filter bar at top (pill-style tags in `var(--color-bg-card)` background)
- Same stream list format as homepage
- Full post listing with tag filtering (keep existing JS functionality)

### Blog Post Page

- Article title in serif, large size
- Date + tags below title
- Prose content with good line-height (1.75-1.8) for readability
- Code blocks with `var(--color-bg-card)` background
- No card frame around the article — open layout

### Projects Page

- Stream list format consistent with homepage
- Each project: title + description
- No card glow effects

### About Page

- Single column text layout (keep current structure)
- Skills tags in pill style matching blog tags

### Footer

- Minimal: copyright line
- Muted text color, no decoration

## Components to Modify

| Component | Change |
|-----------|--------|
| `global.css` | Replace all theme colors, remove grid-bg, terminal, glow, cursor-blink animations |
| `BaseLayout.astro` | Update font imports, remove grid overlay, update meta/theme |
| `Navbar.astro` | Simplify to classic top bar, remove backdrop blur |
| `Hero.astro` | Remove terminal animation, replace with simple intro text |
| `BlogCard.astro` | Replace card layout with stream list row |
| `ProjectCard.astro` | Replace card layout with stream list row |
| `BlogPost.astro` | Update prose typography, code block colors |
| `Footer.astro` | Simplify, update colors |
| `index.astro` | Stream list layout |
| `blog/index.astro` | Stream list layout, update tag pills |
| `projects.astro` | Stream list layout |
| `about.astro` | Update tag pill styles |

## What to Remove

- Grid background overlay (`grid-bg` class)
- Terminal window mock (`terminal` class)
- Card glow animation (`card-glow` class)
- Cursor blink animation (`cursor-blink` class)
- Hero glow pulse (`hero-glow` class)
- JetBrains Mono font import
- Inter font import
- Backdrop blur on navbar
- All cyan/purple accent colors
- All dark theme colors

## Responsive Behavior

- Desktop (≥768px): Full navbar, comfortable max-width (~720px content)
- Mobile (<768px): Navbar collapses to hamburger or simplified layout, single column
- Stream list stacks date above title on mobile
