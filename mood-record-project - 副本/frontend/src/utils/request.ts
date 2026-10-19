interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
}

// 根据平台设置API地址
let baseURL = 'http://localhost:3000/api'

// #ifdef MP-WEIXIN
// 微信小程序环境使用局域网IP
baseURL = 'http://10.23.140.224:3000/api'
// #endif

const getToken = (): string | null => {
  try {
    const storage = uni.getStorageSync('user')
    return storage?.token || null
  } catch {
    return null
  }
}

export const request = <T = any>(options: RequestOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = {}, headers = {}, timeout = 60000 } = options
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    }
    
    const token = getToken()
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }
    
    console.log('[Request] URL:', `${baseURL}${url}`)
    console.log('[Request] Method:', method)
    console.log('[Request] Data:', data)
    console.log('[Request] Token:', token ? '存在' : '不存在')
    
    uni.request({
      url: `${baseURL}${url}`,
      method,
      data,
      header: defaultHeaders,
      timeout,
      success: (res: any) => {
        console.log('[Response] Status:', res.statusCode)
        console.log('[Response] Data:', res.data)
        
        if (res.statusCode === 200) {
          const response = res.data as { success: boolean; message: string; data?: T }
          
          if (response.success) {
            resolve(response.data !== undefined ? response.data as T : (response as unknown as T))
          } else {
            if (response.message === 'Token已过期' || response.message === 'token无效或已过期' || response.message === '未授权访问') {
              uni.removeStorageSync('user')
              uni.reLaunch({ url: '/pages/auth/index' })
            }
            uni.showToast({
              title: response.message,
              icon: 'none'
            })
            reject(new Error(response.message))
          }
        } else {
          uni.showToast({
            title: `请求失败: ${res.statusCode}`,
            icon: 'none'
          })
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('[Request Error]', err)
        uni.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

export const get = <T = any>(url: string, data?: Record<string, any>): Promise<T> => {
  return request({ url, method: 'GET', data })
}

export const post = <T = any>(url: string, data?: Record<string, any>): Promise<T> => {
  return request({ url, method: 'POST', data })
}
