// pages/course/course.js - AI 动态课程版
const { COURSES } = require('../../data/courses')
const ai = require('../../utils/ai')

Page({
  data: {
    genderFilter: 'all',
    activeCategory: '全部',
    categories: ['全部', '初阶', '进阶', '高级', '特别'],
    filteredCourses: [],
    learnedMap: {},
    // AI 动态生成
    aiConfigured: false,
    generatingNew: false,
    aiCourses: [], // AI 动态生成的课程
    showAISection: false,
  },

  onLoad() {
    const gender = wx.getStorageSync('userGender') || 'all'
    const aiConfigured = ai.isConfigured()
    const aiCourses = wx.getStorageSync('aiGeneratedCourses') || {}
    const aiCourseList = Object.values(aiCourses)

    this.setData({
      genderFilter: gender === '' ? 'all' : gender,
      aiConfigured,
      aiCourses: aiCourseList,
      showAISection: aiCourseList.length > 0,
    })
    this.filterCourses()
  },

  onShow() {
    const learnedMap = wx.getStorageSync('learningProgress') || {}
    this.setData({ learnedMap })
    this.filterCourses()
  },

  filterCourses() {
    let list = [...COURSES]
    const { genderFilter, activeCategory } = this.data
    if (genderFilter !== 'all') {
      list = list.filter(c => c.gender === genderFilter || c.gender === 'both')
    }
    if (activeCategory !== '全部') {
      list = list.filter(c => c.category === activeCategory)
    }
    this.setData({ filteredCourses: list })
  },

  setFilter(e) {
    const { type, val } = e.currentTarget.dataset
    this.setData({ [type === 'gender' ? 'genderFilter' : 'activeCategory']: val }, () => {
      this.filterCourses()
    })
  },

  setCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.cat }, () => {
      this.filterCourses()
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  // AI 动态生成新课程
  generateNewCourses() {
    if (this.data.generatingNew) return
    const { genderFilter, activeCategory } = this.data

    const genderMap = { male: '男生', female: '女生', all: '通用' }
    const gender = genderMap[genderFilter] || '通用'
    const category = activeCategory !== '全部' ? activeCategory : '进阶'

    this.setData({ generatingNew: true })

    wx.showLoading({ title: 'AI 生成课程中...' })

    ai.generateCourseList({ gender, category, count: 3 }, (raw) => {
      wx.hideLoading()
      const parsed = ai.parseCourseList(raw)

      if (parsed.length > 0) {
        // 存储到本地
        const stored = wx.getStorageSync('aiGeneratedCourses') || {}
        const newCourses = {}
        parsed.forEach((c, i) => {
          const id = `ai_${Date.now()}_${i}`
          const course = {
            id,
            title: c.title,
            desc: c.desc,
            category: c.category,
            gender: genderFilter === 'all' ? 'both' : genderFilter,
            chapters: c.chapters,
            cover: '🤖',
            coverBg: '#6C63FF',
            tags: ['AI 生成', category],
            isFree: true,
            views: 0,
            isAIGenerated: true,
          }
          newCourses[id] = course
          stored[id] = course
        })
        wx.setStorageSync('aiGeneratedCourses', stored)

        const aiCourseList = Object.values(stored)
        this.setData({
          generatingNew: false,
          aiCourses: aiCourseList,
          showAISection: true,
        })
        wx.showToast({ title: `AI 生成了 ${parsed.length} 门新课程！`, icon: 'none' })
      } else {
        this.setData({ generatingNew: false })
        wx.showToast({ title: 'AI 生成课程失败，稍后再试', icon: 'none' })
      }
    }, (err) => {
      wx.hideLoading()
      this.setData({ generatingNew: false })
      const ai = require('../../utils/ai')
      if (err === '__domain_blocked__') {
        ai.handleError(err)
      } else {
        wx.showToast({ title: 'AI 生成失败，请稍后再试', icon: 'none' })
      }
    })
  },

  clearAICourses() {
    wx.showModal({
      title: '清除 AI 课程',
      content: '确定清除所有 AI 生成的课程吗？',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('aiGeneratedCourses')
          this.setData({ aiCourses: [], showAISection: false })
        }
      }
    })
  },
})
