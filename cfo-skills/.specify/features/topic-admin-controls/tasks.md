# Tasks: 话题运营干预能力（置顶 + 编辑）

**Feature Branch**: `feature/topic-admin-controls`

**Created**: 2026-05-14

**Spec**: `.specify/features/topic-admin-controls/spec.md`
**Plan**: `.specify/features/topic-admin-controls/plan.md`

---

## Task List

### Phase 1: 类型和安全基础（无依赖，并行）

- [ ] **T-001**: 在 `src/types/index.ts` 新增 `AdminTopicFields` 类型（isPinned, pinnedAt, editedTitle, editedDescription, sourceTag）
- [ ] **T-002**: 在 `firestore.rules` 新增规则：仅 `VITE_OPERATOR_UIDS` 中的 UID 可写入 `topics/{topicId}` 的 admin 字段（isPinned, pinnedAt, editedTitle, editedDescription, sourceTag），禁止写入 votes、eloScore 等字段
- [ ] **T-003**: 更新 `.env.example`，新增 `VITE_OPERATOR_UIDS` 说明（逗号分隔的 Firebase Auth UID 列表）

---

### Phase 2: 核心服务层（依赖 T-001）

- [ ] **T-004**: 新建 `src/services/adminTopicService.ts`，实现 `pinTopic(topicId, pin)`、`editTopic(topicId, title, description)`、`setSourceTag(topicId, tag)` 三个函数，全部使用 `setDoc(..., { merge: true })`
- [ ] **T-005**: 新建 `src/hooks/useTopicAdmin.ts`，基于 `VITE_OPERATOR_UIDS` 和 `auth.currentUser.uid` 判断 `isOperator`，提供 `isOperator: boolean` 和 `isLoading: boolean`

---

### Phase 3: UI 组件（依赖 T-004, T-005）

- [ ] **T-006**: 新建 `src/components/Badge.tsx`，导出 `<PinnedBadge>` 和 `<OfficialBadge>` 两个组件（Tiny badge，绿色"置顶"、蓝色"官方"）
- [ ] **T-007**: 新建 `src/components/TopicAdminMenu.tsx`，实现"⋮"菜单浮层，内部三个选项：置顶/取消置顶、编辑、标记官方/来源（根据当前状态动态文案），非运营用户不渲染
- [ ] **T-008**: 修改 `src/components/TopicCard.tsx`，接入 `useTopicAdmin`，显示 PinnedBadge（当 `topic.isPinned`）和 OfficialBadge（当 `topic.sourceTag === 'official'`），在运营用户下渲染 TopicAdminMenu
- [ ] **T-009**: 新建 `src/components/TopicEditModal.tsx`，实现编辑浮层（标题输入 maxLength=50，描述 maxLength=200，实时字数统计，保存/取消按钮 + loading 状态）

---

### Phase 4: 页面集成（依赖 T-005, T-006, T-008）

- [ ] **T-010**: 修改 `src/pages/TopicSwipe.tsx` 的 Firestore query，在 `where('publishStatus', '==', 'PUBLISHED')` 之后加上复合排序：`orderBy('isPinned', 'desc'), orderBy('pinnedAt', 'desc'), orderBy('eloScore', 'desc')`

---

### Phase 5: 联调与验证（依赖 T-010）

- [ ] **T-011**: 在 Firestore 中手动注入一条测试话题数据（publishStatus=PUBLISHED），验证置顶功能：置顶后刷新，话题排第 1 位，徽章显示
- [ ] **T-012**: 验证 Firestore Rules：非白名单用户尝试写入被拒绝（Firebase Console → Security Rules Simulator 测试）
- [ ] **T-013**: 全量功能回归：现有话题列表、投票、ELO 评分、灵魂伴侣匹配等核心功能不受影响

---

## Task Dependency Graph

```
Phase 1 (T-001, T-002, T-003) ──┐
                                 ├──► Phase 2 (T-004, T-005) ──┬──► Phase 3 (T-006, T-007, T-008, T-009) ──┬──► Phase 4 (T-010) ──┬──► Phase 5 (T-011, T-012, T-013)
                                 │                               │                                           │
                                 └───────────────────────────────┘                                           │
                                                                                                             │
                                     (T-009 独立，无额外依赖)                                                  │
```

## P1 优先级（必须全部完成才合入）

- T-002 Firestore Rules 安全（最重要）
- T-004 adminTopicService 正确实现
- T-005 useTopicAdmin 正确判断权限
- T-010 列表排序正确
- T-011 功能联调通过

## P2 优先级（可后合入）

- T-009 TopicEditModal 编辑体验优化
- T-013 完整回归测试
