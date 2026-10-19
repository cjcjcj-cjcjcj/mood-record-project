<template>
  <view class="container">
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input 
        class="search-input" 
        v-model="searchId" 
        placeholder="搜索用户ID..."
        type="number"
        @confirm="searchUser"
      />
      <view class="search-btn" @click="searchUser">
        <text class="btn-text">搜索</text>
      </view>
    </view>

    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'friends' }"
        @click="switchTab('friends')"
      >
        <text class="tab-text">好友</text>
        <text class="tab-badge" v-if="friends.length > 0">{{ friends.length }}</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'requests' }"
        @click="switchTab('requests')"
      >
        <text class="tab-text">好友请求</text>
        <text class="tab-badge request-badge" v-if="requests.length > 0">{{ requests.length }}</text>
      </view>
    </view>

    <view class="content" v-if="activeTab === 'friends'">
      <view class="friend-list" v-if="friends.length > 0">
        <view 
          class="friend-item" 
          v-for="friend in friends" 
          :key="friend.friend_id"
          @click="goToChat(friend.friend_id)"
        >
          <view class="friend-avatar"></view>
          <view class="friend-info">
            <text class="friend-name">{{ friend.nickname }}</text>
            <text class="friend-id">ID: {{ friend.friend_id }}</text>
          </view>
          <view class="friend-actions">
            <view class="action-item" @click.stop="goToProfile(friend.friend_id)">
              <text class="action-icon">👤</text>
            </view>
            <view class="action-item" @click.stop="showDeleteConfirm(friend.friend_id)">
              <text class="action-icon">🗑️</text>
            </view>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text class="empty-icon">👥</text>
        <text class="empty-text">还没有好友</text>
        <text class="empty-tip">去世界页添加好友吧~</text>
      </view>
    </view>

    <view class="content" v-else>
      <view class="request-list" v-if="requests.length > 0">
        <view 
          class="request-item" 
          v-for="request in requests" 
          :key="request.id"
        >
          <view class="request-avatar">
            <image v-if="request.avatar" class="avatar-img" :src="request.avatar" mode="aspectFill" />
            <text v-else class="avatar-placeholder">{{ request.nickname?.charAt(0) || '?' }}</text>
          </view>
          <view class="request-info">
            <text class="request-name">{{ request.nickname || '用户' }}</text>
            <text class="request-id">ID: {{ request.user_id }}</text>
          </view>
          <view class="request-actions">
            <view class="accept-btn" @click="acceptRequest(request.id)">
              <text class="btn-text">接受</text>
            </view>
            <view class="reject-btn" @click="rejectRequest(request.id)">
              <text class="btn-text">拒绝</text>
            </view>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text class="empty-icon">📬</text>
        <text class="empty-text">暂无好友请求</text>
      </view>
    </view>

    <view class="search-result" v-if="searchResult">
      <view class="result-card">
        <view class="result-avatar"></view>
        <view class="result-info">
          <text class="result-name">{{ searchResult.nickname }}</text>
          <text class="result-id">ID: {{ searchResult.id }}</text>
        </view>
        <view class="result-action" @click="sendRequest(searchResult.id)">
          <text class="btn-text">加好友</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useFriendStore } from '@/stores/friend'
import { userApi } from '@/api'

const friendStore = useFriendStore()

const activeTab = ref<'friends' | 'requests'>('friends')
const searchId = ref('')
const searchResult = ref<any>(null)
const friends = ref<any[]>([])
const requests = ref<any[]>([])

const switchTab = async (tab: 'friends' | 'requests') => {
  activeTab.value = tab
  searchResult.value = null
  await loadData()
}

const loadData = async () => {
  if (activeTab.value === 'friends') {
    await friendStore.fetchFriends()
    friends.value = friendStore.friends
  } else {
    await friendStore.fetchRequests()
    requests.value = friendStore.requests
  }
}

const searchUser = async () => {
  if (!searchId.value) {
    uni.showToast({ title: '请输入用户ID', icon: 'none' })
    return
  }

  try {
    const result = await userApi.search(parseInt(searchId.value))
    console.log('Search result:', result)
    if (result && result.id) {
      searchResult.value = {
        id: result.id,
        nickname: result.nickname || '用户',
        avatar: result.avatar
      }
      console.log('Search result set:', searchResult.value)
    } else {
      uni.showToast({ title: '未找到用户', icon: 'none' })
      searchResult.value = null
    }
  } catch (error) {
    console.error('Search error:', error)
    uni.showToast({ title: '搜索失败', icon: 'none' })
    searchResult.value = null
  }
}

const sendRequest = async (userId: number) => {
  await friendStore.sendRequest(userId)
  searchResult.value = null
  searchId.value = ''
}

const acceptRequest = async (requestId: number) => {
  await friendStore.acceptRequest(requestId)
  await loadData()
}

const rejectRequest = async (requestId: number) => {
  await friendStore.rejectRequest(requestId)
  await loadData()
}

const showDeleteConfirm = (friendId: number) => {
  uni.showModal({
    title: '删除好友',
    content: '确定要删除这位好友吗？',
    success: async (res) => {
      if (res.confirm) {
        await friendStore.deleteFriend(friendId)
        await loadData()
      }
    }
  })
}

const goToChat = (friendId: number) => {
  uni.navigateTo({ url: `/pages/chat/index?friend_id=${friendId}` })
}

const goToProfile = (userId: number) => {
  uni.navigateTo({ url: `/pages/user/profile/index?id=${userId}` })
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
  padding: 24rpx;
  min-height: 100vh;
  background: $bg-color;
}

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  padding: 20rpx 24rpx;
  background: $card-bg;
  border-radius: 24rpx;
  font-size: 28rpx;
}

.search-btn {
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 24rpx;
  cursor: pointer;
}

.btn-text {
  font-size: 28rpx;
  color: #fff;
}

.tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx;
  background: $card-bg;
  border-radius: 20rpx;
  cursor: pointer;
  border: 2rpx solid transparent;

  &.active {
    background: rgba($primary-color, 0.1);
    border-color: $primary-color;
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

.tab-badge {
  padding: 4rpx 12rpx;
  background: $primary-color;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #fff;

  &.request-badge {
    background: #FF6B6B;
  }
}

.content {
  min-height: 400rpx;
}

.friend-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: $card-bg;
  border-radius: 20rpx;
  cursor: pointer;
}

.friend-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: $primary-color;
}

.friend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.friend-name {
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
}

.friend-id {
  font-size: 24rpx;
  color: $text-light;
}

.friend-actions {
  display: flex;
  gap: 24rpx;
}

.action-item {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-color;
  border-radius: 50%;
  cursor: pointer;
}

.action-icon {
  font-size: 28rpx;
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.request-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: $card-bg;
  border-radius: 20rpx;
}

.request-avatar {
  width: 80rpx;
  height: 80rpx;
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

.request-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.request-name {
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
}

.request-id {
  font-size: 24rpx;
  color: $text-light;
}

.request-actions {
  display: flex;
  gap: 16rpx;
}

.accept-btn {
  padding: 16rpx 28rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 16rpx;
  cursor: pointer;
}

.reject-btn {
  padding: 16rpx 28rpx;
  background: $bg-color;
  border-radius: 16rpx;
  cursor: pointer;

  .btn-text {
    color: $text-secondary;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 30rpx;
  color: $text-light;
  margin-bottom: 8rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: $text-light;
}

.search-result {
  margin-top: 24rpx;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: rgba($primary-color, 0.1);
  border-radius: 20rpx;
  border: 2rpx solid $primary-color;
}

.result-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: $primary-color;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-name {
  font-size: 30rpx;
  font-weight: 500;
  color: $text-primary;
}

.result-id {
  font-size: 24rpx;
  color: $text-light;
}

.result-action {
  padding: 16rpx 28rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 16rpx;
  cursor: pointer;
}
</style>
