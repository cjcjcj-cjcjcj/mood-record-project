import { defineStore } from 'pinia'
import { ref } from 'vue'
import { diaryApi, commentApi, type Diary, type Comment } from '@/api'

export const useDiaryStore = defineStore('diary', () => {
  const diaries = ref<Diary[]>([])
  const diaryDetail = ref<Diary | null>(null)
  const worldDiaries = ref<Diary[]>([])
  const comments = ref<Comment[]>([])

  const addDiary = async (data: { title: string; content: string; mood_tag?: number; background_images?: string[]; visibility?: number }) => {
    try {
      const result = await diaryApi.add(data)
      if (result) {
        await fetchList()
        return true
      }
      return false
    } catch (error) {
      console.error('添加日记失败:', error)
      return false
    }
  }

  const fetchList = async (page = 1, size = 20, keyword?: string, visibility?: number) => {
    try {
      const result = await diaryApi.list(page, size, keyword, visibility)
      if (result) {
        diaries.value = result
      }
    } catch (error) {
      console.error('获取日记列表失败:', error)
    }
  }

  const fetchDetail = async (id: number) => {
    try {
      const result = await diaryApi.detail(id)
      if (result) {
        diaryDetail.value = result
      }
    } catch (error) {
      console.error('获取日记详情失败:', error)
    }
  }

  const updateDiary = async (data: { id: number; title?: string; content?: string; mood_tag?: number; background_images?: string[]; visibility?: number }) => {
    try {
      const result = await diaryApi.update(data)
      if (result) {
        await fetchList()
        return true
      }
      return false
    } catch (error) {
      console.error('更新日记失败:', error)
      return false
    }
  }

  const deleteDiary = async (id: number) => {
    try {
      await diaryApi.delete(id)
      await fetchList()
    } catch (error) {
      console.error('删除日记失败:', error)
    }
  }

  const fetchWorld = async (page = 1, size = 20) => {
    try {
      const result = await diaryApi.world(page, size)
      if (result) {
        worldDiaries.value = result
      }
    } catch (error) {
      console.error('获取世界日记失败:', error)
    }
  }

  const addComment = async (diary_id: number, content: string) => {
    try {
      const result = await commentApi.add(diary_id, content)
      if (result) {
        await fetchComments(diary_id)
        return true
      }
      return false
    } catch (error) {
      console.error('添加评论失败:', error)
      return false
    }
  }

  const fetchComments = async (diary_id: number, page = 1, size = 20) => {
    try {
      const result = await commentApi.list(diary_id, page, size)
      if (result) {
        comments.value = result
      }
    } catch (error) {
      console.error('获取评论失败:', error)
    }
  }

  const deleteComment = async (id: number) => {
    try {
      await commentApi.delete(id)
      if (diaryDetail.value) {
        await fetchComments(diaryDetail.value.id)
      }
    } catch (error) {
      console.error('删除评论失败:', error)
    }
  }

  return {
    diaries,
    diaryDetail,
    worldDiaries,
    comments,
    addDiary,
    fetchList,
    fetchDetail,
    updateDiary,
    deleteDiary,
    fetchWorld,
    addComment,
    fetchComments,
    deleteComment
  }
})
