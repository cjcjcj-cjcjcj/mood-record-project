<template>
  <view class="container">
    <view class="chat-header" v-if="friend">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="friend-info" @click="goToProfile">
        <view class="friend-avatar"></view>
        <text class="friend-name">{{ friend.nickname }}</text>
      </view>
      <view class="header-action">
        <text class="action-icon">⋯</text>
      </view>
    </view>

    <scroll-view 
      class="chat-content" 
      scroll-y 
      :scroll-into-view="scrollToId"
      scroll-with-animation
    >
      <view class="message-list">
        <view 
          class="message-item" 
          v-for="(msg, index) in messages" 
          :key="msg.id"
          :id="'msg-' + msg.id"
          :class="{ self: isSelf(msg.from_user_id) }"
        >
          <view class="message-avatar"></view>
          <view class="message-bubble">
            <text class="message-text">{{ msg.content }}</text>
            <text class="message-time">{{ formatTime(msg.created_at) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-bar">
      <input 
        class="message-input" 
        v-model="inputText" 
        placeholder="输入消息..."
        @confirm="sendMessage"
      />
      <view class="send-btn" :class="{ active: inputText.trim() }" @click="sendMessage">
        <text class="send-icon">➤</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFriendStore } from '@/stores/friend'
import { useUserStore } from '@/stores/user'

const friendStore = useFriendStore()
const userStore = useUserStore()

const friendId = ref(0)
const friend = ref<any>(null)
const messages = ref<any[]>([])
const inputText = ref('')
const scrollToId = ref('')

const isSelf = (fromUserId: number) => {
  return fromUserId === userStore.user?.id
}

const formatTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadMessages = async () => {
  if (friendId.value > 0) {
    await friendStore.fetchChatHistory(friendId.value)
    messages.value = friendStore.chatMessages
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messages.value.length > 0) {
      const lastMsg = messages.value[messages.value.length - 1]
      scrollToId.value = 'msg-' + lastMsg.id
    }
  })
}

const sendMessage = async () => {
  if (!inputText.value.trim()) return

  await friendStore.sendMessage(friendId.value, inputText.value)
  inputText.value = ''
  await loadMessages()
  scrollToBottom()
}

const goBack = () => {
  uni.navigateBack()
}

const goToProfile = () => {
  uni.navigateTo({ url: `/pages/user/profile/index?id=${friendId.value}` })
}

const findFriend = () => {
  const friends = friendStore.friends
  return friends.find(f => f.friend_id === friendId.value)
}

onLoad((options) => {
  if (options?.friend_id) {
    friendId.value = parseInt(options.friend_id)
    friend.value = findFriend()
    loadMessages()
  }
})

onMounted(() => {
  friend.value = findFriend()
  loadMessages()
})
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg-color;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: $card-bg;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-color;
  border-radius: 50%;
  cursor: pointer;
}

.back-icon {
  font-size: 40rpx;
  color: $text-primary;
}

.friend-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  cursor: pointer;
}

.friend-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: $primary-color;
}

.friend-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
}

.header-action {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon {
  font-size: 36rpx;
  color: $text-secondary;
}

.chat-content {
  flex: 1;
  padding: 24rpx;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.message-item {
  display: flex;
  gap: 16rpx;

  &.self {
    flex-direction: row-reverse;

    .message-bubble {
      background: linear-gradient(135deg, $primary-color, $primary-dark);
      border-radius: 24rpx 24rpx 8rpx 24rpx;

      .message-text {
        color: #fff;
      }

      .message-time {
        color: rgba(255, 255, 255, 0.7);
      }
    }
  }
}

.message-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $primary-color;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 70%;
  padding: 20rpx 24rpx;
  background: $card-bg;
  border-radius: 24rpx 24rpx 24rpx 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.message-text {
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.5;
  display: block;
}

.message-time {
  font-size: 22rpx;
  color: $text-light;
  text-align: right;
  margin-top: 8rpx;
  display: block;
}

.input-bar {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background: $card-bg;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.message-input {
  flex: 1;
  padding: 20rpx 28rpx;
  background: $bg-color;
  border-radius: 32rpx;
  font-size: 28rpx;
}

.send-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $border-color;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(135deg, $primary-color, $primary-dark);
  }
}

.send-icon {
  font-size: 32rpx;
  color: #fff;
}
</style>
