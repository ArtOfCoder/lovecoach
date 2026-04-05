// pages/profile/profile.js
const { COURSES } = require('../../data/courses')

const BADGES = [
  { id: 1, icon: '🌱', name: '初学者', condition: 1 },
  { id: 2, icon: '📖', name: '好学生', condition: 3 },
  { id: 3, icon: '🔥', name: '学霸', condition: 6 },
  { id: 4, icon: '💎', name: '恋爱高手', condition: COURSES.length },
  { id: 5, icon: '🏆', name: '全部解锁', condition: COURSES.length },
]

Page({
  data: {
    userInfo: {
      nickname: '',
      avatar: '',
      gender: '',
    },
    stats: {
      learnedCount: 0,
      totalMinutes: 0,
      streakDays: 1,
    },
    badges: [],
    learnedCourses: [],
  },

  // 隐藏入口：连续点击版本号计数
  _versionClickCount: 0,
  _versionClickTimer: null,

  onShow() {
    this.loadUserInfo()
    this.loadStats()
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const gender = wx.getStorageSync('userGender') || ''
    this.setData({ userInfo: { ...userInfo, gender } })
  },

  loadStats() {
    const progress = wx.getStorageSync('learningProgress') || {}
    const learnedIds = Object.keys(progress)
    const learnedCount = learnedIds.length
    const totalMinutes = learnedIds.reduce((sum, id) => {
      const c = COURSES.find(c => c.id === id)
      return sum + (c ? parseInt(c.duration) : 0)
    }, 0)
    const streakDays = wx.getStorageSync('streakDays') || 1

    // 已学课程
    const learnedCourses = COURSES.filter(c => learnedIds.includes(c.id))

    // 成就
    const badges = BADGES.map(b => ({
      ...b,
      unlocked: learnedCount >= b.condition,
    }))

    this.setData({ stats: { learnedCount, totalMinutes, streakDays }, learnedCourses, badges })
  },

  setGender(e) {
    const gender = e.currentTarget.dataset.gender
    wx.setStorageSync('userGender', gender)
    const userInfo = { ...this.data.userInfo, gender }
    this.setData({ userInfo })
  },

  editNickname() {
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '输入你的昵称',
      content: this.data.userInfo.nickname,
      success: (res) => {
        if (res.confirm && res.content) {
          const userInfo = { ...this.data.userInfo, nickname: res.content }
          wx.setStorageSync('userInfo', userInfo)
          this.setData({ userInfo })
        }
      }
    })
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const avatar = res.tempFilePaths[0]
        const userInfo = { ...this.data.userInfo, avatar }
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userInfo })
      }
    })
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  goToSoulmate() {
    wx.navigateTo({ url: '/pages/soulmate/soulmate' })
  },

  goToSoulmateHistory() {
    wx.navigateTo({ url: '/pages/soulmate-history/soulmate-history' })
  },

  goToUserStats() {
    wx.navigateTo({ url: '/pages/user-stats/user-stats' })
  },

  editProfile() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding?mode=edit' })
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  clearProgress() {
    wx.showModal({
      title: '重置进度',
      content: '确定要清除所有学习记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('learningProgress')
          this.loadStats()
          wx.showToast({ title: '已重置', icon: 'success' })
        }
      }
    })
  },

  shareApp() {
    // 分享通过右上角菜单触发，这里做个提示引导
    wx.showToast({ title: '点击右上角"···"分享给朋友', icon: 'none', duration: 2500 })
  },

  showAbout() {
    wx.showModal({
      title: '恋爱进化论',
      content: '版本 1.0.0\n\n科学恋爱，用心相处。\n本小程序提供恋爱技巧教学、AI顾问、话题库等功能，帮助你在感情中更自信。',
      showCancel: false,
    })
  },

  // 连续点击版本号触发管理员入口
  onVersionClick() {
    this._versionClickCount++
    
    // 重置计时器，3秒内连续点击才有效
    if (this._versionClickTimer) {
      clearTimeout(this._versionClickTimer)
    }
    this._versionClickTimer = setTimeout(() => {
      this._versionClickCount = 0
    }, 3000)
    
    // 连续点击5次触发管理员验证
    if (this._versionClickCount >= 5) {
      this._versionClickCount = 0
      clearTimeout(this._versionClickTimer)
      this._showAdminLogin()
    }
  },

  _showAdminLogin() {
    wx.showModal({
      title: '管理员验证',
      editable: true,
      placeholderText: '请输入管理员密码',
      success: (res) => {
        if (res.confirm && res.content === 'love2026') {
          wx.navigateTo({ url: '/pages/admin/admin' })
        } else if (res.confirm) {
          wx.showToast({ title: '密码错误', icon: 'error' })
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '恋爱进化论 - 让感情升温有方法',
      path: '/pages/index/index',
    }
  },
})
