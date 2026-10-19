# API 设计文档

## 概述

本文档定义了心语项目的后端 API 接口，采用 RESTful 风格设计。

### 基础信息

- **基础路径**: `/api`
- **认证方式**: JWT Token
- **请求格式**: JSON
- **响应格式**: JSON
- **服务端口**: 3000

### 认证说明

所有需要登录的接口，请求头中需携带 `Authorization` 字段：

```
Authorization: Bearer <token>
```

### 响应格式

#### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

#### 失败响应

```json
{
  "success": false,
  "message": "错误信息"
}
```

---

## 1. 用户接口

### 1.1 注册

- **路径**: `POST /api/user/register`
- **认证**: 无需

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码，至少6位 |
| nickname | string | 否 | 用户昵称 |

#### 响应示例

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "hzy",
      "nickname": "hzy",
      "avatar": null,
      "birthday": null,
      "mood_display_range": "all"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "is_birthday": false
  }
}
```

### 1.2 登录

- **路径**: `POST /api/user/login`
- **认证**: 无需

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

#### 响应示例

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "hzy",
      "nickname": "hzy",
      "avatar": null,
      "birthday": null,
      "mood_display_range": "all"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "is_birthday": false
  }
}
```

### 1.3 获取用户信息

- **路径**: `GET /api/user/info`
- **认证**: 需要

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "hzy",
    "nickname": "hzy",
    "avatar": null,
    "birthday": null,
    "mood_display_range": "all",
    "created_at": "2026-06-16T14:51:21.680Z"
  }
}
```

### 1.4 获取用户资料

- **路径**: `GET /api/user/profile`
- **认证**: 需要

#### 响应示例

同 `/api/user/info`

### 1.5 更新用户信息

- **路径**: `POST /api/user/update`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | string | 否 | 用户昵称 |
| avatar | string | 否 | 头像URL |
| birthday | string | 否 | 生日，格式 YYYY-MM-DD |
| mood_display_range | string | 否 | 心情展示范围 |

#### 响应示例

```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "user": {
      "id": 1,
      "username": "hzy",
      "nickname": "新昵称",
      "avatar": "http://xxx.png",
      "birthday": "1990-01-01",
      "mood_display_range": "all"
    }
  }
}
```

### 1.6 修改密码

- **路径**: `POST /api/user/changePassword`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码，至少6位 |

#### 响应示例

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

### 1.7 设置心情展示范围

- **路径**: `POST /api/user/settings`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| mood_display_range | string | 是 | 展示范围，`all` / `day` / `week` |

#### 响应示例

```json
{
  "success": true,
  "message": "设置成功"
}
```

### 1.8 获取其他用户详情

- **路径**: `GET /api/user/detail`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 是 | 目标用户ID |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 2,
    "nickname": "c11j",
    "avatar": "http://xxx.png",
    "birthday": null,
    "created_at": "2026-06-16T14:51:39.947Z"
  }
}
```

### 1.9 搜索用户

- **路径**: `GET /api/user/search`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 是 | 用户ID |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 2,
    "nickname": "c11j",
    "avatar": "http://xxx.png"
  }
}
```

---

## 2. 心情接口

### 2.1 添加心情记录

- **路径**: `POST /api/mood/add`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| mood_type | number | 是 | 心情类型，1-6 |
| content | string | 否 | 心情描述 |
| images | array | 否 | 图片URL数组 |
| visibility | number | 否 | 可见性，默认1 |
| record_date | string | 否 | 记录日期，默认今天 |
| record_time | string | 否 | 记录时间，默认当前时间 |

#### 响应示例

```json
{
  "success": true,
  "message": "记录成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "mood_type": 1,
    "content": "今天很开心",
    "images": null,
    "visibility": 1,
    "record_date": "2026-06-16",
    "record_time": "22:52:17",
    "created_at": "2026-06-16T14:52:17.233Z"
  }
}
```

### 2.2 获取今日心情

- **路径**: `GET /api/mood/today`
- **认证**: 需要

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "mood_type": 1,
      "content": "今天很开心",
      "images": null,
      "visibility": 1,
      "record_date": "2026-06-16",
      "record_time": "22:52:17",
      "created_at": "2026-06-16T14:52:17.233Z"
    }
  ]
}
```

### 2.3 获取心情列表

- **路径**: `GET /api/mood/list`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| limit | number | 否 | 返回数量限制 |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "mood_type": 1,
      "content": "今天很开心",
      "visibility": 1,
      "record_date": "2026-06-16",
      "record_time": "22:52:17",
      "created_at": "2026-06-16T14:52:17.233Z"
    }
  ]
}
```

### 2.4 获取指定日期心情

- **路径**: `GET /api/mood/day`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| date | string | 否 | 日期，格式 YYYY-MM-DD，默认今天 |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "moods": [
      {
        "id": 1,
        "user_id": 1,
        "mood_type": 1,
        "content": "今天很开心",
        "visibility": 1,
        "record_date": "2026-06-16",
        "record_time": "22:52:17",
        "created_at": "2026-06-16T14:52:17.233Z"
      }
    ]
  }
}
```

### 2.5 获取心情日历数据

- **路径**: `GET /api/mood/calendar`
- **认证**: 需要

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "2026-06-16": [
      {
        "id": 1,
        "user_id": 1,
        "mood_type": 1,
        "content": "今天很开心",
        "visibility": 1,
        "record_date": "2026-06-16",
        "record_time": "22:52:17",
        "created_at": "2026-06-16T14:52:17.233Z"
      }
    ],
    "2026-06-15": [
      {
        "id": 2,
        "user_id": 1,
        "mood_type": 2,
        "content": "心情平静",
        "visibility": 1,
        "record_date": "2026-06-15",
        "record_time": "10:30:00",
        "created_at": "2026-06-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 2.6 心情统计

- **路径**: `GET /api/mood/stat`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 否 | 统计类型，`week` / `month` / `year` |
| date | string | 否 | 指定日期 |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "total_count": 10,
    "avg_mood": 2,
    "most_frequent": 1,
    "distribution": {
      "1": 3,
      "2": 2,
      "3": 1,
      "4": 2,
      "5": 1,
      "6": 1
    }
  }
}
```

### 2.7 心情分布统计

- **路径**: `GET /api/mood/statistics`
- **认证**: 需要

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "1": 5,
    "2": 3,
    "3": 2,
    "4": 1,
    "5": 1,
    "6": 0
  }
}
```

### 2.8 世界广场心情

- **路径**: `GET /api/mood/world`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页数量，默认20 |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "mood_type": 1,
      "content": "今天很开心",
      "visibility": 1,
      "record_date": "2026-06-16",
      "record_time": "22:52:17",
      "created_at": "2026-06-16T14:52:17.233Z",
      "user": {
        "id": 2,
        "nickname": "c11j",
        "avatar": "http://xxx.png"
      }
    }
  ]
}
```

---

## 3. 日记接口

### 3.1 添加日记

- **路径**: `POST /api/diary/add`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 日记标题 |
| content | string | 是 | 日记内容 |
| mood_tag | number | 否 | 心情标签，1-6 |
| background_images | array | 否 | 背景图片URL数组 |
| visibility | number | 否 | 可见性，默认1 |

#### 响应示例

```json
{
  "success": true,
  "message": "保存成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "美好的一天",
    "content": "今天天气真好",
    "mood_tag": 1,
    "background_images": "[\"http://xxx.png\"]",
    "visibility": 3,
    "comment_count": 0,
    "created_at": "2026-06-16T14:52:58.892Z",
    "updated_at": "2026-06-16T14:52:58.892Z"
  }
}
```

### 3.2 获取日记列表

- **路径**: `GET /api/diary/list`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| visibility | number | 否 | 可见性筛选 |
| keyword | string | 否 | 关键词搜索 |
| limit | number | 否 | 返回数量限制 |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "title": "美好的一天",
      "content": "今天天气真好",
      "mood_tag": 1,
      "visibility": 3,
      "comment_count": 2,
      "created_at": "2026-06-16T14:52:58.892Z",
      "updated_at": "2026-06-16T14:52:58.892Z"
    }
  ]
}
```

### 3.3 获取日记详情

- **路径**: `GET /api/diary/detail`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 日记ID |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "美好的一天",
    "content": "今天天气真好",
    "mood_tag": 1,
    "background_images": "[\"http://xxx.png\"]",
    "visibility": 3,
    "comment_count": 2,
    "created_at": "2026-06-16T14:52:58.892Z",
    "updated_at": "2026-06-16T14:52:58.892Z"
  }
}
```

### 3.4 更新日记

- **路径**: `POST /api/diary/update`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 日记ID |
| title | string | 否 | 日记标题 |
| content | string | 否 | 日记内容 |
| mood_tag | number | 否 | 心情标签 |
| background_images | array | 否 | 背景图片URL数组 |
| visibility | number | 否 | 可见性 |

#### 响应示例

```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "修改后的标题",
    "content": "修改后的内容",
    "mood_tag": 2,
    "visibility": 2,
    "comment_count": 2,
    "created_at": "2026-06-16T14:52:58.892Z",
    "updated_at": "2026-06-17T10:00:00.000Z"
  }
}
```

### 3.5 删除日记

- **路径**: `POST /api/diary/delete`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 日记ID |

#### 响应示例

```json
{
  "success": true,
  "message": "删除成功"
}
```

### 3.6 世界广场日记

- **路径**: `GET /api/diary/world`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页数量，默认20 |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "title": "美好的一天",
      "content": "今天天气真好",
      "mood_tag": 1,
      "visibility": 3,
      "comment_count": 2,
      "created_at": "2026-06-16T14:52:58.892Z",
      "updated_at": "2026-06-16T14:52:58.892Z",
      "user": {
        "id": 2,
        "nickname": "c11j",
        "avatar": "http://xxx.png"
      }
    }
  ]
}
```

### 3.7 获取指定用户日记

- **路径**: `GET /api/diary/user`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 是 | 目标用户ID |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "title": "美好的一天",
      "content": "今天天气真好",
      "mood_tag": 1,
      "visibility": 2,
      "comment_count": 2,
      "created_at": "2026-06-16T14:52:58.892Z",
      "updated_at": "2026-06-16T14:52:58.892Z"
    }
  ]
}
```

---

## 4. 评论接口

### 4.1 添加评论

- **路径**: `POST /api/comment/add`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| diary_id | number | 是 | 日记ID |
| content | string | 是 | 评论内容 |

#### 响应示例

```json
{
  "success": true,
  "message": "评论成功",
  "data": {
    "id": 1,
    "diary_id": 1,
    "user_id": 1,
    "content": "真棒！",
    "created_at": "2026-06-16T14:58:11.810Z"
  }
}
```

### 4.2 获取评论列表

- **路径**: `GET /api/comment/list`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| diary_id | number | 是 | 日记ID |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "diary_id": 1,
      "user_id": 2,
      "content": "真棒！",
      "created_at": "2026-06-16T14:58:11.810Z",
      "user": {
        "id": 2,
        "nickname": "c11j",
        "avatar": "http://xxx.png"
      }
    }
  ]
}
```

### 4.3 删除评论

- **路径**: `POST /api/comment/delete`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 评论ID |

#### 响应示例

```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## 5. 好友接口

### 5.1 添加好友

- **路径**: `POST /api/friend/add`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 目标用户名 |

#### 响应示例

```json
{
  "success": true,
  "message": "好友请求已发送",
  "data": {
    "id": 1,
    "user_id": 1,
    "friend_id": 2,
    "status": 0,
    "created_at": "2026-06-16T15:53:49.863Z",
    "updated_at": "2026-06-16T15:53:49.863Z"
  }
}
```

### 5.2 发送好友请求

- **路径**: `POST /api/friend/request`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| to_user_id | number | 是 | 目标用户ID |

#### 响应示例

同 `/api/friend/add`

### 5.3 获取好友列表

- **路径**: `GET /api/friend/list`
- **认证**: 需要

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "friend_id": 2,
      "nickname": "c11j",
      "avatar": "http://xxx.png",
      "created_at": "2026-06-16T15:53:49.863Z"
    }
  ]
}
```

### 5.4 获取待处理好友请求

- **路径**: `GET /api/friend/pending`
- **认证**: 需要

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "user_id": 3,
      "nickname": "hzycj",
      "avatar": null,
      "created_at": "2026-06-16T16:18:46.849Z"
    }
  ]
}
```

### 5.5 获取好友请求列表

- **路径**: `GET /api/friend/requests`
- **认证**: 需要

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 2,
      "user_id": 3,
      "nickname": "hzycj",
      "avatar": null,
      "created_at": "2026-06-16T16:18:46.849Z"
    }
  ]
}
```

### 5.6 接受好友请求

- **路径**: `POST /api/friend/accept`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| request_id | number | 否 | 请求记录ID |
| user_id | number | 否 | 发送请求的用户ID |

#### 响应示例

```json
{
  "success": true,
  "message": "已接受好友请求"
}
```

### 5.7 拒绝好友请求

- **路径**: `POST /api/friend/reject`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| request_id | number | 否 | 请求记录ID |
| user_id | number | 否 | 发送请求的用户ID |

#### 响应示例

```json
{
  "success": true,
  "message": "已拒绝好友请求"
}
```

### 5.8 删除好友

- **路径**: `POST /api/friend/delete`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| friend_id | number | 是 | 好友ID |

#### 响应示例

```json
{
  "success": true,
  "message": "已删除好友"
}
```

---

## 6. 聊天接口

### 6.1 发送消息

- **路径**: `POST /api/chat/send`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| to_user_id | number | 是 | 接收方用户ID |
| content | string | 是 | 消息内容 |

#### 响应示例

```json
{
  "success": true,
  "message": "发送成功",
  "data": {
    "id": 1,
    "from_user_id": 1,
    "to_user_id": 2,
    "content": "嗨，最近怎么样？",
    "is_read": 0,
    "created_at": "2026-06-16T16:39:31.864Z"
  }
}
```

### 6.2 获取聊天记录

- **路径**: `GET /api/chat/list`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| to_user_id | number | 是 | 对方用户ID |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "from_user_id": 2,
      "to_user_id": 1,
      "content": "嗨，最近怎么样？",
      "is_read": 1,
      "created_at": "2026-06-16T16:39:31.864Z",
      "from_user": {
        "id": 2,
        "nickname": "c11j",
        "avatar": "http://xxx.png"
      }
    }
  ]
}
```

### 6.3 获取聊天历史

- **路径**: `GET /api/chat/history`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| friend_id | number | 是 | 好友ID |
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页数量，默认20 |

#### 响应示例

同 `/api/chat/list`

### 6.4 获取未读消息数量

- **路径**: `GET /api/chat/unread`
- **认证**: 需要

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "count": 5
  }
}
```

### 6.5 标记消息已读

- **路径**: `POST /api/chat/read`
- **认证**: 需要

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| from_user_id | number | 是 | 发送方用户ID |

#### 响应示例

```json
{
  "success": true,
  "message": "已标记已读"
}
```

---

## 7. 情绪建议接口

### 7.1 获取情绪建议

- **路径**: `GET /api/suggestion/list`
- **认证**: 无需

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| mood_type | number | 否 | 心情类型，1-6 |

#### 响应示例

```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "mood_type": 1,
      "suggestion": "有什么开心事来心语分享一下呀~ 开心的心情会传染，分享快乐可以让快乐加倍！"
    }
  ]
}
```

---

## API 汇总表

| 模块 | 接口路径 | HTTP方法 | 需要认证 |
|------|---------|---------|---------|
| 用户 | `/api/user/register` | POST | 否 |
| 用户 | `/api/user/login` | POST | 否 |
| 用户 | `/api/user/info` | GET | 是 |
| 用户 | `/api/user/profile` | GET | 是 |
| 用户 | `/api/user/update` | POST | 是 |
| 用户 | `/api/user/changePassword` | POST | 是 |
| 用户 | `/api/user/settings` | POST | 是 |
| 用户 | `/api/user/detail` | GET | 是 |
| 用户 | `/api/user/search` | GET | 是 |
| 心情 | `/api/mood/add` | POST | 是 |
| 心情 | `/api/mood/today` | GET | 是 |
| 心情 | `/api/mood/list` | GET | 是 |
| 心情 | `/api/mood/day` | GET | 是 |
| 心情 | `/api/mood/calendar` | GET | 是 |
| 心情 | `/api/mood/stat` | GET | 是 |
| 心情 | `/api/mood/statistics` | GET | 是 |
| 心情 | `/api/mood/world` | GET | 是 |
| 日记 | `/api/diary/add` | POST | 是 |
| 日记 | `/api/diary/list` | GET | 是 |
| 日记 | `/api/diary/detail` | GET | 是 |
| 日记 | `/api/diary/update` | POST | 是 |
| 日记 | `/api/diary/delete` | POST | 是 |
| 日记 | `/api/diary/world` | GET | 是 |
| 日记 | `/api/diary/user` | GET | 是 |
| 评论 | `/api/comment/add` | POST | 是 |
| 评论 | `/api/comment/list` | GET | 是 |
| 评论 | `/api/comment/delete` | POST | 是 |
| 好友 | `/api/friend/add` | POST | 是 |
| 好友 | `/api/friend/request` | POST | 是 |
| 好友 | `/api/friend/list` | GET | 是 |
| 好友 | `/api/friend/pending` | GET | 是 |
| 好友 | `/api/friend/requests` | GET | 是 |
| 好友 | `/api/friend/accept` | POST | 是 |
| 好友 | `/api/friend/reject` | POST | 是 |
| 好友 | `/api/friend/delete` | POST | 是 |
| 聊天 | `/api/chat/send` | POST | 是 |
| 聊天 | `/api/chat/list` | GET | 是 |
| 聊天 | `/api/chat/history` | GET | 是 |
| 聊天 | `/api/chat/unread` | GET | 是 |
| 聊天 | `/api/chat/read` | POST | 是 |
| 建议 | `/api/suggestion/list` | GET | 否 |