<template>
  <view class="container">
    <view class="card">
      <input 
        class="title-input" 
        v-model="title" 
        placeholder="日记标题"
        :maxlength="50"
      />
    </view>

    <view class="card">
      <text class="section-title">心情标签</text>
      <view class="mood-options">
        <view 
          class="mood-option" 
          v-for="(mood, index) in moodOptions" 
          :key="index"
          :class="{ selected: selectedMood === mood.type }"
          @click="selectMood(mood.type)"
        >
          <text class="mood-emoji">{{ mood.emoji }}</text>
          <text class="mood-name">{{ mood.name }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="section-title">日记内容</text>
      <textarea 
        class="content-input"
        v-model="content"
        placeholder="写下今天的心语..."
        :maxlength="2000"
        :auto-height="true"
      ></textarea>
      <text class="char-count">{{ content.length }}/2000</text>
    </view>

    <view class="card">
      <text class="section-title">可见范围</text>
      <view class="visibility-options">
        <view 
          class="visibility-option" 
          v-for="(option, index) in visibilityOptions" 
          :key="index"
          :class="{ selected: visibility === option.value }"
          @click="selectVisibility(option.value)"
        >
          <text class="visibility-icon">{{ option.icon }}</text>
          <text class="visibility-name">{{ option.name }}</text>
        </view>
      </view>
    </view>

    <view class="submit-btn" @click="submitDiary">
      <text class="submit-text">保存日记</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDiaryStore } from '@/stores/diary'

const diaryStore = useDiaryStore()

const title = ref('')
const content = ref('')
const selectedMood = ref<number | null>(null)
const visibility = ref(2)

const moodOptions = [
  { type: 1, name: '开心', emoji: '😊' },
  { type: 2, name: '平静', emoji: '😌' },
  { type: 3, name: '焦虑', emoji: '😰' },
  { type: 4, name: '难过', emoji: '😢' },
  { type: 5, name: '生气', emoji: '😠' },
  { type: 6, name: '烦躁', emoji: '😤' }
]

const visibilityOptions = [
  { value: 1, name: '私密', icon: '🔒' },
  { value: 2, name: '好友可见', icon: '👥' },
  { value: 3, name: '全部可见', icon: '🌍' }
]

const selectMood = (type: number) => {
  selectedMood.value = selectedMood.value === type ? null : type
}

const selectVisibility = (value: number) => {
  visibility.value = value
}

const submitDiary = async () => {
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }

  if (!content.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }

  const data = {
    title: title.value,
    content: content.value,
    mood_tag: selectedMood.value || undefined,
    visibility: visibility.value
  }

  const success = await diaryStore.addDiary(data)
  if (success) {
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } else {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
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
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
  display: block;
}

.title-input {
  width: 100%;
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
  padding: 8rpx 0;
}

.mood-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.mood-option {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: $bg-color;
  border-radius: 20rpx;
  border: 2rpx solid transparent;
  cursor: pointer;

  &.selected {
    border-color: $primary-color;
    background: rgba($primary-color, 0.1);
  }
}

.mood-emoji {
  font-size: 28rpx;
}

.mood-name {
  font-size: 26rpx;
  color: $text-primary;
}

.content-input {
  width: 100%;
  min-height: 300rpx;
  padding: 20rpx;
  background: $bg-color;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.6;
  box-sizing: border-box;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: $text-light;
  margin-top: 12rpx;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  width: calc(50% - 8rpx);
  aspect-ratio: 16/9;
  position: relative;
  border-radius: 16rpx;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.delete-icon {
  color: #fff;
  font-size: 32rpx;
  line-height: 1;
}

.image-add {
  width: calc(50% - 8rpx);
  aspect-ratio: 16/9;
  border: 2rpx dashed $border-color;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-icon {
  font-size: 40rpx;
  color: $text-light;
  margin-bottom: 8rpx;
}

.add-text {
  font-size: 24rpx;
  color: $text-light;
}

.visibility-options {
  display: flex;
  gap: 20rpx;
}

.visibility-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: $bg-color;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  cursor: pointer;

  &.selected {
    border-color: $primary-color;
    background: rgba($primary-color, 0.1);
  }
}

.visibility-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.visibility-name {
  font-size: 24rpx;
  color: $text-primary;
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
