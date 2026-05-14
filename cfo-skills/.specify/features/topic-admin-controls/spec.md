# Feature Specification: 话题运营干预能力（置顶 + 编辑）

**Feature Branch**: `feature/topic-admin-controls`

**Created**: 2026-05-14

**Status**: Draft

**Input**: User description: "运营同学需要能够手动置顶重要话题、编辑话题标题/描述、以及标记话题来源（官方/爬虫），不需要修改 ELO 分数和 votes 数据。"

---

## User Scenarios & Testing

### User Story 1 - 话题置顶 (Priority: P1)

作为运营，我打开话题列表，长按或点击某个话题的"⋮"菜单，选择"置顶"，该话题立即出现在话题列表最顶部，并附带一个"置顶"徽章。全平台用户都能看到这个置顶状态。

**Why this priority**: 平台内容完全依赖爬虫，运营无法干预重大事件的话题呈现，置顶是运营可控性的最小功能集。

**Independent Test**: 置顶功能完全独立于 votes 和 AI 服务，运营开启置顶后，刷新页面或在其他设备上均能看到置顶效果。

**Acceptance Scenarios**:

1. **Given** 话题列表有 N 个话题（其中话题 T 评分排名第 5），**When** 运营将话题 T 置顶，**Then** 话题 T 显示在列表第 1 位，且顶部有"置顶"徽章，持续有效直到取消置顶
2. **Given** 话题 T 已被置顶，**When** 运营取消置顶，**Then** 话题 T 按 ELO 自然排名回到原来位置，徽章消失
3. **Given** 有多个话题被置顶，**Then** 按置顶时间倒序排列（最新置顶的在最上）

---

### User Story 2 - 话题内容编辑 (Priority: P2)

作为运营，我点击某个话题，进入编辑面板，可以修改话题的标题（最多 50 字）和描述（最多 200 字）。保存后立即生效，全平台可见。

**Why this priority**: 爬虫抓取的标题有时语义不清或标题党，运营有权修正以符合内容实质。

**Independent Test**: 编辑功能完全独立于 votes 和 AI 服务。编辑保存后，刷新页面标题和描述已更新。

**Acceptance Scenarios**:

1. **Given** 话题 T 原标题为"某股票大涨"，**When** 运营将其修改为"某股票涨停（AI 算力板块）"并保存，**Then** 全平台所有用户看到的标题均为新标题
2. **Given** 话题 T 的描述为空，**When** 运营添加描述"该股票为今日科创板涨幅冠军"并保存，**Then** 描述字段更新，旧数据不保留
3. **Given** 运营输入标题超过 50 字，**Then** 输入框限制输入，保存按钮置灰，无法提交

---

### User Story 3 - 话题来源标记 (Priority: P3)

作为运营，我可以为话题打上"官方"标签（仅"官方"和"来源"两个互斥选项）。带"官方"标签的话题显示特殊图标。

**Why this priority**: 区分平台官方发布的内容和爬虫抓取内容，增加内容可信度。

**Independent Test**: 标记后刷新页面，特殊图标在全平台可见。

**Acceptance Scenarios**:

1. **Given** 话题 T 当前来源为"爬虫"，**When** 运营将其改为"官方"，**Then** 话题 T 显示官方徽章
2. **Given** 话题 T 是"官方"，**When** 运营改为"爬虫"，**Then** 官方徽章消失

---

### User Story 4 - 运营访问控制 (Priority: P1)

只有特定用户（运营白名单）能看到并使用上述管理功能。普通用户体验完全不变。

**Why this priority**: 防止普通用户滥用管理能力。

**Independent Test**: 非白名单用户登录后，看不到任何置顶/编辑/标记入口，无法通过 URL 直接访问管理功能。

**Acceptance Scenarios**:

1. **Given** 用户 A 在运营白名单中，**When** 打开话题页面，**Then** 每个话题旁显示"⋮"菜单入口
2. **Given** 用户 B 不在白名单中，**When** 打开话题页面，**Then** 无菜单入口，直接进入话题详情页

---

## Requirements

### Functional Requirements

- **FR-001**: 运营可以置顶任意话题，被置顶的话题在列表中排在所有非置顶话题之前
- **FR-002**: 置顶状态持久化到 Firestore，重新打开页面或跨设备均保持
- **FR-003**: 运营可以编辑话题标题（上限 50 字）和描述（上限 200 字），保存后全平台生效
- **FR-004**: 运营可以将话题来源标记为"官方"或"来源"，来源标签持久化
- **FR-005**: 管理功能通过 Firestore Security Rules 控制，仅白名单用户可写入 `topics/{topicId}` 的 `isPinned`、`editedTitle`、`editedDescription`、`sourceTag` 字段
- **FR-006**: votes、eloScore、impressionCount 等字段**不在**运营可编辑范围内，Firestore Rules 必须禁止写入
- **FR-007**: UI 上需明确区分"置顶徽章"、"官方徽章"两种视觉标记

### Key Entities

- **topics/{topicId}**: 新增字段
  - `isPinned: boolean` — 是否置顶
  - `pinnedAt: timestamp | null` — 置顶时间（用于排序）
  - `editedTitle: string | null` — 运营修改后的标题（null = 用原始标题）
  - `editedDescription: string | null` — 运营修改后的描述（null = 用原始描述）
  - `sourceTag: 'official' | 'crawled'` — 来源标签，默认 'crawled'

---

## Success Criteria

- **SC-001**: 运营置顶话题后，3 秒内列表刷新，新置顶话题排在第 1 位
- **SC-002**: 标题/描述编辑保存后，刷新页面内容已更新，无内容丢失
- **SC-003**: 运营白名单用户在 Firestore 中通过自定义 claim 或 `roles/operators` 集合管理，非白名单用户即使直接写 Firestore 也被 Rules 拒绝
- **SC-004**: 运营 UI 零学习成本：长按/点击"⋮" → 出现置顶/编辑/标记选项，3 秒内可以完成一次操作

---

## Assumptions

- Firestore `topics/{topicId}` 文档结构已存在，hotspot-engine 持续写入，运营干预不覆盖爬虫原始数据
- 火山方舟 AI 服务**不依赖** topics 文档的标题/描述字段，编辑后不影响 AI 服务正常运行
- 赞弹秀已有 Firebase Auth，用户体系已建立，运营白名单复用现有用户系统
- 话题列表前端已有现成的 `TopicCard` 组件，可在其上扩展徽章和菜单
