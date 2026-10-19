<template>
  <view class="container">
    <view class="content-list">
      <view 
        class="content-card diary-card" 
        v-for="diary in diaryList" 
        :key="diary.id"
      >
        <view class="card-header">
          <view class="user-info" @click="goToProfile(diary.user_id)">
            <view class="user-avatar">
              <image v-if="diary.user?.avatar" class="avatar-img" :src="diary.user.avatar" mode="aspectFill" />
              <text v-else class="avatar-placeholder">{{ diary.user?.nickname?.charAt(0) || '?' }}</text>
            </view>
            <text class="user-name">{{ diary.user?.nickname || '用户' }}</text>
          </view>
          <text class="card-time">{{ formatTime(diary.created_at) }}</text>
        </view>
        
        <view class="diary-content">
          <text class="diary-title">{{ diary.title }}</text>
          <text class="diary-text">{{ diary.content.slice(0, 150) }}{{ diary.content.length > 150 ? '...' : '' }}</text>
        </view>

        <view class="diary-footer">
          <view class="mood-tag" v-if="diary.mood_tag" :style="{ backgroundColor: getMoodColor(diary.mood_tag) }">
            {{ getMoodLabel(diary.mood_tag) }}
          </view>
          <view class="diary-stats">
            <text class="stat-item">💬 {{ diary.comment_count }}</text>
          </view>
        </view>

        <view class="card-footer">
          <view class="action-btn" @click="goToDiaryDetail(diary.id)">
            <text class="action-icon">📖</text>
            <text class="action-text">查看详情</text>
          </view>
          <view class="action-btn" @click="showAddFriend(diary.user_id)" v-if="!isOwnDiary(diary.user_id)">
            <text class="action-icon">👋</text>
            <text class="action-text">加好友</text>
          </view>
        </view>
      </view>

      <view class="empty-state" v-if="diaryList.length === 0">
        <text class="empty-icon">📖</text>
        <text class="empty-text">还没有公开的日记</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMoodStore } from '@/stores/mood'
import { useDiaryStore } from '@/stores/diary'
import { useFriendStore } from '@/stores/friend'
import { useUserStore } from '@/stores/user'

const moodStore = useMoodStore()
const diaryStore = useDiaryStore()
const friendStore = useFriendStore()
const userStore = useUserStore()

const diaryList = ref<any[]>([])

const getMoodLabel = (type: number) => moodStore.getMoodLabel(type)
const getMoodColor = (type: number) => moodStore.getMoodColor(type)

const isOwnDiary = (user_id: number) => {
  return userStore.user?.id === user_id
}

const formatTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

const loadData = async () => {
  await diaryStore.fetchWorld(1, 20)
  diaryList.value = diaryStore.worldDiaries
}

const goToProfile = (user_id: number) => {
  uni.navigateTo({ url: `/pages/user/profile/index?id=${user_id}` })
}

const goToDiaryDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/diary/detail/index?id=${id}` })
}

const showAddFriend = (user_id: number) => {
  uni.showModal({
    title: '添加好友',
    content: '确定要发送好友请求吗？',
    success: (res) => {
      if (res.confirm) {
        friendStore.sendRequest(user_id)
      }
    }
  })
}

onMounted(() => {
  loadData()
})

onShow(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  padding: 0;
  min-height: 100vh;
  background: $bg-color;
}

.tab-bar {
  display: flex;
  background: $card-bg;
  padding: 16rpx 24rpx;
  gap: 24rpx;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tab-item {
  flex: 1;
  padding: 16rpx 0;
  text-align: center;
  border-radius: 20rpx;
  transition: all 0.3s ease;

  &.active {
    background: rgba($primary-color, 0.1);
  }
}

.tab-text {
  font-size: 30rpx;
  font-weight: 500;
  color: $text-secondary;

  .active & {
    color: $primary-dark;
  }
}

.content-list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.content-card {
  background: $card-bg;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  cursor: pointer;
}

.user-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: $primary-color;
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
  color: #fff;
  font-weight: 600;
}

.user-name {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
}

.card-time {
  font-size: 24rpx;
  color: $text-light;
}

.mood-card {
  .mood-content {
    display: flex;
    gap: 20rpx;
    margin-bottom: 20rpx;
  }

  .mood-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    flex-shrink: 0;
  }

  .mood-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .mood-label {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-primary;
  }

  .mood-text {
    font-size: 26rpx;
    color: $text-secondary;
    line-height: 1.5;
  }
}

.diary-card {
  .diary-content {
    margin-bottom: 16rpx;
  }

  .diary-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 12rpx;
    display: block;
  }

  .diary-text {
    font-size: 28rpx;
    color: $text-secondary;
    line-height: 1.6;
  }

  .diary-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid $border-color;
    margin-bottom: 16rpx;
  }

  .mood-tag {
    padding: 6rpx 16rpx;
    border-radius: 12rpx;
    font-size: 22rpx;
    color: #fff;
  }

  .diary-stats {
    display: flex;
    gap: 16rpx;
  }

  .stat-item {
    font-size: 24rpx;
    color: $text-light;
  }
}

.card-footer {
  display: flex;
  gap: 24rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: $bg-color;
  border-radius: 20rpx;
  cursor: pointer;
}

.action-icon {
  font-size: 28rpx;
}

.action-text {
  font-size: 26rpx;
  color: $text-secondary;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 30rpx;
  color: $text-light;
}
</style>
