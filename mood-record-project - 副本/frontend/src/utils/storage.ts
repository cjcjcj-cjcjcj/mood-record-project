export interface UserStorage {
  user: {
    id: number
    nickname: string
    avatar?: string
    birthday?: string
    mood_display_range: string
    created_at?: string
  }
  token: string
  is_birthday: boolean
}

export const storage = {
  setUser: (data: UserStorage) => {
    try {
      uni.setStorageSync('user', data)
    } catch (e) {
      console.error('存储用户信息失败:', e)
    }
  },
  
  getUser: (): UserStorage | null => {
    try {
      const data = uni.getStorageSync('user')
      return data ? data : null
    } catch (e) {
      console.error('获取用户信息失败:', e)
      return null
    }
  },
  
  removeUser: () => {
    try {
      uni.removeStorageSync('user')
    } catch (e) {
      console.error('删除用户信息失败:', e)
    }
  },
  
  getToken: (): string | null => {
    const user = storage.getUser()
    return user?.token || null
  },
  
  getUserId: (): number | null => {
    const user = storage.getUser()
    return user?.user.id || null
  }
}
