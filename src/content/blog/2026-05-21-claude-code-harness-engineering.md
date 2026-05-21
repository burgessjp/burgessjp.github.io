---
title: Claude Code 大项目实战：从配置体系到自动化工作流
date: 2026-05-21
tags: [Claude Code, Harness Engineering, AI Workflow, React Native]
category: AI
excerpt: 移动端（RN/Android）场景下，用 Harness Engineering 思路搭建工程化 Claude Code 工作流——面向有 Claude Code 使用经验的开发者，不谈概念，只解决大项目实战中的真实问题。
---

> 移动端（RN/Android）场景下，用 Harness Engineering 思路搭建工程化 Claude Code 工作流——面向有 Claude Code 使用经验的开发者，不谈概念，只解决大项目实战中的真实问题。

## 一、问题现场——大项目用 Claude Code 为什么会失控

你有一个 5 万行的 React Native 项目。Claude Code 用了两个月，一开始很爽——加个组件、改个 bug、写个接口，几分钟搞定。但随着项目变大，事情开始不对劲了。

**上下文爆炸。** 你让 Claude 改一个 Native Module 的桥接逻辑，它读完 Java 文件、读 Kotlin 文件、读 JS 导出层、读构建配置……等你反应过来，上下文窗口已经塞满了。后面的对话质量急剧下降，Claude 开始"忘记"前面的讨论，给出自相矛盾的方案。ETH Zurich 对 138 个 agentfile 的研究发现，上下文利用率超过 40% 后性能显著下降——进入了所谓的"愚蠢区域"。你的感觉是对的：不是模型变笨了，是你给它塞了太多东西。

**质量赌博。** 同样一个需求，今天 Claude 生成的代码跑得通，明天换一个 session 同样的需求就不一定了。你没法复现昨天的质量。问题不在模型本身——同一个 Claude，在配置良好的项目里能稳定输出高质量代码，在配置混乱的项目里就像掷骰子。关键区别不在于你用了什么 prompt，在于项目有没有一个工程外壳。

**配置碎片。** 你花了一个下午写了一篇长长的 CLAUDE.md，把项目架构、编码规范、目录结构全写进去了。结果 Claude 该不遵守还是不遵守。ETH Zurich 的研究给出了一个反直觉的结论：LLM 自动生成的配置文件不仅没有帮助，反而**损害了性能**，同时成本增加了 20% 以上。HumanLayer 团队的 CLAUDE.md 不到 60 行。Anthropic 官方建议更直接——对 CLAUDE.md 中的每一行问自己："移除它会导致 Claude 犯错吗？"如果不会，就删掉。

**协作黑洞。** 你和同事用 Claude 改同一份代码。你的 Claude 按 Redux 模式写状态管理，他的 Claude 按 Zustand 模式写——因为你们各自的 CLAUDE.md 不一样。一个月后项目里出现了三套状态管理方案，谁的 Claude 都不知道该遵循哪套。大型代码库的最佳实践文档里有一句话很精准："自下而上的采用会带来热情，但没人集中化就会碎片化。"

这些问题不是 Claude Code 的 bug，而是缺少工程化外壳的必然结果。Mitchell Hashimoto（HashiCorp 联合创始人、Terraform 创始人）在 2026 年初提出了一个概念，被整个行业迅速接受：**Harness Engineering**。他给的定义很简单——"每次发现 agent 犯错，都要花时间设计一个方案，使得该 agent 不再犯同样的错误。"

这个定义背后是一个更根本的洞察：**模型决定上限，Harness 决定下限。** 一个配置良好的中等模型，在 Harness 到位的情况下，输出质量可以超过顶级模型在裸奔状态下的表现。这不是理论——OpenAI 的内部案例已经验证了这一点：3 个工程师、5 个月、零手写代码、约 100 万行产出，靠的不是模型有多强，而是 Harness 有多稳。

接下来的四章，我用一个 RN/Android 项目为主线，把 Harness Engineering 从理论拆解成你可以直接拿去用的配置和工作流。不谈概念，只解决问题。

## 二、配置体系——让 Claude 理解你的项目

Harness Engineering 有四层架构：Memory（记忆）、Execution（执行）、Feedback（反馈）、Orchestration（编排）。配置体系是 Memory 层——教 Claude 理解你的项目规则和约束。这一章解决一个问题：**怎么让 Claude 每次都按你的规矩来，而不是按它自己的理解来。**

### 2.1 CLAUDE.md：从 router 思维开始

**问题：** 你的项目有编码规范、架构约定、目录结构、构建命令……这些信息散落在文档里、README 里、同事的脑子里，Claude 无从遵循。

最常见的错误是把 CLAUDE.md 当知识库写——把项目的一切都塞进去。你的本意是好的，觉得信息越全 Claude 越懂。但实际效果相反：CLAUDE.md 每次会话都完整加载到上下文窗口，每多一行都在挤占 Claude 理解代码的空间。

正确做法是把 CLAUDE.md 当 **router**，不是 library。它应该是一个索引——指向更详细的信息，而不是信息本身。Anthropic 官方文档用 `@path/to/import` 语法支持这种渐进式披露，让 Claude 在需要时按需读取，而不是一开始就全塞进去。

三个核心原则：

**200 行上限。** HumanLayer 团队的 CLAUDE.md 不到 60 行，他们在生产级项目里稳定运行。超过 100 行就该考虑拆分了。

**禁止清单 > 要求清单。** "Do NOT introduce new state management libraries" 比 "Use Zustand for state management" 更防坑。禁止清单能节省的不是一次纠正，是后续 10 次兼容性修复。

**5 秒可判定。** "写干净的代码"对 AI 等于没说。"禁止 `any` 类型"、"组件不超过 200 行"、"async/await 替代 Promise 链"——这些规则 5 秒内就能判断代码是否符合。

一个 RN 项目的根 CLAUDE.md，25 行足够：

```markdown
# RN/Android 项目

## 项目类型
React Native 0.76 + Kotlin Android + TypeScript strict

## 禁止清单
- DO NOT introduce new state management libraries (项目统一用 Zustand)
- DO NOT use `any` type, disable TypeScript strict checks, or add `@ts-ignore`
- DO NOT modify android/app/src/main/ without explicit approval
- DO NOT add native dependencies without updating Podfile AND build.gradle
- DO NOT use `// eslint-disable-next-line`

## 关键命令
- `pnpm test` — 运行所有单元测试
- `cd android && ./gradlew assembleRelease` — Android Release 构建

## 架构决策
- JS 层和 Native 层通过 TurboModule 通信，参考 src/native/README.md
```

注意这个文件的每一行都通过了"移除它会导致 Claude 犯错吗"的测试——去掉 Zustand 的禁止项，Claude 就可能引入 Redux；去掉 `any` 类型的禁止项，Claude 就会用 `any` 绕过类型检查。

进阶做法是**子目录 CLAUDE.md 分层**。在 `android/` 下放一个本地 CLAUDE.md，写原生层的规则（Kotlin 编码规范、JNI 边界、ProGuard 注意事项）；在 `src/navigation/` 下放导航结构的约定。Claude 进入这些目录时会自动加载对应的 CLAUDE.md，形成分层约束。

### 2.2 rules/：专项规则拆分

**问题：** CLAUDE.md 超过 100 行了，信息密度开始下降。你在文件里找一条具体规则要翻半天，Claude 也一样。

解法是把专项规则拆到 `rules/` 目录。CLAUDE.md 只保留全局路由和最关键的禁止清单，细节规则按关注点分离。

```
.claude/
├── CLAUDE.md                    # 全局路由 + 禁止清单（< 50 行）
├── rules/
│   ├── android-native.md        # 原生层开发约束
│   └── rn-patterns.md           # RN 架构模式
└── settings.json                # hooks 配置
```

`rules/android-native.md` 的关键条目示例：

```markdown
## 原生层开发约束

- 新增 Native Module 必须同时实现 TypeScript 类型定义文件
- JNI 边界禁止传递复杂对象，只允许基本类型和 ByteBuffer
- ProGuard 规则变更必须在 `proguard-rules.pro` 中添加注释说明原因
- 新增权限必须同步更新 AndroidManifest.xml 和隐私合规文档
```

`rules/rn-patterns.md` 的关键条目：

```markdown
## RN 架构模式

- 页面组件放 `src/screens/`，共享组件放 `src/components/`
- 每个页面组件对应一个 `use[PageName].ts` hook 封装业务逻辑
- 导航使用 React Navigation 6.x，路由定义集中在 `src/navigation/`
- 列表页必须使用 FlashList，不使用 ScrollView 渲染长列表
```

OpenAI 的百万行项目用了 **88 个 AGENTS.md 文件**做分层约束。他们的做法是"给 agent 一张地图，不是一本千页的操作手册"。你的项目不需要 88 个文件，但按关注点分离的思路是一样的——让 Claude 在需要时按需读取，而不是一开始就全塞进去。

### 2.3 hooks：把"请记住"变成"必须"

**问题：** CLAUDE.md 和 rules/ 里写了规则，但 Claude 不一定遵守。写"禁止修改原生层"和 Claude 实际不修改原生层，中间差了一个执行力。

这是 Harness Engineering 的核心区分：**CLAUDE.md 是咨询性的，hooks 是确定性的。** 你在 CLAUDE.md 里写"请记住不要引入新依赖"——Claude 大概率会遵守，但不是 100%。用 hooks 配置一个检查脚本——100% 会执行。

Claude Code 的 hooks 在特定生命周期事件触发。最常用的五个：

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| `PreToolUse` | Claude 调用工具前 | 阻止危险操作、限制文件修改范围 |
| `PostToolUse` | 工具调用完成后 | 自动格式化、触发验证 |
| `Stop` | Claude 完成响应时 | 强制跑测试/lint，不过不让停 |
| `Notification` | Claude 发送通知时 | 集成 Slack/邮件通知 |
| `SessionStart` | 新会话开始时 | 注入动态上下文（分支名、issue 列表） |

退出码语义是 hooks 设计的关键：**0 = 沉默通过（不输出任何东西），2 = 阻塞并把错误喂回 Claude。** 这个设计不是偶然的——成功时沉默是为了不污染上下文窗口，失败时反馈是为了让 Claude 知道该修什么。

**实例 1：PreToolUse hook——原生层修改限制**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "command": ".claude/hooks/check-native-modify.sh"
      }
    ]
  }
}
```

配套的 `check-native-modify.sh`：

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if echo "$FILE_PATH" | grep -q "android/app/src/main/"; then
  echo "BLOCKED: 原生层修改需要人工确认。请在 CLAUDE.md 中移除限制或手动执行。" >&2
  exit 2
fi
exit 0
```

这个 hook 在 Claude 每次尝试编辑或写入文件时触发。如果文件路径在原生层目录内，直接阻止，Claude 会收到错误信息并被要求调整方案。

**实例 2：Stop hook——完成后自动验证**

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "command": ".claude/hooks/validate-on-stop.sh",
        "timeout": 120000
      }
    ]
  }
}
```

配套的 `validate-on-stop.sh`（基于 HumanLayer 实战配置，改写为 RN 场景）：

```bash
#!/bin/bash
cd "$CLAUDE_PROJECT_DIR"

# 并行跑 lint 和类型检查
OUTPUT=$(pnpm run lint 2>&1 && pnpm run typecheck 2>&1)

if [ $? -ne 0 ]; then
  echo "验证失败，请修复以下问题后重试：" >&2
  echo "$OUTPUT" | tail -20 >&2
  exit 2
fi
# 成功时沉默——不输出任何东西
exit 0
```

注意最后一行：成功时 `exit 0`，不输出任何内容。这是 HumanLayer 的设计哲学——**成功时沉默，失败时才反馈。** 每一次不必要的输出都在浪费上下文窗口。

### 2.4 skills：封装可复用的操作序列

**问题：** "帮我新建一个 RN 模块"——你每次都要教 Claude 一遍步骤：创建目录、写 index.ts、写类型定义、注册 TurboModule、导出到 NativeModules。重复操作的每次教学都是在浪费 token 和时间。

Skills 是 Claude Code 的按需加载能力模块。和 CLAUDE.md 的关键区别：**CLAUDE.md 每次会话都加载，Skills 只在触发时才加载。** 这意味着你可以大胆地写详细的 Skills，不用担心挤占上下文窗口。

一个 skill 只解决一个能力。触发词写在 `description` 里——这是 Claude 决定是否调用的依据。

RN 新模块创建 skill 的 `SKILL.md`：

```markdown
---
name: create-rn-module
description: 创建新的 React Native 模块。当用户说"新建模块"、"创建 feature"、"添加新页面模块"时使用。
---

# 创建 RN 模块

## 步骤
1. 在 `src/modules/` 下创建目录，命名为 kebab-case
2. 创建 `index.ts` 导出所有公共 API
3. 创建 `types.ts` 定义 TypeScript 类型
4. 如果涉及原生桥接，参考 `src/native/README.md` 创建 TurboModule
5. 在 `src/modules/index.ts` 中注册新模块
6. 运行 `pnpm typecheck` 验证类型正确

## 模板
组件模板参考 `@src/modules/_template/`
```

引用深度保持一层——`SKILL.md` 可以引用其他文件（比如模板目录），但不要嵌套引用（A 引用 B，B 又引用 C）。Anthropic 的 Skill 最佳实践明确建议：SKILL.md 控制在 500 行以内，50 token 的简洁指令胜过 150 token 的冗长解释。

另外一个实用建议：**让一个 Claude 实例帮你写 Skill，然后用另一个 Claude 实例测试它。** 这避免了"写的人和用的人是同一个模型"的认知偏差——和后面要讲的 SDD 三角色分离是同一个逻辑。

---

配置体系搭建好了，Claude 已经能理解你的项目规则和约束。但理解规则和稳定输出之间还有一道鸿沟——工作流。下一章解决的问题是：**配置好了，但工作流不对，质量照样不稳定。**

## 三、工程工作流——让 Claude 稳定输出

配置是 Memory 层，告诉 Claude "规则是什么"。工作流是 Execution + Orchestration 层，解决"怎么稳定地按规则做事"。这一章覆盖三个核心问题：怎么避免 AI 自评偏见、怎么拆分复杂任务、怎么管理大项目的上下文。

### 3.1 Spec-Driven Development：三角色分离

**问题：** 你让 Claude 写一个功能，写完让它自己检查一遍。它说"看起来不错"。你 review 了一下，发现三个遗漏的边界条件和一个类型不匹配。Claude 不是没能力发现这些问题——而是**同一个模型既写代码又审查代码，倾向于认为自己的实现没问题。** 这是 AI 的自评偏见，不是个别现象，是所有 LLM 的共性。

解法是 **SDD（Spec-Driven Development）**——把一个 Claude 干的事拆成三个角色：

| 角色 | 职责 | 可以做 | 禁止做 |
|------|------|--------|--------|
| Planner | 把模糊需求转化为精确的 Spec | 写 Spec、提问澄清 | 写代码、自评 |
| Generator | 严格按照 Spec 实现代码 | 写代码、写测试 | 修改 Spec、自评 |
| Evaluator | 对比 Spec 和实现，客观评分 | 评估、评分 | 修改代码、修改 Spec |

关键约束：**角色之间必须重启 Claude Code。** 重启 = 清空上下文 = 角色隔离。同一个 session 里切角色，自评偏见依然存在。

用一个实际需求走一遍流程："给 RN 项目添加 Dark Mode 支持。"

**Planner 阶段**——输入模糊需求，输出精确 Spec：

```markdown
# Spec: Dark Mode 支持

## 功能描述
支持系统级和手动切换的 Dark Mode，覆盖所有页面组件。

## 验收标准
### AC-1: 系统主题跟随
- 前置条件：设备设置为 Dark Mode
- 期望结果：应用启动后自动使用 Dark 主题
- 验证方式：截屏对比

### AC-2: 手动切换
- 操作步骤：设置页 → 外观 → 选择"深色"
- 期望结果：立即切换，下次启动保持选择
- 验证方式：单元测试 + 手动验证

### AC-3: 自定义组件适配
- 期望结果：所有自定义组件响应主题变化，无硬编码颜色
- 验证方式：`grep -r "#[0-9a-fA-F]" src/` 返回空

## 技术约束
- 使用 react-native-paper 的主题系统
- 颜色定义集中在 src/theme/colors.ts

## 不包含
- 不修改原生启动屏颜色（单独需求）
```

**Generator 阶段**——重启 Claude Code，输入 Spec，输出代码和测试。Generator 只看 Spec，不看 Planner 的思考过程，确保实现严格按 Spec 走，不按 Planner 的暗示走。

**Evaluator 阶段**——再重启，输入 Spec + 实现代码，输出评分报告。Evaluator 用 AC-3 的 `grep` 命令实际跑一遍——发现 `src/components/Header.tsx` 第 42 行有一个硬编码的 `#333`，给 AC-3 标记为 PARTIAL，总分 82。

评分标准：**90+ 合并，80-89 可选改进后合并，60-79 回 Generator 修复，<60 回 Planner 重新规划。** 82 分的 Dark Mode 可以合并，但 Header 的硬编码颜色需要先修。

进阶技巧：**混用模型。** Planner 用 Opus（需要强推理做需求分析），Generator 用 Sonnet（结构化执行，性价比高），Evaluator 用 Opus（严格审查需要深度理解）。不同模型进一步减少认知偏差。

核心思想：**Spec 是开发者和 AI 之间的合同。** 开发者承诺需求就是这些，AI 承诺实现就是这些，评估基于合同条款，不看心情。

### 3.2 Subagent 拆分：复杂任务怎么分工

**问题：** 一个大需求——比如"重构整个导航系统"——涉及十几个文件，Claude 单次搞不定。你让它分步做，但做到一半上下文窗口已经溢出，后面的步骤质量急剧下降。

解法是用 **Subagent 做上下文防火墙。** 每个 subagent 获得一个新鲜的、小型的、高度相关的上下文窗口。只有精简的结果回流给父代理。

一个常见错误是按"前端/后端"角色来分 subagent。实际有效的分法是**按上下文边界分**——一个 subagent 不需要理解另一个 subagent 的内部细节，它们通过文件系统做协作接口。

RN 场景的 subagent 配置示例（`.claude/agents/js-feature.md`）：

```markdown
---
name: js-feature
description: 实现纯 JS/TS 层的功能开发。当任务只涉及 JS 层代码（不涉及原生层修改）时使用。
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---

你是 JS 层功能开发 agent。

## 职责
- 实现页面组件、业务逻辑、状态管理
- 编写对应的单元测试
- 输出实现摘要到 specs/handoff/js-feature.md

## 约束
- 只修改 src/ 目录下的文件
- 不修改 android/ 或 ios/ 目录
- 不修改 package.json（依赖变更需上报）
- 完成后运行 pnpm test && pnpm typecheck
```

这个配置限制了工具范围（不给 Agent 工具权限防止它委派子任务）、指定了模型（Sonnet 足够处理 JS 层开发）、明确了输出接口（handoff 文件）。

模型选择有讲究：**父会话用 Opus 做规划/编排，子代理用 Sonnet/Haiku 做执行。** 这是成本和质量的平衡——不需要在每个子任务上烧 Opus 的 token。Anthropic 内部用 16 个并行 Claude 实例构建 C 编译器，2000 次会话产出 10 万行 Rust 代码，用的就是这个策略：编排用 Opus，执行用更快的模型。

mihomo-rust 项目（3 万行 Go 移植到 Rust）的四角色 Agent Team 进一步验证了这个模式——PM 用 Sonnet 管路线图，Architect 用 Opus 做架构决策，Engineer 用 Sonnet 写代码，QA 用 Haiku 跑测试。文件系统是协作界面：vision.md → gap-analysis.md → roadmap.md → specs/*.md，每个角色只读前序文档、输出自己的文档。

Geoffrey Huntley 的做法更激进——所谓的 **Ralph 循环**：

```bash
while :; do cat PROMPT.md | claude-code; done
```

Agent 直接推送到主分支，CI 作为唯一的安全网。部署 30 秒内完成，失败就自动修复。他的观点是："你捕获的反压越多，你就能授予越多的自主权。"

### 3.3 Context 管理：大项目的上下文策略

**问题：** 5 万行代码库，Claude 的上下文窗口装不下。你不可能把整个项目塞进去——而且即使能塞进去，上一章提到的 40% 阈值也会让性能跳水。

解法是**三层渐进式上下文架构**：

**第一层：CLAUDE.md 做索引（热内存）。** 根 CLAUDE.md 只放最关键的禁止清单和路由指针，控制在 30 行以内。子目录 CLAUDE.md 按需加载。这是 Claude 每次会话都会看到的"地图"。

**第二层：LSP 做符号导航。** 配置好 TypeScript Language Server，Claude 就有了 "Go to Definition" 和 "Find All References" 的能力。不需要把整个文件读进上下文，通过 LSP 精确定位到符号级别。Anthropic 官方把 LSP 集成列为大型代码库中"最高价值的投资之一"。

**第三层：Subagent 做隔离。** 每个任务只加载相关的上下文。任务之间的状态通过文件系统传递，不通过上下文窗口传递。

具体操作建议：

**`/compact` 的时机。** Anthropic 官方的说法是"上下文窗口是唯一需要管理的最重要资源"。当上下文利用率超过 40% 时，主动用 `/compact` 压缩。Dex Horthy 在 BAML（30 万行 Rust）上的做法更精细——通过频繁的有意压缩，把上下文始终保持在 40-60% 的"智能区域"内。

**`/clear` 的策略。** 两次失败纠正后必须 `/clear`。不是因为你前面的对话没用，而是因为上下文已经被失败的方法"污染"了——Claude 会倾向于在已经失败的思路上继续打转。清空后，把前两轮学到的经验写成一句更好的初始提示，胜过带着 40 轮失败历史继续纠缠。

**HANDOFF.md。** 上下文刷新前让 Claude 写一份交接文档——当前进度、什么方法有效、什么方法无效、下一步该做什么。控制在 60 行以内。新会话从 HANDOFF.md 恢复，比从零开始快得多。

**`#` 快速记忆。** 输入以 `#` 开头的内容，可以选择存储到 CLAUDE.md 或 MEMORY.md。适合记录 Claude 在调试过程中发现的关键洞察——比如"React Native 0.76 的 `useColorScheme` 在 Android 上有延迟，需要手动 listener"。这些发现不进 CLAUDE.md（不是规则），进 MEMORY.md（跨会话的知识）。

Anthropic 内部实现了 5 层上下文压缩管线（Budget Reduction → Snip → Microcompact → Context Collapse → Auto-compact），但作为用户你不需要关心这些细节。你需要关心的是：**在 40% 阈值前主动压缩，在失败后果断清空，在清空前留好交接文档。**

---

工作流建立好了，Claude 能稳定地按 Spec 输出，能通过 subagent 处理复杂任务，能管理好上下文窗口。但还有一个关键环节缺失——验证自动化。下一章解决的问题是：**怎么让 Claude 写完代码后自动跑测试、自动修复、形成闭环？**

## 四、开发侧自动化——从写完代码到自测通过

这是全文的核心实操章节。前面三章建立了"理解规则"和"稳定工作流"的基础，这一章把它们串成一条自动化链路：**Claude 写完代码 → 自动验证 → 失败自动修复 → 直到通过。** 目标是让"开发→自测"这个循环不依赖你的手动介入。

Harness 的四层架构里，这是 **Feedback 层**。生成是概率的，验证必须确定。

### 4.1 自动化验证链

验证不是一道关，是一条链。RN 项目的典型验证层级：

| 层级 | 工具 | 时机 | 阈值 |
|------|------|------|------|
| 代码风格 | ESLint + Prettier | 每次文件保存 | 0 error |
| 类型安全 | TypeScript strict | 每次文件保存 | 0 error |
| 单元测试 | Jest | Claude 完成任务时 | 100% pass |
| 构建 | Gradle / Metro | Claude 完成任务时 | 构建成功 |
| E2E（可选） | Detox | PR 级别 | 核心路径 pass |

关键是**什么时候触发哪一层**。不是每次改动都跑全部验证——那样太慢。分层触发：

- **PostToolUse hook**（每次文件修改后）：只跑 ESLint + TypeScript，快速反馈
- **Stop hook**（Claude 完成任务后）：跑完整验证链（ESLint + TS + Jest + 构建）

`.claude/settings.json` 中的完整 hooks 配置：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": ".claude/hooks/quick-check.sh",
        "timeout": 30000
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "command": ".claude/hooks/full-validate.sh",
        "timeout": 120000
      }
    ]
  }
}
```

`quick-check.sh`（PostToolUse，每次文件修改后触发）：

```bash
#!/bin/bash
cd "$CLAUDE_PROJECT_DIR"

# 只检查被修改的文件，快速反馈
CHANGED=$(git diff --name-only --cached 2>/dev/null || git diff --name-only)
TS_FILES=$(echo "$CHANGED" | grep '\.ts\|\.tsx$' | head -5)

if [ -n "$TS_FILES" ]; then
  pnpm exec tsc --noEmit 2>&1 | tail -10
  if [ $? -ne 0 ]; then
    echo "TypeScript 类型检查失败，请修复。" >&2
    exit 2
  fi
fi
exit 0
```

`full-validate.sh`（Stop hook，Claude 完成任务后触发）：

```bash
#!/bin/bash
cd "$CLAUDE_PROJECT_DIR"

# 并行跑 lint 和类型检查，串行跑测试（需要完整环境）
OUTPUT=$(pnpm run lint 2>&1 && pnpm run typecheck 2>&1)

if [ $? -ne 0 ]; then
  echo "验证失败：" >&2
  echo "$OUTPUT" | tail -20 >&2
  exit 2
fi

# lint 和 typecheck 通过后跑测试
TEST_OUTPUT=$(pnpm test 2>&1)
if [ $? -ne 0 ]; then
  echo "测试失败：" >&2
  echo "$TEST_OUTPUT" | tail -15 >&2
  exit 2
fi

# 成功时沉默
exit 0
```

Stripe 的 Minions 团队把这个原则叫 **"Shift feedback left"**——把验证尽可能前移，不要等到 CI 才发现问题。他们的做法是 pre-push hooks + background lint daemons，在开发者（或 agent）推送之前就拦截问题。你的 Stop hook 做的是同一件事——在 Claude 说"我做完了"之前，先验证它真的做完了。

### 4.2 自主度分级

不是所有任务都该给 Claude 同等自由度。在 RN 项目里，JS 层的改动成本低、回滚容易，原生层的改动成本高、影响范围大。给不同层级不同的自主度，是 Harness 的约束型设计。

| 自主度 | 场景 | Claude 行为 | 配置方式 |
|--------|------|------------|---------|
| **高自主** | 纯 JS 层：新组件、样式调整、业务逻辑 | 自由编辑，仅事后验证 | CLAUDE.md 规则 + PostToolUse hook |
| **中自主** | 原生桥接、依赖变更 | 可编辑但需确认 | CLAUDE.md 规则 + PreToolUse hook 限制 |
| **低自主** | 跨平台架构改动、数据库迁移、权限变更 | 只输出方案，人工确认后执行 | hooks 阻止直接修改 + CLAUDE.md 禁止清单 |

自主度在 CLAUDE.md 中声明（告诉 Claude 规则），在 hooks 中强制执行（确保 Claude 遵守）。CLAUDE.md 里写的 "DO NOT modify android/app/src/main/ without explicit approval" 是咨询性的——Claude 大概率会遵守但不保证。PreToolUse hook 检查文件路径是确定性的——100% 会阻止。

PreToolUse hook 阻止原生层直接修改的配置：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "command": ".claude/hooks/guard-native.sh"
      }
    ]
  }
}
```

`guard-native.sh`：

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# 低自主度：完全阻止
if echo "$FILE_PATH" | grep -qE "(android/app/src/main|ios/.*\.pbxproj)"; then
  cat <<'EOF' >&2
{"decision": "ask", "reason": "原生层修改需要人工确认。请描述需要修改什么，由开发者手动操作。"}
EOF
  exit 0
fi

# 中自主度：允许但记录
if echo "$FILE_PATH" | grep -qE "(package\.json|android/build\.gradle)"; then
  echo "注意：正在修改依赖文件，请确保同步更新所有相关配置。" >&2
fi
exit 0
```

这个 hook 的设计体现了 OpenAI 百万行案例的核心经验：**通过不变的约束来强制执行，而不是微管理实现。** 他们用自定义 linter 锁死依赖层方向（Types → Config → Repo → Service → Runtime → UI），linter 错误信息不是简单的 "violation detected"，而是包含具体的修复指南——错误信息本身就成了 agent 的上下文。Augment Code 的 Harness 架构进一步建议：**所有规则设为 error 而非 warn**，并禁止 `// eslint-disable-next-line`——防止 agent 绕过检查而不是修复问题。

### 4.3 反馈闭环

验证链和自主度分级是静态防线。反馈闭环是动态的——让 Claude 写完代码后，**自动验证、自动发现问题、自动修复**，直到通过。

完整工作流：

```
Claude 写完代码
    ↓
Stop hook 触发验证链
    ↓
验证失败 → 错误输出（stderr，退出码 2）→ Claude 被迫重新参与
    ↓
Claude 读取错误信息，修复代码
    ↓
再次触发 Stop hook → 再次验证
    ↓
通过 → Claude 正常结束（沉默，退出码 0）
```

这个闭环能运转的关键在于 **Stop hook 的 JSON 输出**。普通的退出码 2 只是告诉 Claude "出错了"，JSON 输出可以阻止 Claude 停止并告诉它为什么：

```json
{
  "decision": "block",
  "reason": "ESLint 发现 3 个错误：\n1. src/Header.tsx:42 - 硬编码颜色值，请使用 theme.colors.text\n2. src/utils/format.ts:15 - 缺少 return type 注解\n3. src/api/client.ts:88 - 禁止使用 any 类型\n\n请修复后重试。"
}
```

注意这些错误信息不是简单的 "violation detected"——每条都告诉 Claude **具体哪里错了、怎么修**。这是 OpenAI 百万行案例中"linter 错误信息包含修复指南"的实践。错误信息本身成了 Claude 的上下文，它不需要猜该怎么修。

**禁止 `// eslint-disable-next-line`** 是一个容易被忽略但至关重要的配置。没有这条禁令，Claude 遇到 lint 错误时会直接加 `// eslint-disable-next-line` 来绕过——问题"消失"了，但根因没解决。在 CLAUDE.md 的禁止清单里加上这一条，同时配置 ESLint 的 `noInlineConfig: true` 规则，双保险。

Mitchell Hashimoto 的 Harness Engineering 定义在这里得到了最直接的体现："每次发现 agent 犯错，都要设计一个方案让它不再犯同样的错。" 每次 Claude 用 `eslint-disable` 绕过检查，你就加一条规则；每次 Claude 忘了跑测试，你就加一个 Stop hook。Harness 不是一次设计好的，是**在犯错中迭代出来的**。

Stripe Minions 的迭代策略更系统化——给 agent **一次 CI 修复机会**，如果修复后 CI 还不过，直接升级给人类。不是无限循环让 agent 自己修——那样容易陷入 "doom loop"。一次机会的边界强迫 agent 集中精力，也给人类一个清晰的信号：agent 修不好的问题，可能是 spec 本身有歧义。

### 4.4 CI 集成（思路 + 关键配置）

CI 集成不展开全链路——那是一篇独立文章的体量。这里讲清思路和关键配置。

**核心模式：Docker + Claude Code 非交互模式。**

```bash
# CI 中运行 Claude Code 的典型命令
claude -p "review this PR and check for issues" \
  --allowedTools "Read,Grep,Glob" \
  --max-turns 10 \
  --output-format json
```

`claude -p` 是单次查询模式，处理完就退出。`--allowedTools` 限制权限——CI 环境里只给只读工具，不给 Edit/Write。`--max-turns` 防止 agent 无限循环。`--output-format json` 方便解析结果。

**关键门禁：**

- **类型检查必须过**——`pnpm typecheck` 返回非零则阻止合并
- **测试必须过**——`pnpm test` 必须全部通过
- **Lint 必须过**——`pnpm lint` 零 error（warn 可以有）
- **构建必须成功**——`cd android && ./gradlew assembleRelease` 成功

**安全红线：**

- CI 环境不碰生产数据，不连接生产数据库
- 限制网络出口——agent 只能访问内部 registry 和必要的 API
- 使用标准化的 Docker 镜像，不要用开发者的本地环境

Stripe Minions 的做法值得参考——他们用标准化的 devbox（AWS EC2 实例），从预热池启动不到 10 秒。Devbox 运行在 QA 环境，无生产数据访问，无任意网络出口。他们的观点是："对人类好的，对 agent 也好。" 人类开发者不该直接碰生产环境，agent 也不该。

GitHub Actions / GitLab CI 的配置模式类似：Docker 镜像里装好 Claude Code 和项目依赖 → 用 `claude -p` 运行检查任务 → 解析 JSON 输出 → 决定是否阻止合并。具体配置可以参考 wiki 中的 Docker + GitLab CI 指南。

---

自动化链路搭好了。Claude 写完代码会自动验证，验证失败会自动修复，原生层有权限保护，CI 有门禁把关。最后一章回答一个更根本的问题：**如果我今天从零开始，怎么一步步搭出这套体系？**

## 五、落地路径——渐进式搭建指南

不要试图一次搭好全套 Harness。正确的节奏是**边用边建，遇到问题再加**。以下四个阶段，每个阶段都有明确的检查清单——什么时候该进下一阶段。

### 阶段 0：第 1 天——写 CLAUDE.md，只写最关键的 20 行

打开你现有的项目，回答三个问题：

1. **Claude 最常犯的 3 个错是什么？** → 写成禁止清单
2. **你每次新会话都要教 Claude 的 2 个命令是什么？** → 写进去
3. **你项目里最容易踩坑的 1 个架构决策是什么？** → 写进去

就这些。不写代码库概览，不写目录结构，不写"写干净的代码"这种废话。Claude 能从代码推断的东西不需要写。

示例结构：

```markdown
## 禁止清单
- DO NOT introduce new state management libraries
- DO NOT use `any` type
- DO NOT modify native layer without approval

## 关键命令
- `pnpm test` — 跑测试
- `pnpm typecheck` — 类型检查

## 架构决策
- JS ↔ Native 通信走 TurboModule，见 src/native/README.md
```

**检查清单：**
- CLAUDE.md < 30 行？
- 每条规则 5 秒内可判定？
- 没有从代码能推断的内容？
- 通过了"移除它会导致 Claude 犯错吗"测试？

完成这个阶段只需要 10 分钟。做完之后继续正常用 Claude——你会发现它犯那 3 个错的频率明显下降。

### 阶段 1：第 1 周——配置验证链 + hooks

等你在阶段 0 的基础上用了一周 Claude，你会开始发现新的问题：Claude 写完代码没跑测试、类型不匹配直接交差、lint 报错了当没看见。这些问题用 CLAUDE.md 解决不了——需要 hooks。

具体操作：

1. **确认你的 ESLint + TypeScript strict 已经配好。** 如果没有，这是前提条件。
2. **写一个 Stop hook**：Claude 完成任务后自动跑 `pnpm lint && pnpm typecheck`。参考第四章 4.1 的 `full-validate.sh`。
3. **测试这个 hook**：故意让 Claude 写一段有类型错误的代码，看它完成后 hook 是否触发、错误是否喂回、Claude 是否自行修复。

**检查清单：**
- Stop hook 在 Claude 完成后触发了？
- 验证失败时错误信息喂回 Claude 了？
- Claude 能根据错误信息自行修复？
- 验证通过时 Claude 正常结束（无多余输出）？

阶段 1 完成后，你已经有了一个最小可用的 Harness：CLAUDE.md 定义规则，hooks 强制执行验证。这已经能覆盖 70% 的质量问题。

### 阶段 2：第 2-3 周——封装 skills + 建立 SDD 工作流

用了两周 Claude + hooks，你会发现两类新问题：一是某些操作每次都要教一遍（比如"新建模块"），二是复杂需求的输出质量波动大。

针对重复操作——封装成 skills。先封装你最常用的 2-3 个：新建模块、跑测试、生成路由。每个 skill 只解决一件事，触发词写在 description 里。参考第二章 2.4 的 SKILL.md 示例。

针对质量波动——开始实践 SDD 三角色分离。不用每个需求都走三角色，先从**你写过的最复杂的那 3 个需求**开始试。对比一下：单角色直出 vs 三角色分离，质量差距有多大。参考第三章 3.1 的完整流程。

开始用 subagent 做上下文隔离——当你发现一个任务 Claude 做到一半开始"迷路"，那就是该拆 subagent 的信号。不要提前拆，在需要时才拆。

**检查清单：**
- Skill 被 Claude 自动触发了（不需要你手动提醒）？
- 三角色分离比单角色质量有明显提升？
- Subagent 的 handoff 文件能被父会话正确消费？

### 阶段 3：第 1 月+——subagent 拆分 + CI 集成 + 持续优化

到这个阶段，你的 Harness 已经覆盖了 Memory（CLAUDE.md + rules）、Execution（SDD + subagent）、Feedback（hooks + 验证链）三层。剩下的是 Orchestration 和持续迭代。

**按上下文边界拆 subagent。** 不按"前端/后端"分，按"这个 subagent 不需要理解那个 subagent 的内部细节"来分。参考第三章 3.2 的配置示例。

**CI 集成。** 用 `claude -p` + Docker + `--allowedTools` 做自动化检查。不用一步到位——先加一个 PR review agent，再做自动化测试。参考第四章 4.4。

**持续优化。** 每周花 10 分钟回顾 Claude 这周犯的错：哪些是 CLAUDE.md 没覆盖到的？哪些是 hooks 没拦住的？把新的错误转化为新规则或新 hooks。Mitchell Hashimoto 说的："AGENTS.md 的每一行都基于一个 bad agent behavior。" 你的 CLAUDE.md 和 hooks 也应该是这样——**没有犯错就没有规则，每次犯错都加一条规则。**

---

## 补充视角：Mitchell Hashimoto 的六步采纳框架

前面四个阶段是从 Harness 的架构出发，自下而上搭建。Mitchell Hashimoto 在 Ghostty 终端项目上用的是另一个角度——**从个人采纳出发，自外而内演进**。六个步骤，对开发者个体的参考价值很高：

**1. Drop the Chatbot。** 从聊天界面切换到 agent。Claude Code 就是 agent——它能读文件、执行命令、发 HTTP 请求。聊天模式（比如在 claude.ai 对话框里问代码问题）本质上还是你手动搬运上下文，agent 模式让 Claude 自己去找。

**2. Reproduce Your Own Work。** 强迫自己用 agent 复现你手动做的 commit。Hashimoto 说"这很痛苦……但专业技能由此形成"。你会发现很多你以为"很简单"的操作，agent 根本不知道怎么做——这些就是你该写进 CLAUDE.md 的东西。

**3. End-of-Day Agents。** 每天下班前 30 分钟，启动 Claude 做深度任务：代码库调研、性能分析、issue triage。你不需要等结果——第二天早上来看。这是让 agent 利用你的"空闲时间"。

**4. Outsource the Slam Dunks。** 把你 100% 确信 agent 能做好的事交给它，然后去做别的事。Hashimoto 的建议是："关掉 agent 的桌面通知。上下文切换非常昂贵。" 让 agent 在后台跑，你集中精力做只有你能做的事。

**5. Engineer the Harness。** 这一步和我们的四阶段路径重合——每次犯错都加一条规则，每次绕过检查都加一个 hook。但 Hashimoto 的做法更具体：他会专门写脚本来验证 agent 的输出（比如截图脚本对比 UI 变化），而不只是跑 lint 和测试。

**6. Always Have an Agent Running。** 目标是 10-20% 的工作时间有 agent 在跑。不需要每时每刻都有，但当你发现"我在等 agent 完成"的频率变高，说明你已经开始利用 agent 的并行能力了。

---

回到文章开篇的那句话：**模型决定上限，Harness 决定下限。**

读到这里，你应该能看到一个清晰的图景：CLAUDE.md 定义规则，rules/ 拆分关注点，hooks 强制执行，skills 封装能力，subagent 隔离上下文，SDD 保证质量，验证链形成闭环。这些不是独立的功能，是一套互相配合的 Harness 体系。

但最重要的不是这些配置本身，而是一个思维方式：**不是配好 Claude Code 才开始干活，而是边干边建 Harness。** 第 1 天写 20 行 CLAUDE.md，第 1 周加一个 Stop hook，第 2 周封装第一个 skill——你的 Harness 会随着项目一起长大。

读完这篇文章，你应该能拿到一个万行级项目，从 Day 1 开始搭建工程化的 Claude Code 工作流。不是纸上谈兵，是你可以今天就动手做的事。
