---
title: 译｜Claude Code 大型代码库实战：配置模式、扩展层和成功部署的三个关键
date: 2026-05-24
tags: [Claude Code, Best Practices, Large Codebase, Anthropic, Harness Engineering]
category: AI
excerpt: Anthropic 官方文章完整译文——覆盖 Claude Code 在百万行代码库中的配置模式、七层扩展架构、三种成功部署策略，以及可直接复用的 CLAUDE.md 模板。
---
> 原文：[How Claude Code works in large codebases: Best practices and where to start](https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start)（2026-05-14，Anthropic 官方博客）
>
> 面向正在大型代码库中部署 Claude Code 的工程团队——覆盖配置体系、扩展层设计、组织层面采用的完整指南。

Claude Code 已经在百万行 monorepo、数十年历史的遗留系统、横跨几十个仓库的分布式架构、以及拥有数千名开发者的组织中投入生产。这些环境面临的挑战是小项目不会遇到的——不同子目录的构建命令各异、散落在无公共根目录下的遗留代码、以及文件数量大到 grep 都烧上下文。

Anthropic 观察了大量实际部署后，总结出了一套可复制的配置模式。这篇文章是完整译文。


## 一、导航原理 — Claude Code 不用 RAG

Claude Code 导航代码库的方式和一个软件工程师一样：遍历文件系统、读文件、用 grep 精确定位、跨文件追踪引用。它运行在开发者本地机器上，不需要构建、维护或上传代码库索引。

RAG 驱动的 AI 编码工具通过嵌入整个代码库，在查询时检索相关片段。在大规模场景下，这些系统会失败——嵌入管道跟不上工程团队的提交速度。当开发者查询索引时，它反映的是几周前、几天前甚至几小时前的代码状态。检索结果会返回一个两周前已重命名的函数，或引用一个上个迭代已删除的模块，而且没有任何提示表明这些信息已经过时。

**Agentic search 避免了这些失败模式。** 没有嵌入管道，没有需要维护的集中式索引——每个开发者的实例直接从实时代码库工作。

但这种方案有代价：**它需要 Claude 有足够的初始上下文才知道往哪看。** 这意味着 Claude 的导航质量取决于代码库的设置是否到位——通过 CLAUDE.md 文件和 skills 分层加载上下文。如果你让它在一个十亿行代码库中查找一个模糊的模式，工作还没开始就会撞上上下文窗口限制。在代码库设置上投入的团队，效果显著更好。


## 二、扩展层全景 — Harness 的七个组件

一个常见误解：Claude Code 的能力完全由模型决定。团队关注模型跑分和测试任务表现，但实际上，**围绕模型构建的生态系统——Harness——对性能的影响超过模型本身。**

Harness 由五个扩展点构成——CLAUDE.md 文件、Hooks、Skills、Plugins 和 MCP 服务器——每个承担不同功能。组件的搭建顺序很重要，因为每层都建立在前一层的基础上。另外两个能力——LSP 集成和 Subagents——补全了整个设置。

### 1. CLAUDE.md — 每次会话自动加载的上下文

CLAUDE.md 是 Claude 在每次会话开始时自动读取的上下文文件：根文件放全局信息，子目录文件放本地约定。它们给 Claude 提供做好任何事所需的代码库知识。

**关键原则：因为它们在每次会话中都加载（不管任务是什么），保持内容聚焦于广泛适用的内容，否则会拖累性能。** 把可复用的专业知识放进 CLAUDE.md 而不是 Skill，是最常见的配置错误。

### 2. Hooks — 让配置自我进化

大多数团队把 Hooks 理解为阻止 Claude 做错事的脚本。但它们更有价值的使用场景是**持续改进**。一个 Stop hook 可以在会话结束时反思刚才发生了什么，趁上下文还新鲜，提议 CLAUDE.md 的更新。一个 Start hook 可以动态加载团队特定的上下文，让每个开发者自动获得适合自己模块的配置，不需要手动设置。

对于 linting 和格式化这类自动化检查，Hooks 比依赖 Claude 记住一条指令要一致得多。**用 prompt 做应该自动运行的事，是第二个常见错误。**

### 3. Skills — 按需加载的专业知识

大型代码库有几十种任务类型，不是所有专业知识都需要在每次会话中存在。Skills 通过**渐进式披露（progressive disclosure）**解决这个问题——把专业工作流和领域知识从上下文空间的竞争中卸载，只在任务需要时才加载。

例如，安全审查 Skill 在 Claude 评估代码漏洞时才加载；文档处理 Skill 在代码变更需要更新文档时才加载。Skills 还可以绑定到特定路径，只激活在代码库的相关部分。一个支付服务团队可以把部署 Skill 绑定到该目录——其他人在 monorepo 的其他地方工作时，它永远不会自动加载。

**把所有东西塞进 CLAUDE.md 而不是用 Skills 拆分，是第三个常见错误。**

### 4. Plugins — 把好配置分发出去

大型代码库的一个挑战：好的配置容易变成部落知识（tribal knowledge）。Plugin 把 Skills、Hooks 和 MCP 配置打包成一个可安装的包。新工程师第一天安装 Plugin，就立刻获得和资深用户相同的上下文和能力。Plugin 更新可以通过托管市场在组织内分发。

Anthropic 合作的一家大型零售企业构建了一个连接 Claude 和内部分析平台的 Skill，让业务分析师在不离开工作流的情况下拉取绩效数据。他们在正式推广前先以 Plugin 形式分发给小范围团队验证。

**让好配置停留在小团队，是第四个常见错误。**

### 5. LSP 集成 — 给 Claude IDE 级别的导航

大多数大型代码库的 IDE 已经在运行 LSP，驱动着"Go to Definition"和"Find All References"。把 LSP 暴露给 Claude，它就获得了**符号级精度**：可以跟踪一个函数调用到定义处、跨文件追踪引用、区分不同语言中同名函数。没有 LSP，Claude 只能做文本匹配，可能定位到错误的符号。

一家企业软件公司在 Claude Code 推广前，**全组织部署了 LSP 集成**，目的就是让 C 和 C++ 导航在大规模下可靠工作。对于多语言代码库，这是**最高价值的投资之一**。

很多人以为 LSP 是自动配置的——不是，需要手动设置。

### 6. MCP 服务器 — 连接内部工具

MCP 服务器是 Claude 连接到它无法直接访问的内部工具、数据源和 API 的方式。最成熟的团队构建了 MCP 服务器，暴露结构化搜索作为 Claude 可以直接调用的工具。其他的连接内部文档、工单系统或分析平台。

**在基础没打好之前就建 MCP 连接，是第五个常见错误。** 先把 CLAUDE.md、Hooks、Skills 这些基础层做好，再考虑 MCP。

### 7. Subagents — 分离探索和编辑

Subagent 是一个隔离的 Claude 实例，拥有自己的上下文窗口，接受任务、执行工作、只把最终结果返回给父实例。Harness 就位后，一些团队启动一个**只读 subagent** 来映射子系统并把发现写入文件，然后让主实例带着完整图景做编辑。

在同一个会话中既探索又编辑——而不是用 subagent 分离——是第六个常见错误。

### 一张表说清七个组件

| 组件 | 加载时机 | 最适合 | 常见混淆 |
|------|---------|--------|---------|
| CLAUDE.md | 每次会话 | 项目约定、代码库知识 | 把可复用知识放这而不是 Skill |
| Hooks | 事件触发 | 自动化行为、捕获会话学习 | 用 prompt 做应自动运行的事 |
| Skills | 按需加载 | 跨项目可复用的专业知识 | 全塞进 CLAUDE.md |
| Plugins | 配置后始终可用 | 组织内分发工作配置 | 好配置停留在小团队 |
| LSP | 配置后始终可用 | 符号级导航、自动错误检测 | 以为自动配置 |
| MCP | 配置后始终可用 | 连接内部工具和数据源 | 在基础没打好前就建 MCP |
| Subagents | 调用时 | 分离探索和编辑、并行工作 | 在同一会话中又探索又编辑 |


## 三、三种成功的配置模式

不同代码库结构决定了不同的 Claude Code 配置方式。但 Anthropic 观察到的成功部署中，三个模式反复出现。

### 3.1 让代码库在大规模下可导航

Claude 在大型代码库中提供帮助的能力，受限于它找到正确上下文的能力。加载太多上下文到每次会话会降低性能，太少则让 Claude 盲目导航。最有效的部署**先投入让代码库对 Claude 可读（legible）**。

六个一致性出现的实践：

**CLAUDE.md 文件保持精简和分层。** Claude 在移动通过代码库时增量加载它们：根文件放全局信息，子目录文件放本地约定。根文件应该只有指针和关键坑点——其他都会退化为噪声。

**在子目录初始化，不在仓库根目录。** Claude 在限定到与任务实际相关的代码库部分时表现最好。在 monorepo 中这可能违反直觉，因为工具通常假设根目录访问。但 Claude 会**自动向上遍历目录树**并加载沿途找到的每个 CLAUDE.md 文件，所以根级上下文从不丢失。

**每个子目录指定自己的 test 和 lint 命令。** Claude 改了一个服务就跑全量测试套件——超时，还在不相关输出上浪费上下文。子目录级 CLAUDE.md 应该指定适用于该部分的命令。这对服务型代码库效果很好（每个目录有自己的 test 和 build 命令）。在编译型语言 monorepo 中，跨目录依赖深，子目录级作用域更难实现，可能需要项目特定的构建配置。

**用 `.claude/settings.json` 排除噪声。** 在 `permissions.deny` 中提交排除规则，意味着排除项是版本控制的，团队中每个开发者获得相同的噪声缩减而不需要自己配置。在某些代码库中，生成文件本身就是开发工作的对象——开发代码生成器的开发者可以在本地设置中覆盖项目级排除，不影响团队其他人。

**构建代码库地图。** 当代码不是以常规目录结构组织时，在仓库根目录放一个轻量级 Markdown 文件，列出每个顶层文件夹和一行描述——这给了 Claude 一个目录表（table of contents），它可以在打开文件前先扫描。对于有数百个顶层文件夹的代码库，分层效果最好：根文件只描述最高层结构，子目录 CLAUDE.md 提供下一级细节，随 Claude 移动按需加载。简单场景下，@-mention Claude 应该引用的特定文件或目录也能达到同样效果。

**运行 LSP 服务器。** 在大型代码库中 grep 一个常见函数名返回数千个匹配，Claude 花大量上下文打开文件来判断哪个重要。LSP 只返回指向同一符号的引用——过滤在读文件之前就完成了。设置方法：安装语言的代码智能 Plugin 和对应的语言服务器二进制文件，Claude Code 文档覆盖了可用的 Plugin 和故障排除。

### 3.2 随模型演进主动维护 CLAUDE.md

**为当前模型写的指令可能对未来模型有害。** 引导 Claude 按某种模式操作的 CLAUDE.md 规则，可能在下一个模型发布时变得不必要甚至有害。例如，一条告诉 Claude 把每个重构拆成单文件修改的 CLAUDE.md 规则，可能帮助过早期模型保持正轨，但会阻止新模型做它处理得很好的跨文件协调编辑。

为补偿特定模型限制（无论在模型推理还是 Claude Code 工具本身）而构建的 Skills 和 Hooks，在那些限制不再存在后就变成了开销。例如，一个拦截文件写入以执行 `p4 edit` 的 Hook（Perforce 代码库），在 Claude Code 添加原生 Perforce 模式后就多余了。

**建议每 3-6 个月做一次配置审查，或在大模型发布后性能感觉停滞时也做一次。**

### 3.3 指定管理和采用的负责人

技术配置本身不能驱动采用。做对了的组织也在组织层面投入了。

推广最快的部署都有一个共同点：**在开放访问前就有专门的基础设施投入。** 一个小团队，有时甚至只是一个人，先把工具链接好，让 Claude 在开发者第一次接触时就已经融入他们的工作流。在一家公司，几个工程师构建了一套 Plugin 和 MCP，第一天就可用。在另一家，一整个专注于管理 AI 编码工具的团队在推广开始前就把基础设施就位了。两种情况下，开发者的首次体验都是高效的而非令人沮丧的，采用从那里自然扩散。

目前做这项工作的团队通常位于**开发者体验（Developer Experience）或开发者生产力（Developer Productivity）**之下。多个组织中正在出现一个新角色：**Agent Manager**——一个专注于管理 Claude Code 生态系统的 PM/工程师混合职能。对于没有专门团队的组织，最小可行版本是一个 **DRI（Directly Responsible Individual）**：一个人拥有 Claude Code 配置的决策权，包括设置、权限策略、Plugin 市场和 CLAUDE.md 约定，以及保持它们更新的责任。

**自下而上的采用会带来热情，但没人集中化就会碎片化。** 你需要一个人或一个团队来组装和推广正确的 Claude Code 约定（比如标准化的 CLAUDE.md 层级或精选的 Skills 和 Plugins 集）。没有这项工作，知识会停留在部落层面，采用会停滞。

在大型组织中（尤其是受监管行业），治理问题会很早出现：谁控制哪些 Skills 和 Plugins 可用？怎么防止数千名工程师独立重建同样的东西？怎么确保 AI 生成的代码经过和人类生成的代码一样的审查流程？Anthropic 的建议是：从一组已批准的 Skills 开始，要求代码审查流程，限制初始访问，随着信心增长逐步扩大。最顺利的部署在早期就建立了**跨职能工作组**——把工程、信息安全和治理代表拉到一起，共同定义需求并构建推广路线图。


## 四、CLAUDE.md 模板实战

以下模板直接来自 Anthropic 的建议，针对大型代码库设计。可以直接抄。

### 根目录 CLAUDE.md

```markdown
# Project Name

## 项目概览
- **架构**: Monorepo（pnpm workspace）
- **语言**: TypeScript（前端）+ Go（后端服务）
- **部署**: K8s → AWS

## 目录结构
- `apps/web/` — 前端 React 应用
- `services/auth/` — 认证服务（Go）
- `packages/shared/` — 共享类型和工具库
- `infra/` — K8s manifests 和 Terraform

## 关键约定
- 使用 Conventional Commits: `type(scope): description`
- PR 必须通过 CI（lint + test + type-check）

## ⚠️ 常见坑
- `packages/shared` 类型变更需同时更新前后端
- `infra/` 由 Platform 团队维护，改之前先 @platform-team

## 不要做的事
- 不要修改 `generated/` 下的文件
- 不要在根目录运行 `pnpm test`（太慢，每个服务跑自己的）
```

注意每一行都通过了一个测试：**删掉它，Claude 会不会犯错？** "不要修改 `generated/`"——删掉这条，Claude 就可能去改自动生成的文件。"不要在根目录跑 `pnpm test`"——删掉这条，Claude 就会跑全量测试，烧掉上下文窗口还大概率超时。

### 子目录 CLAUDE.md（以 Go 服务为例）

```markdown
# Auth Service

## 常用命令
- 测试: `go test ./...`
- 单个测试: `go test ./internal/handlers -run TestLogin`
- Lint: `golangci-lint run`

## 代码结构
- `cmd/auth/` — 入口
- `internal/handlers/` — HTTP handlers
- `internal/service/` — 业务逻辑
- `internal/repository/` — 数据库操作

## 约定
- Handler 层只做参数校验和响应格式化，逻辑放 service 层
- 所有数据库操作使用 sqlc 生成的类型安全代码

## 坑
- `FindByEmail` 有缓存，测试时需要 mock Redis
- JWT secret 从环境变量读取
```

### .claude/settings.json（排除噪声）

```json
{
  "permissions": {
    "deny": [
      "read:generated/**",
      "read:dist/**",
      "read:node_modules/**",
      "read:*.lock",
      "write:generated/**"
    ]
  }
}
```

这个配置提交到版本控制后，团队里每个开发者都自动获得相同的噪声过滤。开发代码生成器的开发者可以在本地设置中覆盖 `generated/**` 的排除——不影响其他人。

### 模板设计思路对照

| 最佳实践 | 模板体现 |
|---------|----------|
| 精简分层 | 根文件只放目录结构和全局约定 |
| 子目录初始化 | 每个服务有自己的 CLAUDE.md |
| 精确的 test/lint 命令 | 每个子目录指定自己的命令 |
| settings.json 排除噪声 | 排除 generated/dist/lock |
| 代码库地图 | 根目录的目录结构表 |
| 常见坑 | 每个文件都有 ⚠️ 坑点 |
| 不要做的事 | 明确列出禁止操作 |


## 行动清单

1. **今天：写根目录 CLAUDE.md。** 回答三个问题：Claude 最常犯的 3 个错 → 写成禁止清单；每次新会话都要教 Claude 的 2 个命令 → 写进去；项目里最容易踩的 1 个架构坑 → 写进去。控制在 30 行以内
2. **本周：给每个主要子目录加 CLAUDE.md。** 每个文件只写本目录的 test/lint 命令、代码结构、本地约定和坑点
3. **本周：配 `.claude/settings.json` 排除噪声。** 排除 generated/、dist/、node_modules/、lock 文件
4. **本月：部署 LSP 集成。** 多语言代码库优先级最高——符号级导航比 grep 精确几个数量级
5. **每季度：做一次配置审查。** 模型在演进，补偿旧模型限制的规则可能拖累新模型。删掉不再需要的禁止项和 hooks

---

- 原文：[How Claude Code works in large codebases: Best practices and where to start](https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start)（Anthropic 官方博客，2026-05-14）
- 相关：[Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)（Anthropic Engineering Blog，2025-04-18）
- 相关：[Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
