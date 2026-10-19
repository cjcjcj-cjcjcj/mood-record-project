import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { moodApi, type Mood } from '@/api'

export const useMoodStore = defineStore('mood', () => {
  const moods = ref<Mood[]>([])
  const todayMood = ref<Mood | null>(null)
  const calendarData = ref<Record<string, Mood[]>>({})
  const worldMoods = ref<Mood[]>([])

  const moodLabels: Record<number, string> = {
    1: '开心',
    2: '平静',
    3: '焦虑',
    4: '难过',
    5: '生气',
    6: '烦躁'
  }

  const moodColors: Record<number, string> = {
    1: '#FFD700',
    2: '#ADD8E6',
    3: '#9932CC',
    4: '#4169E1',
    5: '#DC143C',
    6: '#FFA500'
  }

  const getMoodLabel = (type: number) => moodLabels[type] || '未知'
  const getMoodColor = (type: number) => moodColors[type] || '#999999'

  const addMood = async (data: { mood_type: number; content?: string; images?: string[]; visibility?: number }) => {
    try {
      await moodApi.add(data)
      await fetchToday()
      await fetchCalendar()
      return true
    } catch (error) {
      console.error('添加心情失败:', error)
      return false
    }
  }

  const fetchToday = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const dayResult = await moodApi.day(today)
      const moods = dayResult?.moods || []
      
      if (moods.length === 0) {
        todayMood.value = null
        return
      }
      
      const countMap: Record<number, { count: number; lastMood: any }> = {}
      moods.forEach(mood => {
        if (!countMap[mood.mood_type]) {
          countMap[mood.mood_type] = { count: 0, lastMood: mood }
        }
        countMap[mood.mood_type].count++
        if (!countMap[mood.mood_type].lastMood || mood.record_time > countMap[mood.mood_type].lastMood.record_time) {
          countMap[mood.mood_type].lastMood = mood
        }
      })
      
      let maxCount = 0
      let selectedMood = moods[0]
      for (const type in countMap) {
        if (countMap[type].count > maxCount) {
          maxCount = countMap[type].count
          selectedMood = countMap[type].lastMood
        } else if (countMap[type].count === maxCount) {
          if (countMap[type].lastMood.record_time > selectedMood.record_time) {
            selectedMood = countMap[type].lastMood
          }
        }
      }
      
      todayMood.value = selectedMood || null
    } catch (error) {
      console.error('获取今日心情失败:', error)
    }
  }

  const fetchCalendar = async (month?: string) => {
    try {
      const result = await moodApi.calendar(month)
      if (result) {
        calendarData.value = result
      }
    } catch (error) {
      console.error('获取日历心情失败:', error)
    }
  }

  const fetchDayMoods = async (date: string) => {
    try {
      const result = await moodApi.day(date)
      return result?.moods || []
    } catch (error) {
      console.error('获取当日心情失败:', error)
      return []
    }
  }

  const fetchWorld = async (page = 1, size = 20) => {
    try {
      const result = await moodApi.world(page, size)
      if (result) {
        worldMoods.value = result
      }
    } catch (error) {
      console.error('获取世界心情失败:', error)
    }
  }

  const getMoodsByDate = (date: string): Mood[] => {
    return calendarData.value[date] || []
  }

  return {
    moods,
    todayMood,
    calendarData,
    worldMoods,
    moodLabels,
    moodColors,
    getMoodLabel,
    getMoodColor,
    addMood,
    fetchToday,
    fetchCalendar,
    fetchDayMoods,
    fetchWorld,
    getMoodsByDate
  }
})
