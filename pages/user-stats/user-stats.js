// pages/user-stats/user-stats.js
// 用户使用统计页面

const storage = require('../../utils/storage')

Page({
  data: {
    stats: null,
    loading: true,
    activeTab: 'overview', // overview, modules, history, ai
    moduleList: [],
    recentLogs: [],
    aiChats: [],
    soulmatePayments: [],
  },

  onShow() {
    this.loadStats()
  },

  loadStats() {
    this.setData({ loading: true })
    
    const stats = storage.getUserStats()
    
    // 处理模块数据
    const moduleMap = {
      soulmate: { name: '灵魂伴侣', icon: '💕', color: '#FF6B8A' },
      aiCoach: { name: '恋爱顾问', icon: '💕', color: '#7B68EE' },
      course: { name: '课程学习', icon: '📚', color: '#4CAF50' },
      couple: { name: '情侣档案', icon: '💑', color: '#FF8E9B' },
      chatReply: { name: '聊天回复', icon: '💬', color: '#2196F3' },
      topics: { name: '话题库', icon: '💡', color: '#FF9800' },
      quiz: { name: '恋爱测试', icon: '📝', color: '#9C27B0' },
    }
    
    const moduleList = Object.entries(stats.modules || {}).map(([key, value]) => ({
      key,
      ...moduleMap[key],
      count: value.count,
      lastTime: value.lastTime,
      formattedLastTime: this.formatRelativeTime(value.lastTime),
    })).sort((a, b) => b.count - a.count)
    
    // 获取最近的行为日志
    const recentLogs = storage.getUserBehaviorLogs({ limit: 20 })
    
    // AI 聊天记录
    const aiChats = (stats.aiChats || []).slice(0, 10)
    
    // 灵魂伴侣付费记录
    const soulmatePayments = (stats.soulmatePayments || []).map(p => ({
      ...p,
      formattedDate: this.formatDate(p.timestamp),
    }))
    
    this.setData({
      stats,
      moduleList,
      recentLogs,
      aiChats,
      soulmatePayments,
      loading: false,
    })
  },

  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({ activeTab: tab })
  },

  formatRelativeTime(timestamp) {
    if (!timestamp) return '从未使用'
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return this.formatDate(timestamp)
  },

  formatDate(timestamp) {
    const date = new Date(timestamp)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },

  getActionText(action) {
    const map = {
      'soulmate_generate': '生成灵魂伴侣',
      'soulmate_pay': '解锁灵魂伴侣',
      'ai_chat': 'AI问答',
      'ai_signal': '信号分析',
      'ai_roleplay': '角色练习',
      'ai_vent': '倾诉模式',
      'course_view': '浏览课程',
      'course_complete': '完成课程',
      'couple_update': '更新档案',
      'chat_reply': '使用聊天回复',
      'topic_view': '查看话题',
      'quiz_start': '开始测试',
      'quiz_complete': '完成测试',
    }
    return map[action] || action
  },

  // 查看AI对话详情
  viewAiChat(e) {
    const { index } = e.currentTarget.dataset
    const chat = this.data.aiChats[index]
    wx.showModal({
      title: 'AI对话详情',
      content: `问：${chat.question}\n\n答：${chat.answer}`,
      showCancel: false,
      confirmText: '关闭',
    })
  },

  // 清空统计
  clearStats() {
    wx.showModal({
      title: '清空统计',
      content: '确定要清空所有使用统计吗？此操作不可恢复。',
      confirmColor: '#FF6B8A',
      success: (res) => {
        if (res.confirm) {
          storage.clearUserStats()
          storage.clearUserBehaviorLogs()
          this.loadStats()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      },
    })
  },

  // 跳转到对应页面
  goToPage(e) {
    const { page } = e.currentTarget.dataset
    const map = {
      soulmate: '/pages/soulmate/soulmate',
      aiCoach: '/pages/ai-coach/ai-coach',
      course: '/pages/course/course',
      couple: '/pages/couple/couple',
      chatReply: '/pages/chat-reply/chat-reply',
      topics: '/pages/topics/topics',
      quiz: '/pages/quiz/quiz',
    }
    const url = map[page]
    if (url) {
      wx.navigateTo({ url })
    }
  },

  // 查看灵魂伴侣历史
  goToSoulmateHistory() {
    wx.navigateTo({ url: '/pages/soulmate-history/soulmate-history' })
  },

  onShareAppMessage() {
    return {
      title: '我的恋爱进化论使用统计',
      path: '/pages/user-stats/user-stats',
    }
  },
})
