import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi, type User } from '@/api'
import { storage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const isBirthday = ref(false)
  const isLogin = ref(false)

  const init = () => {
    const stored = storage.getUser()
    if (stored) {
      user.value = stored.user
      token.value = stored.token
      isBirthday.value = stored.is_birthday
      isLogin.value = true
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const data = await userApi.login(username, password)
      if (data) {
        user.value = data.user
        token.value = data.token
        isBirthday.value = data.is_birthday
        isLogin.value = true
        storage.setUser(data)
        
        if (isBirthday.value) {
          uni.showToast({
            title: '生日快乐！🎉',
            icon: 'none',
            duration: 3000
          })
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  const register = async (username: string, password: string, nickname?: string) => {
    try {
      const data = await userApi.register(username, password, nickname)
      if (data) {
        user.value = data.user
        token.value = data.token
        isBirthday.value = data.is_birthday
        isLogin.value = true
        storage.setUser(data)
        return true
      }
      return false
    } catch (error) {
      console.error('注册失败:', error)
      return false
    }
  }

  const logout = () => {
    user.value = null
    token.value = ''
    isBirthday.value = false
    isLogin.value = false
    storage.removeUser()
    // 跳转到登录页面
    uni.reLaunch({
      url: '/pages/auth/index'
    })
  }

  const updateUser = async (data: Partial<User>) => {
    try {
      const result = await userApi.update(data)
      if (result && result.user) {
        user.value = result.user
        const stored = storage.getUser()
        if (stored) {
          stored.user = result.user
          storage.setUser(stored)
        }
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
    }
  }

  const updateSettings = async (mood_display_range: string) => {
    try {
      await userApi.settings({ mood_display_range })
      if (user.value) {
        user.value.mood_display_range = mood_display_range
        const stored = storage.getUser()
        if (stored) {
          stored.user.mood_display_range = mood_display_range
          storage.setUser(stored)
        }
      }
    } catch (error) {
      console.error('更新设置失败:', error)
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await userApi.changePassword({ oldPassword, newPassword })
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    }
  }

  return {
    user,
    token,
    isBirthday,
    isLogin,
    init,
    login,
    register,
    logout,
    updateUser,
    updateSettings,
    changePassword
  }
})
