<template>
  <view class="container">
    <view class="form-card">
      <view class="form-item">
        <text class="form-label">昵称</text>
        <input 
          class="form-input" 
          v-model="nickname" 
          placeholder="请输入昵称"
          placeholder-class="input-placeholder"
        />
      </view>
      
      <view class="form-item">
        <text class="form-label">账号</text>
        <text class="form-display">{{ username || '未设置' }}</text>
      </view>
      
      <view class="form-item">
        <text class="form-label">ID</text>
        <text class="form-display">{{ userId || '-' }}</text>
      </view>
      
      <view class="form-item">
        <text class="form-label">生日</text>
        <view class="date-picker" @click="chooseBirthday">
          <text class="date-value">{{ birthday || '请选择生日' }}</text>
          <text class="date-arrow">›</text>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">头像</text>
        <view class="avatar-upload" @click="chooseAvatar">
          <view class="avatar-preview">
            <image v-if="avatar" class="avatar-image" :src="avatar" mode="aspectFill" />
            <text v-else class="avatar-icon">👤</text>
          </view>
          <text class="upload-text">更换头像</text>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">修改密码</text>
        <view class="password-link" @click="showChangePassword">
          <text class="password-text">点击修改</text>
          <text class="password-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="submit-btn" @click="submitProfile">
      <text class="submit-text">保存修改</text>
    </view>

    <!-- 修改密码弹窗 -->
    <view class="modal-overlay" v-if="showPasswordModal" @click="closePasswordModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">修改密码</text>
          <text class="modal-close" @click="closePasswordModal">×</text>
        </view>
        <view class="modal-body">
          <view class="modal-form-item">
            <text class="modal-label">原密码</text>
            <input 
              class="modal-input" 
              v-model="oldPassword" 
              type="password"
              placeholder="请输入原密码"
              placeholder-class="modal-placeholder"
            />
          </view>
          <view class="modal-form-item">
            <text class="modal-label">新密码</text>
            <input 
              class="modal-input" 
              v-model="newPassword" 
              type="password"
              placeholder="请输入新密码"
              placeholder-class="modal-placeholder"
            />
          </view>
          <view class="modal-form-item">
            <text class="modal-label">确认新密码</text>
            <input 
              class="modal-input" 
              v-model="confirmPassword" 
              type="password"
              placeholder="请再次输入新密码"
              placeholder-class="modal-placeholder"
            />
          </view>
        </view>
        <view class="modal-footer">
          <view class="modal-btn modal-btn-cancel" @click="closePasswordModal">
            <text>取消</text>
          </view>
          <view class="modal-btn modal-btn-confirm" @click="submitChangePassword">
            <text>确认修改</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const nickname = ref('')
const username = ref('')
const userId = ref<number | string>('')
const birthday = ref('')
const avatar = ref('')

// 修改密码相关
const showPasswordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

onMounted(() => {
  if (userStore.user) {
    nickname.value = userStore.user.nickname || ''
    username.value = userStore.user.username || ''
    userId.value = userStore.user.id || ''
    birthday.value = userStore.user.birthday || ''
    avatar.value = userStore.user.avatar || ''
  }
})

const chooseBirthday = () => {
  const currentDate = birthday.value || new Date().toISOString().split('T')[0]
  uni.showModal({
    title: '选择生日',
    editable: true,
    placeholderText: '请输入日期 (YYYY-MM-DD)',
    success: (res) => {
      if (res.confirm && res.content) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (dateRegex.test(res.content)) {
          birthday.value = res.content
        } else {
          uni.showToast({ title: '日期格式不正确', icon: 'none' })
        }
      }
    }
  })
}

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      avatar.value = res.tempFilePaths[0]
    }
  })
}

const showChangePassword = () => {
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

const submitChangePassword = async () => {
  if (!oldPassword.value.trim()) {
    uni.showToast({ title: '请输入原密码', icon: 'none' })
    return
  }
  
  if (!newPassword.value.trim()) {
    uni.showToast({ title: '请输入新密码', icon: 'none' })
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }

  if (newPassword.value.length < 6) {
    uni.showToast({ title: '密码长度不能少于6位', icon: 'none' })
    return
  }

  uni.showLoading({ title: '修改中...' })

  try {
    await userStore.changePassword(oldPassword.value, newPassword.value)
    
    uni.hideLoading()
    uni.showToast({ title: '修改成功', icon: 'success' })
    closePasswordModal()
  } catch (error) {
    uni.hideLoading()
    console.error('修改密码失败:', error)
    uni.showToast({ title: '修改失败', icon: 'none' })
  }
}

const submitProfile = async () => {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }

  uni.showLoading({ title: '保存中...' })

  try {
    const updateData: Record<string, any> = {
      nickname: nickname.value
    }
    
    if (birthday.value) {
      updateData.birthday = birthday.value
    }
    
    if (avatar.value && avatar.value !== userStore.user?.avatar) {
      updateData.avatar = avatar.value
    }

    await userStore.updateUser(updateData)
    
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    console.error('保存失败:', error)
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

.form-card {
  background: $card-bg;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border-color;

  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  font-size: 30rpx;
  color: $text-primary;
  font-weight: 500;
}

.form-input {
  font-size: 30rpx;
  color: $text-primary;
  text-align: right;
  flex: 1;
  margin-left: 24rpx;
}

.form-display {
  font-size: 30rpx;
  color: $text-secondary;
  text-align: right;
  flex: 1;
  margin-left: 24rpx;
}

.input-placeholder {
  color: $text-light;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  justify-content: flex-end;
  margin-left: 24rpx;
}

.date-value {
  font-size: 30rpx;
  color: $text-primary;
}

.date-arrow {
  font-size: 36rpx;
  color: $text-light;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-left: 24rpx;
  cursor: pointer;
}

.avatar-preview {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: $bg-color;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 40rpx;
}

.upload-text {
  font-size: 28rpx;
  color: $primary-color;
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
}

.submit-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.password-link {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  justify-content: flex-end;
  margin-left: 24rpx;
}

.password-text {
  font-size: 30rpx;
  color: $primary-color;
}

.password-arrow {
  font-size: 36rpx;
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
  width: 85%;
  max-width: 640rpx;
  background: $card-bg;
  border-radius: 32rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid $border-color;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: $text-primary;
}

.modal-close {
  font-size: 48rpx;
  color: $text-light;
  line-height: 1;
}

.modal-body {
  padding: 32rpx;
}

.modal-form-item {
  margin-bottom: 24rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.modal-label {
  font-size: 28rpx;
  color: $text-secondary;
  margin-bottom: 12rpx;
  display: block;
}

.modal-input {
  width: 100%;
  padding: 24rpx;
  border: 1rpx solid $border-color;
  border-radius: 16rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.modal-placeholder {
  color: $text-light;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid $border-color;
}

.modal-btn {
  flex: 1;
  padding: 28rpx;
  text-align: center;
  font-size: 32rpx;

  &-cancel {
    color: $text-secondary;
    border-right: 1rpx solid $border-color;
  }

  &-confirm {
    color: $primary-color;
    font-weight: 600;
  }
}
</style>
