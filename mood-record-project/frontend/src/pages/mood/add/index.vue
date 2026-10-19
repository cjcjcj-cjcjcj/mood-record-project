<template>
  <view class="container">
    <view class="card mood-select-card">
      <text class="section-title">选择心情</text>
      <view class="mood-grid">
        <view 
          class="mood-item" 
          v-for="(mood, index) in moodOptions" 
          :key="index"
          :class="{ selected: selectedMood === mood.type }"
          @click="selectMood(mood.type)"
        >
          <view class="mood-emoji">{{ mood.emoji }}</view>
          <text class="mood-name">{{ mood.name }}</text>
        </view>
      </view>
    </view>

    <view class="submit-btn" @click="submitMood">
      <text class="submit-text">记录心情</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMoodStore } from '@/stores/mood'

const moodStore = useMoodStore()

const selectedMood = ref<number>(1)
const recordDate = ref<string>(new Date().toISOString().split('T')[0])

const moodOptions = [
  { type: 1, name: '开心', emoji: '😊' },
  { type: 2, name: '平静', emoji: '😌' },
  { type: 3, name: '焦虑', emoji: '😰' },
  { type: 4, name: '难过', emoji: '😢' },
  { type: 5, name: '生气', emoji: '😠' },
  { type: 6, name: '烦躁', emoji: '😤' }
]

const selectMood = (type: number) => {
  selectedMood.value = type
}

const submitMood = async () => {
  console.log('[Submit Mood] recordDate:', recordDate.value)
  const data = {
    mood_type: selectedMood.value,
    record_date: recordDate.value
  }

  const success = await moodStore.addMood(data)
  if (success) {
    uni.showToast({ title: '记录成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } else {
    uni.showToast({ title: '记录失败', icon: 'none' })
  }
}

const getUrlParams = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage?.options || currentPage?.$page?.options || {}
  console.log('[Mood Add] getUrlParams options:', options)
  if (options?.date) {
    recordDate.value = options.date
  }
}

onLoad((options: any) => {
  console.log('[Mood Add] onLoad options:', options)
  if (options?.date) {
    recordDate.value = options.date
  }
})

onMounted(() => {
  getUrlParams()
  console.log('[Mood Add] onMounted recordDate:', recordDate.value)
})
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  padding: 24rpx;
  min-height: 100vh;
  background: $bg-color;
  padding-bottom: 160rpx;
}

.card {
  background: $card-bg;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 24rpx;
  display: block;
}

.mood-select-card {
  .mood-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  .mood-item {
    width: calc(33.33% - 14rpx);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24rpx;
    background: $bg-color;
    border-radius: 24rpx;
    border: 3rpx solid transparent;
    transition: all 0.3s ease;
    cursor: pointer;

    &.selected {
      border-color: $primary-color;
      background: rgba($primary-color, 0.1);
    }
  }

  .mood-emoji {
    font-size: 56rpx;
    margin-bottom: 12rpx;
  }

  .mood-name {
    font-size: 28rpx;
    color: $text-primary;
    font-weight: 500;
  }
}

.submit-btn {
  position: fixed;
  bottom: 40rpx;
  left: 24rpx;
  right: 24rpx;
  padding: 28rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 32rpx;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba($primary-dark, 0.3);
  cursor: pointer;
}

.submit-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}
</style>