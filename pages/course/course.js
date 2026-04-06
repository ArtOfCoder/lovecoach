// pages/course/course.js - 课程列表页（含搜索/分类）
const { COURSES } = require('../../data/courses')
const ai = require('../../utils/ai')

// 分类映射：将数据中的 category 值映射到显示名
const CATEGORY_MAP = {
  '全部': null,
  '入门': ['初阶', '入门', 'beginner'],
  '聊天': ['聊天', 'chat', '进阶'],
  '约会': ['约会', 'date'],
  '关系': ['关系', 'relationship', '高级', '深度'],
  '心理': ['心理', '心法', '特别'],
  '分手': ['分手', '高阶'],
}

Page({
  data: {
    genderFilter: 'all',
    activeCategory: '全部',
    categories: ['全部', '入门', '聊天', '约会', '关系', '心理', '分手'],
    filteredCourses: [],
    learnedMap: {},
    searchKeyword: '',
    showSearch: false,
    totalCount: 0,
    // 课程统计
    courseStats: {},
    // AI 动态生成
    aiConfigured: false,
    generatingNew: false,
    aiCourses: [],
    showAISection: false,
  },

  onLoad() {
    const gender = wx.getStorageSync('userGender') || 'all'
    const aiConfigured = ai.isConfigured()
    const aiCourses = wx.getStorageSync('aiGeneratedCourses') || {}
    const aiCourseList = Object.values(aiCourses)

    // 统计各分类数量
    const stats = {}
    COURSES.forEach(c => {
      const cat = this._mapCategory(c.category)
      stats[cat] = (stats[cat] || 0) + 1
    })

    this.setData({
      genderFilter: gender === '' ? 'all' : gender,
      aiConfigured,
      aiCourses: aiCourseList,
      showAISection: aiCourseList.length > 0,
      totalCount: COURSES.length,
      courseStats: stats,
    })
    
    // 延迟加载课程列表，避免阻塞页面渲染
    setTimeout(() => {
      this.filterCourses()
    }, 50)
  },

  onShow() {
    const learnedMap = wx.getStorageSync('learningProgress') || {}
    this.setData({ learnedMap })
    this.filterCourses()
  },

  // 将数据中的 category 映射到页面分类
  _mapCategory(dataCategory) {
    for (const [key, vals] of Object.entries(CATEGORY_MAP)) {
      if (key === '全部') continue
      if (vals && vals.includes(dataCategory)) return key
    }
    return '关系' // 默认归到关系类
  },

  filterCourses() {
    let list = [...COURSES]
    const { genderFilter, activeCategory, searchKeyword } = this.data

    // 性别筛选
    if (genderFilter !== 'all') {
      list = list.filter(c => c.gender === genderFilter || c.gender === 'both')
    }

    // 分类筛选
    if (activeCategory !== '全部') {
      const validCats = CATEGORY_MAP[activeCategory] || []
      list = list.filter(c => validCats.includes(c.category))
    }

    // 关键词搜索
    if (searchKeyword && searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase()
      list = list.filter(c =>
        c.title.toLowerCase().includes(kw) ||
        c.desc.toLowerCase().includes(kw) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(kw)))
      )
    }

    this.setData({ filteredCourses: list })
  },

  toggleSearch() {
    this.setData({
      showSearch: !this.data.showSearch,
      searchKeyword: '',
    })
    if (!this.data.showSearch) {
      this.filterCourses()
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.filterCourses()
  },

  clearSearch() {
    this.setData({ searchKeyword: '' })
    this.filterCourses()
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

  goToSearch() {
    this.setData({ showSearch: true })
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
