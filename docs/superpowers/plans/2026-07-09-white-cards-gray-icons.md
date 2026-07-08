# White Cards + Gray Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all semi-transparent/rgba white card backgrounds with solid `#FFFFFF` and change all non-gray icon colors to gray (`COLORS.textSecondary = '#8E8E93'`) across the entire app.

**Architecture:** Pure style changes — no logic, no new components. Each task targets a group of screens independently so agents can run in parallel. All changes use existing `COLORS` theme values; no new constants needed.

**Tech Stack:** React Native StyleSheet, `@expo/vector-icons` (MaterialCommunityIcons), `COLORS` from `../../theme/theme`

---

## What changes everywhere

| Before | After |
|---|---|
| `rgba(255, 255, 255, 0.85)` on cards/rows | `'#FFFFFF'` |
| `rgba(255, 255, 255, 0.75)` on cards/rows | `'#FFFFFF'` |
| `rgba(255, 255, 255, 0.6)` on cards/rows | `'#FFFFFF'` |
| `rgba(255, 255, 255, 0.5)` on avatarRing | `'#FFFFFF'` |
| `COLORS.primary` on non-destructive menu/form icons | `COLORS.textSecondary` |
| Hardcoded blue (`#007AFF`) on non-destructive icons | `COLORS.textSecondary` |

**Do NOT change:**
- Modal overlays (`rgba(0,0,0,0.4)`) — intentional dimming
- Tab pill active state colors — intentional accent
- Toggle button colors (lost=red, found=green) — intentional
- Send button, avatar backgrounds, chip colors — intentional
- `COLORS.error` on destructive/logout icons — intentional
- Image badge overlays (red/green tint on item type) — intentional

---

## Task 1 — Profile screens (ProfileScreen + EditProfileScreen)

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`
- Modify: `src/screens/profile/EditProfileScreen.tsx`

### ProfileScreen.tsx changes

- [ ] **Step 1: Fix headerCard background**

In `StyleSheet.create`, find `headerCard` and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 2: Fix avatarRing background**

Find `avatarRing` and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.5)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 3: Fix menuCard background**

Find `menuCard` and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 4: Fix menu icon colors**

In the JSX, find the `MaterialCommunityIcons` inside `menuRow`:
```diff
-  color={item.destructive ? COLORS.error : COLORS.primary}
+  color={item.destructive ? COLORS.error : COLORS.textSecondary}
```

### EditProfileScreen.tsx changes

- [ ] **Step 5: Fix avatarRing background**

Find `avatarRing` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.5)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 6: Fix formCard background**

Find `formCard` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 7: Fix any icon colors in EditProfileScreen**

Find any `MaterialCommunityIcons` or icon components with `color={COLORS.primary}` on non-accent icons and change to `color={COLORS.textSecondary}`.

---

## Task 2 — Feed screens (FeedScreen + ItemDetailScreen)

**Files:**
- Modify: `src/screens/feed/FeedScreen.tsx`
- Modify: `src/screens/feed/ItemDetailScreen.tsx`

### FeedScreen.tsx changes

- [ ] **Step 1: Fix card background**

Find `card` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 2: Fix header background**

Find `header` style — change the semi-transparent background to solid:
```diff
-    backgroundColor: 'rgba(242,242,247,0.7)',
+    backgroundColor: '#F2F2F7',
```

### ItemDetailScreen.tsx changes

- [ ] **Step 3: Fix card background**

Find `card` style (the detail info card, around line 359) and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.92)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 4: Fix header background**

Find `headerStyle` and change:
```diff
-    backgroundColor: 'rgba(242,242,247,0.85)',
+    backgroundColor: '#F2F2F7',
```

- [ ] **Step 5: Fix backBtn background**

Find `backBtnBlur` style and change:
```diff
-    backgroundColor: 'rgba(255,255,255,0.5)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 6: Fix icon colors in ItemDetailScreen**

Find any `MaterialCommunityIcons` with `color={COLORS.primary}` used for info/display icons (not action buttons) and change to `color={COLORS.textSecondary}`.

---

## Task 3 — Post & My Posts (PostItemScreen + MyPostsScreen)

**Files:**
- Modify: `src/screens/post/PostItemScreen.tsx`
- Modify: `src/screens/profile/MyPostsScreen.tsx`

### PostItemScreen.tsx changes

- [ ] **Step 1: Fix card background**

Find `card` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 2: Fix icon colors**

Find any `MaterialCommunityIcons` with `color={COLORS.primary}` on non-accent UI icons (section icons, chevrons, etc.) and change to `color={COLORS.textSecondary}`.

### MyPostsScreen.tsx changes

- [ ] **Step 3: Fix card background**

Find `card` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 4: Fix filterRow background**

Find `filterRow` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.6)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 5: Fix icon colors**

Find any `MaterialCommunityIcons` with `color={COLORS.primary}` on non-accent icons and change to `color={COLORS.textSecondary}`.

---

## Task 4 — Messaging screens (ConversationsScreen + ChatScreen)

**Files:**
- Modify: `src/screens/messages/ConversationsScreen.tsx`
- Modify: `src/screens/messages/ChatScreen.tsx`

### ConversationsScreen.tsx changes

- [ ] **Step 1: Fix conversation row background**

Find `row` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.75)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 2: Fix icon colors**

Find any `MaterialCommunityIcons` with `color={COLORS.primary}` on non-accent icons and change to `color={COLORS.textSecondary}`.

### ChatScreen.tsx changes

- [ ] **Step 3: Fix received message bubble background**

Find `bubbleThem` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 4: Fix inputBar background**

Find `inputBar` style and change:
```diff
-    backgroundColor: 'rgba(255,255,255,0.5)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 5: Fix header background**

Find `header` style and change:
```diff
-    backgroundColor: 'rgba(242,242,247,0.85)',
+    backgroundColor: '#F2F2F7',
```

- [ ] **Step 6: Fix icon colors**

Find any `MaterialCommunityIcons` with `color={COLORS.primary}` on non-accent icons (back button, etc.) and change to `color={COLORS.textSecondary}`.

---

## Task 5 — Notifications screen

**Files:**
- Modify: `src/screens/profile/NotificationsScreen.tsx`

- [ ] **Step 1: Fix list background**

Find `list` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 2: Fix row background**

Find `row` style and change:
```diff
-    backgroundColor: 'rgba(255, 255, 255, 0.85)',
+    backgroundColor: '#FFFFFF',
```

- [ ] **Step 3: Fix iconCircle background**

Find `iconCircle` style — it currently uses a conditional `'#E8F1FF'` or `'#E8F8EE'`. Change to a neutral light gray:
```diff
-    backgroundColor: item.type === 'match' ? '#E8F1FF' : '#E8F8EE'
+    backgroundColor: '#F2F2F7'
```
And the icon color inside it to `COLORS.textSecondary`.
