const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function convertISOToMySQL(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function migrateData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'xinyu_db'
  });

  try {
    console.log('Connected to xinyu_db database');

    // 读取JSON数据
    const dbFile = path.join(__dirname, '..', 'data', 'database.json');
    const jsonData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

    console.log('Starting data migration...');

    // 迁移用户数据
    if (jsonData.users && jsonData.users.length > 0) {
      console.log('Migrating users...');
      for (const user of jsonData.users) {
        await connection.execute(
          `INSERT INTO users (id, openid, username, password, nickname, avatar, birthday, mood_display_range, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           openid = VALUES(openid),
           password = VALUES(password),
           nickname = VALUES(nickname),
           avatar = VALUES(avatar),
           birthday = VALUES(birthday),
           mood_display_range = VALUES(mood_display_range),
           updated_at = VALUES(updated_at)`,
          [
            user.id,
            user.openid,
            user.username,
            user.password,
            user.nickname,
            user.avatar,
            user.birthday,
            user.mood_display_range,
            convertISOToMySQL(user.created_at),
            convertISOToMySQL(user.updated_at)
          ]
        );
      }
      console.log(`Migrated ${jsonData.users.length} users`);
    }

    // 迁移心情记录
    if (jsonData.moods && jsonData.moods.length > 0) {
      console.log('Migrating moods...');
      // 获取所有存在的用户ID
      const [existingUsers] = await connection.execute('SELECT id FROM users');
      const userIds = new Set(existingUsers.map(u => u.id));
      
      let migratedCount = 0;
      for (const mood of jsonData.moods) {
        // 检查用户是否存在
        if (!userIds.has(mood.user_id)) {
          console.log(`Skipping mood ${mood.id} - user ${mood.user_id} does not exist`);
          continue;
        }
        
        const images = mood.images ? JSON.stringify(mood.images) : null;
        await connection.execute(
          `INSERT INTO moods (id, user_id, mood_type, content, images, visibility, record_date, record_time, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           mood_type = VALUES(mood_type),
           content = VALUES(content),
           images = VALUES(images),
           visibility = VALUES(visibility),
           record_date = VALUES(record_date),
           record_time = VALUES(record_time)`,
          [
            mood.id,
            mood.user_id,
            mood.mood_type,
            mood.content,
            images,
            mood.visibility,
            mood.record_date,
            mood.record_time,
            convertISOToMySQL(mood.created_at)
          ]
        );
        migratedCount++;
      }
      console.log(`Migrated ${migratedCount} moods`);
    }

    // 迁移日记数据
    if (jsonData.diaries && jsonData.diaries.length > 0) {
      console.log('Migrating diaries...');
      // 获取所有存在的用户ID
      const [existingUsers] = await connection.execute('SELECT id FROM users');
      const userIds = new Set(existingUsers.map(u => u.id));
      
      let migratedCount = 0;
      for (const diary of jsonData.diaries) {
        // 检查用户是否存在
        if (!userIds.has(diary.user_id)) {
          console.log(`Skipping diary ${diary.id} - user ${diary.user_id} does not exist`);
          continue;
        }
        
        const backgroundImages = diary.background_images ? JSON.stringify(diary.background_images) : null;
        await connection.execute(
          `INSERT INTO diaries (id, user_id, title, content, mood_tag, background_images, visibility, comment_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           content = VALUES(content),
           mood_tag = VALUES(mood_tag),
           background_images = VALUES(background_images),
           visibility = VALUES(visibility),
           comment_count = VALUES(comment_count),
           updated_at = VALUES(updated_at)`,
          [
            diary.id,
            diary.user_id,
            diary.title,
            diary.content,
            diary.mood_tag,
            backgroundImages,
            diary.visibility,
            diary.comment_count,
            convertISOToMySQL(diary.created_at),
            convertISOToMySQL(diary.updated_at)
          ]
        );
        migratedCount++;
      }
      console.log(`Migrated ${migratedCount} diaries`);
    }

    // 迁移日记评论
    if (jsonData.diary_comments && jsonData.diary_comments.length > 0) {
      console.log('Migrating diary_comments...');
      // 获取所有存在的日记ID和用户ID
      const [existingDiaries] = await connection.execute('SELECT id FROM diaries');
      const [existingUsers] = await connection.execute('SELECT id FROM users');
      const diaryIds = new Set(existingDiaries.map(d => d.id));
      const userIds = new Set(existingUsers.map(u => u.id));
      
      let migratedCount = 0;
      for (const comment of jsonData.diary_comments) {
        // 检查日记和用户是否存在
        if (!diaryIds.has(comment.diary_id)) {
          console.log(`Skipping comment ${comment.id} - diary ${comment.diary_id} does not exist`);
          continue;
        }
        if (!userIds.has(comment.user_id)) {
          console.log(`Skipping comment ${comment.id} - user ${comment.user_id} does not exist`);
          continue;
        }
        
        await connection.execute(
          `INSERT INTO diary_comments (id, diary_id, user_id, content, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           content = VALUES(content)`,
          [
            comment.id,
            comment.diary_id,
            comment.user_id,
            comment.content,
            convertISOToMySQL(comment.created_at)
          ]
        );
        migratedCount++;
      }
      console.log(`Migrated ${migratedCount} diary_comments`);
    }

    // 迁移好友关系
    if (jsonData.friends && jsonData.friends.length > 0) {
      console.log('Migrating friends...');
      // 获取所有存在的用户ID
      const [existingUsers] = await connection.execute('SELECT id FROM users');
      const userIds = new Set(existingUsers.map(u => u.id));
      
      let migratedCount = 0;
      for (const friend of jsonData.friends) {
        // 检查用户是否存在
        if (!userIds.has(friend.user_id)) {
          console.log(`Skipping friend ${friend.id} - user ${friend.user_id} does not exist`);
          continue;
        }
        if (!userIds.has(friend.friend_id)) {
          console.log(`Skipping friend ${friend.id} - friend ${friend.friend_id} does not exist`);
          continue;
        }
        
        await connection.execute(
          `INSERT INTO friends (id, user_id, friend_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           updated_at = VALUES(updated_at)`,
          [
            friend.id,
            friend.user_id,
            friend.friend_id,
            friend.status,
            convertISOToMySQL(friend.created_at),
            convertISOToMySQL(friend.updated_at)
          ]
        );
        migratedCount++;
      }
      console.log(`Migrated ${migratedCount} friends`);
    }

    // 迁移消息
    if (jsonData.messages && jsonData.messages.length > 0) {
      console.log('Migrating messages...');
      // 获取所有存在的用户ID
      const [existingUsers] = await connection.execute('SELECT id FROM users');
      const userIds = new Set(existingUsers.map(u => u.id));
      
      let migratedCount = 0;
      for (const message of jsonData.messages) {
        // 检查用户是否存在
        if (!userIds.has(message.from_user_id)) {
          console.log(`Skipping message ${message.id} - from_user ${message.from_user_id} does not exist`);
          continue;
        }
        if (!userIds.has(message.to_user_id)) {
          console.log(`Skipping message ${message.id} - to_user ${message.to_user_id} does not exist`);
          continue;
        }
        
        await connection.execute(
          `INSERT INTO messages (id, from_user_id, to_user_id, content, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           content = VALUES(content),
           is_read = VALUES(is_read)`,
          [
            message.id,
            message.from_user_id,
            message.to_user_id,
            message.content,
            message.is_read,
            convertISOToMySQL(message.created_at)
          ]
        );
        migratedCount++;
      }
      console.log(`Migrated ${migratedCount} messages`);
    }

    // 迁移情绪建议
    if (jsonData.emotion_suggestions && jsonData.emotion_suggestions.length > 0) {
      console.log('Migrating emotion_suggestions...');
      for (const suggestion of jsonData.emotion_suggestions) {
        await connection.execute(
          `INSERT INTO emotion_suggestions (id, mood_type, suggestion, created_at)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           suggestion = VALUES(suggestion)`,
          [
            suggestion.id,
            suggestion.mood_type,
            suggestion.suggestion,
            convertISOToMySQL(suggestion.created_at || new Date().toISOString())
          ]
        );
      }
      console.log(`Migrated ${jsonData.emotion_suggestions.length} emotion_suggestions`);
    }

    console.log('Data migration completed successfully');

    // 验证数据
    console.log('\nVerifying migrated data:');
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [moodCount] = await connection.execute('SELECT COUNT(*) as count FROM moods');
    const [diaryCount] = await connection.execute('SELECT COUNT(*) as count FROM diaries');
    const [commentCount] = await connection.execute('SELECT COUNT(*) as count FROM diary_comments');
    const [friendCount] = await connection.execute('SELECT COUNT(*) as count FROM friends');
    const [messageCount] = await connection.execute('SELECT COUNT(*) as count FROM messages');
    const [suggestionCount] = await connection.execute('SELECT COUNT(*) as count FROM emotion_suggestions');

    console.log(`Users: ${userCount[0].count}`);
    console.log(`Moods: ${moodCount[0].count}`);
    console.log(`Diaries: ${diaryCount[0].count}`);
    console.log(`Diary Comments: ${commentCount[0].count}`);
    console.log(`Friends: ${friendCount[0].count}`);
    console.log(`Messages: ${messageCount[0].count}`);
    console.log(`Emotion Suggestions: ${suggestionCount[0].count}`);

  } catch (error) {
    console.error('Error migrating data:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrateData()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });