const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');

const JWT_SECRET = 'xinyu_secret_key';

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'xinyu_db',
  charset: 'utf8mb4',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const uploadDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  }
});

const formatAvatarUrl = (avatar) => {
  if (avatar && avatar.startsWith('/')) {
    return 'http://10.23.156.155:3000' + avatar;
  }
  return avatar;
};

const formatUserAvatars = (users) => {
  if (Array.isArray(users)) {
    return users.map(user => ({ ...user, avatar: formatAvatarUrl(user.avatar) }));
  }
  return users;
};

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.json({ success: false, message: '未登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  } catch {
    return res.json({ success: false, message: 'token无效' });
  }
};

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.post('/api/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ success: false, message: '用户名或密码错误' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar && user.avatar.startsWith('/') ? 'http://10.21.90.173:3000' + user.avatar : user.avatar, birthday: user.birthday, mood_display_range: user.mood_display_range },
        token,
        is_birthday: false
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.json({ success: false, message: '登录失败' });
  }
});

app.post('/api/user/register', async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.json({ success: false, message: '用户名已存在' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, nickname, mood_display_range) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, nickname || username, 'all']
    );
    const [newUser] = await pool.query('SELECT id, username, nickname, avatar, birthday, mood_display_range FROM users WHERE id = ?', [result.insertId]);
    const userData = newUser[0];
    if (userData.avatar && userData.avatar.startsWith('/')) {
      userData.avatar = 'http://10.21.90.173:3000' + userData.avatar;
    }
    const token = jwt.sign({ id: result.insertId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      message: '注册成功',
      data: {
        user: userData,
        token,
        is_birthday: false
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.json({ success: false, message: '注册失败' });
  }
});

app.post('/api/user/update', verifyToken, async (req, res) => {
  try {
    const { nickname, avatar, birthday } = req.body;
    await pool.query('UPDATE users SET nickname = ?, avatar = ?, birthday = ?, updated_at = NOW() WHERE id = ?', [nickname, avatar, birthday, req.userId]);
    const [users] = await pool.query('SELECT id, username, nickname, avatar, birthday, mood_display_range FROM users WHERE id = ?', [req.userId]);
    const user = users[0];
    if (user.avatar && user.avatar.startsWith('/')) {
      user.avatar = 'http://10.21.90.173:3000' + user.avatar;
    }
    res.json({ success: true, message: '更新成功', data: user });
  } catch (err) {
    console.error('User update error:', err);
    res.json({ success: false, message: '更新失败' });
  }
});

app.post('/api/user/upload-avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    console.log('[Upload Avatar] Request received');
    console.log('[Upload Avatar] User ID:', req.userId);
    console.log('[Upload Avatar] File:', req.file ? req.file.filename : 'null');
    
    if (!req.file) {
      console.log('[Upload Avatar] Error: No file');
      return res.json({ success: false, message: '请选择图片' });
    }
    const avatarUrl = '/uploads/' + req.file.filename;
    console.log('[Upload Avatar] Avatar URL:', avatarUrl);
    
    const [result] = await pool.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [avatarUrl, req.userId]);
    console.log('[Upload Avatar] Update result:', result);
    
    const [users] = await pool.query('SELECT id, username, nickname, avatar, birthday, mood_display_range FROM users WHERE id = ?', [req.userId]);
    console.log('[Upload Avatar] Query result:', users);
    
    const user = users[0];
    if (user.avatar && user.avatar.startsWith('/')) {
      user.avatar = 'http://10.21.90.173:3000' + user.avatar;
    }
    console.log('[Upload Avatar] Response user:', user);
    
    res.json({ success: true, message: '上传成功', data: user });
  } catch (err) {
    console.error('[Upload Avatar] Error:', err);
    res.json({ success: false, message: '上传失败' });
  }
});

app.use('/uploads', express.static(uploadDir));

app.post('/api/user/settings', verifyToken, async (req, res) => {
  try {
    const { mood_display_range } = req.body;
    await pool.query('UPDATE users SET mood_display_range = ?, updated_at = NOW() WHERE id = ?', [mood_display_range, req.userId]);
    res.json({ success: true, message: '设置成功' });
  } catch (err) {
    console.error('User settings error:', err);
    res.json({ success: false, message: '设置失败' });
  }
});

app.get('/api/user/detail', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id);
    const [users] = await pool.query('SELECT id, username, nickname, avatar, birthday, mood_display_range FROM users WHERE id = ?', [userId]);
    const user = users[0];
    if (user && user.avatar && user.avatar.startsWith('/')) {
      user.avatar = 'http://10.21.90.173:3000' + user.avatar;
    }
    res.json({ success: true, message: '获取成功', data: user });
  } catch (err) {
    console.error('User detail error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/user/search', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id);
    const [users] = await pool.query('SELECT id, username, nickname, avatar FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: '获取成功', data: users[0] });
  } catch (err) {
    console.error('User search error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.post('/api/user/changePassword', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0) {
      return res.json({ success: false, message: '用户不存在' });
    }
    const valid = await bcrypt.compare(oldPassword, users[0].password);
    if (!valid) {
      return res.json({ success: false, message: '旧密码错误' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, req.userId]);
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('Change password error:', err);
    res.json({ success: false, message: '修改失败' });
  }
});

app.get('/api/user/info', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, nickname, avatar, birthday, mood_display_range FROM users WHERE id = ?', [req.userId]);
    res.json({ success: true, message: '获取成功', data: users[0] });
  } catch (err) {
    console.error('User info error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/mood/today', verifyToken, async (req, res) => {
  try {
    const today = getLocalDate();
    const [moods] = await pool.query('SELECT * FROM moods WHERE user_id = ? AND record_date = ?', [req.userId, today]);
    res.json({ success: true, message: '获取成功', data: moods.length > 0 ? moods[0] : null });
  } catch (err) {
    console.error('Mood today error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/mood/day', verifyToken, async (req, res) => {
  try {
    const date = req.query.date || getLocalDate();
    const [moods] = await pool.query('SELECT * FROM moods WHERE user_id = ? AND record_date = ?', [req.userId, date]);
    res.json({ success: true, message: '获取成功', data: { moods } });
  } catch (err) {
    console.error('Mood day error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/mood/list', verifyToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const [moods] = await pool.query('SELECT * FROM moods WHERE user_id = ? AND record_date BETWEEN ? AND ? ORDER BY record_date DESC', [req.userId, start_date, end_date]);
    res.json({ success: true, message: '获取成功', data: moods });
  } catch (err) {
    console.error('Mood list error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/mood/stat', verifyToken, async (req, res) => {
  try {
    const { type } = req.query;
    
    let dateCondition = '';
    const today = new Date();
    
    if (type === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      const startStr = startOfWeek.toISOString().split('T')[0];
      const endStr = endOfWeek.toISOString().split('T')[0];
      dateCondition = `AND record_date BETWEEN '${startStr}' AND '${endStr}'`;
    } else if (type === 'month') {
      const month = getLocalDate().slice(0, 7);
      dateCondition = `AND record_date LIKE '${month}%'`;
    } else if (type === 'year') {
      const year = getLocalDate().slice(0, 4);
      dateCondition = `AND record_date LIKE '${year}%'`;
    }
    
    const [stats] = await pool.query(
      `SELECT mood_type, COUNT(*) as count FROM moods WHERE user_id = ? ${dateCondition} GROUP BY mood_type`,
      [req.userId]
    );
    
    const [total] = await pool.query(
      `SELECT COUNT(*) as total FROM moods WHERE user_id = ? ${dateCondition}`,
      [req.userId]
    );
    
    const [avg] = await pool.query(
      `SELECT AVG(mood_type) as avg_mood FROM moods WHERE user_id = ? ${dateCondition}`,
      [req.userId]
    );
    
    const distribution = {};
    let mostFrequent = null;
    let maxCount = 0;
    
    stats.forEach(item => {
      distribution[item.mood_type] = item.count;
      if (item.count > maxCount) {
        maxCount = item.count;
        mostFrequent = item.mood_type;
      }
    });
    
    res.json({
      success: true,
      message: '获取成功',
      data: {
        total_count: total[0]?.total || 0,
        avg_mood: avg[0]?.avg_mood || null,
        most_frequent: mostFrequent,
        distribution
      }
    });
  } catch (err) {
    console.error('Mood stat error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.post('/api/mood/add', verifyToken, async (req, res) => {
  try {
    console.log('[Mood Add] Request received');
    console.log('[Mood Add] Body:', req.body);
    
    const images = req.body.images ? JSON.stringify(req.body.images) : null;
    let recordTime = req.body.record_time || new Date().toTimeString().split(' ')[0];
    if (recordTime.length > 8) {
      const timeMatch = recordTime.match(/(\d{2}:\d{2}:\d{2})/);
      recordTime = timeMatch ? timeMatch[1] : new Date().toTimeString().split(' ')[0];
    }
    const recordDate = req.body.record_date || getLocalDate();
    console.log('[Mood Add] Record Date:', recordDate);
    
    const [result] = await pool.query(
      'INSERT INTO moods (user_id, mood_type, content, images, visibility, record_date, record_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [req.userId, req.body.mood_type, req.body.content || null, images, req.body.visibility || 1, recordDate, recordTime]
    );
    console.log('[Mood Add] Insert result:', result);
    
    const [newMood] = await pool.query('SELECT * FROM moods WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: '记录成功', data: newMood[0] });
  } catch (err) {
    console.error('[Mood Add] Error:', err);
    res.json({ success: false, message: '记录失败' });
  }
});

app.get('/api/mood/calendar', verifyToken, async (req, res) => {
  try {
    const month = req.query.month || getLocalDate().slice(0, 7);
    const [moods] = await pool.query('SELECT * FROM moods WHERE user_id = ? AND record_date LIKE ?', [req.userId, `${month}%`]);
    const calendarData = {};
    moods.forEach(mood => {
      const date = mood.record_date;
      if (!calendarData[date]) calendarData[date] = [];
      calendarData[date].push(mood);
    });
    res.json({ success: true, message: '获取成功', data: calendarData });
  } catch (err) {
    console.error('Mood calendar error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/mood/stats', verifyToken, async (req, res) => {
  try {
    const [daysResult] = await pool.query(
      'SELECT COUNT(DISTINCT record_date) AS total_days FROM moods WHERE user_id = ?',
      [req.userId]
    );
    const [totalResult] = await pool.query(
      'SELECT COUNT(*) AS total_count FROM moods WHERE user_id = ?',
      [req.userId]
    );
    res.json({
      success: true,
      message: '获取成功',
      data: {
        totalDays: daysResult[0].total_days || 0,
        totalCount: totalResult[0].total_count || 0
      }
    });
  } catch (err) {
    console.error('Mood stats error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/mood/world', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 20;
    const offset = (page - 1) * size;
    const [moods] = await pool.query(
      'SELECT m.id, m.user_id, m.mood_type, m.content, m.visibility, m.record_date, m.record_time, m.created_at, u.nickname, u.avatar FROM moods m JOIN users u ON m.user_id = u.id WHERE m.visibility = 1 ORDER BY m.created_at DESC LIMIT ? OFFSET ?',
      [size, offset]
    );
    const formattedMoods = moods.map(m => ({ ...m, avatar: formatAvatarUrl(m.avatar) }));
    res.json({ success: true, message: '获取成功', data: formattedMoods });
  } catch (err) {
    console.error('Mood world error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/diary/list', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const offset = (page - 1) * size;
    const keyword = req.query.keyword;
    const visibility = req.query.visibility;
    
    let query = 'SELECT * FROM diaries WHERE user_id = ?';
    let params = [req.userId];
    
    if (keyword) {
      query += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (visibility !== undefined && visibility !== 0) {
      query += ' AND visibility = ?';
      params.push(visibility);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(size, offset);
    
    const [diaries] = await pool.query(query, params);
    res.json({ success: true, message: '获取成功', data: diaries });
  } catch (err) {
    console.error('Diary list error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/diary/detail', async (req, res) => {
  try {
    const diaryId = parseInt(req.query.id);
    const [diaries] = await pool.query('SELECT d.*, u.nickname, u.avatar FROM diaries d JOIN users u ON d.user_id = u.id WHERE d.id = ?', [diaryId]);
    const diary = diaries[0];
    if (diary) {
      diary.avatar = formatAvatarUrl(diary.avatar);
    }
    res.json({ success: true, message: '获取成功', data: diary });
  } catch (err) {
    console.error('Diary detail error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/diary/user', async (req, res) => {
  try {
    const userId = parseInt(req.query.user_id);
    const [diaries] = await pool.query(
      'SELECT d.id, d.user_id, d.title, d.content, d.visibility, d.created_at, u.username, u.nickname, u.avatar FROM diaries d JOIN users u ON d.user_id = u.id WHERE d.user_id = ? AND d.visibility IN (2, 3) ORDER BY d.created_at DESC',
      [userId]
    );
    const formattedDiaries = diaries.map(d => ({ ...d, avatar: formatAvatarUrl(d.avatar) }));
    res.json({ success: true, message: '获取成功', data: formattedDiaries });
  } catch (err) {
    console.error('Diary user error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/diary/world', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 20;
    const offset = (page - 1) * size;
    const [diaries] = await pool.query(
      'SELECT d.id, d.user_id, d.title, d.content, d.visibility, d.created_at, u.username, u.nickname, u.avatar FROM diaries d JOIN users u ON d.user_id = u.id WHERE d.visibility = 3 ORDER BY d.created_at DESC LIMIT ? OFFSET ?',
      [size, offset]
    );
    const formattedDiaries = diaries.map(d => ({ ...d, avatar: formatAvatarUrl(d.avatar) }));
    res.json({ success: true, message: '获取成功', data: formattedDiaries });
  } catch (err) {
    console.error('Diary world error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.post('/api/diary/add', verifyToken, async (req, res) => {
  try {
    const backgroundImages = req.body.background_images ? JSON.stringify(req.body.background_images) : null;
    const [result] = await pool.query(
      'INSERT INTO diaries (user_id, title, content, mood_tag, background_images, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [req.userId, req.body.title, req.body.content || '', req.body.mood_tag || null, backgroundImages, req.body.visibility || 1]
    );
    const [newDiary] = await pool.query('SELECT * FROM diaries WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: '保存成功', data: newDiary[0] });
  } catch (err) {
    console.error('Diary add error:', err);
    res.json({ success: false, message: '保存失败' });
  }
});

app.post('/api/diary/update', verifyToken, async (req, res) => {
  try {
    const diaryId = parseInt(req.body.id);
    const backgroundImages = req.body.background_images ? JSON.stringify(req.body.background_images) : null;
    await pool.query(
      'UPDATE diaries SET title = ?, content = ?, mood_tag = ?, background_images = ?, visibility = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [req.body.title, req.body.content || '', req.body.mood_tag || null, backgroundImages, req.body.visibility || 1, diaryId, req.userId]
    );
    const [diary] = await pool.query('SELECT * FROM diaries WHERE id = ?', [diaryId]);
    res.json({ success: true, message: '更新成功', data: diary[0] });
  } catch (err) {
    console.error('Diary update error:', err);
    res.json({ success: false, message: '更新失败' });
  }
});

app.post('/api/diary/delete', verifyToken, async (req, res) => {
  try {
    const diaryId = parseInt(req.body.id);
    await pool.query('DELETE FROM diaries WHERE id = ? AND user_id = ?', [diaryId, req.userId]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('Diary delete error:', err);
    res.json({ success: false, message: '删除失败' });
  }
});

app.post('/api/comment/add', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO diary_comments (diary_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
      [req.body.diary_id, req.userId, req.body.content]
    );
    await pool.query('UPDATE diaries SET comment_count = comment_count + 1 WHERE id = ?', [req.body.diary_id]);
    const [newComment] = await pool.query('SELECT c.*, u.username, u.nickname, u.avatar FROM diary_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [result.insertId]);
    const comment = newComment[0];
    if (comment) {
      comment.avatar = formatAvatarUrl(comment.avatar);
    }
    res.json({ success: true, message: '评论成功', data: comment });
  } catch (err) {
    console.error('Comment add error:', err);
    res.json({ success: false, message: '评论失败' });
  }
});

app.get('/api/comment/list', async (req, res) => {
  try {
    const diaryId = parseInt(req.query.diary_id);
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const offset = (page - 1) * size;
    const [comments] = await pool.query(
      'SELECT c.*, u.username, u.nickname, u.avatar FROM diary_comments c JOIN users u ON c.user_id = u.id WHERE c.diary_id = ? ORDER BY c.created_at DESC LIMIT ? OFFSET ?',
      [diaryId, size, offset]
    );
    const formattedComments = comments.map(c => ({ ...c, avatar: formatAvatarUrl(c.avatar) }));
    res.json({ success: true, message: '获取成功', data: formattedComments });
  } catch (err) {
    console.error('Comment list error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.post('/api/comment/delete', verifyToken, async (req, res) => {
  try {
    const commentId = parseInt(req.body.id);
    const [comments] = await pool.query('SELECT diary_id FROM diary_comments WHERE id = ?', [commentId]);
    if (comments.length > 0) {
      await pool.query('UPDATE diaries SET comment_count = comment_count - 1 WHERE id = ?', [comments[0].diary_id]);
    }
    await pool.query('DELETE FROM diary_comments WHERE id = ?', [commentId]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('Comment delete error:', err);
    res.json({ success: false, message: '删除失败' });
  }
});

app.get('/api/friend/list', verifyToken, async (req, res) => {
  try {
    const [friends] = await pool.query(
      'SELECT uf.friend_id, u.username, u.nickname, u.avatar, uf.status FROM friends uf JOIN users u ON uf.friend_id = u.id WHERE uf.user_id = ?',
      [req.userId]
    );
    const formattedFriends = friends.map(f => ({ ...f, avatar: formatAvatarUrl(f.avatar) }));
    res.json({ success: true, message: '获取成功', data: formattedFriends });
  } catch (err) {
    console.error('Friend list error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.post('/api/friend/request', verifyToken, async (req, res) => {
  try {
    const toUserId = parseInt(req.body.to_user_id);
    if (toUserId === req.userId) {
      return res.json({ success: false, message: '不能添加自己为好友' });
    }
    const [existing] = await pool.query('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [req.userId, toUserId]);
    if (existing.length > 0) {
      return res.json({ success: false, message: '已经是好友或已有请求' });
    }
    await pool.query('INSERT INTO friend_requests (from_user_id, to_user_id, status) VALUES (?, ?, 0)', [req.userId, toUserId]);
    res.json({ success: true, message: '请求已发送' });
  } catch (err) {
    console.error('Friend request error:', err);
    res.json({ success: false, message: '发送失败' });
  }
});

app.get('/api/friend/requests', verifyToken, async (req, res) => {
  try {
    const [requests] = await pool.query(
      'SELECT fr.*, u.username, u.nickname, u.avatar FROM friend_requests fr JOIN users u ON fr.from_user_id = u.id WHERE fr.to_user_id = ? AND fr.status = 0',
      [req.userId]
    );
    const formattedRequests = requests.map(r => ({ ...r, avatar: formatAvatarUrl(r.avatar) }));
    res.json({ success: true, message: '获取成功', data: formattedRequests });
  } catch (err) {
    console.error('Friend requests error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.post('/api/friend/accept', verifyToken, async (req, res) => {
  try {
    const requestId = parseInt(req.body.request_id);
    const [requests] = await pool.query('SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ?', [requestId, req.userId]);
    if (requests.length === 0) {
      return res.json({ success: false, message: '请求不存在' });
    }
    const request = requests[0];
    await pool.query('UPDATE friend_requests SET status = 1 WHERE id = ?', [requestId]);
    await pool.query('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 1)', [req.userId, request.from_user_id]);
    await pool.query('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 1)', [request.from_user_id, req.userId]);
    res.json({ success: true, message: '已添加好友' });
  } catch (err) {
    console.error('Friend accept error:', err);
    res.json({ success: false, message: '操作失败' });
  }
});

app.post('/api/friend/reject', verifyToken, async (req, res) => {
  try {
    const requestId = parseInt(req.body.request_id);
    await pool.query('UPDATE friend_requests SET status = 2 WHERE id = ? AND to_user_id = ?', [requestId, req.userId]);
    res.json({ success: true, message: '已拒绝请求' });
  } catch (err) {
    console.error('Friend reject error:', err);
    res.json({ success: false, message: '操作失败' });
  }
});

app.post('/api/friend/delete', verifyToken, async (req, res) => {
  try {
    const friendId = parseInt(req.body.friend_id);
    await pool.query('DELETE FROM friends WHERE user_id = ? AND friend_id = ?', [req.userId, friendId]);
    await pool.query('DELETE FROM friends WHERE user_id = ? AND friend_id = ?', [friendId, req.userId]);
    res.json({ success: true, message: '已删除好友' });
  } catch (err) {
    console.error('Friend delete error:', err);
    res.json({ success: false, message: '删除失败' });
  }
});

app.post('/api/chat/send', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO messages (from_user_id, to_user_id, content, is_read, created_at) VALUES (?, ?, ?, 0, NOW())',
      [req.userId, req.body.to_user_id, req.body.content]
    );
    const [newMessage] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    res.json({ success: true, message: '发送成功', data: newMessage[0] });
  } catch (err) {
    console.error('Chat send error:', err);
    res.json({ success: false, message: '发送失败' });
  }
});

app.get('/api/chat/history', verifyToken, async (req, res) => {
  try {
    const friendId = parseInt(req.query.friend_id);
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?) ORDER BY created_at DESC LIMIT 50',
      [req.userId, friendId, friendId, req.userId]
    );
    res.json({ success: true, message: '获取成功', data: messages.reverse() });
  } catch (err) {
    console.error('Chat history error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.get('/api/chat/unread', verifyToken, async (req, res) => {
  try {
    const [count] = await pool.query('SELECT COUNT(*) as unread FROM messages WHERE to_user_id = ? AND is_read = 0', [req.userId]);
    res.json({ success: true, message: '获取成功', data: count[0] });
  } catch (err) {
    console.error('Chat unread error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.post('/api/chat/read', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE messages SET is_read = 1 WHERE to_user_id = ? AND from_user_id = ?', [req.userId, req.body.from_user_id]);
    res.json({ success: true, message: '已标记为已读' });
  } catch (err) {
    console.error('Chat read error:', err);
    res.json({ success: false, message: '操作失败' });
  }
});

app.get('/api/suggestion/list', async (req, res) => {
  try {
    const moodType = req.query.mood_type;
    let query = 'SELECT * FROM emotion_suggestions';
    let params = [];
    
    if (moodType) {
      query += ' WHERE mood_type = ?';
      params.push(moodType);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 10';
    
    const [suggestions] = await pool.query(query, params);
    res.json({ success: true, message: '获取成功', data: suggestions });
  } catch (err) {
    console.error('Suggestion list error:', err);
    res.json({ success: false, message: '获取失败' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});