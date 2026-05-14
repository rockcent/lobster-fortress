# Implementation Plan: 话题运营干预能力（置顶 + 编辑）

**Feature Branch**: `feature/topic-admin-controls`

**Created**: 2026-05-14

**Input**: 基于 spec.md — 话题置顶、编辑标题/描述、来源标记、运营访问控制

---

## 技术栈上下文

- **前端**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS 4
- **后端**: Firebase Firestore（直接前端写入，无 Cloud Functions）
- **Auth**: Firebase Auth（已有用户体系）

---

## 文件变更范围

### 新建文件

| 文件路径 | 用途 |
|---|---|
| `src/services/adminTopicService.ts` | 封装 Firestore 运营写入操作（置顶、编辑、标记） |
| `src/hooks/useTopicAdmin.ts` | React Hook：检测当前用户是否为运营白名单，提供 admin actions |
| `src/components/TopicAdminMenu.tsx` | 运营菜单组件（⋮ 浮层：置顶/编辑/标记） |
| `src/components/Badge.tsx` | 统一徽章组件（PinnedBadge / OfficialBadge） |

### 修改文件

| 文件路径 | 变更内容 |
|---|---|
| `firestore.rules` | 新增规则：仅白名单用户可写入 `topics` 的 admin 字段，votes 等字段禁止写入 |
| `src/components/TopicCard.tsx` | 接入 `useTopicAdmin`，显示徽章和菜单 |
| `src/pages/TopicSwipe.tsx` | 修改 Firestore 查询：先按 `isPinned DESC, pinnedAt DESC` 排序，再按 ELO |
| `src/types/index.ts` | 新增 `AdminTopicFields` 类型定义 |
| `.env.example` | 新增 `VITE_OPERATOR_UIDS` 环境变量说明（逗号分隔的 UID 白名单） |

---

## 核心实现细节

### 1. 运营白名单方案

采用环境变量 + 前端检测 + Firestore Rules 双重保险：

```
.env.local
VITE_OPERATOR_UIDS=uid1,uid2,uid3
```

前端 Hook：
```typescript
// useTopicAdmin.ts
const isOperator = OPERATOR_UIDS.split(',').includes(auth.currentUser?.uid ?? '')
```

Firestore Rules 读取同一份 UID 列表（通过 request.auth.uid 匹配）：
```javascript
// firestore.rules
match /topics/{topicId} {
  allow write: if request.auth.uid in [ENFORCED_OPERATOR_UIDS]
               && request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['isPinned', 'pinnedAt', 'editedTitle', 'editedDescription', 'sourceTag'])
}
```

**注意**：前端环境变量只是用于 UI 显示控制，真正的安全屏障是 Firestore Rules。

### 2. Firestore 文档更新策略

不使用 `update()`，因为 topics 文档由 hotspot-engine 持续写入（直接覆盖），改为：

```typescript
// adminTopicService.ts
export async function pinTopic(topicId: string, pin: boolean) {
  const ref = doc(db, 'topics', topicId)
  if (pin) {
    await setDoc(ref, { isPinned: true, pinnedAt: serverTimestamp() }, { merge: true })
  } else {
    await setDoc(ref, { isPinned: false, pinnedAt: null }, { merge: true })
  }
}
```

`setDoc(..., { merge: true })` 保证只更新 admin 字段，不影响 hotspot-engine 写入的其他字段。

### 3. 列表查询排序

```typescript
// TopicSwipe.tsx — Firestore query
const q = query(
  collection(db, 'topics'),
  where('publishStatus', '==', 'PUBLISHED'),
  orderBy('isPinned', 'desc'),
  orderBy('pinnedAt', 'desc'),
  orderBy('eloScore', 'desc'),
  limit(50)
)
```

> Firestore 复合排序：先 `isPinned DESC` 把置顶的拉上来（isPinned=false 排在 isPinned=true 之后），同置顶状态再按 pinnedAt DESC，同时间再按 eloScore DESC。

### 4. 编辑 Modal 组件

```
TopicAdminMenu → 点击"编辑" → TopicEditModal 浮层
```

- 标题输入框（maxLength=50，实时计数）
- 描述文本框（maxLength=200，实时计数）
- 保存按钮：loading 状态，禁止重复提交
- 取消按钮：关闭 modal，不保存

### 5. 标记切换

来源标记是两个互斥按钮："官方" / "来源"，切换时：
```typescript
await setDoc(ref, { sourceTag: isOfficial ? 'official' : 'crawled' }, { merge: true })
```

---

## Edge Cases

| 场景 | 处理方式 |
|---|---|
| 运营在 hotspot-engine 更新 topic 的同一秒保存编辑 | `{ merge: true }` 合并写入，timestamp 以 Firestore server 为准 |
| 用户在话题被编辑后立即刷新 | 直接读取 Firestore，无缓存 |
| 运营白名单为空 | 所有用户都看不到管理菜单，Firestore Rules 拒绝所有写入 |
| 话题被删除时仍处于置顶状态 | 前端查询时自动过滤（文档不存在则不显示），无额外处理 |

---

## 不在此版本范围内

- 话题 ELO 分数修改（Constitution 约束）
- votes 数据修改（Constitution 约束）
- 多语言支持
- PWA / 离线支持
- 历史编辑记录
