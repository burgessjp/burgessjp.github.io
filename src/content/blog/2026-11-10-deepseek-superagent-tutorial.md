---
title: DeepSeek Super-agent 由浅入深：从零读懂常驻式编程智能体
date: 2026-11-10
tags: [DeepSeek, Super-agent, Agent, Harness]
category: AI
excerpt: DeepSeek Harness 团队开源的常驻式编程智能体研究原型——守着一个 GitHub 仓库，听人派活，自己立项、开分支、写代码、提 PR。九层递进读完它的核心理念、领域模型、授权模型、执行模型与源码架构。
---

> 仓库：[deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype)（2026-10-31 开源 · MIT · 研究原型）
>
> 本文基于 v0.1.0 文档（2026-11-10 核对），由浅入深读完它的全部设计文档。

Super-agent 是一个**不抢你注意力的常驻同事**：它守着一个 GitHub 仓库（可选飞书），听人派活，自己立项、开分支、写代码、提 PR。它只在必须有人出手时才开口说话——会主动干活，更懂何时闭嘴。

一条请求的完整路径，前半程由 Router 主导判断，后半程由 Worker 执行：

```
Source（GitHub / 飞书） → Eval（准入 + 研判） → Ticket（授权的工作单元） → Worker（独立会话 + 目录） → PR（可评审的结果） → 人（只在决策点出现）
```

## L0 · 它是什么

*无先修要求 · 约 5 分钟*

### 0.1 一句话定义

**dsh-superagent** 是 DeepSeek Harness 团队开源的**常驻式（always-on）编程智能体**研究原型：它以 DeepSeek Harness 插件包的形式运行，监听一个 GitHub 仓库和（可选的）飞书群。当**被允许的人**向它要活时，它开一个工作单元（Ticket），在自己的独立会话和目录里干活，最后回到原始对话里交付结果——通常是一个 Pull Request。

官方原话的自我定位更克制：

> "Research prototype for reference only, not an official DeepSeek product."
>
> 仅供参考的研究原型，不是 DeepSeek 的正式产品。代码大量由编程智能体完成，可能有 bug，风格不统一，用前请自行审查。

### 0.2 它从哪来：两条时间线

- **2026-08-13** —— DeepSeek 开源 **DeepSeek Harness**（dsh）：一个"一切皆插件"的 Agent 运行框架，模型、工具、技能、会话、沙箱、循环、UI 全部是插件，由 Cordis 内核加载。媒体报道其 5 天收获约 15 万 star。
- **2026-10-31** —— DeepSeek Harness 团队发布技术文章《Super-agent 设计探索：迈向更自主的 Agent 系统》，同日开源 `dsh-superagent-prototype`（v0.1.0，MIT）。开源后迅速登顶 GitHub Trending，星标数已超 8 万（媒体统计口径 83.7K）。

所以 "Super-agent" 不是凭空出现的新框架，而是**站在 Harness 之上的一个应用层原型**：Harness 解决"Agent 怎么跑起来"（内核、插件、会话），Super-agent 解决"一个能替整个团队干活的 Agent 应该怎么被组织、被授权、被约束"。

> **别认错项目**：GitHub 上还有一个 `superagent-ai/superagent`，那是做提示注入防护的 AI 安全 SDK，和 DeepSeek 这个 Super-agent 毫无关系。搜资料时注意区分。

### 0.3 和你天天用的 Coding Agent 有什么不同

你熟悉的 Claude Code、Codex 这类工具是**会话式**的：你开一个会话，人在回路里盯着，会话结束 Agent 就消失了。Super-agent 把这个模型整个翻过来：

| 维度 | 会话式 Coding Agent | Super-agent |
| --- | --- | --- |
| 生命周期 | 会话即 Agent，关窗即消失 | 常驻进程，7×24 监听事件 |
| 驱动方式 | 人驱动：你打一句它动一步 | 事件驱动：GitHub / 飞书事件触发 |
| 并发 | 一个会话一条线 | 一个 Ticket 一个 Worker 会话，多任务并行 |
| 记忆 | 靠上下文窗口 + 压缩摘要 | SQLite 持久化状态，重启可恢复 |
| 授权 | 默认你能做的它都能做 | 显式允许列表 + 版本化策略（Policy） |
| 对人的态度 | 尽量多问，确保理解正确 | 尽量少说话，只在决策点开口 |
| 结果交付 | 聊天窗口里的回答 | 回到原始对话的回复 + Pull Request |

### 0.4 效果数据（团队自报）

- 同一批任务，单会话方案 p95 完成时间 **29.5 分钟**，双层数据架构压到 **15.7 分钟**。
- 初步实验任务完成时间 **p50 约 12.4 分钟**，较单会话方案更稳定。

注意：这是团队自己公布的对比数字，没有第三方复现。star 速度和实验数据都说明"方向有吸引力"，不等于"生产可用"——这个判断我们留到 L8 展开。

### 0.5 本教程怎么读

九个层级严格递进，每一级只依赖前面的概念：**L0–L2** 给任何背景的人建立直觉；**L3–L5** 是设计核心，读完你能看懂它的每一份文档；**L6–L7** 面向想动手部署、想读源码的人；**L8** 是冷静的批判与可迁移的设计启示。全文术语与官方文档保持中英对照，附录有完整术语表。

## L1 · 核心理念：注意力经济

*先修：L0 · 约 6 分钟*

理解 Super-agent 的一切设计之前，先记住它唯一的最高原则——整份 `000-philosophy.md` 都是这一句话的推论：

> "Take as little human attention as possible, and give as much value as possible."
>
> 占用尽可能少的人类注意力，交付尽可能多的价值。

这句话为什么重要？因为一个能替整个团队干活的 Agent，**也能浪费整个团队的注意力**。一条消息、一个通知、一个问题、一个设置项、一个面板元素、一段文档，每一样都要消耗某个人的注意力——每一样给出的价值必须超过这个成本，否则就被删除。这是把"注意力"当成产品里的一等预算来管理。

### 1.1 由原则推出的五条 Agent 守则

| 守则 | 具体含义 |
| --- | --- |
| 被要求才行动 | 只有两种情况动手：有人直接向它要活，或团队写下的规则允许。没人要的活只能以"只记录、不执行"的模式开始 |
| 有必要才说话 | 确认请求一次并说明要做什么；干活期间保持沉默；结果就绪、需要决策、或干不下去时才再开口。消息短，且回到请求发生的原始对话 |
| 一次只问一个问题 | 结构化表单里的一个具体问题，确保问题能到达人，而不是埋在长报告里 |
| 按影响停，不按努力停 | 局部改动推进到"可评审的结果"为止；需要设计决策就停下来，带着清晰的问题 |
| 诚实汇报 | 草稿标注未完成，失败按失败报，绝不为了不问人而绕过限制 |

### 1.2 由原则推出的四条设计守则

- **少概念。** 设计里只有领域概念（如 Source）和它的具体实现（如 GitHub、飞书）。一个业务需求要么变成某个概念的属性，要么变成 Agent 遵循的一段提示词——**不为它新增概念**。
- **少设置。** 一个默认值能覆盖几乎所有团队时，设置项就被默认值替代。团队能用语言描述的行为是提示词文本，不是设置项。
- **面板只显示需要人的东西。** 需要人处理的事排最前面，健康状态不占空间。
- **文档按序号读。** 每份编号文档只建立在它之前的文档之上，读者永远不会遇到没介绍过的概念。

### 1.3 操作者的四条责任

权限越大，欠团队的谨慎越多。文档对部署它的人同样有要求：

1. **从小范围开始。** 允许列表先只放少数人，主动性工作先只开"记录模式"；确认它想做的事看起来是对的，再逐步放宽。
2. **为降噪音调优。** Agent 话多时，把提示词改短改严，或者直接暂停它——不要发更多消息去解释噪音。
3. **不用它刷量。** 批量 PR、群发消息、虚假繁忙，消耗的团队注意力比给出的价值多。
4. **为它说的话负责。** 它以你团队天天见到的账号发言，你读它以你名义发的内容，错了回提示词里纠正。

目标只有一句：**在正确的时机提供正确的帮助，其余时刻什么都不做。** 后面每一层——领域模型、授权、执行、面板——都是这句话的工程化。

## L2 · 一次请求的一生

*先修：L1 · 约 8 分钟 · 本节建立直觉，术语在 L3 正式定义*

场景：你是允许列表上的开发者，仓库的 Issue #128 已经有人反馈"首页列表在 iOS 15 上滚动闪烁"。你在下面评论：

**第 1 步 · SOURCE｜GitHub 事件流入**

GitHub Source（一个事件流的实现）读到这条评论，转换成一个不可变的 **Trigger**，附上发送者身份。它丢弃 Agent 自己发的消息，也丢弃监听范围外的事件。

**第 2 步 · GATE｜准入检查（确定性代码，不是模型）**

检查两件事：发送者在不在允许列表？消息是否直接 @ 了 Agent？你在列表里、又 @ 了它——通过，强度记为 **explicit**（明确请求）。

**第 3 步 · EVAL｜研判并立项**

评估层接受这个请求，创建一个 **Ticket**（授权的工作单元），并颁发 **Mandate**（授权书）：记录当时的策略版本、工作范围、强度、匹配的规则、请求者身份。

**第 4 步 · REPLY｜唯一的一条中间消息**

> 收到。我会调查 #128 的列表滚动闪烁，在 iOS 15 上复现并给出修复 PR。

确认一次、说清要做什么——然后沉默开始干活。

**第 5 步 · WORKER｜独立会话 + 独立目录**

系统为这个 Ticket 启动专属执行器会话 `worker-<ticket-id>` 和独立工作目录。prepare 命令（典型是 `git worktree`）为它建好检出。Worker 读代码、复现、修复、跑测试，开分支 `agent/…` 提交 PR。命令免审批运行；前台命令超过 5 秒自动转后台，不阻塞它接收新消息。

**第 6 步 · 你在 Issue 里补一句："只影响 iOS 15，16 没事。"**

这条消息**不再过评估**——Ticket 已经订阅（Subscription）了这个 Issue 所在的线程，消息作为上下文直接扇出给正在干活的 Worker。授权范围不变，只是补充情报。

**第 7 步 · REPORT｜就绪报告**

Worker 完成，报告 **ready**，PR 链接回到 Issue 评论区。Ticket 进入"等待评审"阶段，把 Worker 槽位让出来。

**第 8 步 · 人评审、合并 PR**

PR 合并，线程关闭，Ticket 随之结束。注意它**保留订阅**：几周后如果有人在同一个 Issue 下再说"回归了"，一条人发的消息就能在原授权下唤醒同一张 Ticket，不需要重新评估。

数一数人收到的消息：**两条**（一次确认 + 一个 PR）。期间另一个 Ticket 的 Worker 在隔壁目录并行干活，互不干扰。这就是"少占注意力、多给价值"落到一次真实协作里的样子。

> **对比：同样的活在会话式 Agent 里是什么样** —— 你要开着会话盯全程：复现卡了等你看日志、iOS 15 环境问题等你确认、中途补的"只影响 15"要你手动贴进上下文、测试跑三分钟你切窗口去看别的然后忘了回来。人成了 Agent 的调度器和看门狗——Super-agent 的全部设计就是为了把这层"监工"从人身上拿掉，换成一个常驻的 Router。

## L3 · 领域模型

*先修：L2 · 约 12 分钟 · 对应官方文档 001-domain.md，全文最核心的一篇*

Super-agent 的代码、工具、面板和文档共用同一套词汇，不多一个概念。工作从 Trigger 流向 Eval 再流向执行：

```
Source（事件流） → Trigger → Thread（时间序线程） → batch → Eval（gate + 研判） → Mandate → Ticket（授权的工作） → Assignment → Executor（Worker 会话）

Thread 上的消息经 Subscription 扇出直达 Ticket（绕过 Eval）
Ticket 的结果经 Channel 写回 Source（回复 / PR / 评审）
Policy（版本化策略）约束 Eval 与 Mandate
Eval 输出 Decision：accept / stop / ignore / unavailable
```

### 3.1 核心概念表

前五个（Source、Thread、Eval、Mandate、Subscription）构成核心域，其余是支撑：

| 概念 | 定义 | 它守住的规则 |
| --- | --- | --- |
| Source（来源） | 一个事件流。Source 种类是可复用实现（GitHub、飞书），实例是一份配置 | 持有自己的读取位置和机器人身份；过滤自身消息和范围外事件；重启不得重放事件 |
| Trigger（触发） | 一个不可变事件，携带 Source 自己的元数据（如发送者） | 幂等与审计的基本单元：同一个 Trigger 被接受两次只创建一张 Ticket |
| Thread（线程） | 按时间排序的 Trigger 序列（如一个 Issue 的全部评论） | 同一时刻至多一个 Eval 在跑；可挂多张 Ticket；持有订阅、运行中 Eval 与决定历史 |
| Correlation（关联） | 一个 Trigger 同时属于多个 Thread 的关系 | 只补充上下文，**从不路由** |
| Channel（渠道） | Thread 的写侧（在哪回复） | 确认、答复、PR、resolve 评审都是写操作 |
| Policy（策略） | 版本化的接受规则 + 每个 Source 的部分（允许列表、同步方式、bot 列表） | 规则变了，运行中的 Eval 必须丢弃重排；不同 Source 的身份**永不互相映射** |
| Eval（评估） | 对一批 Trigger 的裁决，两层：gate（确定性准入）+ assessment（模型研判） | 输入快照，输出 Decision，自身无状态；决定新工作开始、继续或停止 |
| Mandate（授权） | 一次 accept 所授予的东西：策略版本、范围、强度、匹配规则、请求者身份 | 不可变；扩大范围=新 Ticket；只有人的 stop 能撤回、策略失效能吊销；恢复前重验证 |
| Ticket（工单） | 一个被授权的工作单元 | 只有 Eval 能创建；open→ended，人在其 Thread 上的消息可唤醒；**定义自己的状态，不跟随执行器** |
| Assignment（派工） | Ticket 与一个执行器实例的绑定 | 一张 Ticket 历史上可有多个；pending→running→ended 独立于 Ticket 状态机 |
| Subscription（订阅） | Ticket 与 Thread 的多对多关系，由 Thread 持有 | 匹配的 Trigger 扇出给所有订阅中的 Ticket，不检查发送者；**给上下文，不给权限**；结束后保留订阅供唤醒 |

> **一个容易忽略的设计决定**："人"不是领域概念。Trigger 只携带 Source 给的发送者标识，允许列表是 Policy 在某个 Source 上的部分。"同一个人在 GitHub 和飞书各有一个账号"这类知识，是 Agent 按需读取的提示词文本，不是系统里的实体。系统因此永远不需要做跨平台身份映射——一个传统权限系统里最脏的问题被直接绕开了。

### 3.2 拒绝清单：它决定不做什么

`001-domain.md` 里最有教学价值的部分是一张 "Rejected concepts" 表——每一条都是一次明确的设计取舍。做架构时，**写下"不做什么"和写下"做什么"同样重要**：

| 被拒绝的设计 | 拒绝理由 |
| --- | --- |
| Principal / Membership 实体，跨 Source 身份映射 | 人是 Trigger 元数据；允许列表是 Policy 的一部分；跨 Source 映射是提示词 |
| Eval 自己调度延时 Trigger | 需要等待的条件就是一个普通 Source（自己定时再查），Eval 不反向依赖 Source |
| 每个 Thread 至多一张活跃 Ticket | 一个 Thread 可以承载多件独立的工作；查重交给研判时看 Ticket 列表 |
| "追加到 Ticket" 的 Decision | 追加就是订阅扇出，不需要 Eval 参与 |
| Ticket 状态跟随 DSH 会话 | Ticket 会被交接、唤醒、由多个执行器跑，必须定义自己的状态 |
| 执行器宣布"用户叫我停" | 只有 Eval 决定停止的强度，Worker 无权代言人的意图 |
| 策略变更时取消运行中的 Ticket | 取消会留下半成品；改为记录变更并送达受影响的 Ticket |
| 执行器故障时锁死其全部工具 | 会拒绝直接在会话里工作的人；暂停自动输入就足够 |
| 从报告自由文本推断"在等人" | 分类需要结构化事实；执行器通过结构化字段提问 |

### 3.3 聚合划分

- **Source** 聚合持有读取位置（重启不重放的关键）。
- **Thread** 聚合持有订阅、运行中的 Eval（串行，期间到达的 Trigger 合并进下一批）、决定历史。
- **Ticket** 聚合持有 Assignment、Channel、Inputs，按 id 引用 Decision。

可复用的是概念和规则；Source 实现、Policy 内容、执行器和 Channel 实现都属于具体部署。接下来两章分别展开"授权"和"执行"这两个最厚的切面。

## L4 · 授权模型

*先修：L3 · 约 12 分钟 · 对应官方文档 002-authorization.md*

授权回答两个问题：**谁可以发起工作？这些工作能走多远？** 一个常驻 Agent 的安全边界不在"它能调什么工具"，而在"它凭什么开始做一件事"。Super-agent 把这件事做成了一个完整的体系，核心是：宿主强制执行允许列表、规则和 Mandate——消息、评论、被引用的文档都只是决策的**输入**，永远改不了权限本身（提示注入在这里被结构性挡住了一层）。

### 4.1 一个 Trigger 的两条路

```
新工作：人的消息未到达任何 Ticket → gate（发送者 × 策略 → 强度） → assessment（模型研判） → Decision（accept / stop / ignore / unavailable）

已有工作的延续：订阅线程上的任何消息（含 bot 和 CI） → Subscription 扇出（绕过 gate） → Ticket 的 Worker（作为上下文 / 后续请求）＋ 不授予新权限：每张 Ticket 始终受自己的 Mandate 限制
```

第二条路是精髓：**授权（Mandate）与上下文（Subscription）彻底分离**。你在我干活的 Issue 里补一句话，这句话直接到达我，不需要再过安检——但它能让我做的事，一毫米也没有变多。

### 4.2 强度：explicit / inferred / 不准入

| 强度 | 什么时候成立 |
| --- | --- |
| explicit 明确 | 允许列表上的人 @ 它或私信它；在有 Ticket 的线程上跟进；准入表格某格设为 explicit |
| inferred 推断 | 不在列表的人跟进有 Ticket 的线程；准入表格设为 inferred 的格；bot 列表上的 bot（如 `dependabot[bot]`）@ 它或落在全量接收范围 |
| 不准入 | 其他一切 bot 消息、表格忽略的情况、以及 accept mode 为 `off` 时的全部推断候选 |

### 4.3 准入表：把"谁能派活"做成可配置矩阵

每个 Source 的 Policy 里有一张准入表。行是接收范围（飞书：每个配置的群、其他群的 @、私信；GitHub：新 Issue、新 PR、评论、默认分支 CI），列是三种情形：

| 格子 | 可选项 | 默认 |
| --- | --- | --- |
| 在列表上，没有 @ Agent | inferred / ignore | inferred |
| 不在列表上，@ 了 Agent | explicit / inferred / ignore | ignore |
| 不在列表上，没 @ Agent | inferred / ignore | ignore |

一个典型用法：把某个客服群的"不在列表 + @"设成 **explicit**，群里任何人 @ Agent 都能直接派活。CI 结果没有发送者，所以只有第三格。普通账号跑的自动评审者在宿主眼里算"人"，要在团队提示词里标注——这是文本层补系统层的例子。

### 4.4 accept mode：给自主性上灰度

| 模式 | 效果 |
| --- | --- |
| `off` | 所有推断候选（没人 @ 的消息、bot 消息、列表外人的跟进）一律不产生候选 |
| `observe`（默认） | 推断候选照常研判，阳性结果记录为 "would accept" 但**不执行** |
| `auto` | 推断候选研判阳性即接受执行 |

explicit 请求在任何模式下都有效。推荐的上线路径：**observe 起步，人工审阅记录下来的"它本来会接什么"，确认判断靠谱后再切 auto。** 这就是灰度发布，只不过发布的是 Agent 的自主权。每条规则描述一种主动性工作（如"CI 红了且日志显示是 flaky test 就尝试修复"），Ticket 的 Mandate 会记录匹配到的规则，Worker 也会收到这些规则的名字和说明。

### 4.5 策略版本与 Mandate 的一生

- 规则 + accept mode + 各 Source 的 Policy 部分哈希成一个**策略版本**，每个 Mandate 记录它被接受时的版本。
- 版本变更：丢弃运行中的 Eval、Trigger 重新排队；给受影响的活跃 Ticket 发一条"策略变更"输入（哪条规则变了、请求者是否还有权限、自主模式是否关闭）；**不立即吊销**已发的 Mandate。
- Mandate 一生只有三种改变：accept 创建、人的 stop 撤回、恢复前重验证失败吊销。
- Ticket 结束后 Mandate 保留：人在其 Thread 上的消息可唤醒同一张 Ticket，**无需新的 Eval**；bot 和 CI 永远唤不醒已结束的 Ticket。
- 唤醒前重验证（Revalidation）：explicit 跟进直接过；inferred 的要求当时 auto 模式且规则仍启用；准入表格批准的按今天的表格重查……验证失败，Ticket 保持结束，消息按"没到过任何 Ticket"重新走 Eval。

> **深入：Eval 没跑完会怎样** —— 时限从候选送达主会话起算（等待投递的时间不计，未送达的候选永不超时）。超时的 Eval 把 Trigger 重新排队；连续两次重试后第三次超时记 `unavailable`。研判失败同样记 `unavailable`，之后的 Trigger 可以开新 Eval。策略变更或基于过期策略做出的决定也记 `unavailable` 并立刻按当前版本重新排队。面板只对 24 小时内、仍是该 Thread 最新决定、未被处理的 unavailable 请求人工注意——又是注意力预算。

## L5 · 执行模型

*先修：L4 · 约 14 分钟 · 对应官方文档 003-execution.md*

### 5.1 Ticket 阶段：从上往下，第一行命中即生效

| 阶段 | 条件 | 面板标签 |
| --- | --- | --- |
| person / delivery | 输入送达执行器会话失败，2 秒后重试、指数退避到 1 分钟 | 输入未送达 |
| person / answer | 有一个等待人回答的问题（Attention） | 等待回答 |
| person / review | 最新报告是 ready | 等待评审 |
| person / blocked·failed | 最新报告是 blocked 或 failed，且此后无人的消息 | 受阻 · 失败 |
| working / queued | 没有 Assignment 或有待启动的 | 排队 |
| idle | 最新报告 waiting，或 Assignment 已结束 | 等待触发 |
| working | 其余一切情况 | 工作中 |

`person` 开头的阶段都表示"没人动手就进行不下去"；人的一条新消息会把 blocked / failed 的 Ticket 放回执行器手里。每个标签都回答一个问题：**它在等谁，等什么。**

### 5.2 Worker：一个 Ticket 一个世界

- 每个 Ticket 一个执行器会话 `worker-<ticket id>`，一个以 Ticket 短名命名的目录（默认在 `<stateDir>/work` 下）。
- 执行器会话以操作者的 OS 用户身份**免审批**跑命令；前台 shell 命令 5 秒后自动转后台 job——长命令不阻塞它收下一条消息，这是"常驻"的关键工程细节。
- 首次派工前若目录不存在，跑一次 prepare 命令（10 分钟时限，典型是 `git worktree` 建检出）；PR 分支最后一段与 Ticket 短名一致即归属该 Ticket。
- Worker 能通过 `DSH_SUPERAGENT_*` 系列环境变量拿到 Ticket 目录、仓库名、agent 账号、起始 Issue/PR 等执行上下文；凭据不进变量，worker 用 agent 账号的 `gh` 包装器和飞书 bot 的 `lark-cli` 访问外部。

### 5.3 后台工作、并发与"人优先"

- turn 结束时还有 shell job 或 subagent 在跑 → Ticket 保持 working、继续占着 Worker 槽位；完成后结果唤醒同一个执行器。
- 后台工作每个 turn 后最多 **30 分钟**：到点杀掉 shell job、报告 waiting（附执行器最后的话和被杀的 job）；subagent 允许继续。
- 移交给人时（ready 或提问后）：subagent 停止，shell job 可以留（比如留一个 dev server 给人评审），不再占槽位、不受 30 分钟限制。
- 并发上限管的是槽位，但**额外留一个槽给人的消息和状态请求**；人的唤醒优先于新任务启动——**新工作永远挤不掉人对已有 Ticket 的跟进**。

### 5.4 合并：保守的默认值

- 宿主没有任何合并决策逻辑，全由"交付要求"提示词段控制。
- 默认**绝不**以 agent 账号开启 auto-merge——GitHub 会把合并归因于开启 auto-merge 的人。要自动合并，必须由提示词指定另一个账号的 CLI。
- 默认允许 auto-merge 的条件：本 Ticket 开的 PR + ready + 必需审批覆盖 head commit + **增删总行数 < 200**；推新修订前先撤掉 auto-merge。
- 要强制审批，去分支保护里配置——提示词管 Agent，GitHub 规则管仓库，两层不混用。

### 5.5 一张 Ticket 怎么结束

- **无 PR 就绪**：ready 报告直接完成 Ticket。
- **无事可做**（复现不了、已被取代）：报告 dropped，静默结束（除非匹配规则要求留言）。
- **有 PR**：Ticket 跟随自己开的 / 起源的 PR，它开的 PR 全部关闭（或没开过 PR 时所有跟随的 PR 关闭）才结束，结局取最后一次相关关闭（merged / closed）。结束后保留订阅，等人的消息唤醒。

### 5.6 故障与恢复：为无常的世界设计

| 场景 | 行为 |
| --- | --- |
| 模型 / 网络瞬时故障 | HTTP 408/429/5xx、连接被拒重置超时：先退避重试 3 次（启动重跑、worker 被告知继续） |
| blocked / failed | 暂停自动输入等人；CI 和 bot 消息只记录不投递；人的消息、后续非 blocked/failed 报告或重试解除保持 |
| 重试 Retry | 结束当前 Assignment，**同一会话、目录、分支、PR** 上起一个新的——不丢工作现场 |
| 宿主重启 | 运行中的 Assignment 以"宿主重启"结束；新的带恢复说明启动：先检查目录、git 历史、GitHub，再重复任何外部动作（最老的 Ticket 优先）。会话、目录、订阅、待投消息全部存活 |
| 副作用投递 | **先落库再执行**（stored work）：转送、投递、启动都是持久化的；失败 2 秒重试、指数退避；同 Ticket 同会话的消息严格保序（确认一定先于答案到达） |
| Source 故障 | 每个 Thread 独立重读；连续 3 次失败才上报健康问题；GitHub 的 404 也重试（可能是失去私有库访问权）；读位置不动，恢复后补读 |
| 暂停处理 | 停派工、停新 Eval、停投递和回复，但 Source 继续记录 Trigger；进行中的 Eval 不超时，截止时间顺延暂停时长 |

把这张表读一遍你会发现一个主题：每一个故障场景都有明确的、记录在案的行为，而"等一个人"几乎是所有未知故障的兜底答案——不是因为它无能，而是因为**自主系统的安全姿态就是失败时降级为安静地等人**。

## L6 · 动手部署

*先修：L2（建议全读 L4–L5）· 对应官方文档 006-deployment.md 与 SETUP.md · 本节是流程地图，动手时以仓库最新文档为准*

### 6.1 最特别的一步：让 Agent 给你装 Agent

安装步骤很多，所以仓库的 `SETUP.md` 不是写给人按顺序执行的，而是写给**你的编程智能体**执行的。README 的安装指引只有一句话：

> "Ask your coding agent: Read SETUP.md in this repository and set up dsh-superagent with me."
>
> 让你的编程智能体读 SETUP.md，和你一起完成安装。

SETUP.md 本身就是 L1 理念的示范：装之前只读两个文件、先跑探针；**一次只问一个问题**、每个问题带推荐答案和一句为什么要问；收集完所有答案再发完整计划，确认后才执行；密钥绝不聊天里传——需要你动手的步骤打包成一条消息、给出要在你终端里跑的确切命令。

### 6.2 前置条件

- Node.js 22.19+ 或 24+、pnpm、git 2.32+、tmux、Python 3.8+、GitHub CLI（gh）2.48+
- DeepSeek Harness（`@deepseek-ai/dsh`，版本满足仓库 `engines.dsh` 范围）+ 配置好模型 provider
- 一个 github.com 仓库（**不支持** GitHub Enterprise Server）；仓库用 Git LFS 的话装 `git-lfs`
- 可选：飞书 / Lark 自建应用（bot 能力）+ `lark-cli`（测试版本 1.0.90）

### 6.3 给 Agent 一个独立身份

Agent 需要一个**专用的 GitHub 用户账号**（不能用 GitHub App——它要读账号的通知流），拥有仓库写权限。再给它一个只含该账号凭据的 gh 包装器：

```shell
# ~/.local/bin/gh-agent
#!/bin/sh
GH_CONFIG_DIR="$HOME/.config/gh-agent" exec gh "$@"

# chmod +x ~/.local/bin/gh-agent
# gh-agent auth login && gh-agent api user --jq .login
```

飞书同理：bot 应用 + 独立配置目录的 `lark-cli` 包装器（宿主拒绝能以用户身份行动的 CLI）。

### 6.4 安装（新机器一次）

```shell
npm install -g @deepseek-ai/dsh@0.2.1-rc.3
git clone https://github.com/deepseek-ai/dsh-superagent-prototype dsh-superagent && cd dsh-superagent
pnpm install && pnpm build
dsh superagent --from-default-profile web --dump-config > /dev/null
dsh plugin --profile superagent add "link:$PWD"
```

- 独立的 `superagent` profile（从 Web 模板复制，默认端口 3082，状态目录 `~/.dsh/state/superagent`）——和你的日常工作 profile 隔离，因为它会改进程级 PATH 和 git 配置。
- 把 `examples/profile.cordis.patch.yml` 复制为 `~/.dsh/profiles/superagent/cordis.patch.yml` 并替换占位符。
- 验证：`scripts/dsh-superagent status` 退出码 0 且无 setup 问题。

### 6.5 九个问题（SETUP.md 的问答路线）

| 问题域 | 问题 | 默认推荐 |
| --- | --- | --- |
| Sources（活从哪来） | 只接 GitHub，还是也接飞书？ | 只 GitHub |
| Sources（活从哪来） | 哪个仓库（owner/name）？ | — |
| Sources（活从哪来） | Agent 用哪个 GitHub 账号？ | 专用账号，**永远不用你自己的** |
| Policy（谁能派活） | GitHub 上谁可以派活？ | 只有你（列表越短噪音越低） |
| Policy（谁能派活） | 飞书哪个群、谁能派？ | 第一个群的全体成员 |
| Execution（怎么干活） | 每个 Ticket 从哪个本地克隆检出？ | 新建 `~/src/<name>` |
| Execution（怎么干活） | 提交署名给谁？ | Agent 账号（它的活一眼可辨） |
| Execution（怎么干活） | ready + 审批过后要不要 auto-merge？ | **不要**，人合并，直到它的 PR 稳定靠谱 |

不问有好默认值的东西（profile 名、端口、accept mode 起步为 observe、分支前缀 `agent/`、每小时自检任务……），它们直接列进计划。

### 6.6 第一次试跑

1. 打开面板：DeepSeek Harness Web 侧边栏的 **Superagent** 入口。
2. 用允许列表上的账号，在仓库任意 Issue 下评论：`@<agent-login> 请求内容`。
3. 约一分钟内，面板 Overview 出现一张 Ticket，然后你会在原 Issue 里收到它的确认回复。

面板围绕三个问题组织：**现在有需要我的吗？系统健康吗？某件工作的来龙去脉是什么？** 六个 tab（Overview / Source / Trigger / Eval / Execution / Settings）按工作流排列，每个概念只在一处出现。

> **安全边界要看清**：两个内置 preset（`dsh-superagent-worker` / `dsh-superagent-router`）以 `danger-full-access` 权限、以操作者的 OS 用户运行；账号包装器和目录只是**默认值，不是安全边界**——worker 能以绝对路径执行程序、能读你的 home 目录。认真隔离：给它一台专用机器或一个只含 Agent 凭据的专用 OS 账号。

## L7 · 源码架构

*先修：L3–L5 · 约 12 分钟 · 对应官方文档 007-architecture.md（TypeScript 单仓，pnpm check 跑类型检查 + 测试 + 构建）*

### 7.1 一张图看懂运行时

```
Source 插件（github / feishu） ──SourceContext──▶ Engine（Intake · Evals · Tickets · Assignments · Replies） ──Repositories──▶ Store（单 SQLite 库）

Session 工具（orchestrator_*） ──▶ Engine ──Outbox──▶ Effects（持久副作用队列） ──▶ DshExecutor（launch / deliver）

MasterAssessor（研判候选） ──▶ 主会话（dsh-superagent-router） ──▶ Sessions（relay / notice） ＋ Settings / Prompts（版本化配置）
```

- **Runtime**（`src/app/runtime.ts`）是组合根：锁状态目录、开 Store、装配一切，本身不含领域规则。每 2 秒一轮 pass：先跑到期副作用，再 `Engine.evaluateDue`。
- **Engine**（`src/core/engine.ts`）是 Trigger、Thread、Decision、Ticket、Assignment 的**唯一写入者**。全部方法同步、每个命令一个事务；对外只暴露五个内部部分，调用方拿到的是按角色裁剪的 `Pick` 类型（`EngineForMainSession`、`EngineForExecutor`……）。
- **Store**：单个 SQLite 库 + 目录锁（防第二个进程写同一份状态）；领域仓储、只读查询、Outbox 回执、版本化设置分区明确。

### 7.2 Effects：先落库，再执行

所有外部副作用走一个持久队列：命令在**事务内** enqueue，提交后才开始执行；失败指数退避重试。六种副作用各管一段：

| kind | 做什么 | 并发 | 重试 |
| --- | --- | --- | --- |
| assessment | 把候选卡片送进主会话的 turn，送达即启动 Eval 时限 | 4 | 2s 起倍增至 60s |
| launch | 启动待运行的 Assignment：prepare、会话、任务消息 | 空闲 Worker 槽 | 瞬时故障 3 次；其余失败即失败 Ticket |
| delivery | 把 Ticket 等待中的输入按序交给运行中的 Assignment | 4 | 2s 起倍增至 60s |
| relay | 把 worker 报告 / 问题 / 人的跟进送进主会话 | 1（保序） | 2s 起倍增至 60s |
| notice | 向主会话注入通知（不唤醒它） | 1（保序） | 2s 起倍增至 60s |
| reply | 经 Source 发出 Channel 消息，同会话按序、前一条连败三次才解阻 | 1 | 5s 起倍增至 300s |

### 7.3 值得偷学的工程约束

- **命令与事实的命名法。** 请求做某事的方法用祈使句（`stopTicket`、`bindThread`），可以被拒绝；记录适配器已完成事实的方法用过去式（`assignmentStarted`、`deliveryFailed`）。读代码时一眼分清"意愿"与"事实"。
- **依赖单向、显式、窄接口。** `src/core` 不 import 外部任何东西（除 Node 哈希）、零 I/O；`src/sources` 不 import `src/app`；面板只 import 类型。每个类收到的都是"它用到的那几个方法"的 Pick 类型，组合根注入。
- **一类状态一个写入者。** Trigger/Ticket 归 Engine；Source 读位置归 Source；设置归 Settings；prompt 版本归 Prompts；回执归 Outbox；健康条目归认领者。Source 想改 Ticket 只能经 `bindThread` / `threadClosed` 走 Engine。
- **Prompt 也是版本化数据。** 团队可覆盖全部内置段落，每次保存生成不可变版本；升级时默认文本变了的面板标 **Default updated**，三向对比后你选择保留 / 采纳 / 手改。提示词强度还有明确层级：宿主与工具强制的事实 > 内置段落 > 匹配规则要求 > 团队段落 > 外部文本（消息、评论、引用文档——**它们是数据，永远改不了规则和授权**）。
- **消息送达语义精确定义到可怕。** "一条输入何时算被读" = 会话把它带进历史 + 随后跟一次报告或 turn 结束；重启、取消、崩溃各算什么，文档逐条列明。分布式系统工程师熟悉的 at-least-once / 幂等思维被原样搬进了 Agent 状态管理。

> **深入：想扩展一个新 Source 要写什么** —— `008-cookbook.md` 用一个虚构的 `webhook` 消息队列完整示范了四步：① 把事件映射到领域（Trigger = 一条消息、Thread = 会话内某消息起的回复串、确定稳定的 id 方案——id 会持久化，改了就断链）；② 声明配置 schema / 面板字段 / 健康条目（字段声明式生成设置表单，默认值必须"什么都不收"）；③ 实现 Channel 发送与线程上下文读取；④ 维护轮询循环与读位置。对照 `src/sources/github.ts` 读，一天能入门。

## L8 · 判断与启示

*先修：建议通读前文 · 约 8 分钟*

### 8.1 冷静的部分

- **研究原型，官方自己反复声明。** 大量工程由编程智能体完成，风格不统一、可能有 bug；发布的版本也和团队内部版、设计文章描述不完全一致，部分设计只是未来方向。
- **绑定生态。** 它不是一个可嵌入的库，而是 DeepSeek Harness 的插件包；Source 目前只有 GitHub（仅 github.com）和飞书；执行器就是 DSH 会话。想在别的技术栈复用，复用的是 L3–L5 的**概念**，不是代码。
- **安全模型偏"约定"，不是"隔离"。** `danger-full-access` + 操作者 OS 用户 + 包装器只是默认值。把它放进生产仓库前，专用 OS 账号 / 专用机器是底线。
- **数据是自报的。** p50/p95 来自团队自己的对比实验，无第三方复现；star 速度衡量的是热度与共鸣，不是成熟度。
- **运维成本真实存在。** 每小时自检、策略调优、噪音治理、提示词版本管理——"养一个常驻 Agent"更像 onboard 一个远程初级同事，不是装一个 App。

### 8.2 它真正贡献了什么

把热潮的语言剥掉，Super-agent 回答的是一个朴素问题：**当一个 Agent 能替整个团队干活时，怎么防止它变成整个团队的负担？** 它的答案是一套完整的、可审计的自主性约束系统——而"自主性需要约束系统"这个观点本身，比任何单个功能都值钱。

| 可直接搬走的设计 | 一句话 |
| --- | --- |
| 注意力预算 | 每条消息 / 通知 / 设置都要付注意力成本，价值必须覆盖成本，否则删除——可以直接当你产品的评审标准 |
| Trigger 不可变 + 幂等 | 事件是不可变事实，重放不产生重复工作，天然可审计 |
| 授权与上下文分离 | Mandate 定义"能做多少"，Subscription 定义"能看见多少"；上下文自由流动，权限寸步不让 |
| 确定性 gate + 模型 assessment 两层裁决 | 权限判定交给代码，价值判定才交给模型——模型永远不裁定权限 |
| 自主性灰度（observe → auto） | 先记录"本来会做什么"，人审够了再放权——Agent 版的灰度发布 |
| Ticket 自己的状态机 | 工作单元不跟随执行器状态：可交接、可唤醒、可换执行器 |
| 单一写入者 + 先落库再执行 | 状态和副作用都有唯一属主与持久队列，崩溃恢复是设计出来的不是补出来的 |
| 拒绝清单 | 把"不做什么"和理由写成文档——领域模型最有效的防腐剂 |

### 8.3 给不同读者的下一步

- **只想理解概念**：按序读仓库 `docs/000–005`，每篇 10 分钟，本文对应章节可当导读。
- **想跑起来玩**：找一个不重要的测试仓库 + 一个专用 GitHub 账号，accept mode 全程 observe 起步，看完它两周的 Decision 记录再谈 auto。
- **想读源码**：从 `src/core/engine.ts` 和五个 EnginePart 进，对照 `007-architecture.md` 的模块表当索引。
- **在做自己的 Agent**：把 8.2 那张表逐条对照你的设计，最可能的缺口是"授权与上下文分离"和"自主性灰度"。

最后一句话总结：**Super-agent 的 "super" 不在于它能做更多事，而在于它把"何时不做事、何时不开口"做成了和"如何干活"同等精密的系统。** 在人人都在堆 Agent 能力的 2026 年，这份克制的工程化本身就是它最值得学的地方。

## 附录：术语表 · 参考资料

### A.1 术语表（中英对照）

| 英文 | 中文 | 含义 |
| --- | --- | --- |
| Agent | 智能体 | dsh-superagent 运行的自动化团队成员，以 GitHub 账号 / 飞书 bot 等身份在 Source 上行动 |
| Main Session | 主会话 | 评估 Trigger、接单派工、回复的 DSH 会话；代码与提示词中叫 `orchestrator` |
| Executor Session | 执行器会话 | 为一个 Ticket 运行的 DSH 会话；代码与提示词中叫 `worker` |
| Source | 来源 | 事件流：插件提供的种类 + 一份实例配置 |
| Trigger | 触发 | 来自 Source 的一个不可变事件 |
| Thread | 线程 | 按时间排序的 Trigger 序列；Eval 在其内串行 |
| Correlation | 关联 | 共享同一 Trigger 的线程间关系；只补充上下文 |
| Channel | 渠道 | Thread 的写侧 |
| Policy / Policy version | 策略 / 策略版本 | 版本化的接受规则与各 Source 部分（允许列表、bot 列表、准入表） |
| Eval | 评估 | 把一批 Trigger 变成一个 Decision 的过程 |
| Gate / Assessment | 准入 / 研判 | Eval 的两层：确定性准入 / 模型研判 |
| Decision | 决定 | Eval 的结果：accept 接单 · stop 停止 · ignore 忽略 · unavailable 未完成 |
| Mandate | 授权 | accept 所授予的东西：强度、范围、所依据的策略版本 |
| Strength | 强度 | Mandate / Eval 的基础强度：explicit 明确 · inferred 推断 |
| Ticket | 工单 | 一个被授权的工作单元 |
| Assignment | 派工 | Ticket 与一个执行器实例的绑定：pending · running · ended |
| Subscription / Fan-out | 订阅 / 扇出 | Ticket 与 Thread 的多对多关系；把订阅线程的 Trigger 作为上下文送达 Ticket |
| Executor | 执行器 | 运行 Assignment 的端口：一个执行器会话 + 一个目录 |
| Report | 报告 | Assignment 向 Ticket 报告的状态：progress · waiting · ready · blocked · failed · dropped |
| Attention | 待人工决定 | Ticket 上等待人回答的问题 |
| Scope | 范围 | Mandate 允许的工作 |
| Disposition | 去向 | 一个 Trigger 被过滤 / 评估 / 扇出的记录 |
| Input | 输入 | 送达 Ticket 的上下文：扇出的 Trigger、策略变更、唤醒、文本 |
| Accept mode | 接受模式 | off / observe / auto，控制推断候选是否被接受 |

### A.2 参考资料

- 仓库与文档（本教程的主要依据）：[deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype)（docs/000–008、SETUP.md，MIT，v0.1.0）
- 底座框架：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)（DeepSeek Harness，"一切皆插件"）
- 团队技术文章：《Super-agent 设计探索：迈向更自主的 Agent 系统》（2026-10-31，见仓库 README 链接）
- 中文解读：[腾讯云开发者社区：DeepSeek 开源 Super-agent 是什么](https://developer.cloud.tencent.com/article/2773403)、[Super Agent 爆火 2026：会主动干活，更懂何时闭嘴](https://www.sohu.com/a/1095752866_122066679)
- 热度追踪：[TrendShift 收录页](https://trendshift.io/repositories/328842) · [Reddit r/singularity 讨论](https://www.reddit.com/r/singularity/comments/1xkoi9g/)

---

*教程内容基于 2026-11-10 抓取的 v0.1.0 文档与公开报道；项目迭代很快，动手前请以仓库最新文档为准。媒体数据（star 数、性能对比）均为报道口径，未经独立验证。*
