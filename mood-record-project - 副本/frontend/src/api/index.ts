import { get, post } from '@/utils/request'

export interface User {
  id: number
  nickname: string
  avatar?: string
  birthday?: string
  mood_display_range: string
  created_at?: string
}

export interface Mood {
  id: number
  user_id: number
  mood_type: number
  content?: string
  images?: string[]
  visibility: number
  record_date: string
  record_time: string
  created_at?: string
}

export interface Diary {
  id: number
  user_id: number
  title: string
  content: string
  mood_tag?: number
  background_images?: string[]
  visibility: number
  comment_count: number
  created_at?: string
  updated_at?: string
}

export interface Comment {
  id: number
  diary_id: number
  user_id: number
  content: string
  user?: User
  created_at?: string
}

export interface Message {
  id: number
  from_user_id: number
  to_user_id: number
  content: string
  is_read: number
  created_at?: string
}

export interface EmotionSuggestion {
  id: number
  mood_type: number
  suggestion: string
}

export const userApi = {
  login: (username: string, password: string) => post('/user/login', { username, password }),
  register: (username: string, password: string, nickname?: string) => post('/user/register', { username, password, nickname }),
  getInfo: () => get('/user/info'),
  update: (data: Partial<User>) => post('/user/update', data),
  settings: (data: { mood_display_range: string }) => post('/user/settings', data),
  detail: (user_id: number) => get('/user/detail', { user_id }),
  search: (user_id: number) => get('/user/search', { user_id }),
  changePassword: (data: { oldPassword: string; newPassword: string }) => post('/user/changePassword', data)
}

export const moodApi = {
  add: (data: { mood_type: number; content?: string; images?: string[]; visibility?: number }) => 
    post('/mood/add', data),
  today: () => get('/mood/today'),
  list: (start_date: string, end_date: string) => get('/mood/list', { start_date, end_date }),
  calendar: (month?: string) => get('/mood/calendar', month ? { month } : {}),
  day: (date: string) => get('/mood/day', { date }),
  stat: (type: string, date?: string) => get('/mood/stat', { type, date }),
  world: (page?: number, size?: number) => get('/mood/world', { page, size })
}

export const diaryApi = {
  list: (page?: number, size?: number, keyword?: string, visibility?: number) => {
    const params: Record<string, any> = {}
    if (page) params.page = page
    if (size) params.size = size
    if (keyword) params.keyword = keyword
    if (visibility !== undefined && visibility !== 0) params.visibility = visibility
    return get('/diary/list', params)
  },
  detail: (id: number) => get('/diary/detail', { id }),
  add: (data: { title: string; content: string; mood_tag?: number; background_images?: string[]; visibility?: number }) => 
    post('/diary/add', data),
  update: (data: { id: number; title?: string; content?: string; mood_tag?: number; background_images?: string[]; visibility?: number }) => 
    post('/diary/update', data),
  delete: (id: number) => post('/diary/delete', { id }),
  world: (page?: number, size?: number) => get('/diary/world', { page, size }),
  user: (user_id: number) => get('/diary/user', { user_id })
}

export const commentApi = {
  add: (diary_id: number, content: string) => post('/comment/add', { diary_id, content }),
  list: (diary_id: number, page?: number, size?: number) => 
    get('/comment/list', { diary_id, page, size }),
  delete: (id: number) => post('/comment/delete', { id })
}

export const friendApi = {
  list: () => get('/friend/list'),
  request: (to_user_id: number) => post('/friend/request', { to_user_id }),
  requests: () => get('/friend/requests'),
  accept: (request_id: number) => post('/friend/accept', { request_id }),
  reject: (request_id: number) => post('/friend/reject', { request_id }),
  delete: (friend_id: number) => post('/friend/delete', { friend_id })
}

export const chatApi = {
  send: (to_user_id: number, content: string) => post('/chat/send', { to_user_id, content }),
  history: (friend_id: number, page?: number, size?: number) => 
    get('/chat/history', { friend_id, page, size }),
  unread: () => get('/chat/unread'),
  read: (from_user_id: number) => post('/chat/read', { from_user_id })
}

export const suggestionApi = {
  list: (mood_type?: number) => get('/suggestion/list', mood_type ? { mood_type } : {})
}
