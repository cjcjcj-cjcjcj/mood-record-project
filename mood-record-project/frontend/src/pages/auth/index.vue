<template>
  <view class="container">
    <view class="auth-container">
      <view class="logo-section">
        <view class="logo">
          <text class="logo-text">💝</text>
        </view>
        <text class="app-name">心语</text>
        <text class="app-desc">记录心情，分享生活</text>
      </view>

      <view class="form-container">
        <view class="tab-bar">
          <view 
            class="tab-item" 
            :class="{ active: isLoginMode }"
            @click="isLoginMode = true"
          >
            <text>登录</text>
          </view>
          <view 
            class="tab-item" 
            :class="{ active: !isLoginMode }"
            @click="isLoginMode = false"
          >
            <text>注册</text>
          </view>
        </view>

        <view class="input-group">
          <text class="input-icon">👤</text>
          <input 
            class="input-field" 
            v-model="username" 
            placeholder="请输入账号"
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="input-group">
          <text class="input-icon">🔑</text>
          <input 
            class="input-field" 
            v-model="password" 
            placeholder="请输入密码"
            password
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="input-group" v-if="!isLoginMode">
          <text class="input-icon">🔑</text>
          <input 
            class="input-field" 
            v-model="confirmPassword" 
            placeholder="请确认密码"
            password
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="input-group" v-if="!isLoginMode">
          <text class="input-icon">📝</text>
          <input 
            class="input-field" 
            v-model="nickname" 
            placeholder="请输入昵称（可选）"
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="submit-btn" @click="handleSubmit">
          <text class="submit-text">{{ isLoginMode ? '登 录' : '注 册' }}</text>
        </view>

        <view class="forgot-link" v-if="isLoginMode" @click="showForgotPassword">
          <text>忘记密码？</text>
        </view>
      </view>

      <view class="agreement">
        <text class="agreement-text">登录即表示同意</text>
        <text class="agreement-link">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isLoginMode = ref(true)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')

onMounted(() => {
  userStore.init()
  if (userStore.isLogin) {
    uni.switchTab({
      url: '/pages/index/index'
    })
  }
})

const handleSubmit = async () => {
  if (!username.value.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return
  }
  
  if (!password.value.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }

  if (!isLoginMode.value) {
    if (!confirmPassword.value.trim()) {
      uni.showToast({ title: '请确认密码', icon: 'none' })
      return
    }
    if (password.value !== confirmPassword.value) {
      uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
      return
    }
  }

  uni.showLoading({ title: isLoginMode.value ? '登录中...' : '注册中...' })

  try {
    let success = false
    
    if (isLoginMode.value) {
      success = await userStore.login(username.value, password.value)
    } else {
      success = await userStore.register(username.value, password.value, nickname.value || undefined)
    }

    uni.hideLoading()

    if (success) {
      if (isLoginMode.value) {
        uni.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 1500)
      } else {
        uni.showToast({ title: '注册成功，请登录', icon: 'success' })
        setTimeout(() => {
          isLoginMode.value = true
          password.value = ''
          confirmPassword.value = ''
          nickname.value = ''
        }, 1500)
      }
    } else {
      uni.showToast({
        title: isLoginMode.value ? '登录失败' : '注册失败',
        icon: 'none'
      })
    }
  } catch (error: any) {
    uni.hideLoading()
    console.error('操作失败:', error)
    uni.showToast({
      title: error?.message || (isLoginMode.value ? '登录失败' : '注册失败'),
      icon: 'none'
    })
  }
}

const showForgotPassword = () => {
  uni.showToast({ title: '请联系管理员重置密码，联系电话：11222111', icon: 'none', duration: 3000 })
}
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFF0F5 100%);
}

.auth-container {
  padding: 40rpx;
}

.logo-section {
  text-align: center;
  padding: 80rpx 0;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(255, 105, 180, 0.3);
}

.logo-text {
  font-size: 80rpx;
}

.app-name {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.app-desc {
  display: block;
  font-size: 28rpx;
  color: #666;
}

.form-container {
  background: white;
  border-radius: 32rpx;
  padding: 48rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.tab-bar {
  display: flex;
  margin-bottom: 40rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: 32rpx;
  color: #999;
  border-bottom: 4rpx solid transparent;
  transition: all 0.3s;

  &.active {
    color: $primary-color;
    border-bottom-color: $primary-color;
    font-weight: 600;
  }
}

.input-group {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  border-radius: 24rpx;
  padding: 0 28rpx;
  margin-bottom: 24rpx;
  height: 88rpx;
}

.input-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.input-field {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #333;
}

.input-placeholder {
  color: #ccc;
}

.submit-btn {
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  color: white;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba($primary-color, 0.3);
}

.submit-text {
  font-size: 34rpx;
  font-weight: 600;
}

.forgot-link {
  text-align: center;
  margin-top: 24rpx;
  
  text {
    font-size: 26rpx;
    color: $primary-color;
  }
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 48rpx;
  font-size: 24rpx;
  color: #999;
  flex-wrap: wrap;
}

.agreement-link {
  color: $primary-color;
  margin: 0 8rpx;
}
</style>
