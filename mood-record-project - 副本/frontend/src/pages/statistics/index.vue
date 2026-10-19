<template>
  <view class="container">
    <view class="filter-bar">
      <view 
        class="filter-item" 
        v-for="(filter, index) in filters" 
        :key="index"
        :class="{ selected: currentFilter === filter.value }"
        @click="selectFilter(filter.value)"
      >
        <text class="filter-text">{{ filter.name }}</text>
      </view>
    </view>

    <view class="summary-card">
      <view class="summary-title">心情统计</view>
      <view class="summary-stats">
        <view class="stat-item">
          <text class="stat-value">{{ totalCount }}</text>
          <text class="stat-label">记录次数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ avgMood }}</text>
          <text class="stat-label">平均心情</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ mostMood }}</text>
          <text class="stat-label">最常心情</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">心情分布</text>
      <view class="mood-chart">
        <view 
          class="chart-item" 
          v-for="(item, index) in moodDistribution" 
          :key="index"
        >
          <text class="chart-label">{{ item.label }}</text>
          <view class="chart-bar-wrapper">
            <view 
              class="chart-bar" 
              :style="{ 
                width: item.percentage + '%',
                backgroundColor: item.color
              }"
            ></view>
          </view>
          <text class="chart-percent">{{ item.count }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">每日心情趋势</text>
      <view class="line-chart">
        <view class="chart-bars">
          <view 
            class="bar-item" 
            v-for="(item, index) in trendData" 
            :key="index"
          >
            <view class="bar-wrapper">
              <view 
                class="bar" 
                :style="{ 
                  height: item.height + '%',
                  backgroundColor: item.color
                }"
              ></view>
            </view>
            <text class="bar-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">情绪建议</text>
      <view class="suggestion-list">
        <view class="suggestion-item" v-for="(item, index) in suggestions" :key="index">
          <text class="suggestion-icon">💡</text>
          <text class="suggestion-text">{{ item.suggestion }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { moodApi, suggestionApi } from '@/api'
import { useMoodStore } from '@/stores/mood'

const moodStore = useMoodStore()

const currentFilter = ref('week')
const totalCount = ref(0)
const avgMood = ref('')
const mostMood = ref('')
const moodDistribution = ref<any[]>([])
const trendData = ref<any[]>([])
const suggestions = ref<any[]>([])

const filters = [
  { name: '本周', value: 'week' },
  { name: '本月', value: 'month' },
  { name: '本年', value: 'year' }
]

const selectFilter = (value: string) => {
  currentFilter.value = value
  loadStatistics()
}

const loadStatistics = async () => {
  try {
    console.log('Loading statistics with filter:', currentFilter.value)
    const result = await moodApi.stat(currentFilter.value)
    console.log('Statistics result:', result)
    if (result) {
      totalCount.value = result.total_count || result.total_days || 0
      avgMood.value = result.avg_mood ? getMoodLabel(Math.round(result.avg_mood)) : '-'
      mostMood.value = result.most_frequent ? getMoodLabel(result.most_frequent) : '-'
      
      const labels = ['开心', '平静', '焦虑', '难过', '生气', '烦躁']
      const colors = ['#FFD700', '#ADD8E6', '#9932CC', '#4169E1', '#DC143C', '#FFA500']
      
      const distribution = result.distribution || {}
      const totalRecords = (Object.values(distribution) as number[]).reduce((sum, val) => sum + val, 0)
      
      moodDistribution.value = labels.map((label, index) => ({
        label,
        color: colors[index],
        count: distribution[index + 1] || 0,
        percentage: totalRecords > 0 
          ? Math.round((distribution[index + 1] || 0) / totalRecords * 100) 
          : 0
      }))

      const last7Days = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        last7Days.push(formatDate(date))
      }
      
      trendData.value = last7Days.map((dateStr) => {
        const moods = moodStore.getMoodsByDate(dateStr)
        const avgMood = moods.length > 0 
          ? Math.round(moods.reduce((sum, m) => sum + m.mood_type, 0) / moods.length)
          : 4
        return {
          label: dateStr.slice(-2),
          mood_type: avgMood,
          height: Math.max(20, (7 - avgMood) * 15),
          color: moodStore.getMoodColor(avgMood)
        }
      })
      
      // 根据最常心情类型获取匹配的情绪建议
      if (result.most_frequent) {
        loadSuggestions(result.most_frequent)
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    uni.showToast({ title: '获取失败', icon: 'none' })
  }
}

const getMoodLabel = (type: number | undefined): string => {
  if (!type) return ''
  const labels: Record<number, string> = {
    1: '开心',
    2: '平静',
    3: '焦虑',
    4: '难过',
    5: '生气',
    6: '烦躁'
  }
  return labels[type] || ''
}

const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const loadSuggestions = async (moodType?: number) => {
  try {
    const params = moodType ? { mood_type: moodType } : {}
    const result = await suggestionApi.list(params)
    if (result && result.length > 0) {
      suggestions.value = result.slice(0, 5)
    }
  } catch (error) {
    console.error('加载建议失败:', error)
  }
}

onMounted(() => {
  loadStatistics()
  loadSuggestions()
})
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.container {
  padding: 24rpx;
  min-height: 100vh;
  background: $bg-color;
}

.filter-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.filter-item {
  flex: 1;
  padding: 16rpx;
  background: $card-bg;
  border-radius: 20rpx;
  text-align: center;
  cursor: pointer;
  border: 2rpx solid transparent;

  &.selected {
    background: rgba($primary-color, 0.1);
    border-color: $primary-color;
  }
}

.filter-text {
  font-size: 28rpx;
  color: $text-secondary;

  .selected & {
    color: $primary-dark;
    font-weight: 500;
  }
}

.summary-card {
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.summary-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 24rpx;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 600;
  color: #fff;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.card {
  background: $card-bg;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 24rpx;
  display: block;
}

.mood-chart {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.chart-label {
  width: 80rpx;
  font-size: 26rpx;
  color: $text-secondary;
}

.chart-bar-wrapper {
  flex: 1;
  height: 32rpx;
  background: $bg-color;
  border-radius: 16rpx;
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  border-radius: 16rpx;
  transition: width 0.5s ease;
}

.chart-percent {
  width: 60rpx;
  font-size: 26rpx;
  color: $text-light;
  text-align: right;
}

.line-chart {
  padding-top: 16rpx;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 240rpx;
  gap: 12rpx;
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
  width: 36rpx;
  border-radius: 18rpx 18rpx 0 0;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 22rpx;
  color: $text-light;
  margin-top: 12rpx;
}

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
</style>
