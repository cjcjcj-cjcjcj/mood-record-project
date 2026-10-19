<template>
  <view class="container">
    <view class="header">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          v-model="keyword" 
          placeholder="搜索日记..."
          @confirm="searchDiary"
        />
      </view>
      <view class="write-btn" @click="goToWrite">
        <text class="write-icon">✏️</text>
      </view>
    </view>

    <view class="filter-bar">
      <view 
        class="filter-item" 
        v-for="(filter, index) in filters" 
        :key="index"
        :class="{ selected: currentFilter === filter.value }"
        @click="selectFilter(filter.value)"
      >
        <text class="filter-text">{{ filter.name }}</text>
      </view>
    </view>

    <view class="diary-list" v-if="diaries.length > 0">
      <view 
        class="diary-card" 
        v-for="diary in diaries" 
        :key="diary.id"
        @click="goToDetail(diary.id)"
      >
        <view class="diary-header">
          <text class="diary-title">{{ diary.title }}</text>
          <text class="diary-date">{{ formatDate(diary.created_at) }}</text>
        </view>
        <view class="diary-content">
          <text class="content-text">{{ diary.content.slice(0, 100) }}{{ diary.content.length > 100 ? '...' : '' }}</text>
        </view>
        <view class="diary-footer">
          <view class="mood-tag" v-if="diary.mood_tag" :style="{ backgroundColor: getMoodColor(diary.mood_tag) }">
            {{ getMoodLabel(diary.mood_tag) }}
          </view>
          <view class="diary-info">
            <text class="info-item">💬 {{ diary.comment_count }}</text>
            <text class="info-item" :class="visibilityClass(diary.visibility)">{{ visibilityLabel(diary.visibility) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-else>
      <text class="empty-icon">📖</text>
      <text class="empty-text">还没有日记</text>
      <view class="empty-btn" @click="goToWrite">
        <text class="empty-btn-text">写第一篇日记</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useDiaryStore } from '@/stores/diary'
import { useMoodStore } from '@/stores/mood'

const diaryStore = useDiaryStore()
const moodStore = useMoodStore()

const keyword = ref('')
const currentFilter = ref(0)
const diaries = ref<any[]>([])

const filters = [
  { name: '全部', value: 0 },
  { name: '公开', value: 3 },
  { name: '好友可见', value: 2 },
  { name: '私密', value: 1 }
]

const getMoodLabel = (type: number) => moodStore.getMoodLabel(type)
const getMoodColor = (type: number) => moodStore.getMoodColor(type)

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const visibilityLabel = (visibility: number) => {
  const labels: Record<number, string> = {
    1: '私密',
    2: '好友',
    3: '公开'
  }
  return labels[visibility] || '未知'
}

const visibilityClass = (visibility: number) => {
  const classes: Record<number, string> = {
    1: 'visibility-private',
    2: 'visibility-friend',
    3: 'visibility-public'
  }
  return classes[visibility] || ''
}

const selectFilter = (value: number) => {
  currentFilter.value = value
  loadDiaries()
}

const searchDiary = () => {
  loadDiaries()
}

const loadDiaries = async () => {
  const visibility = currentFilter.value === 0 ? undefined : currentFilter.value
  await diaryStore.fetchList(1, 20, keyword.value, visibility)
  diaries.value = diaryStore.diaries
}

const goToWrite = () => {
  uni.navigateTo({ url: '/pages/diary/write/index' })
}

const goToDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/diary/detail/index?id=${id}` })
}

onMounted(() => {
  loadDiaries()
})

onShow(() => {
  loadDiaries()
})
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  padding: 24rpx;
  min-height: 100vh;
  background: $bg-color;
}

.header {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: $card-bg;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: $text-primary;
}

.write-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba($primary-dark, 0.3);
  cursor: pointer;
}

.write-icon {
  font-size: 36rpx;
}

.filter-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.filter-item {
  padding: 16rpx 32rpx;
  background: $card-bg;
  border-radius: 20rpx;
  cursor: pointer;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;

  &.selected {
    background: rgba($primary-color, 0.1);
    border-color: $primary-color;
  }
}

.filter-text {
  font-size: 26rpx;
  color: $text-secondary;

  .selected & {
    color: $primary-dark;
    font-weight: 500;
  }
}

.diary-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.diary-card {
  background: $card-bg;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.diary-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}

.diary-date {
  font-size: 24rpx;
  color: $text-light;
}

.diary-content {
  margin-bottom: 16rpx;
}

.content-text {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.6;
}

.diary-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mood-tag {
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: #fff;
}

.diary-info {
  display: flex;
  gap: 16rpx;
}

.info-item {
  font-size: 24rpx;
  color: $text-light;

  &.visibility-private { color: #999; }
  &.visibility-friend { color: #1989fa; }
  &.visibility-public { color: #52c41a; }
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
  font-size: 32rpx;
  color: $text-light;
  margin-bottom: 32rpx;
}

.empty-btn {
  padding: 20rpx 48rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 24rpx;
}

.empty-btn-text {
  font-size: 28rpx;
  color: #fff;
}
</style>
