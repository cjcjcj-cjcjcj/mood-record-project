<template>
  <view class="container">
    <view class="diary-card" v-if="diary">
      <view class="diary-header">
        <text class="diary-title">{{ diary.title }}</text>
        <text class="diary-date">{{ formatDate(diary.created_at) }}</text>
      </view>
      
      <view class="diary-content">
        <text class="content-text">{{ diary.content }}</text>
      </view>
      
      <view class="diary-footer">
        <view class="mood-tag" v-if="diary.mood_tag" :style="{ backgroundColor: getMoodColor(diary.mood_tag) }">
          {{ getMoodLabel(diary.mood_tag) }}
        </view>
        <text class="visibility-text">{{ visibilityLabel(diary.visibility) }}</text>
      </view>
    </view>

    <view class="comments-section" v-if="diary">
      <view class="section-header">
        <text class="section-title">评论 ({{ comments.length }})</text>
      </view>
      
      <view class="comment-input-bar">
        <input 
          class="comment-input" 
          v-model="commentContent" 
          placeholder="写下你的评论..."
          @confirm="submitComment"
        />
        <view class="send-btn" @click="submitComment">
          <text class="send-text">发送</text>
        </view>
      </view>

      <view class="comments-list" v-if="comments.length > 0">
        <view 
          class="comment-item" 
          v-for="comment in comments" 
          :key="comment.id"
        >
          <view class="comment-avatar">
            <image v-if="comment.user?.avatar" class="avatar-img" :src="comment.user.avatar" mode="aspectFill" />
            <text v-else class="avatar-placeholder">{{ comment.user?.nickname?.charAt(0) || '?' }}</text>
          </view>
          <view class="comment-content">
            <view class="comment-header">
              <text class="comment-nickname">{{ comment.user?.nickname || '用户' }}</text>
              <text class="comment-time">{{ formatDate(comment.created_at) }}</text>
            </view>
            <text class="comment-text">{{ comment.content }}</text>
          </view>
        </view>
      </view>

      <view class="empty-comments" v-else>
        <text class="empty-text">暂无评论，快来抢沙发吧~</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useDiaryStore } from '@/stores/diary'
import { useMoodStore } from '@/stores/mood'

const diaryStore = useDiaryStore()
const moodStore = useMoodStore()

const diaryId = ref(0)
const diary = ref<any>(null)
const comments = ref<any[]>([])
const commentContent = ref('')

const getMoodLabel = (type: number) => moodStore.getMoodLabel(type)
const getMoodColor = (type: number) => moodStore.getMoodColor(type)

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const visibilityLabel = (visibility: number) => {
  const labels: Record<number, string> = {
    1: '🔒 私密',
    2: '👥 好友可见',
    3: '🌍 全部可见'
  }
  return labels[visibility] || '未知'
}

const loadDiary = async () => {
  if (diaryId.value > 0) {
    await diaryStore.fetchDetail(diaryId.value)
    diary.value = diaryStore.diaryDetail
    await loadComments()
  }
}

const loadComments = async () => {
  if (diaryId.value > 0) {
    await diaryStore.fetchComments(diaryId.value)
    comments.value = diaryStore.comments
  }
}

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }

  const success = await diaryStore.addComment(diaryId.value, commentContent.value)
  if (success) {
    commentContent.value = ''
    uni.showToast({ title: '评论成功', icon: 'success' })
    loadComments()
  }
}

onLoad((options) => {
  if (options?.id) {
    diaryId.value = parseInt(options.id)
    loadDiary()
  }
})

onMounted(() => {
  loadDiary()
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

.diary-card {
  background: $card-bg;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.diary-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $text-primary;
}

.diary-date {
  font-size: 26rpx;
  color: $text-light;
}

.diary-content {
  margin-bottom: 24rpx;
}

.content-text {
  font-size: 30rpx;
  color: $text-primary;
  line-height: 1.8;
  white-space: pre-wrap;
}

.diary-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid $border-color;
}

.mood-tag {
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: #fff;
}

.visibility-text {
  font-size: 24rpx;
  color: $text-light;
}

.comments-section {
  background: $card-bg;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}

.comment-input-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.comment-input {
  flex: 1;
  padding: 20rpx 24rpx;
  background: $bg-color;
  border-radius: 24rpx;
  font-size: 28rpx;
}

.send-btn {
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 24rpx;
  cursor: pointer;
}

.send-text {
  font-size: 28rpx;
  color: #fff;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.comment-item {
  display: flex;
  gap: 16rpx;
}

.comment-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: $primary-color;
  flex-shrink: 0;
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

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.comment-nickname {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
}

.comment-time {
  font-size: 24rpx;
  color: $text-light;
}

.comment-text {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.5;
}

.empty-comments {
  text-align: center;
  padding: 48rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: $text-light;
}
</style>
