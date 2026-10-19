<template>
  <view class="container">
    <view class="header">
      <view class="greeting">
        <text class="greeting-text">{{ greetingText }}</text>
        <text class="date-text">{{ currentDate }}</text>
      </view>
      <view class="avatar-wrap" @click="goToProfile">
        <view class="avatar-lg"></view>
      </view>
    </view>

    <view class="card today-mood-card" v-if="todayMood" @click="goToAddMood">
      <view class="mood-icon-lg" :style="{ backgroundColor: getMoodColor(todayMood.mood_type) }">
        {{ getMoodEmoji(todayMood.mood_type) }}
      </view>
      <view class="today-mood-info">
        <text class="today-mood-title">今日心情</text>
        <text class="today-mood-label" :style="{ color: getMoodColor(todayMood.mood_type) }">
          {{ getMoodLabel(todayMood.mood_type) }}
        </text>
      </view>
      <text class="today-mood-time" v-if="todayMood.record_time">{{ todayMood.record_time }}</text>
    </view>

    <view class="card calendar-card">
      <view class="calendar-header">
        <view class="nav-btn" @click="prevMonth">
          <text class="nav-icon">‹</text>
        </view>
        <text class="month-title">{{ currentMonthText }}</text>
        <view class="nav-btn" @click="nextMonth">
          <text class="nav-icon">›</text>
        </view>
      </view>
      
      <view class="weekday-row">
        <text class="weekday" v-for="day in weekdays" :key="day">{{ day }}</text>
      </view>
      
      <view class="calendar-grid">
        <view 
          class="date-cell" 
          v-for="(date, index) in calendarDates" 
          :key="index"
          :class="{ 
            'other-month': !date.currentMonth,
            'today': date.isToday,
            'selected': isSelected(date.dateStr),
            'has-mood': hasMood(date.dateStr)
          }"
          @click="selectDate(date)"
        >
          <text class="date-num">{{ date.day }}</text>
          <view class="mood-dots" v-if="hasMood(date.dateStr)">
            <view 
              class="mood-dot" 
              v-for="(mood, i) in getMoodsForDate(date.dateStr).slice(0, 3)" 
              :key="i"
              :style="{ backgroundColor: getMoodColor(mood.mood_type) }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <view class="card selected-date-card" v-if="selectedDate">
      <view class="selected-header">
        <text class="selected-date">{{ selectedDateStr }}</text>
        <view class="add-btn" @click="goToAddMood">
          <text class="add-icon">+</text>
          <text class="add-text">记录心情</text>
        </view>
      </view>
      
      <view class="day-moods" v-if="selectedDayMoods.length > 0">
        <view class="day-mood" v-for="(mood, index) in selectedDayMoods" :key="index">
          <view class="mood-info">
            <view class="mood-icon" :style="{ backgroundColor: getMoodColor(mood.mood_type) }">
              {{ getMoodEmoji(mood.mood_type) }}
            </view>
            <view class="mood-detail">
              <text class="mood-type">{{ getMoodLabel(mood.mood_type) }}</text>
              <text class="mood-time">{{ mood.record_time }}</text>
            </view>
          </view>
          <text class="mood-content-text" v-if="mood.content">{{ mood.content }}</text>
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <text class="empty-icon">📝</text>
        <text class="empty-text">今天还没有记录心情</text>
        <view class="empty-btn" @click="goToAddMood">
          <text class="empty-btn-text">去记录</text>
        </view>
      </view>
    </view>

    <view class="card suggestion-card" v-if="suggestions.length > 0">
      <text class="section-title">心情小贴士</text>
      <view class="suggestion-list">
        <view class="suggestion-item" :key="0">
          <text class="suggestion-icon">💡</text>
          <text class="suggestion-text">{{ suggestions[0].suggestion }}</text>
        </view>
      </view>
    </view>

    <view class="card chart-card" v-if="showChart">
      <text class="section-title">心情趋势</text>
      <view class="chart-container">
        <view class="chart-bars">
          <view class="bar-item" v-for="(item, index) in chartData" :key="index">
            <view class="bar-wrapper">
              <view 
                class="bar" 
                :style="{ 
                  height: item.height + '%',
                  backgroundColor: getMoodColor(item.mood_type)
                }"
              ></view>
            </view>
            <text class="bar-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useMoodStore } from '@/stores/mood'
import { suggestionApi } from '@/api'

const userStore = useUserStore()
const moodStore = useMoodStore()

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const selectedDate = ref<{ dateStr: string; day: number } | null>(null)
const selectedDayMoods = ref<any[]>([])
const suggestions = ref<any[]>([])
const showChart = ref(false)
const chartData = ref<any[]>([])

const currentDate = computed(() => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日 周${weekdays[now.getDay()]}`
})

const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '🌅 早上好'
  if (hour < 18) return '☀️ 下午好'
  return '🌙 晚上好'
})

const currentMonthText = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const todayMood = computed(() => moodStore.todayMood)

const calendarDates = computed(() => {
  const dates: any[] = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startPadding = firstDay.getDay()
  const today = new Date()
  
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  for (let i = startPadding - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = new Date(currentYear.value, currentMonth.value - 1, day)
    dates.push({
      day,
      dateStr: formatDate(date),
      currentMonth: false,
      isToday: false
    })
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value, i)
    const isToday = date.toDateString() === today.toDateString()
    dates.push({
      day: i,
      dateStr: formatDate(date),
      currentMonth: true,
      isToday
    })
  }
  
  const remaining = 42 - dates.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(currentYear.value, currentMonth.value + 1, i)
    dates.push({
      day: i,
      dateStr: formatDate(date),
      currentMonth: false,
      isToday: false
    })
  }
  
  return dates
})

const selectedDateStr = computed(() => {
  if (!selectedDate.value) return ''
  return `${currentYear.value}年${currentMonth.value + 1}月${selectedDate.value.day}日`
})

const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const isSelected = (dateStr: string): boolean => {
  return selectedDate.value?.dateStr === dateStr
}

const hasMood = (dateStr: string): boolean => {
  return moodStore.getMoodsByDate(dateStr).length > 0
}

const getMoodsForDate = (dateStr: string) => {
  return moodStore.getMoodsByDate(dateStr)
}

const getMoodLabel = (type: number) => moodStore.getMoodLabel(type)
const getMoodColor = (type: number) => moodStore.getMoodColor(type)

const getMoodEmoji = (type: number): string => {
  const emojis: Record<number, string> = {
    1: '😊',
    2: '😌',
    3: '😰',
    4: '😢',
    5: '😠',
    6: '😤'
  }
  return emojis[type] || '😐'
}

const selectDate = async (date: any) => {
  selectedDate.value = date
  showChart.value = false
  
  const moods = await moodStore.fetchDayMoods(date.dateStr)
  selectedDayMoods.value = moods
  
  if (moods.length > 0) {
    await loadChartData(date.dateStr)
  }
}

const loadChartData = async (dateStr: string) => {
  const parts = dateStr.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(year, month - 1, parseInt(parts[2]) - i)
    last7Days.push(formatDate(date))
  }
  
  const data: any[] = []
  for (const d of last7Days) {
    const moods = moodStore.getMoodsByDate(d)
    if (moods.length > 0) {
      const avgMood = Math.round(moods.reduce((sum, m) => sum + m.mood_type, 0) / moods.length)
      data.push({
        date: d,
        label: d.slice(5),
        mood_type: avgMood,
        height: Math.max(20, (7 - avgMood) * 15)
      })
    } else {
      data.push({
        date: d,
        label: d.slice(5),
        mood_type: 4,
        height: 45
      })
    }
  }
  
  chartData.value = data
  showChart.value = true
}

const goToProfile = () => {
  uni.switchTab({ url: '/pages/profile/index' })
}

const goToAddMood = () => {
  const date = selectedDate.value?.dateStr || formatDate(new Date())
  uni.navigateTo({ url: `/pages/mood/add/index?date=${date}` })
}

onMounted(async () => {
  userStore.init()
  
  const today = formatDate(new Date())
  selectedDate.value = { dateStr: today, day: new Date().getDate() }
  
  await moodStore.fetchToday()
  await moodStore.fetchCalendar()
  
  selectedDayMoods.value = await moodStore.fetchDayMoods(today)
  if (selectedDayMoods.value.length > 0) {
    await loadChartData(today)
  }
  
  try {
    const latestMoodType = moodStore.todayMood?.mood_type
    const result = await suggestionApi.list(latestMoodType)
    if (result && result.length > 0) {
      suggestions.value = result.slice(0, 3)
    }
  } catch (error) {
    console.error('获取心情小贴士失败:', error)
  }
})

watch([currentYear, currentMonth], async () => {
  await moodStore.fetchCalendar(`${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`)
})

onShow(async () => {
  await moodStore.fetchToday()
  await moodStore.fetchCalendar()
  
  if (selectedDate.value) {
    selectedDayMoods.value = await moodStore.fetchDayMoods(selectedDate.value.dateStr)
    
    if (selectedDayMoods.value.length > 0) {
      await loadChartData(selectedDate.value.dateStr)
    }
  }
  
  try {
    const latestMoodType = moodStore.todayMood?.mood_type
    const result = await suggestionApi.list(latestMoodType)
    if (result && result.length > 0) {
      suggestions.value = result.slice(0, 3)
    }
  } catch (error) {
    console.error('获取心情小贴士失败:', error)
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  padding: 24rpx;
  min-height: 100vh;
  background: $bg-color;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
}

.greeting {
  display: flex;
  flex-direction: column;
}

.greeting-text {
  font-size: 40rpx;
  font-weight: 600;
  color: $text-primary;
}

.date-text {
  font-size: 26rpx;
  color: $text-secondary;
  margin-top: 8rpx;
}

.avatar-wrap {
  cursor: pointer;
}

.avatar-lg {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
}

.today-mood-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.15), rgba(255, 105, 180, 0.1));
  border: 2rpx solid rgba(255, 182, 193, 0.3);
}

.mood-icon-lg {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}

.today-mood-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.today-mood-title {
  font-size: 24rpx;
  color: $text-light;
  margin-bottom: 6rpx;
}

.today-mood-label {
  font-size: 34rpx;
  font-weight: 600;
}

.today-mood-time {
  font-size: 26rpx;
  color: $text-light;
  flex-shrink: 0;
}

.card {
  background: $card-bg;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 20rpx;
  display: block;
}

.calendar-card {
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
  }

  .nav-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-color;
    border-radius: 50%;
    cursor: pointer;
  }

  .nav-icon {
    font-size: 40rpx;
    color: $text-primary;
    font-weight: bold;
  }

  .month-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
  }

  .weekday-row {
    display: flex;
    justify-content: space-around;
    margin-bottom: 16rpx;
  }

  .weekday {
    width: calc(100% / 7);
    text-align: center;
    font-size: 26rpx;
    color: $text-light;
  }

  .calendar-grid {
    display: flex;
    flex-wrap: wrap;
  }

  .date-cell {
    width: calc(100% / 7);
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;

    &.other-month {
      .date-num {
        color: $text-light;
      }
    }

    &.today {
      .date-num {
        background: linear-gradient(135deg, $primary-color, $primary-dark);
        color: #fff;
        border-radius: 50%;
        width: 56rpx;
        height: 56rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &.selected {
      background: rgba($primary-color, 0.1);
      border-radius: 16rpx;
    }

    &.has-mood {
      .date-num {
        font-weight: 600;
      }
    }
  }

  .date-num {
    font-size: 28rpx;
    color: $text-primary;
    margin-bottom: 4rpx;
  }

  .mood-dots {
    display: flex;
    gap: 4rpx;
  }

  .mood-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
  }

  .today-mood-inline {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx;
    margin-top: 24rpx;
    background: linear-gradient(135deg, rgba(255, 182, 193, 0.15), rgba(255, 105, 180, 0.1));
    border-radius: 20rpx;
  }

  .mood-icon-lg {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    flex-shrink: 0;
  }

  .today-mood-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .today-mood-title {
    font-size: 24rpx;
    color: $text-light;
    margin-bottom: 4rpx;
  }

  .today-mood-label {
    font-size: 32rpx;
    font-weight: 600;
  }

  .today-mood-time {
    font-size: 24rpx;
    color: $text-light;
    flex-shrink: 0;
  }
}

.selected-date-card {
  .selected-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
  }

  .selected-date {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-primary;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 24rpx;
    background: linear-gradient(135deg, $primary-color, $primary-dark);
    border-radius: 24rpx;
    cursor: pointer;
  }

  .add-icon {
    font-size: 28rpx;
    color: #fff;
    font-weight: bold;
  }

  .add-text {
    font-size: 26rpx;
    color: #fff;
  }
}

.day-moods {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.day-mood {
  padding: 20rpx;
  background: $bg-color;
  border-radius: 20rpx;
}

.mood-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.mood-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.mood-detail {
  display: flex;
  flex-direction: column;
}

.mood-type {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-primary;
}

.mood-time {
  font-size: 24rpx;
  color: $text-light;
}

.mood-content-text {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: $text-light;
  margin-bottom: 24rpx;
}

.empty-btn {
  padding: 16rpx 48rpx;
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 24rpx;
}

.empty-btn-text {
  font-size: 28rpx;
  color: #fff;
}

.suggestion-card {
  .suggestion-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }

  .suggestion-item {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
  }

  .suggestion-icon {
    font-size: 32rpx;
    flex-shrink: 0;
  }

  .suggestion-text {
    font-size: 26rpx;
    color: $text-secondary;
    line-height: 1.5;
  }
}

.today-mood {
  .mood-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .mood-label {
    padding: 8rpx 24rpx;
    border-radius: 20rpx;
    font-size: 26rpx;
    color: #fff;
  }

  .mood-content {
    padding-top: 16rpx;
    border-top: 1rpx solid $border-color;
  }

  .mood-text {
    font-size: 28rpx;
    color: $text-secondary;
    line-height: 1.6;
  }
}

.chart-card {
  .chart-container {
    padding-top: 16rpx;
  }

  .chart-bars {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 200rpx;
    gap: 16rpx;
  }

  .bar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .bar-wrapper {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .bar {
    width: 32rpx;
    border-radius: 16rpx 16rpx 0 0;
    transition: height 0.3s ease;
  }

  .bar-label {
    font-size: 20rpx;
    color: $text-light;
    margin-top: 8rpx;
  }
}
</style>
