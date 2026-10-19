<template>
  <view class="container">
    <view class="profile-header">
      <view class="avatar-section">
        <view class="avatar-lg">
          <image v-if="user.avatar" class="avatar-img-lg" :src="user.avatar" mode="aspectFill" />
          <text v-else class="avatar-default">👤</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ user.nickname || user.username || '用户' }}</text>
          <text class="user-id">ID: {{ user.id || '-' }}</text>
        </view>
      </view>
      <view class="edit-btn" @click="goToEdit">
        <text class="edit-icon">✏️</text>
      </view>
    </view>

    <view class="stats-row">
      <view class="stat-card" @click="goToAddMood">
        <text class="stat-value">{{ stats.moodCount }}</text>
        <text class="stat-label">记录天数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.diaryCount }}</text>
        <text class="stat-label">日记总数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.friendCount }}</text>
        <text class="stat-label">好友数</text>
      </view>
    </view>

    <view class="card">
      <view class="menu-list">
        <view class="menu-item" @click="goToMyDiary">
          <text class="menu-icon">📖</text>
          <text class="menu-text">我的日记</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goToStatistics">
          <text class="menu-icon">📊</text>
          <text class="menu-text">统计分析</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goToSettings">
          <text class="menu-icon">⚙️</text>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">快捷操作</view>
      <view class="action-grid">
        <view class="action-item" @click="goToAddMood">
          <text class="action-icon">😊</text>
          <text class="action-text">记录心情</text>
        </view>
        <view class="action-item" @click="goToWriteDiary">
          <text class="action-icon">✏️</text>
          <text class="action-text">写日记</text>
        </view>
        <view class="action-item" @click="goToWorld">
          <text class="action-icon">🌍</text>
          <text class="action-text">探索世界</text>
        </view>
        <view class="action-item" @click="goToFriends">
          <text class="action-icon">👥</text>
          <text class="action-text">好友</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <text class="footer-text">心语 v1.0.0</text>
    </view>

    <view class="modal-overlay" v-if="showSettings" @click="closeSettings">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">设置</text>
          <view class="close-btn" @click="closeSettings">
            <text class="close-icon">×</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="setting-item">
            <text class="setting-icon">👤</text>
            <view class="setting-info">
              <text class="setting-label">头像</text>
              <view class="setting-avatar">
                <image v-if="user.avatar" class="avatar-img" :src="user.avatar" mode="aspectFill" />
                <text v-else class="avatar-placeholder">👤</text>
              </view>
            </view>
          </view>
          <view class="setting-item">
            <text class="setting-icon">👤</text>
            <view class="setting-info">
              <text class="setting-label">昵称</text>
              <text class="setting-value">{{ user.nickname }}</text>
            </view>
          </view>
          <view class="setting-item">
            <text class="setting-icon">🎂</text>
            <view class="setting-info">
              <text class="setting-label">生日</text>
              <text class="setting-value">{{ user.birthday || '未设置' }}</text>
            </view>
          </view>
        </view>
        <view class="logout-btn" @click="logout">
          <text class="logout-text">退出登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useMoodStore } from '@/stores/mood'
import { useDiaryStore } from '@/stores/diary'
import { useFriendStore } from '@/stores/friend'
import { moodApi } from '@/api'

const userStore = useUserStore()
const moodStore = useMoodStore()
const diaryStore = useDiaryStore()
const friendStore = useFriendStore()

const user = ref({
  id: 0,
  username: '',
  nickname: '用户',
  avatar: '',
  birthday: ''
})

const stats = ref({
  moodCount: 0,
  diaryCount: 0,
  friendCount: 0
})

const showSettings = ref(false)

const loadUserInfo = () => {
  if (userStore.user) {
    user.value = {
      id: userStore.user.id,
      username: userStore.user.username || '',
      nickname: userStore.user.nickname,
      avatar: userStore.user.avatar || '',
      birthday: userStore.user.birthday || ''
    }
  }
}

const loadStats = async () => {
  await moodStore.fetchToday()
  await diaryStore.fetchList()
  await friendStore.fetchFriends()
  
  const statsResult = await moodApi.stats()
  const moodDays = statsResult?.totalDays || 0
  
  stats.value = {
    moodCount: moodDays,
    diaryCount: diaryStore.diaries.length,
    friendCount: friendStore.friends.length
  }
}

const goToEdit = () => {
  showSettings.value = false
  uni.navigateTo({ url: '/pages/profile/edit/index' })
}

const goToMyDiary = () => {
  uni.switchTab({ url: '/pages/diary/index' })
}

const goToStatistics = () => {
  uni.navigateTo({ url: '/pages/statistics/index' })
}

const goToSettings = () => {
  showSettings.value = true
}

const closeSettings = () => {
  showSettings.value = false
}

const goToAddMood = () => {
  const today = new Date().toISOString().split('T')[0]
  uni.navigateTo({ url: `/pages/mood/add/index?date=${today}` })
}

const goToWriteDiary = () => {
  uni.navigateTo({ url: '/pages/diary/write/index' })
}

const goToWorld = () => {
  uni.switchTab({ url: '/pages/world/index' })
}

const goToFriends = () => {
  uni.switchTab({ url: '/pages/friend/index' })
}



const logout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/index/index' })
      }
    }
  })
}

onMounted(() => {
  loadUserInfo()
  loadStats()
})

onShow(() => {
  loadUserInfo()
  loadStats()
})
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  padding: 0;
  min-height: 100vh;
  background: $bg-color;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 24rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar-lg {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img-lg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-default {
  font-size: 64rpx;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

.user-id {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.edit-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
}

.edit-icon {
  font-size: 28rpx;
}

.stats-row {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  margin-top: -32rpx;
}

.stat-card {
  flex: 1;
  background: $card-bg;
  border-radius: 20rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 600;
  color: $primary-dark;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: $text-light;
  margin-top: 8rpx;
}

.card {
  margin: 0 24rpx 20rpx;
  background: $card-bg;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
  display: block;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border-color;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: $text-primary;
}

.menu-arrow {
  font-size: 36rpx;
  color: $text-light;
}

.range-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.range-option {
  padding: 16rpx 28rpx;
  background: $bg-color;
  border-radius: 20rpx;
  border: 2rpx solid transparent;
  cursor: pointer;

  &.selected {
    background: rgba($primary-color, 0.1);
    border-color: $primary-color;
  }
}

.range-name {
  font-size: 26rpx;
  color: $text-secondary;

  .selected & {
    color: $primary-dark;
    font-weight: 500;
  }
}

.action-grid {
  display: flex;
  flex-wrap: wrap;
}

.action-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
  cursor: pointer;
}

.action-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.action-text {
  font-size: 24rpx;
  color: $text-secondary;
}

.footer {
  text-align: center;
  padding: 48rpx 0;
}

.footer-text {
  font-size: 24rpx;
  color: $text-light;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 80%;
  background: $card-bg;
  border-radius: 32rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid $border-color;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: $text-primary;
}

.close-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-icon {
  font-size: 40rpx;
  color: $text-light;
}

.modal-body {
  padding: 24rpx 32rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border-color;
  pointer-events: none;
  user-select: none;

  &:last-child {
    border-bottom: none;
  }
}

.setting-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
}

.setting-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.setting-label {
  font-size: 28rpx;
  color: $text-primary;
}

.setting-value {
  font-size: 24rpx;
  color: $text-light;
  margin-top: 4rpx;
}

.setting-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: $bg-color;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 32rpx;
}

.setting-arrow {
  font-size: 36rpx;
  color: $text-light;
}

.logout-btn {
  margin: 24rpx 32rpx 32rpx;
  padding: 24rpx;
  background: #FF6B6B;
  border-radius: 24rpx;
  text-align: center;
  cursor: pointer;
}

.logout-text {
  font-size: 30rpx;
  color: #fff;
}
</style>
