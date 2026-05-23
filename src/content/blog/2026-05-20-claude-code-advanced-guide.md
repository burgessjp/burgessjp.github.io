---
title: Claude Code 进阶实战：从「会用」到「用好」的提效手册
date: 2026-05-20
tags: [Claude Code, AI Engineering, Workflow, Best Practices]
category: AI
excerpt: 面向有 Claude Code 基础经验的开发者，解决从「会用」到「用好」的四个核心痛点：会话管理、项目配置、工作流设计、成本控制。
---
> 面向有 Claude Code 基础经验的开发者，解决从「会用」到「用好」的四个核心痛点：会话管理、项目配置、工作流设计、成本控制。


用 Claude Code 写代码的人越来越多了。但观察下来，大多数人的用法还是：打开终端，输入需求，改完就走。遇到问题就多问几轮，会话越来越长，Claude 越来越"笨"，然后困惑——不是说 AI 编程效率提升 10 倍吗？

这篇文章不教你安装 Claude Code，不讲基础命令。它解决的是**已经有 Claude Code 使用经验、但觉得效率远没到天花板的开发者**的真实痛点。

文章按四个最常见的痛点组织，每个模块独立可读，直接跳到你感兴趣的部分：

- **一、「会话越用越笨」** — 上下文管理与会话控制
- **二、「Claude 总是乱改」** — 项目配置工程化
- **三、「改了老代码又出新 bug」** — 工作流与交互策略
- **四、「Token 账单吓一跳」** — 成本控制与常见陷阱

---

## 一、「会话越用越笨」— 上下文管理与会话控制

Claude Code 有 100 万 token 的上下文窗口。这听起来很多，但 Anthropic Claude Code 团队的 Thariq 说了一句反直觉的话：**拥有 100 万 token 的窗口不意味着你应该把它填满。**

核心问题叫**上下文腐朽（Context Rot）**：随着会话变长，模型性能悄悄下降。注意力被分散到更多 token 上，旧的、不相关的内容开始干扰当前任务。模型不会报错——它只是变得模糊、不精确、更容易幻觉。

社区经验和多项测试表明，性能在上下文窗口使用到 50-60% 时就开始下滑。也就是说，**你的 100 万 token 窗口，真正高效的使用范围大概只有 50-60 万。**

这就是为什么你经常遇到这些场景：

- **Claude 明明读过文件却说「我不知道」** — 不是忘了，是上下文里噪声太多，注意力分散，那条信息被淹没了
- **压缩后丢掉关键上下文** — 自动压缩发生在模型最不聪明的时候（上下文已经很长了），它没法准确判断什么重要
- **长调试会话后模型变笨** — 调试产生的大量中间输出占满了上下文，留给真正思考的空间不够了

### 1.1 每一轮对话都是分支点

大多数人只会 Continue。但每次 Claude 完成一轮操作后，你其实有五个选择：

| 操作 | 效果 | 适用场景 |
|------|------|----------|
| **Continue** | 保持全部上下文继续 | 上下文仍然有用 |
| **Rewind**（Esc Esc） | 跳回之前某条消息，丢弃之后的内容 | Claude 走错了方向 |
| **/clear** | 清空会话，从零开始 | 开始全新任务 |
| **/compact** | 让 Claude 总结当前会话，用摘要替代历史 | 同一任务中途减负 |
| **Subagent** | 派一个独立上下文的子代理去做事 | 大量中间输出，只需要结论 |

关键决策：**新任务开新会话，错误方向用 Rewind，上下文膨胀用 Compact，一次性探索用 Subagent。**

### 1.2 Rewind > 纠正

如果你只从这篇文章记住一个习惯，那就是 **Rewind**。

场景：Claude 读了五个文件，尝试方案 A，失败了。你的直觉是输入「那个不行，试试 B」。看看上下文发生了什么：

**纠正（大多数人的做法）：**
```
文件读取 → 方案A（失败）→ "不行，试B" → 方案B（失败）→ "也不行，试C" → 方案C（成功）
```
上下文里塞满了：文件读取 + 两个失败方案 + 两条纠正消息 + 最终方案。大量噪声。

**Rewind（正确的做法）：**
```
文件读取 → [Esc Esc 回到这里] → "foo模块没暴露那个接口，直接用C" → 方案C（成功）
```
上下文里只有：文件读取 + 一条精确指令 + 成功方案。干净。

双击 Esc 回到文件读取之后那条消息，用你刚学到的信息重新提问。还有一个进阶技巧：先让 Claude「从这一点总结一下」，拿到总结后 Rewind 回去，把总结贴进新 prompt。这等于让「尝试过并失败的 Claude」给「还没开始的 Claude」写了一封信。

### 1.3 主动 Compact，而且要带方向

不要等自动压缩。自动压缩在你最不希望它发生的时候触发——上下文已经很长、模型已经变笨了，这时候让它决定什么重要，丢东西的概率很高。

**正确的做法是在 50-60% 上下文使用时主动 compact，并告诉它你要保留什么：**

```
/compact 专注于 auth 重构的进展，保留修改过的文件列表，丢掉测试调试的过程
```

这个方向描述很关键。不带描述的 `/compact` 是盲猜，带描述的 `/compact` 是精准手术。

社区经验总结出一个实用的阈值：**50% 规则**。不要等到上下文条变红才 compact。在 50% 左右、Claude 还清醒的时候主动压缩，效果远好于 90% 被动触发。一个社区用户的原话：「区别在于 Claude 清醒时压缩还是已经糊涂时压缩。」

### 1.4 Subagent：隔离一次性上下文

Subagent 是最被低估的上下文管理工具。当你让 Claude 派一个子代理时，那个代理拥有自己的全新上下文窗口。它可以做任意多的工作——读 20 个文件、跑 12 次搜索、碰 3 次壁——然后只把最终结论返回给父会话。

所有探索噪声？子代理退出时就回收了。

用一个心理测试决定是否该用 Subagent：**「我以后还需要这个工具输出吗，还是只需要结论？」**

只需要结论的场景：
- 「派一个子代理去读那个代码库，总结它怎么实现 auth 流程」
- 「派一个子代理根据 git 变更写这个功能的文档」
- 「派一个子代理根据 spec 文件验证这项工作的结果」

有时候 Claude 会自动调用子代理，但不会总是猜到你需要上下文隔离。**主动告诉它用子代理是更好的做法。**

### 1.5 Effort 等级：按任务难度动态切换

Claude Code 有 5 个 effort 等级：low、medium、high、xhigh、max。默认值因模型而异——**Sonnet 默认 high，Opus 默认 xhigh**。大多数任务用默认值就行，但你可以动态切换：简单格式化用 low，常规改动用 medium，并发会话用 high，碰到卡壳的 bug 切 max，解决后切回默认。**同一任务中可以动态切换**——开始探索时 xhigh，找到方向后切 high 降低成本。（详细的 effort 与 token 成本关系见模块 4。）

### 1.6 实战 Demo：从 Session Rot 到正确操作

下面是一个完整的会话管理操作序列，展示了从问题到解决的全过程：

```

/compact 保留 JWT 验证逻辑的修改，丢掉中间调试过程

"auth/middleware.go 里的 ValidateToken 函数用了旧的签名算法，
 直接改成 RS256，别动其他文件"

"派一个子代理去读 services/user-svc/internal/auth/ 目录，
 总结它的 JWT 刷新逻辑，只给我结论"

/clear
"项目用 Go + gin，JWT 认证逻辑在 auth/middleware.go，
 刚把签名算法从 HS256 改成了 RS256，
 写 unit test 覆盖正常验证、过期 token、错误算法三种情况，
 测试文件放 auth/middleware_test.go"
```

> 来源：[Thariq Shihipar, Anthropic Claude Code 团队](https://x.com/trq212/status/2044548257058328723) · [FindSkill 会话管理指南](https://findskill.ai/blog/claude-code-session-management-guide/) · [Sébastien Dubois, Claude Code Tips](https://www.dsebastien.net/claude-code-tips-and-best-practices/)

---

会话管理解决的是「怎么让 Claude 保持聪明」。但如果你没给它正确的项目信息，再聪明的 Claude 也只能靠猜。下一个模块解决的就是这个问题。

你可能遇到过这些情况：Claude 明明读过你的代码，转头就引入了一个项目根本不用的库；让它改一个模块，它顺手改了其他三个你不想动的文件；团队成员各自配置，同样的代码 Claude 在不同人手里表现完全不一样。

## 二、「Claude 总是乱改」— 项目配置工程化

根本原因只有一个：**你没给 Claude 足够好的操作手册。**

CLAUDE.md 不是项目文档，不是 README，不是给人类看的。**它是给 Claude 的操作手册**——每次会话自动加载，告诉 Claude 这个项目怎么工作、什么能做什么不能做。

### 2.1 200 行铁律

CLAUDE.md 每次会话都加载到上下文窗口里。超过 200 行，每多一行都在挤占 Claude 理解你代码的空间。

检验标准很简单：**对每一行问「删掉这行会导致 Claude 犯错吗？」** 如果不会，删掉它。

**反面教材（臃肿版）：**
```markdown

## 项目简介
这是一个用 React + TypeScript 开发的电商平台，主要面向东南亚市场，
支持多语言和多币种...

## 技术栈详细说明
- React 18.3 使用了 concurrent features
- TypeScript 5.2 启用了 strict mode
- 使用 React Query 做数据请求
- 使用 Zustand 做状态管理
- 使用 Tailwind CSS 做样式
- 使用 Vitest 做单元测试
- 使用 Playwright 做 E2E 测试
...

## 代码风格指南（完整版）
- 使用函数式组件
- 使用 arrow function
- Props 使用 interface 定义
- 使用 camelCase 命名
- 文件名使用 PascalCase
- 每个组件一个文件
- 组件不超过 200 行
- 使用 early return 减少嵌套
- ...（还有 20 条）
```

**正面教材（精简版）：**
```markdown

## 架构
React 18 + TypeScript strict + Zustand + React Query

## 关键命令
- 测试: `pnpm test`（单文件: `pnpm test -- path/to/test`）
- Lint: `pnpm lint`
- 构建: `pnpm build`

## 不要做的事
- 不要引入 lodash（用原生方法）
- 不要引入 axios（用 React Query）
- 不要修改 `src/generated/` 下的文件
- 不要用 `any` 类型

## 坑
- `src/api/client.ts` 的 baseURL 在 .env 里，本地开发需要设 LOCAL_API_URL
- `src/i18n/` 的翻译文件是自动生成的，改了会被覆盖
```

区别在哪？精简版砍掉了 Claude 能自己从代码里看出来的东西（React 版本号、文件命名约定），保留了**不看 CLAUDE.md 就会犯错的东西**（不要引入什么库、哪些文件不能改、哪些坑会踩）。

### 2.2 禁止清单比正面指导更有效

「写干净的代码」对 AI 等于没说。「禁止 any 类型」才有用。

CLAUDE.md 里最有力量的部分是 **Do NOT 清单**。它防止的不是一次错误，而是后续 10 次兼容性修复：

```markdown
## 不要做的事
- 不要引入新的 UI 库（用项目已有的 components/ui/）
- 不要使用 inline styles（用 Tailwind class）
- 不要创建新的全局状态（优先组件内 state + props 传递）
- 不要修改 `generated/` 下的文件（从 schema 重新生成）
- 不要在根目录跑 `pnpm test`（太慢，跑单个文件）
```

### 2.3 分层 CLAUDE.md：每层管不同的事

CLAUDE.md 不是只有一个文件。Claude Code 支持四层配置，Claude 进入子目录时会自动加载该目录的 CLAUDE.md：

```
~/.claude/CLAUDE.md              ← 全局（所有项目通用偏好）
project/CLAUDE.md                ← 项目（栈、架构、全局约定）
project/src/auth/CLAUDE.md       ← 子目录（安全红线、已知陷阱）
project/CLAUDE.local.md          ← 个人（不进 git）
```

每层管什么：

| 层级 | 内容 | 示例 |
|------|------|------|
| **全局** | 跨项目通用偏好 | 回复用中文、先给方案不直接写代码 |
| **项目** | 栈、架构、全局约定 | 技术栈、目录结构、禁止库 |
| **子目录** | 该模块的红线和陷阱 | auth 模块的 JWT secret 读取方式、缓存陷阱 |
| **个人** | 个人开发偏好 | 不进 git，不影响团队 |

**子目录 CLAUDE.md 是大型代码库的秘密武器。** 当 Claude 操作 `src/auth/` 目录时，它会自动加载该目录的 CLAUDE.md。这意味着你可以在敏感模块装上护栏：

```markdown

## 红线
- JWT secret 只从环境变量读取，不要硬编码或 fallback
- 密码比对只用 bcrypt，不要用其他哈希算法
- Token 过期时间从 config.TokenExpiry 读取，不要硬编码

## 坑
- FindByEmail 有 Redis 缓存，测试时需要 mock
- RefreshToken 的 revocation 检查有 race condition，已加分布式锁
```

### 2.4 settings.json：排除噪声，保护关键路径

`.claude/settings.json` 不只是权限配置。它告诉 Claude **不要读什么、不要写什么**——这在大型代码库里至关重要：

```json
{
  "permissions": {
    "deny": [
      "read:generated/**",
      "read:dist/**",
      "read:node_modules/**",
      "read:*.lock",
      "read:*.min.js",
      "write:generated/**",
      "write:dist/**"
    ]
  }
}
```

为什么这很重要？因为 Claude 的上下文是稀缺资源。让它读 2000 行的 lock 文件或 generated 代码，等于浪费了可以用来理解你业务逻辑的空间。

### 2.5 超过 100 行就拆到 rules/

CLAUDE.md 超过 100 行是一个信号：你的项目指导已经需要按领域拆分了。

```
.claude/
├── rules/
│   ├── frontend.md        ← React 组件规范、样式约定
│   ├── backend-api.md     ← API 设计规范、错误处理
│   ├── testing.md         ← 测试策略、mock 约定
│   └── data-pipelines.md  ← 数据管道规范
```

rules/ 下的文件按需加载，不会像 CLAUDE.md 那样每次会话都塞进上下文。**只在相关任务时才占用上下文空间。**

### 2.6 Hooks：从「请记住」到「你必须」

CLAUDE.md 里写的规则是「请记住」。Hooks 是「你必须」。

CLAUDE.md 写「每次编辑后运行 lint」——Claude 可能忘。配一个 hook——编辑后自动跑 lint，想忘都不行。

以下配置片段放在项目的 `.claude/settings.json` 中（完整格式参考 [官方 Hooks 文档](https://code.claude.com/docs/en/hooks)）：

**编辑后自动格式化：**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$PROJECT_DIR\" && npx prettier --write \"$FILE_PATH\" 2>/dev/null",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**保护主分支不被直接编辑：**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "[ \"$(git branch --show-current)\" != \"main\" ] || { echo '{\"block\": true, \"message\": \"不能在 main 分支上直接编辑，请先创建功能分支\"}' >&2; exit 2; }",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**测试文件变更后自动运行相关测试：**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=\"$FILE_PATH\"; if [[ \"$FILE\" == *.test.* ]]; then npx vitest run \"$FILE\" --reporter=verbose 2>&1 | head -50; fi",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### 2.7 LSP：大型代码库最高价值投资

如果你只做一件事来提升 Claude Code 在大型代码库中的表现，那就是**开 LSP**。

没有 LSP，Claude 只能做字符串搜索——grep 一个函数名，然后猜测哪个匹配是真正的定义。有了 LSP，Claude 获得「Go to Definition」和「Find All References」的能力，精确度完全不同。

**启用步骤（以 TypeScript 为例）：**

1. 系统安装语言服务器：`npm install -g typescript-language-server typescript`
2. 在 `.claude/settings.json` 中启用插件：

```json
{
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": true
  }
}
```

3. 重启 Claude Code 使配置生效

对于多语言代码库（比如 TypeScript + Go），每种语言安装对应的语言服务器并配一个 LSP 插件。Anthropic 官方文档明确说：**LSP 是大型 C/C++ 代码库中 Claude Code 成功的前提条件。**

### 2.8 渐进式配置路径

不要一上来就搭全套。按需渐进：

```
第 1 天：CLAUDE.md + settings.json
         ↓ CLAUDE.md 超过 100 行了
加上 rules/ 按领域拆分
         ↓ 发现重复的自动化需求
加上 hooks（格式化、保护主分支、自动测试）
         ↓ 发现重复的提示词模式
加上 commands（/review、/test、/deploy）
         ↓ 工作流变复杂了
加上 skills（多文件打包能力）
         ↓ 需要专精角色
加上 agents（code-reviewer、test-writer）
```

每一步都解决一个具体的痛点，不提前搭建用不到的东西。

### 2.9 MCP：连接外部服务

上面的配置都是「让 Claude 更懂你的项目」。MCP（Model Context Protocol）解决的是另一个问题：**让 Claude 能直接操作外部服务。**

通过 MCP 服务器，Claude Code 可以连接数据库、调用 API、读取内部文档系统——不需要你手动复制粘贴信息。常见的高价值 MCP 服务器：

- **数据库**：直接查询数据库结构，不用 `DESCRIBE TABLE` 复制结果
- **GitHub/GitLab**：直接操作 PR、Issue，不用离开终端
- **内部文档**：直接搜索和读取团队知识库

配置方式：在 `.claude/settings.json` 中添加 MCP 服务器定义，或在 `~/.claude/` 下配置全局 MCP。具体的 MCP 服务器列表和配置方法参考 [官方 MCP 文档](https://modelcontextprotocol.io/) 和 [Claude Code MCP 指南](https://code.claude.com/docs/en/mcp)。

### 2.10 实战 Demo：从空白项目搭建完整 .claude 目录

假设你要开始一个 React + TypeScript 项目，完整配置过程：

**Step 1：根目录 CLAUDE.md** — 参考上文的精简版模板，关键是不超 200 行，只保留「不看就会犯错」的内容。

**Step 2：settings.json（排除噪声）：**

```json
{
  "permissions": {
    "deny": [
      "read:src/generated/**",
      "read:dist/**",
      "read:node_modules/**",
      "read:*.lock",
      "write:src/generated/**"
    ]
  }
}
```

**Step 3：敏感模块加子目录 CLAUDE.md** — 在 `src/auth/` 下放安全红线和已知陷阱（见上文示例）。

**Step 4：按需加 hooks** — 主分支保护 + 自动格式化（见上文示例）。

**Step 5：CLAUDE.md 膨胀时拆 rules/** — API 规范、测试约定拆成独立文件。

> 来源：[Anthropic 官方：Claude Code 大型代码库最佳实践](https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start) · [@vincemask: 写好 CLAUDE.md 的 8 条经验](https://x.com/vincemask) · [Chris Wiles: claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase) · [Anthropic 官方 Hooks 文档](https://code.claude.com/docs/en/hooks)

---

配置工程化解决的是「怎么让 Claude 知道规则」。但知道了规则还不够——你怎么和 Claude 协作才能保证代码质量？下一个模块解决工作流问题。

## 三、「改了老代码又出新 bug」— 工作流与交互策略

有一个被反复验证但很多人忽略的事实：**同一个模型既写代码又审查代码，倾向于认为自己的实现没问题。**

这不是模型缺陷，是认知偏差。人类也一样——自己写的代码自己审查，总是更容易放过问题。所以代码审查要找没写过这段代码的人来做。

对 AI 来说，解决方案只有一个：**任务的执行和评估必须彻底拆开。**

### 3.1 第一轮就说清任务

大多数人和 Claude 交互的方式是：给一句话需求 → Claude 写代码 → 发现不对 → 纠正 → 再写 → 再纠正。来回 3-5 轮才到位。

**每多一轮交互，上下文就多一层噪声，token 消耗就多一点。** Anthropic 官方建议：第一轮就把任务说清楚——意图 + 约束 + 验收标准 + 相关文件位置。

**模糊 prompt（来回 5 轮）：**
```
帮我加个登录功能
```

**精确 prompt（一轮到位）：**
```
在 src/features/auth/ 下实现用户登录功能：

意图：手机号 + 验证码登录，7 天免登录

约束：
- 用项目已有的 apiClient（src/api/client.ts）
- 状态管理用 useAuthStore（src/stores/auth.ts）
- 不要引入新依赖

验收标准：
- 输入手机号 → 发送验证码 → 输入验证码 → 登录成功
- 登录后 token 存 localStorage + store
- 7 天内自动登录（检查 token 过期）
- 网络错误显示 toast 提示

相关文件：
- src/api/client.ts（API 请求基础配置）
- src/stores/auth.ts（认证状态管理）
- src/components/ui/Input.tsx（输入组件）
- src/components/ui/Button.tsx（按钮组件）
```

看起来写精确 prompt 花的时间更多。但算总账：5 轮模糊交互 vs 1 轮精确交互，总时间反而更短，总 token 消耗反而更低。

### 3.2 Plan Mode：先探索，再动手

按 Shift+Tab 循环切换模式（Normal → Auto-Accept → Plan Mode），切到 Plan Mode 后 Claude 只做研究和规划，不修改任何文件。

Plan Mode 的价值：**把「搞清楚要做什么」和「动手做」分开。** 不用 Plan Mode 时，Claude 边读代码边改，很容易在没完全理解架构的情况下就开始写代码，然后改了不该改的地方。

正确的工作流是：
1. **Plan Mode**：让 Claude 先读代码、理解架构、制定方案
2. 确认方案没问题
3. **退出 Plan Mode**：让 Claude 按方案执行

### 3.3 SDD 三角色分离工作流

SDD（Spec-Driven Development）是目前用 Claude Code 保证代码质量最有效的工作流之一。核心思想：**让规划的人规划，让写代码的人写代码，让审查的人审查。**

三个角色，每个角色独立会话（重启 Claude Code 清空上下文）：

```
需求（模糊）
    ↓
┌─────────────┐
│  Planner    │  模糊需求 → 精确 Spec
│  /plan      │  输出：specs/xxx.spec.md
└──────┬──────┘
       ↓ （重启 Claude Code）
┌─────────────┐
│  Generator  │  严格按 Spec 实现代码
│  /generate  │  输出：代码 + 测试
└──────┬──────┘
       ↓ （重启 Claude Code）
┌─────────────┐
│  Evaluator  │  对比 Spec vs 实现，客观评分
│  /evaluate  │  输出：评分 + 问题列表
└─────────────┘
```

**为什么必须重启？** 因为同一会话里模型倾向于认可自己之前的工作。重启 = 清空上下文 = 角色隔离。

三个命令文件（放在 `.claude/commands/` 下），每个角色的核心约束不同：

**Planner（`.claude/commands/plan.md`）：**
```markdown
你是 Planner，职责是将模糊需求转化为精确的 Spec 文档。

## 严格规则
- 你只能生成 Spec，不能写任何实现代码
- 每个验收标准必须可量化、可自动验证
- 如果用户需求不明确，主动提问澄清

## 输出
生成文件到 specs/{feature-name}.spec.md

## Spec 格式
## 功能描述（精确，无歧义）
## 验收标准
### AC-1: {标准名称}
- 前置条件 / 操作步骤 / 期望结果 / 验证方式
## 边界条件 / 技术约束 / 不包含

$ARGUMENTS
```

**Generator（`.claude/commands/generate.md`）：**
```markdown
你是 Generator，职责是严格按照 Spec 实现代码。

## 严格规则
- 严格按照 Spec 实现，不能修改 Spec
- 如果发现 Spec 有歧义，停止并报告，不自行决定
- 为每个验收标准编写对应的测试

## 输入
Spec 文件路径：$ARGUMENTS

## 输出
实现报告（每个 AC 的状态）+ 未解决的问题
```

**Evaluator（`.claude/commands/evaluate.md`）：**
```markdown
你是 Evaluator，职责是客观评估代码实现是否符合 Spec。

## 严格规则
- 你只评估，不修改任何代码或 Spec
- 逐条检查每个验收标准，评分基于事实
- 你比 Generator 更严格，这是你的价值所在

## 输入
$ARGUMENTS（Spec 路径 + 代码目录）

## 评分标准
>= 90 通过 | 60-89 修复后重评 | < 60 重新规划
```

**评分标准：**

| 分数 | 操作 |
|------|------|
| >= 90 | 完成 |
| 80-89 | 可选改进后完成 |
| 60-79 | 回到 Generator 修复 |
| < 60 | 回到 Planner 重新规划 |

进阶技巧：**三个角色可以用不同模型**。Planner 用 Sonnet（擅长规划），Generator 用 Sonnet（擅长编码），Evaluator 用 Opus（更严格的审查）。不同模型减少认知偏差。

### 3.4 给 Claude 自检手段

Anthropic 官方说这是**最高杠杆的提效动作**：给 Claude 验证自己工作的方式。

三种方式：
- **测试**：「实现完后跑 `pnpm test`，如果有失败的测试，修复它们」
- **截图**（前端）：「启动 dev server，用浏览器打开页面，截一张图给我看效果」
- **预期输出**：给一个具体的期望结果，让 Claude 对比实际输出

没有自检手段时，Claude 会认为自己的实现是正确的。有了自检手段，它能主动发现问题并修复——**不需要你每次都去验证。**

### 3.5 Auto 模式的正确使用

Auto 模式不是「无脑放手」。正确用法是：**先把上下文喂足，再切 Auto。**

Auto 前的检查清单：
- [ ] CLAUDE.md 里写了禁止事项
- [ ] 任务说清楚了（意图 + 约束 + 验收标准）
- [ ] 相关文件路径给了
- [ ] 测试/验证方式指定了

这四条都满足后，Auto 模式才能真正发挥价值——Claude 自主执行、自检、修复，不需要你一轮一轮地审批。

### 3.6 Adaptive Thinking 手动调控

Opus 4.7 的自适应思考默认会根据任务复杂度自动调整思考深度。但有时候你需要手动干预：

```
"Think carefully and step-by-step; this problem is harder than it looks"

"Prioritize responding quickly rather than thinking deeply"
```

### 3.7 实战 Demo：一个功能开发全链路

以「给现有 API 加限流中间件」为例，展示 SDD 的关键决策点——重点不是流程本身（上面已经讲过），而是每个环节容易踩的坑：

```
/plan 给 /api/* 路由加限流，每用户每分钟 60 次请求

"补充：需要区分已登录用户（按 user_id）和匿名用户（按 IP），
 已登录用户限额 100/min，匿名用户 30/min，
 限流时返回 429 + Retry-After 头，
 不要用 Redis 以外的存储"


/generate specs/rate-limit.spec.md



/evaluate specs/rate-limit.spec.md src/middleware/

```

**三个常见错误：**
1. 不重启就切换角色——模型会倾向于认可自己的前序工作
2. Generator 自行决定 Spec 歧义——应该停止并报告，不是自作主张
3. Evaluator 发现的问题直接改代码——应该反馈给 Planner 重开循环

> 来源：[Anthropic 官方：Claude Code 最佳实践](https://code.claude.com/docs/en/best-practices) · [Claude Code SDD 三角色分离工作流](https://code.claude.com/docs/en/best-practices) · [Addy Osmani: LLM Coding Workflow 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e)

---

会话管理、项目配置、工作流策略都到位了，最后还有一个现实问题：账单。前三个模块都在提升效率，但如果效率是用钱堆出来的，不可持续。

## 四、「Token 账单吓一跳」— 成本控制与常见陷阱

Opus 4.7 带来了更聪明的推理能力，但也带来了更高的 token 消耗。新 tokenizer 的变化 + 模型倾向于更深入思考，意味着如果你不主动控制，成本会悄悄失控。

同一个任务，不同人用 Claude Code 的成本可以差 3-5 倍。差距不在模型，在用法。

### 4.1 Token 成本意识

首先理解 token 消耗的结构。每次 Claude Code 会话，token 主要花在三个地方：

| 消耗来源 | 占比 | 控制手段 |
|----------|------|----------|
| **CLAUDE.md + 系统提示** | 固定开销 | 精简 CLAUDE.md（200 行铁律） |
| **文件读取 + 工具调用** | 可变，看任务 | 排除噪声文件（settings.json deny） |
| **模型思考 + 输出** | 可变，看 effort | 选择合适的 effort 等级 |

Effort 等级直接影响思考 token 的消耗。一个实用的对比：

| 等级 | 适用场景 | 大致相对成本 |
|------|----------|-------------|
| **low** | 简单格式化、小文本改动 | 基准 1x |
| **medium** | 文档整理、小改动 | ~2x |
| **high** | 常规编码（Sonnet 默认） | ~3x |
| **xhigh** | 复杂编码（Opus 默认） | ~6x |
| **max** | 极难 bug、架构决策 | ~15x |

> 数据来源：[Towards AI: I Tested All 5 Effort Levels of Claude Opus 4.7](https://pub.towardsai.net/i-tested-all-5-effort-levels-of-claude-opus-4-7-2f335c626786)，成本为相对比值，实际消耗因任务而异。

**同一任务从 xhigh 切到 high，token 消耗可能减少约 50%，质量差异在大多数常规任务中不明显。**

### 4.2 输出长度控制

一个经常被忽略的技巧：**指定输出长度可以直接减少 40-60% 的 token 消耗。**

```
"修复这个 bug"

"修复这个 bug，回复控制在 200 字以内，只列出改了什么和为什么"
```

在 CLAUDE.md 或 Custom Instructions 里加上这些规则，每次会话都生效：

```markdown
## 回复风格
- 不要复述我的需求
- 不要加「当然可以」「好的」之类的开头
- 代码改动直接给 diff，不要解释每一行
- 不确定的地方列选项让我选，不要自己猜
```

### 4.3 CLAUDE.md 定期审查

为旧模型写的 CLAUDE.md 规则，在新模型上可能变成负担。

Anthropic 官方举了一个例子：早期模型的跨文件协调能力有限，所以很多团队在 CLAUDE.md 里写「每个重构拆成单文件修改」。这条规则帮助了旧模型，但**阻止了新模型做高效的跨文件协调编辑**。

建议每 3-6 个月做一次配置审查，或者在重大模型更新后审查。审查清单：

- [ ] 哪些规则是为了补偿旧模型限制的？现在还适用吗？
- [ ] CLAUDE.md 是否超过 200 行？该拆到 rules/ 了？
- [ ] hooks 是否有不必要的自动化（限制新模型发挥）？
- [ ] skills 是否有已经不需要的（新模型默认就能做好）？

### 4.4 并行会话策略

跑多个并发会话时，不需要每个都用 xhigh。

**更重要的是选择合适的模型。** Sonnet 和 Opus 的价格差约 5 倍，但大多数编码任务用 Sonnet 就够了。一个实用的分配策略：

| 任务类型 | 推荐模型 | Effort 等级 | 理由 |
|----------|----------|-------------|------|
| 日常编码、小功能、bug 修复 | Sonnet | high | 性价比最优 |
| 架构设计、复杂重构、代码审查 | Opus | xhigh | 需要更强的推理能力 |
| 格式化、文档整理、简单搜索 | Sonnet | medium | 不需要深度思考 |
| 极难 bug、安全审计 | Opus | max | 需要最大推理深度 |

一个常见误区是所有任务都默认用 Opus。实际上 Sonnet 在编码任务上的表现已经很接近 Opus，速度更快、成本更低。**只在 Opus 的额外推理能力确实能带来价值时才切过去**——架构决策、复杂多文件协调、需要深度推理的 bug。

- **研究型会话**（读代码、查资料）：medium 或 high
- **实现型会话**（写代码、改 bug）：xhigh
- **极难问题**（架构决策、复杂 bug）：max

不同类型的会话分配不同 effort 等级，总成本能降下来不少。

### 4.5 新话题开新会话

这个建议简单但有效：**新话题开新会话。**

旧会话里残留的上下文不会帮到新任务，只会增加 token 消耗（因为每次请求都要发送整个上下文）。新话题开新会话 = 零历史负担 = 精准的上下文 = 更少的 token 浪费。

灰色地带是相关任务：比如刚实现完功能想写文档。这时部分上下文是有用的，省去了重新读取文件的成本。判断标准：**如果新任务需要用到的上下文超过旧会话的 30%，就继续；否则开新会话。**

### 4.6 常见陷阱速查表

| 陷阱 | 症状 | 解法 |
|------|------|------|
| **CLAUDE.md 塞太多** | 每次会话烧 token，性能反而下降 | 200 行铁律 + rules/ 拆分 |
| **为旧模型保留的 hooks** | 限制新模型的跨文件协调能力 | 定期审查，砍掉过时规则 |
| **无脑 auto 模式** | 不必要的操作被自动执行 | 充分前置上下文后再 auto |
| **从不 /compact** | 上下文腐朽 + 高 token 消耗 | 50% 时主动 compact 带方向描述 |
| **同一会话又探索又编辑** | 上下文爆炸 | subagent 探索，主实例编辑 |
| **模糊 prompt 来回纠正** | 5 轮才到位，每轮都烧 token | 第一轮就说清任务 |
| **从不切 effort 等级** | 简单任务也用 xhigh/max | 按任务难度动态切换（5 个等级：low → max） |

---

## 行动清单

四个模块讲了很多，如果你只记三个立刻能做的事：

**1. 精简你的 CLAUDE.md**

现在就打开项目的 CLAUDE.md，对每一行问「删掉这行会导致 Claude 犯错吗？」。删不掉的保留，删得了的删掉。超过 200 行的拆到 rules/。

**2. 养成 Rewind 习惯**

下次 Claude 走错方向时，不要纠正。双击 Esc 回到正确的位置，用你学到的信息重新提问。试一次你就会体会到区别。

**3. 在 50% 上下文时主动 compact**

不要等自动压缩。在上下文用到一半、Claude 还清醒的时候，`/compact` 并告诉它你接下来要做什么。这是最稳的防止 session rot 的方法。

---

**进一步阅读：**

- [Anthropic 官方：Claude Code 最佳实践](https://code.claude.com/docs/en/best-practices) — 完整的官方指南
- [Anthropic 官方：大型代码库配置模式](https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start) — 深度配置指南
- [Thariq Shihipar：会话管理与 1M 上下文](https://x.com/trq212/status/2044548257058328723) — Claude Code 团队工程师的会话管理 playbook
- [Chris Wiles: claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase) — 完整的项目配置示例仓库
- [FindSkill: Claude Code 会话管理指南](https://findskill.ai/blog/claude-code-session-management-guide/) — 社区深度解读
- [Addy Osmani: LLM Coding Workflow 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e) — Google 工程师的工作流
