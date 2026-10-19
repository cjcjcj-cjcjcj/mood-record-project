# MySQL 数据库迁移说明

## 迁移完成

您的项目已成功从JSON文件存储迁移到MySQL数据库！

## 数据库信息

- **数据库名**: `xinyu_db`
- **主机**: `localhost`
- **端口**: `3306`
- **用户名**: `root`
- **密码**: `123456`

## 数据表结构

已创建以下数据表：

1. **users** - 用户表
2. **moods** - 心情记录表
3. **diaries** - 日记表
4. **diary_comments** - 日记评论表
5. **friends** - 好友关系表
6. **friend_requests** - 好友请求表
7. **messages** - 消息表
8. **emotion_suggestions** - 情绪建议表

## 迁移的数据

已成功迁移以下数据：

- **Users**: 6 个用户
- **Moods**: 13 条心情记录
- **Diaries**: 4 篇日记
- **Diary Comments**: 6 条评论
- **Friends**: 4 条好友关系
- **Messages**: 3 条消息
- **Emotion Suggestions**: 12 条情绪建议

## 使用方法

### 启动服务器

```bash
cd backend
npm start
```

或者使用开发模式：

```bash
cd backend
npm run dev
```

### 文件说明

- **app.mysql.js** - 使用MySQL的新版本服务器
- **app.js** - 使用JSON文件的旧版本服务器（已保留）
- **database/config.js** - MySQL数据库配置
- **database/schema.sql** - 数据库表结构SQL文件
- **database/setup.js** - 数据库初始化脚本
- **database/migrate.js** - 数据迁移脚本

### 如果需要重新初始化数据库

```bash
cd backend/database
node setup.js
```

### 如果需要重新迁移数据

```bash
cd backend/database
node migrate.js
```

## 配置修改

如果需要修改数据库连接信息，请编辑 `backend/database/config.js` 文件：

```javascript
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'xinyu_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

## 优势

使用MySQL相比JSON文件存储有以下优势：

1. **性能提升**: MySQL针对查询进行了优化，支持索引
2. **数据完整性**: 外键约束确保数据一致性
3. **并发处理**: 支持多用户同时访问
4. **数据安全**: 更好的数据备份和恢复机制
5. **扩展性**: 支持更复杂的查询和数据分析
6. **事务支持**: 支持数据库事务，确保数据操作的一致性

## 注意事项

1. 原有的JSON数据库文件 `backend/data/database.json` 已保留，作为备份
2. 如果需要切换回JSON版本，可以使用 `npm run start:old` 命令
3. 确保MySQL服务正在运行
4. 定期备份数据库

## 故障排除

### 无法连接到MySQL

确保MySQL服务正在运行，并且连接信息正确。

### 数据迁移失败

检查MySQL数据库是否已创建，以及表结构是否正确。

### 服务器启动失败

检查端口3000是否被占用，或查看错误日志。

---

迁移完成！现在您可以使用MySQL数据库来存储和管理您的应用数据了。