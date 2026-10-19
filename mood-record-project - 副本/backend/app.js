const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, 'data');
const dbFile = path.join(dbDir, 'database.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbData = {};

if (fs.existsSync(dbFile)) {
  try {
    dbData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch {
    dbData = {};
  }
} else {
  dbData = {
    users: [],
    moods: [],
    diaries: [],
    diary_comments: [],
    friends: [],
    messages: [],
    emotion_suggestions: []
  };
  fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2));
}

const saveDB = () => {
  fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2));
};

const getNextId = (tableName) => {
  const records = dbData[tableName] || [];
  if (records.length === 0) return 1;
  return Math.max(...records.map(r => r.id)) + 1;
};

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initSuggestions = () => {
  const suggestions = [
    { mood_type: 1, suggestion: '有什么开心事来心语分享一下呀~ 开心的心情会传染，分享快乐可以让快乐加倍！' },
    { mood_type: 1, suggestion: '今天心情不错哦！可以记录下来，以后回忆起来一定会很美好~' },
    { mood_type: 2, suggestion: '享受这份宁静，记录下此刻的美好吧~ 平静是一种难得的状态。' },
    { mood_type: 2, suggestion: '心如止水，岁月静好。这样的时刻值得珍惜。' },
    { mood_type: 3, suggestion: '深呼吸，让烦恼随风而去，写下来也许会好一些~' },
    { mood_type: 3, suggestion: '烦躁的时候可以听听舒缓的音乐，放松一下心情。' },
    { mood_type: 4, suggestion: '难过也没关系，心语一直陪着你~ 说出来会好受些。' },
    { mood_type: 4, suggestion: '每个人都有难过的时候，给自己一些时间和空间。' },
    { mood_type: 5, suggestion: '先冷静一下，把不愉快写出来会好受一些~' },
    { mood_type: 5, suggestion: '生气是拿别人的错误惩罚自己，深呼吸，冷静下来。' },
    { mood_type: 6, suggestion: '别担心，一步一步来，一切都会好起来的~' },
    { mood_type: 6, suggestion: '焦虑的时候可以试试冥想或者运动，让身心放松下来。' }
  ];

  for (const s of suggestions) {
    const existing = dbData.emotion_suggestions.find(
      es => es.mood_type === s.mood_type && es.suggestion === s.suggestion
    );
    if (!existing) {
      dbData.emotion_suggestions.push({
        id: getNextId('emotion_suggestions'),
        ...s,
        created_at: new Date().toISOString()
      });
    }
  }
  saveDB();
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'xinyu_secret_key';

const routes = {
  '/api/user/register': async (req, res, data) => {
    const { username, password, nickname } = data;
    
    const existing = dbData.users.find(u => u.username === username);
    if (existing) {
      return { success: false, message: '用户名已存在' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: getNextId('users'),
      openid: null,
      username,
      password: hashedPassword,
      nickname: nickname || username,
      avatar: null,
      birthday: null,
      mood_display_range: 'all',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    dbData.users.push(newUser);
    saveDB();

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
    
    return {
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          nickname: newUser.nickname,
          avatar: newUser.avatar,
          birthday: newUser.birthday,
          mood_display_range: newUser.mood_display_range
        },
        token,
        is_birthday: false
      }
    };
  },

  '/api/user/login': async (req, res, data) => {
    const { username, password } = data;
    
    const user = dbData.users.find(u => u.username === username);
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { success: false, message: '用户名或密码错误' };
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    return {
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          birthday: user.birthday,
          mood_display_range: user.mood_display_range
        },
        token,
        is_birthday: false
      }
    };
  },

  '/api/user/profile': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = dbData.users.find(u => u.id === decoded.id);
      if (!user) return { success: false, message: '用户不存在' };

      return {
        success: true,
        message: '获取成功',
        data: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          birthday: user.birthday,
          mood_display_range: user.mood_display_range,
          created_at: user.created_at
        }
      };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/user/update': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const index = dbData.users.findIndex(u => u.id === decoded.id);
      if (index === -1) return { success: false, message: '用户不存在' };

      const updates = {};
      if (data.nickname !== undefined) updates.nickname = data.nickname;
      if (data.avatar !== undefined) updates.avatar = data.avatar;
      if (data.birthday !== undefined) updates.birthday = data.birthday;
      if (data.mood_display_range !== undefined) updates.mood_display_range = data.mood_display_range;
      updates.updated_at = new Date().toISOString();

      dbData.users[index] = { ...dbData.users[index], ...updates };
      saveDB();

      return { success: true, message: '更新成功', data: { user: dbData.users[index] } };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/user/changePassword': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const index = dbData.users.findIndex(u => u.id === decoded.id);
      if (index === -1) return { success: false, message: '用户不存在' };

      const user = dbData.users[index];
      const { oldPassword, newPassword } = data;

      // 验证原密码
      const valid = await bcrypt.compare(oldPassword, user.password);
      if (!valid) {
        return { success: false, message: '原密码不正确' };
      }

      // 验证新密码长度
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: '新密码长度不能少于6位' };
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      dbData.users[index].password = hashedPassword;
      dbData.users[index].updated_at = new Date().toISOString();
      saveDB();

      return { success: true, message: '密码修改成功' };
    } catch (error) {
      console.error('修改密码错误:', error);
      return { success: false, message: '修改失败' };
    }
  },

  '/api/user/info': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = dbData.users.find(u => u.id === decoded.id);
      if (!user) return { success: false, message: '用户不存在' };

      return {
        success: true,
        message: '获取成功',
        data: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          birthday: user.birthday,
          mood_display_range: user.mood_display_range,
          created_at: user.created_at
        }
      };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/user/settings': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const index = dbData.users.findIndex(u => u.id === decoded.id);
      if (index === -1) return { success: false, message: '用户不存在' };

      if (data.mood_display_range !== undefined) {
        dbData.users[index].mood_display_range = data.mood_display_range;
        dbData.users[index].updated_at = new Date().toISOString();
        saveDB();
      }

      return { success: true, message: '设置成功' };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/user/detail': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      jwt.verify(token, JWT_SECRET);
      const userId = parseInt(data.user_id);
      const user = dbData.users.find(u => u.id === userId);
      if (!user) return { success: false, message: '用户不存在' };

      return {
        success: true,
        message: '获取成功',
        data: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          birthday: user.birthday,
          created_at: user.created_at
        }
      };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/user/search': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      jwt.verify(token, JWT_SECRET);
      const userId = parseInt(data.user_id);
      const user = dbData.users.find(u => u.id === userId);
      if (!user) return { success: false, message: '用户不存在' };

      return {
        success: true,
        message: '获取成功',
        data: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar
        }
      };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/mood/today': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const today = new Date().toISOString().split('T')[0];
      
      const todayMoods = dbData.moods.filter(m => 
        m.user_id === decoded.id && m.record_date === today
      );
      todayMoods.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { success: true, message: '获取成功', data: todayMoods };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/mood/stat': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Mood stat request - user_id:', decoded.id, 'type:', data.type);
      console.log('All moods count:', dbData.moods.length);
      console.log('User moods:', dbData.moods.filter(m => m.user_id === decoded.id));
      
      // 获取用户所有心情记录
      const userMoods = dbData.moods.filter(m => m.user_id === decoded.id);
      let filteredMoods = [...userMoods]; // 创建副本，避免引用问题
      
      // 按类型筛选（优先）
      console.log('Current date:', new Date());
      if (data.type === 'week') {
        // 获取本周数据
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        console.log('Week ago:', weekAgo);
        filteredMoods = userMoods.filter(m => {
          const recordDate = new Date(m.record_date);
          const result = recordDate >= weekAgo;
          console.log('Record date:', m.record_date, '>=', weekAgo, ':', result);
          return result;
        });
        console.log('Filtered moods count after week filter:', filteredMoods.length);
      } else if (data.type === 'month') {
        // 获取本月数据
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        console.log('Month ago:', monthAgo);
        filteredMoods = userMoods.filter(m => {
          const recordDate = new Date(m.record_date);
          const result = recordDate >= monthAgo;
          console.log('Record date:', m.record_date, '>=', monthAgo, ':', result);
          return result;
        });
        console.log('Filtered moods count after month filter:', filteredMoods.length);
      } else if (data.type === 'year') {
        // 获取本年数据
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        console.log('Year ago:', yearAgo);
        filteredMoods = userMoods.filter(m => new Date(m.record_date) >= yearAgo);
        console.log('Filtered moods count after year filter:', filteredMoods.length);
      }
      
      console.log('Before date filter - filteredMoods.length:', filteredMoods.length);
      console.log('data.date:', data.date, 'typeof:', typeof data.date);
      
      // 按日期筛选（额外条件）
      if (data.date && data.date !== 'undefined' && data.date !== '') {
        filteredMoods = filteredMoods.filter(m => m.record_date === data.date);
      }
      
      console.log('After date filter - filteredMoods.length:', filteredMoods.length);
      console.log('filteredMoods:', filteredMoods);
      
      // 计算各心情类型的分布
      const distribution = {};
      for (let i = 1; i <= 6; i++) {
        distribution[i] = filteredMoods.filter(m => m.mood_type === i).length;
      }
      
      console.log('distribution:', distribution);
      
      // 计算统计数据
      const total_count = filteredMoods.length;
      console.log('total_count:', total_count);
      
      // 计算平均心情
      let avg_mood = 0;
      if (total_count > 0) {
        avg_mood = Math.round(filteredMoods.reduce((sum, m) => sum + m.mood_type, 0) / total_count);
      }
      
      // 计算最常心情
      let most_frequent = 0;
      let maxCount = 0;
      
      // 找出最大频数
      for (let i = 1; i <= 6; i++) {
        if (distribution[i] > maxCount) {
          maxCount = distribution[i];
        }
      }
      
      // 收集所有具有最大频数的心情类型
      const maxTypes = [];
      for (let i = 1; i <= 6; i++) {
        if (distribution[i] === maxCount && maxCount > 0) {
          maxTypes.push(i);
        }
      }
      
      // 如果只有一个类型，直接返回
      if (maxTypes.length === 1) {
        most_frequent = maxTypes[0];
      } else if (maxTypes.length > 1) {
        // 如果有多个类型频数相同，选择最新记录的那个
        let latestMood = null;
        for (const mood of filteredMoods) {
          if (maxTypes.includes(mood.mood_type)) {
            if (!latestMood || new Date(mood.created_at) > new Date(latestMood.created_at)) {
              latestMood = mood;
            }
          }
        }
        if (latestMood) {
          most_frequent = latestMood.mood_type;
        }
      }
      
      const resultData = {
        total_count,
        avg_mood,
        most_frequent,
        distribution
      };
      console.log('Final result:', resultData);
      
      return { 
        success: true, 
        message: '获取成功', 
        data: resultData
      };
    } catch (error) {
      console.error('统计API错误:', error);
      return { success: false, message: '获取失败' };
    }
  },

  '/api/mood/add': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const newMood = {
        id: getNextId('moods'),
        user_id: decoded.id,
        mood_type: data.mood_type,
        content: data.content || null,
        images: data.images ? JSON.stringify(data.images) : null,
        visibility: data.visibility || 1,
        record_date: data.record_date || getLocalDate(),
        record_time: data.record_time || new Date().toTimeString().split(' ')[0],
        created_at: new Date().toISOString()
      };
      dbData.moods.push(newMood);
      saveDB();

      return { success: true, message: '记录成功', data: newMood };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/mood/list': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      let moods = dbData.moods.filter(m => m.user_id === decoded.id);
      moods.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if (data.limit) {
        moods = moods.slice(0, parseInt(data.limit));
      }

      return { success: true, message: '获取成功', data: moods };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/mood/statistics': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const userMoods = dbData.moods.filter(m => m.user_id === decoded.id);
      const stats = {};
      for (let i = 1; i <= 6; i++) {
        stats[i] = userMoods.filter(m => m.mood_type === i).length;
      }

      return { success: true, message: '获取成功', data: stats };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/mood/day': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const date = data.date || new Date().toISOString().split('T')[0];
      
      const moods = dbData.moods.filter(
        m => m.user_id === decoded.id && m.record_date === date
      );
      moods.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { success: true, message: '获取成功', data: { moods: moods } };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/mood/calendar': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const userMoods = dbData.moods.filter(m => m.user_id === decoded.id);
      const calendarData = {};
      
      for (const mood of userMoods) {
        const date = mood.record_date;
        if (!calendarData[date]) {
          calendarData[date] = [];
        }
        calendarData[date].push(mood);
      }

      return { success: true, message: '获取成功', data: calendarData };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/mood/world': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const page = parseInt(data.page) || 1;
      const size = parseInt(data.size) || 20;
      
      // 获取所有公开的心情记录，排除自己的
      let worldMoods = dbData.moods.filter(m => 
        m.visibility === 1 && m.user_id !== decoded.id
      );
      
      // 按时间排序
      worldMoods.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // 分页
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedMoods = worldMoods.slice(start, end);
      
      // 添加用户信息
      const moodsWithUser = paginatedMoods.map(m => {
        const user = dbData.users.find(u => u.id === m.user_id);
        return {
          ...m,
          user: user ? {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar
          } : null
        };
      });

      return { success: true, message: '获取成功', data: moodsWithUser };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/diary/world': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const page = parseInt(data.page) || 1;
      const size = parseInt(data.size) || 20;
      
      // 获取所有公开的日记
      let worldDiaries = dbData.diaries.filter(d => 
        d.visibility === 3
      );
      
      // 按时间排序
      worldDiaries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // 分页
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedDiaries = worldDiaries.slice(start, end);
      
      // 添加用户信息
      const diariesWithUser = paginatedDiaries.map(d => {
        const user = dbData.users.find(u => u.id === d.user_id);
        return {
          ...d,
          user: user ? {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar
          } : null
        };
      });

      return { success: true, message: '获取成功', data: diariesWithUser };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/diary/add': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const newDiary = {
        id: getNextId('diaries'),
        user_id: decoded.id,
        title: data.title,
        content: data.content,
        mood_tag: data.mood_tag || null,
        background_images: data.background_images ? JSON.stringify(data.background_images) : null,
        visibility: data.visibility || 1,
        comment_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      dbData.diaries.push(newDiary);
      saveDB();

      return { success: true, message: '保存成功', data: newDiary };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/diary/user': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const targetUserId = parseInt(data.user_id);
      
      if (!targetUserId) return { success: false, message: '用户ID不能为空' };
      
      const isFriend = dbData.friends.some(
        f => ((f.user_id === decoded.id && f.friend_id === targetUserId) ||
              (f.user_id === targetUserId && f.friend_id === decoded.id)) && f.status === 1
      );
      
      let visibilityFilter = [3];
      if (isFriend) {
        visibilityFilter = [2, 3];
      }
      
      let diaries = dbData.diaries.filter(
        d => d.user_id === targetUserId && visibilityFilter.includes(d.visibility)
      );
      
      diaries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return { success: true, message: '获取成功', data: diaries };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/diary/list': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      let diaries = dbData.diaries.filter(d => d.user_id === decoded.id);
      
      // 根据可见性筛选
      if (data.visibility !== undefined && data.visibility !== null && data.visibility !== '') {
        const visibility = parseInt(data.visibility);
        if (visibility > 0) {
          diaries = diaries.filter(d => d.visibility === visibility);
        }
      }
      
      // 根据关键词搜索
      if (data.keyword) {
        const keyword = data.keyword.toLowerCase();
        diaries = diaries.filter(d => 
          (d.title && d.title.toLowerCase().includes(keyword)) ||
          (d.content && d.content.toLowerCase().includes(keyword))
        );
      }
      
      diaries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if (data.limit) {
        diaries = diaries.slice(0, parseInt(data.limit));
      }

      return { success: true, message: '获取成功', data: diaries };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/diary/detail': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      jwt.verify(token, JWT_SECRET);
      
      const diary = dbData.diaries.find(d => d.id === parseInt(data.id));
      if (!diary) return { success: false, message: '日记不存在' };

      return { success: true, message: '获取成功', data: diary };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/diary/update': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const index = dbData.diaries.findIndex(d => d.id === data.id && d.user_id === decoded.id);
      if (index === -1) return { success: false, message: '日记不存在或无权限' };

      const updates = {};
      if (data.title !== undefined) updates.title = data.title;
      if (data.content !== undefined) updates.content = data.content;
      if (data.mood_tag !== undefined) updates.mood_tag = data.mood_tag;
      if (data.background_images !== undefined) updates.background_images = JSON.stringify(data.background_images);
      if (data.visibility !== undefined) updates.visibility = data.visibility;
      updates.updated_at = new Date().toISOString();

      dbData.diaries[index] = { ...dbData.diaries[index], ...updates };
      saveDB();

      return { success: true, message: '更新成功', data: dbData.diaries[index] };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/diary/delete': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const index = dbData.diaries.findIndex(d => d.id === data.id && d.user_id === decoded.id);
      if (index === -1) return { success: false, message: '日记不存在或无权限' };

      dbData.diaries.splice(index, 1);
      dbData.diary_comments = dbData.diary_comments.filter(c => c.diary_id !== data.id);
      saveDB();

      return { success: true, message: '删除成功' };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/comment/add': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const diary = dbData.diaries.find(d => d.id === parseInt(data.diary_id));
      if (!diary) return { success: false, message: '日记不存在' };

      const newComment = {
        id: getNextId('diary_comments'),
        diary_id: parseInt(data.diary_id),
        user_id: decoded.id,
        content: data.content,
        created_at: new Date().toISOString()
      };
      dbData.diary_comments.push(newComment);
      
      const diaryIndex = dbData.diaries.findIndex(d => d.id === parseInt(data.diary_id));
      if (diaryIndex !== -1) {
        dbData.diaries[diaryIndex].comment_count++;
      }
      saveDB();

      return { success: true, message: '评论成功', data: newComment };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/comment/list': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      jwt.verify(token, JWT_SECRET);
      
      let comments = dbData.diary_comments.filter(c => c.diary_id === parseInt(data.diary_id));
      comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const commentsWithUser = comments.map(c => {
        const user = dbData.users.find(u => u.id === c.user_id);
        return {
          ...c,
          user: user ? { id: user.id, nickname: user.nickname, avatar: user.avatar } : null
        };
      });

      return { success: true, message: '获取成功', data: commentsWithUser };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/comment/delete': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const comment = dbData.diary_comments.find(c => c.id === data.id);
      if (!comment) return { success: false, message: '评论不存在' };
      if (comment.user_id !== decoded.id) return { success: false, message: '无权限删除' };

      dbData.diary_comments = dbData.diary_comments.filter(c => c.id !== data.id);
      
      const diaryIndex = dbData.diaries.findIndex(d => d.id === comment.diary_id);
      if (diaryIndex !== -1 && dbData.diaries[diaryIndex].comment_count > 0) {
        dbData.diaries[diaryIndex].comment_count--;
      }
      saveDB();

      return { success: true, message: '删除成功' };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/friend/add': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const targetUser = dbData.users.find(u => u.username === data.username);
      if (!targetUser) return { success: false, message: '用户不存在' };
      if (targetUser.id === decoded.id) return { success: false, message: '不能添加自己为好友' };

      const existing = dbData.friends.find(
        f => (f.user_id === decoded.id && f.friend_id === targetUser.id) ||
             (f.user_id === targetUser.id && f.friend_id === decoded.id)
      );
      if (existing) return { success: false, message: '已发送过好友请求或已是好友' };

      const newFriend = {
        id: getNextId('friends'),
        user_id: decoded.id,
        friend_id: targetUser.id,
        status: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      dbData.friends.push(newFriend);
      saveDB();

      return { success: true, message: '好友请求已发送', data: newFriend };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/friend/accept': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 支持两种参数格式：request_id（记录ID）或 user_id（发送请求的用户ID）
      let index = -1;
      if (data.request_id !== undefined) {
        // 通过请求记录ID查找
        index = dbData.friends.findIndex(
          f => f.id === parseInt(data.request_id) && f.friend_id === decoded.id && f.status === 0
        );
      } else if (data.user_id !== undefined) {
        // 通过发送请求的用户ID查找
        index = dbData.friends.findIndex(
          f => f.user_id === parseInt(data.user_id) && f.friend_id === decoded.id && f.status === 0
        );
      }
      
      if (index === -1) return { success: false, message: '好友请求不存在' };

      dbData.friends[index].status = 1;
      dbData.friends[index].updated_at = new Date().toISOString();
      saveDB();

      return { success: true, message: '已接受好友请求' };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/friend/reject': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 支持两种参数格式：request_id（记录ID）或 user_id（发送请求的用户ID）
      if (data.request_id !== undefined) {
        // 通过请求记录ID删除
        dbData.friends = dbData.friends.filter(
          f => !(f.id === parseInt(data.request_id) && f.friend_id === decoded.id && f.status === 0)
        );
      } else if (data.user_id !== undefined) {
        // 通过发送请求的用户ID删除
        dbData.friends = dbData.friends.filter(
          f => !((f.user_id === parseInt(data.user_id) && f.friend_id === decoded.id) ||
                 (f.user_id === decoded.id && f.friend_id === parseInt(data.user_id)))
        );
      }
      saveDB();

      return { success: true, message: '已拒绝好友请求' };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/friend/list': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const friends = dbData.friends.filter(
        f => (f.user_id === decoded.id || f.friend_id === decoded.id) && f.status === 1
      );

      const friendList = friends.map(f => {
        const friendId = f.user_id === decoded.id ? f.friend_id : f.user_id;
        const user = dbData.users.find(u => u.id === friendId);
        return {
          friend_id: friendId,
          nickname: user?.nickname || '未知',
          avatar: user?.avatar || null,
          created_at: f.created_at
        };
      });

      return { success: true, message: '获取成功', data: friendList };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/friend/pending': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const pending = dbData.friends.filter(f => f.friend_id === decoded.id && f.status === 0);

      const pendingList = pending.map(f => {
        const user = dbData.users.find(u => u.id === f.user_id);
        return {
          user_id: f.user_id,
          nickname: user?.nickname || '未知',
          avatar: user?.avatar || null,
          created_at: f.created_at
        };
      });

      return { success: true, message: '获取成功', data: pendingList };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/friend/delete': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const friendId = parseInt(data.friend_id);
      
      dbData.friends = dbData.friends.filter(
        f => !((f.user_id === decoded.id && f.friend_id === friendId) ||
               (f.user_id === friendId && f.friend_id === decoded.id))
      );
      saveDB();

      return { success: true, message: '已删除好友' };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/friend/request': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const toUserId = parseInt(data.to_user_id);
      
      const targetUser = dbData.users.find(u => u.id === toUserId);
      if (!targetUser) return { success: false, message: '用户不存在' };
      if (targetUser.id === decoded.id) return { success: false, message: '不能添加自己为好友' };

      const existing = dbData.friends.find(
        f => ((f.user_id === decoded.id && f.friend_id === targetUser.id) ||
             (f.user_id === targetUser.id && f.friend_id === decoded.id))
      );
      if (existing) return { success: false, message: '已发送过好友请求或已是好友' };

      const newFriend = {
        id: getNextId('friends'),
        user_id: decoded.id,
        friend_id: targetUser.id,
        status: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      dbData.friends.push(newFriend);
      saveDB();

      return { success: true, message: '好友请求已发送', data: newFriend };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/friend/requests': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const pending = dbData.friends.filter(f => f.friend_id === decoded.id && f.status === 0);

      const pendingList = pending.map(f => {
        const user = dbData.users.find(u => u.id === f.user_id);
        return {
          id: f.id,
          user_id: f.user_id,
          nickname: user?.nickname || '未知',
          avatar: user?.avatar || null,
          created_at: f.created_at
        };
      });

      return { success: true, message: '获取成功', data: pendingList };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/chat/send': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const toUserId = parseInt(data.to_user_id);
      
      const isFriend = dbData.friends.some(
        f => ((f.user_id === decoded.id && f.friend_id === toUserId) ||
              (f.user_id === toUserId && f.friend_id === decoded.id)) && f.status === 1
      );
      if (!isFriend) return { success: false, message: '不是好友，无法发送消息' };

      const newMessage = {
        id: getNextId('messages'),
        from_user_id: decoded.id,
        to_user_id: toUserId,
        content: data.content,
        is_read: 0,
        created_at: new Date().toISOString()
      };
      dbData.messages.push(newMessage);
      saveDB();

      return { success: true, message: '发送成功', data: newMessage };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/chat/list': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const toUserId = parseInt(data.to_user_id);
      
      const messages = dbData.messages.filter(
        m => m.from_user_id === decoded.id && m.to_user_id === toUserId ||
             m.from_user_id === toUserId && m.to_user_id === decoded.id
      );
      messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      dbData.messages.forEach(m => {
        if (m.to_user_id === decoded.id) {
          m.is_read = 1;
        }
      });
      saveDB();

      const messagesWithUser = messages.map(m => {
        const fromUser = dbData.users.find(u => u.id === m.from_user_id);
        return {
          ...m,
          from_user: fromUser ? { id: fromUser.id, nickname: fromUser.nickname, avatar: fromUser.avatar } : null
        };
      });

      return { success: true, message: '获取成功', data: messagesWithUser };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/chat/unread': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const unreadCount = dbData.messages.filter(
        m => m.to_user_id === decoded.id && m.is_read === 0
      ).length;

      return { success: true, message: '获取成功', data: { count: unreadCount } };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/chat/history': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const page = parseInt(data.page) || 1;
      const size = parseInt(data.size) || 20;
      const friendId = parseInt(data.friend_id);
      
      // 获取与好友的聊天记录
      let messages = dbData.messages.filter(
        m => (m.from_user_id === decoded.id && m.to_user_id === friendId) ||
             (m.from_user_id === friendId && m.to_user_id === decoded.id)
      );
      
      // 按时间排序
      messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      // 分页
      const start = (page - 1) * size;
      const end = start + size;
      const paginatedMessages = messages.slice(start, end);
      
      // 添加发送者信息
      const messagesWithUser = paginatedMessages.map(m => {
        const fromUser = dbData.users.find(u => u.id === m.from_user_id);
        return {
          ...m,
          from_user: fromUser ? {
            id: fromUser.id,
            nickname: fromUser.nickname,
            avatar: fromUser.avatar
          } : null
        };
      });

      return { success: true, message: '获取成功', data: messagesWithUser };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/chat/read': async (req, res, data) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return { success: false, message: '未登录' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 将指定用户发送的消息标记为已读
      dbData.messages.forEach(m => {
        if (m.from_user_id === data.from_user_id && m.to_user_id === decoded.id) {
          m.is_read = 1;
        }
      });
      saveDB();

      return { success: true, message: '已标记已读' };
    } catch {
      return { success: false, message: 'token无效' };
    }
  },

  '/api/suggestion/list': async (req, res, data) => {
    let suggestions = dbData.emotion_suggestions;
    
    if (data.mood_type !== undefined && data.mood_type !== 'undefined' && data.mood_type !== '{}') {
      const moodType = parseInt(data.mood_type);
      if (!isNaN(moodType)) {
        suggestions = suggestions.filter(s => s.mood_type === moodType);
      }
    }

    // 只返回一条随机建议
    if (suggestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * suggestions.length);
      suggestions = [suggestions[randomIndex]];
    }
    
    return { success: true, message: '获取成功', data: suggestions };
  }
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    let data = {};
    try {
      if (body) {
        data = JSON.parse(body);
      }
    } catch {
      data = {};
    }

    const mergedData = { ...query, ...data };

    // 记录所有请求
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${pathname} - ${JSON.stringify(mergedData)}`);

    if (routes[pathname]) {
      try {
        const result = await routes[pathname](req, res, mergedData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: '服务器错误' }));
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: '接口不存在' }));
    }
  });
});

initSuggestions();
console.log('情绪建议数据初始化完成');

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`局域网访问地址: http://192.168.253.1:${PORT}`);
});