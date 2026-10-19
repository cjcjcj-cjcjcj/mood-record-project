import { defineStore } from 'pinia'
import { ref } from 'vue'
import { friendApi, chatApi, type User, type Message } from '@/api'

export const useFriendStore = defineStore('friend', () => {
  const friends = ref<User[]>([])
  const requests = ref<any[]>([])
  const chatMessages = ref<Message[]>([])
  const currentFriend = ref<User | null>(null)
  const unreadCount = ref(0)

  const fetchFriends = async () => {
    try {
      const result = await friendApi.list()
      if (result) {
        friends.value = result
      }
    } catch (error) {
      console.error('获取好友列表失败:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      const result = await friendApi.requests()
      if (result) {
        requests.value = result
      }
    } catch (error) {
      console.error('获取好友请求失败:', error)
    }
  }

  const sendRequest = async (to_user_id: number) => {
    try {
      await friendApi.request(to_user_id)
      uni.showToast({
        title: '已发送好友请求',
        icon: 'success'
      })
    } catch (error) {
      console.error('发送好友请求失败:', error)
    }
  }

  const acceptRequest = async (request_id: number) => {
    try {
      await friendApi.accept(request_id)
      await fetchRequests()
      await fetchFriends()
      uni.showToast({
        title: '已添加好友',
        icon: 'success'
      })
    } catch (error) {
      console.error('接受好友请求失败:', error)
    }
  }

  const rejectRequest = async (request_id: number) => {
    try {
      await friendApi.reject(request_id)
      await fetchRequests()
      uni.showToast({
        title: '已拒绝请求',
        icon: 'none'
      })
    } catch (error) {
      console.error('拒绝好友请求失败:', error)
    }
  }

  const deleteFriend = async (friend_id: number) => {
    try {
      await friendApi.delete(friend_id)
      await fetchFriends()
      uni.showToast({
        title: '已删除好友',
        icon: 'none'
      })
    } catch (error) {
      console.error('删除好友失败:', error)
    }
  }

  const sendMessage = async (to_user_id: number, content: string) => {
    try {
      await chatApi.send(to_user_id, content)
      await fetchChatHistory(to_user_id)
    } catch (error) {
      console.error('发送消息失败:', error)
    }
  }

  const fetchChatHistory = async (friend_id: number, page = 1, size = 50) => {
    try {
      const result = await chatApi.history(friend_id, page, size)
      if (result) {
        chatMessages.value = result
      }
    } catch (error) {
      console.error('获取聊天记录失败:', error)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const result = await chatApi.unread()
      if (result) {
        unreadCount.value = result.count
      }
    } catch (error) {
      console.error('获取未读消息数失败:', error)
    }
  }

  const markAsRead = async (from_user_id: number) => {
    try {
      await chatApi.read(from_user_id)
      await fetchUnreadCount()
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  const setCurrentFriend = (friend: User) => {
    currentFriend.value = friend
    chatMessages.value = []
  }

  return {
    friends,
    requests,
    chatMessages,
    currentFriend,
    unreadCount,
    fetchFriends,
    fetchRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    deleteFriend,
    sendMessage,
    fetchChatHistory,
    fetchUnreadCount,
    markAsRead,
    setCurrentFriend
  }
})
