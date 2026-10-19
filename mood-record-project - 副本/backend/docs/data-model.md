# 数据模型

## 概述

本项目采用 JSON 文件作为数据存储，包含以下7个数据模型：

| 模型名称 | 说明 | 对应集合 |
|---------|------|---------|
| User | 用户信息 | `users` |
| Mood | 心情记录 | `moods` |
| Diary | 日记 | `diaries` |
| DiaryComment | 日记评论 | `diary_comments` |
| Friend | 好友关系 | `friends` |
| Message | 聊天消息 | `messages` |
| EmotionSuggestion | 情绪建议 | `emotion_suggestions` |

---

## 1. User（用户模型）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 用户唯一标识，自增主键 |
| openid | string | 否 | 微信小程序openid |
| username | string | 是 | 用户名，唯一 |
| password | string | 是 | 加密后的密码（bcrypt） |
| nickname | string | 是 | 用户昵称 |
| avatar | string | 否 | 头像URL |
| birthday | string | 否 | 生日，格式 YYYY-MM-DD |
| mood_display_range | string | 是 | 心情展示范围，取值 `all` / `day` / `week` |
| created_at | string | 是 | 创建时间，ISO格式 |
| updated_at | string | 是 | 更新时间，ISO格式 |

### 示例数据

```json
{
  "id": 1,
  "openid": null,
  "username": "hzy",
  "password": "$2b$10$Kmqvv4Syb6rzWx3CvbzsY.mZ.gdsXkCkoNRBPu2pYEyxcgqYP6Z3a",
  "nickname": "hzy",
  "avatar": null,
  "birthday": null,
  "mood_display_range": "all",
  "created_at": "2026-06-16T14:51:21.680Z",
  "updated_at": "2026-06-16T14:51:21.680Z"
}
```

---

## 2. Mood（心情模型）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 心情记录唯一标识 |
| user_id | number | 是 | 所属用户ID |
| mood_type | number | 是 | 心情类型，取值 1-6 |
| content | string | 否 | 心情描述文字 |
| images | string | 否 | 图片URL数组，JSON字符串格式 |
| visibility | number | 是 | 可见性，1=公开，2=好友，3=私密 |
| record_date | string | 是 | 记录日期，格式 YYYY-MM-DD |
| record_time | string | 是 | 记录时间，格式 HH:MM:SS |
| created_at | string | 是 | 创建时间，ISO格式 |

### 心情类型映射

| 值 | 心情类型 | 说明 |
|----|---------|------|
| 1 | 开心 | 😊 |
| 2 | 平静 | 😌 |
| 3 | 烦躁 | 😫 |
| 4 | 难过 | 😢 |
| 5 | 生气 | 😠 |
| 6 | 焦虑 | 😰 |

### 示例数据

```json
{
  "id": 1,
  "user_id": 2,
  "mood_type": 1,
  "content": "今天很开心",
  "images": null,
  "visibility": 1,
  "record_date": "2026-06-16",
  "record_time": "22:52:17",
  "created_at": "2026-06-16T14:52:17.233Z"
}
```

---

## 3. Diary（日记模型）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 日记唯一标识 |
| user_id | number | 是 | 所属用户ID |
| title | string | 是 | 日记标题 |
| content | string | 是 | 日记内容 |
| mood_tag | number | 否 | 心情标签，取值 1-6 |
| background_images | string | 否 | 背景图片URL数组，JSON字符串格式 |
| visibility | number | 是 | 可见性，1=私密，2=好友，3=公开 |
| comment_count | number | 是 | 评论数量 |
| created_at | string | 是 | 创建时间，ISO格式 |
| updated_at | string | 是 | 更新时间，ISO格式 |

### 示例数据

```json
{
  "id": 1,
  "user_id": 2,
  "title": "美好的一天",
  "content": "今天天气真好，和朋友一起出去玩了~",
  "mood_tag": 1,
  "background_images": "[\"http://tmp/image.png\"]",
  "visibility": 3,
  "comment_count": 2,
  "created_at": "2026-06-16T14:52:58.892Z",
  "updated_at": "2026-06-16T14:52:58.892Z"
}
```

---

## 4. DiaryComment（日记评论模型）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 评论唯一标识 |
| diary_id | number | 是 | 所属日记ID |
| user_id | number | 是 | 评论用户ID |
| content | string | 是 | 评论内容 |
| created_at | string | 是 | 创建时间，ISO格式 |

### 示例数据

```json
{
  "id": 1,
  "diary_id": 1,
  "user_id": 2,
  "content": "真棒！",
  "created_at": "2026-06-16T14:58:11.810Z"
}
```

---

## 5. Friend（好友关系模型）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 好友关系唯一标识 |
| user_id | number | 是 | 用户ID（发起方） |
| friend_id | number | 是 | 好友ID（接收方） |
| status | number | 是 | 状态，0=待确认，1=已确认 |
| created_at | string | 是 | 创建时间，ISO格式 |
| updated_at | string | 是 | 更新时间，ISO格式 |

### 状态说明

| 值 | 状态 | 说明 |
|----|------|------|
| 0 | 待确认 | 好友请求已发送，等待对方确认 |
| 1 | 已确认 | 好友关系已建立 |

### 示例数据

```json
{
  "id": 1,
  "user_id": 1,
  "friend_id": 2,
  "status": 1,
  "created_at": "2026-06-16T15:53:49.863Z",
  "updated_at": "2026-06-16T16:16:49.787Z"
}
```

---

## 6. Message（聊天消息模型）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 消息唯一标识 |
| from_user_id | number | 是 | 发送方用户ID |
| to_user_id | number | 是 | 接收方用户ID |
| content | string | 是 | 消息内容 |
| is_read | number | 是 | 是否已读，0=未读，1=已读 |
| created_at | string | 是 | 创建时间，ISO格式 |

### 示例数据

```json
{
  "id": 1,
  "from_user_id": 2,
  "to_user_id": 1,
  "content": "嗨，最近怎么样？",
  "is_read": 0,
  "created_at": "2026-06-16T16:39:31.864Z"
}
```

---

## 7. EmotionSuggestion（情绪建议模型）

### 字段定义

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 建议唯一标识 |
| mood_type | number | 是 | 心情类型，取值 1-6 |
| suggestion | string | 是 | 建议内容 |

### 示例数据

```json
{
  "id": 1,
  "mood_type": 1,
  "suggestion": "有什么开心事来心语分享一下呀~ 开心的心情会传染，分享快乐可以让快乐加倍！"
}
```

---

## 数据关系图

```
User ──1:N──→ Mood
User ──1:N──→ Diary
Diary ──1:N──→ DiaryComment
User ──M:N──→ Friend (通过friends表关联)
User ──1:N──→ Message (作为发送方)
User ──1:N──→ Message (作为接收方)
Mood ──N:N──→ EmotionSuggestion (通过mood_type关联)
```

---

## 数据存储结构

```json
{
  "users": [],
  "moods": [],
  "diaries": [],
  "diary_comments": [],
  "friends": [],
  "messages": [],
  "emotion_suggestions": [],
  "_nextId": {
    "users": 1,
    "moods": 1,
    "diaries": 1,
    "diary_comments": 1,
    "friends": 1,
    "messages": 1,
    "emotion_suggestions": 1
  }
}
```

**说明**: `_nextId` 对象用于记录每个集合的下一个自增ID值，确保ID唯一性。