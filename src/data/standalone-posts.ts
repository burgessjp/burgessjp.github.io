// 独立文章（public/articles/<slug>/index.html）的元数据登记处。
// 首页、/blog 列表、RSS 均从此处合并，新增独立文章只需在此追加一条。
export interface StandalonePost {
  title: string;
  excerpt: string;
  date: Date;
  tags: string[];
  /** 站内绝对路径，如 /articles/android-pixel-density/ */
  url: string;
}

export const standalonePosts: StandalonePost[] = [
  {
    title: '黄仁勋，英伟达 CEO，1993–2026 — Stratechery 中译',
    excerpt: 'Stratechery 长文汉译：芯片管制、AI 泡沫与一个人的外骨骼——黄仁勋离场与英伟达护城河的崩解。',
    date: new Date('2026-11-21'),
    tags: ['英伟达', '黄仁勋', 'Stratechery', 'AI'],
    url: '/articles/jensen-huang/',
  },
  {
    title: '5 个词，重新搞懂 Android 像素密度',
    excerpt: 'px、ppi、dpi、dp、sp 一次讲透：4 个可交互实验，从「按钮失踪案」建立密度直觉。',
    date: new Date('2026-11-21'),
    tags: ['Android'],
    url: '/articles/android-pixel-density/',
  },
];
