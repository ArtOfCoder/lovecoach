// pages/index/index.js - 全面升级版
const { COURSES } = require('../../data/courses')
const app = getApp()
const ai = require('../../utils/ai')

const DAILY_WORDS = [
  '喜欢一个人，是从觉得他有点不一样开始的。',
  '好的感情，是两个人互相成为更好的自己。',
  '爱一个人，不是改变对方，而是接受对方本来的样子。',
  '心动，是最好的开始；用心，才是最长的陪伴。',
  '感情里，真诚永远比技巧重要。',
  '遇到对的人，不用练习就知道怎么在一起。',
  '你值得被认真喜欢。',
  '喜欢是一件很小的事，爱是一件很大的事。',
  '真正喜欢你的人，不会让你反复猜测他的感受。',
  '最好的关系，是两个人互相点亮。',
  '敢开口才有机会，不敢开口只有遗憾。',
]

const DAILY_TASKS = [
  '今天对一个陌生人微笑并说声你好',
  '给一个许久不联系的朋友发一条消息',
  '今天记录一件让你心动的小事',
  '对着镜子练习微笑30秒',
  '学习一个新的搭讪开场白并默背3遍',
  '今天主动称赞一个人，要具体真诚',
  '回顾上一次约会，写下3个可以改进的地方',
]

// 热门问题池（共25条，每次随机取5条显示）
const HOT_QUESTIONS_POOL = [
  '怎么让他/她对我产生好奇？',
  '被拒绝了，还有没有机会？',
  '第一次约会聊什么不会冷场？',
  '喜欢同事怎么表白不影响工作？',
  '如何自然地要到对方的联系方式？',
  '暧昧了很久，怎么捅破那层窗户纸？',
  '对方突然冷淡，是不喜欢我了吗？',
  '如何在不尴尬的情况下表白？',
  '约会时遇到冷场怎么化解？',
  '喜欢一个已有男/女友的人怎么办？',
  '怎么判断对方是喜欢我还是只把我当朋友？',
  '表白被拒了，还能成为朋友吗？',
  '长期异地恋怎么维持感情？',
  '如何在关系里保持自我而不失去自己？',
  '热恋期过后感情变淡怎么办？',
  '吵架后对方不回消息怎么处理？',
  '怎么制造浪漫惊喜但不显得刻意？',
  '分手了还藕断丝连怎么办？',
  '怎么让喜欢的人主动找我聊天？',
  '恋爱多久算正常可以谈婚论嫁？',
  '暗恋一个人要不要表白？',
  '怎么从朋友关系升级成恋人？',
  '被前任分手后如何走出来？',
  '怎么挽回一段感情？',
  '第一次见网友，怎么保持自然？',
]

// 动态获取热门问题（每次根据日期取不同组合）
function getHotQuestions() {
  const now = new Date()
  // 用当天小时数做偏移，让每隔几小时刷新一次
  const offset = (now.getDate() * 7 + Math.floor(now.getHours() / 4)) % HOT_QUESTIONS_POOL.length
  const result = []
  for (let i = 0; i < 5; i++) {
    result.push(HOT_QUESTIONS_POOL[(offset + i * 5) % HOT_QUESTIONS_POOL.length])
  }
  return result
}

Page({
  data: {
    activeGender: 'male',
    greeting: '',
    userNickname: '',
    dailyWord: '',
    dailyTask: '',
    todayTaskDone: false,
    todayTask: '',
    recommendCourses: [],
    hotQuestions: [],
    learnedCount: 0,
    totalMinutes: 0,
    streakDays: 1,
    progressPercent: 0,
    remainCourses: 5,
    aiUnread: 0,
    aiConfigured: false,
    showNewUserGuide: false,   // 新用户引导横幅
  },

  onLoad() {
    this.initGreeting()
    this.loadUserData()
    this.loadDailyContent()
    this.loadProgress()
    this.checkStreakDay()
    this.setData({
      aiConfigured: ai.isConfigured(),
      hotQuestions: getHotQuestions(),
    })
    this.checkNewUser()
    
    // 预加载关键数据
    this.preloadData()
  },
  
  // 预加载关键数据，提升后续页面打开速度
  preloadData() {
    // 预加载课程数据
    const courses = require('../../data/courses')
    // 预加载AI配置
    const aiModule = require('../../utils/ai')
    console.log('[首页] 关键数据预加载完成')
  },

  onShow() {
    this.loadProgress()
    const info = wx.getStorageSync('userInfo') || {}
    this.setData({
      userNickname: info.nickname || '',
      hotQuestions: getHotQuestions(), // 每次显示时刷新热门问题
    })
    this.checkNewUser()
    // 检查是否有待处理的AI问题（从大家都在问跳转过来后再返回的情况）
    // 注意：这里只是确保问题存在，实际发送由 ai-coach 页面处理
  },

  // 检测是否为新用户（没有昵称且没有档案）
  checkNewUser() {
    const info = wx.getStorageSync('userInfo') || {}
    const profile = wx.getStorageSync('coupleProfile')
    const hasProfile = !!(profile && profile.myName && profile.taName)
    const hasNickname = !!(info.nickname && info.nickname.trim())
    this.setData({ showNewUserGuide: !hasNickname && !hasProfile })
  },

  initGreeting() {
    const h = new Date().getHours()
    let greeting = '早上好'
    if (h >= 11 && h < 13) greeting = '中午好'
    else if (h >= 13 && h < 18) greeting = '下午好'
    else if (h >= 18) greeting = '晚上好'
    this.setData({ greeting })
  },

  loadUserData() {
    const gender = wx.getStorageSync('userGender') || 'male'
    const info = wx.getStorageSync('userInfo') || {}
    this.setData({ activeGender: gender, userNickname: info.nickname || '' })
    this.loadRecommendCourses(gender)
  },

  loadDailyContent() {
    const day = new Date().getDate()
    const wordIdx = day % DAILY_WORDS.length
    const taskIdx = day % DAILY_TASKS.length
    const todayKey = `task_${new Date().toDateString()}`
    const todayTaskDone = !!wx.getStorageSync(todayKey)
    this.setData({
      dailyWord: DAILY_WORDS[wordIdx],
      todayTask: DAILY_TASKS[taskIdx],
      todayTaskDone,
    })
  },

  checkStreakDay() {
    const today = new Date().toDateString()
    const lastDay = wx.getStorageSync('lastActiveDay')
    let streakDays = wx.getStorageSync('streakDays') || 1
    if (lastDay && lastDay !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (lastDay === yesterday.toDateString()) {
        streakDays++
      } else {
        streakDays = 1
      }
      wx.setStorageSync('streakDays', streakDays)
    }
    wx.setStorageSync('lastActiveDay', today)
    this.setData({ streakDays })
  },

  loadRecommendCourses(gender) {
    const list = COURSES.filter(c => c.gender === gender).slice(0, 4)
    this.setData({ recommendCourses: list })
  },

  loadProgress() {
    const progress = wx.getStorageSync('learningProgress') || {}
    const learnedIds = Object.keys(progress)
    const learnedCount = learnedIds.length
    const totalMinutes = learnedIds.reduce((sum, id) => {
      const c = COURSES.find(c => c.id === id)
      return sum + (c ? parseInt(c.duration) : 0)
    }, 0)
    const streakDays = wx.getStorageSync('streakDays') || 1
    const targetCount = 5
    const progressPercent = Math.min(Math.round(learnedCount / targetCount * 100), 100)
    const remainCourses = Math.max(targetCount - learnedCount, 0)
    this.setData({ learnedCount, totalMinutes, streakDays, progressPercent, remainCourses })
  },

  switchGender(e) {
    const gender = e.currentTarget.dataset.gender
    wx.setStorageSync('userGender', gender)
    app.globalData.userGender = gender
    this.setData({ activeGender: gender })
    this.loadRecommendCourses(gender)
  },

  goToDaily() {
    const todayKey = `task_${new Date().toDateString()}`
    if (this.data.todayTaskDone) {
      wx.showToast({ title: '今日任务已完成！继续保持', icon: 'none' })
      return
    }
    wx.showModal({
      title: '今日任务',
      content: this.data.todayTask + '\n\n完成后点击确认打卡',
      confirmText: '完成打卡',
      cancelText: '等会再做',
      success: res => {
        if (res.confirm) {
          wx.setStorageSync(todayKey, true)
          this.setData({ todayTaskDone: true })
          wx.showToast({ title: '打卡成功！继续坚持', icon: 'success' })
        }
      }
    })
  },

  shareWord() {
    // 分享功能：通过 button open-type="share" 方式触发，这里提示用户右上角分享
    wx.showToast({ title: '点击右上角"···"分享给朋友', icon: 'none', duration: 2500 })
  },

  askAI(e) {
    const q = e.currentTarget.dataset.q
    if (!q) return
    // 存储待发送的问题
    wx.setStorageSync('pendingAIQuestion', q)
    wx.switchTab({ url: '/pages/ai-coach/ai-coach' })
  },

  goToAI() { wx.switchTab({ url: '/pages/ai-coach/ai-coach' }) },
  goToTopics() { wx.navigateTo({ url: '/pages/topics/topics' }) },
  goToCourse() { wx.switchTab({ url: '/pages/course/course' }) },
  goToSoulmate() { wx.navigateTo({ url: '/pages/soulmate/soulmate' }) },
  goToProfile() { wx.switchTab({ url: '/pages/profile/profile' }) },
  goToQuiz() { wx.navigateTo({ url: '/pages/quiz/quiz' }) },
  goToRoleplay() { wx.navigateTo({ url: '/pages/roleplay/roleplay' }) },
  goToCouple() { wx.switchTab({ url: '/pages/couple/couple' }) },
  goToChatReply() { wx.navigateTo({ url: '/pages/chat-reply/chat-reply' }) },
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onShareAppMessage() {
    return {
      title: `"${this.data.dailyWord}" — 恋爱进化论`,
      path: '/pages/index/index',
    }
  },
})
