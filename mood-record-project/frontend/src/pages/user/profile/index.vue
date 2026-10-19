<template>
  <view class="container">
    <view class="profile-header" v-if="user">
      <view class="avatar-wrap">
        <view class="avatar-lg"></view>
      </view>
      <view class="user-info">
        <text class="user-name">{{ user.nickname && user.nickname.trim() ? user.nickname : user.username }}</text>
        <text class="user-id">ID: {{ user.id }}</text>
        <text class="user-birthday" v-if="user.birthday">🎂 {{ formatBirthday(user.birthday) }}</text>
      </view>
      <view class="action-btn" @click="handleAction">
        <text class="btn-text">{{ actionText }}</text>
      </view>
    </view>

    <view class="stats-card" v-if="user">
      <view class="stat-item">
        <text class="stat-value">{{ diaryCount }}</text>
        <text class="stat-label">日记</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ friendCount }}</text>
        <text class="stat-label">好友</text>
      </view>
    </view>

    <view class="card">
      <view class="section-header">
        <text class="section-title">日记</text>
      </view>
      <view class="diary-list" v-if="diaries.length > 0">
        <view 
          class="diary-item" 
          v-for="diary in diaries" 
          :key="diary.id"
          @click="goToDiary(diary.id)"
        >
          <view class="diary-content">
            <text class="diary-title">{{ diary.title }}</text>
            <text class="diary-preview">{{ diary.content.slice(0, 50) }}...</text>
          </view>
          <view class="diary-meta">
            <text class="diary-time">{{ formatDiaryTime(diary.created_at) }}</text>
            <text class="diary-visibility">{{ getVisibilityLabel(diary.visibility) }}</text>
          </view>
        </view>
      </view>
      <view class="empty-diaries" v-else>
        <text class="empty-text">暂无日记</text>
      </view>
    </view>

    <view class="card" v-if="isFriend && user">
      <view class="section-header">
        <text class="section-title">聊天</text>
      </view>
      <view class="chat-btn" @click="goToChat(user.id)">
        <text class="chat-text">💬 发送消息</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { userApi, diaryApi } from '@/api'
import { useFriendStore } from '@/stores/friend'
import { useUserStore } from '@/stores/user'

const friendStore = useFriendStore()
const userStore = useUserStore()

const userId = ref(0)
const user = ref<any>(null)
const diaries = ref<any[]>([])
const diaryCount = ref(0)
const friendCount = ref(0)
const isFriend = ref(false)
const isRequestSent = ref(false)

const actionText = computed(() => {
  if (isFriend.value) return '已成为好友'
  if (isRequestSent.value) return '请求已发送'
  return '加好友'
})

const formatBirthday = (birthday: string) => {
  const date = new Date(birthday)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const loadUser = async () => {
  if (userId.value > 0) {
    try {
      const result = await userApi.detail(userId.value)
      if (result) {
        user.value = result.user
        
        await loadDiaries()
        checkFriendStatus()
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }
}

const loadDiaries = async () => {
  if (userId.value > 0) {
    try {
      const result = await diaryApi.user(userId.value)
      diaries.value = result || []
      diaryCount.value = diaries.value.length
    } catch (error) {
      console.error('加载日记失败:', error)
    }
  }
}

const loadMoods = async () => {
  if (userId.value > 0) {
    const range = user.value?.mood_display_range || 'all'
    let endDate = new Date()
    let startDate = new Date()
    
    switch (range) {
      case 'day':
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        startDate = new Date('2000-01-01')
    }
    
    const startStr = formatDateStr(startDate)
    const endStr = formatDateStr(endDate)
    
    try {
      const result = await userApi.detail(userId.value)
      moods.value = result.moods || []
      moodCount.value = moods.value.length
    } catch (error) {
      console.error('加载心情失败:', error)
    }
  }
}

const formatDateStr = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const checkFriendStatus = async () => {
  if (userId.value === userStore.user?.id) {
    isFriend.value = true
    return
  }
  
  await friendStore.fetchFriends()
  const friends = friendStore.friends
  isFriend.value = friends.some(f => f.friend_id === userId.value)
  
  await friendStore.fetchRequests()
  const requests = friendStore.requests
  isRequestSent.value = requests.some(r => r.to_user_id === userId.value)
}

const goToDiary = (diaryId: number) => {
  uni.navigateTo({ url: `/pages/diary/detail/index?id=${diaryId}` })
}

const formatDiaryTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${hour}:${minute}`
}

const getVisibilityLabel = (visibility: number) => {
  const labels: Record<number, string> = {
    1: '私密',
    2: '好友可见',
    3: '公开'
  }
  return labels[visibility] || '未知'
}

const handleAction = () => {
  if (isFriend.value) return
  if (isRequestSent.value) return
  
  friendStore.sendRequest(userId.value)
  isRequestSent.value = true
}

const goToChat = (friendId: number) => {
  uni.navigateTo({ url: `/pages/chat/index?friend_id=${friendId}` })
}

onLoad((options) => {
  if (options?.id) {
    userId.value = parseInt(options.id)
    loadUser()
  }
})

onMounted(() => {
  loadUser()
})
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  padding: 24rpx;
  min-height: 100vh;
  background: $bg-color;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx;
  background: $card-bg;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.avatar-wrap {
  flex-shrink: 0;
}

.avatar-lg {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
}

.user-id {
  font-size: 24rpx;
  color: $text-light;
}

.user-birthday {
  font-size: 24rpx;
  color: $text-secondary;
}

.action-btn {
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 24rpx;
  cursor: pointer;
}

.btn-text {
  font-size: 28rpx;
  color: #fff;
}

.stats-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 32rpx;
  background: $card-bg;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 600;
  color: $primary-dark;
}

.stat-label {
  font-size: 24rpx;
  color: $text-light;
  margin-top: 8rpx;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: $border-color;
}

.card {
  background: $card-bg;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
}

.section-subtitle {
  font-size: 24rpx;
  color: $text-light;
}

.mood-timeline {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.mood-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mood-date {
  width: 80rpx;
  font-size: 24rpx;
  color: $text-light;
}

.mood-dots {
  width: 48rpx;
  display: flex;
  justify-content: center;
}

.mood-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
}

.mood-label {
  font-size: 26rpx;
  color: $text-primary;
}

.empty-moods {
  text-align: center;
  padding: 32rpx 0;
}

.empty-text {
  font-size: 26rpx;
  color: $text-light;
}

.chat-btn {
  padding: 20rpx;
  background: rgba($primary-color, 0.1);
  border-radius: 16rpx;
  text-align: center;
  cursor: pointer;
}

.chat-text {
  font-size: 28rpx;
  color: $primary-dark;
}

.diary-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.diary-item {
  padding: 20rpx;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 16rpx;
  cursor: pointer;
  transition: background 0.2s;
  
  &:active {
    background: rgba(0, 0, 0, 0.05);
  }
}

.diary-content {
  margin-bottom: 12rpx;
}

.diary-title {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 8rpx;
  display: block;
}

.diary-preview {
  font-size: 24rpx;
  color: $text-light;
  display: block;
}

.diary-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diary-time {
  font-size: 22rpx;
  color: $text-light;
}

.diary-visibility {
  font-size: 22rpx;
  color: $primary-dark;
  padding: 4rpx 12rpx;
  background: rgba($primary-color, 0.1);
  border-radius: 20rpx;
}

.empty-diaries {
  text-align: center;
  padding: 32rpx 0;
}
</style>
