// pages/detail/detail.js - 课程内容动态生成版
const { COURSES } = require('../../data/courses')
const ai = require('../../utils/ai')

Page({
  data: {
    course: {},
    chapterDone: [],
    showModal: false,
    currentChapter: {},
    currentIdx: 0,
    isCompleted: false,
    // 章节内容生成
    aiContent: '',     // 生成的章节内容
    aiLoading: false,  // 生成中
    useAIContent: false, // 当前章节使用动态内容
    aiConfigured: false,
  },

  onLoad(options) {
    const { id, aiGen } = options
    const aiConfigured = ai.isConfigured()
    this.setData({ aiConfigured })

    // 检查是否是动态生成课程（id 以 ai_ 开头）
    if (id && id.startsWith('ai_')) {
      this.loadAICourse(id)
      return
    }

    const course = COURSES.find(c => c.id === id) || {}
    const progress = wx.getStorageSync('learningProgress') || {}
    const chapterDone = course.chapters ? course.chapters.map((_, i) => {
      return !!(progress[id] && progress[id].includes(i))
    }) : []
    const isCompleted = chapterDone.length > 0 && chapterDone.every(v => v)
    this.setData({ course, chapterDone, isCompleted })
    wx.setNavigationBarTitle({ title: course.title || '课程详情' })
  },

  loadAICourse(id) {
    // 从 storage 加载动态生成的课程
    const aiCourses = wx.getStorageSync('aiGeneratedCourses') || {}
    const course = aiCourses[id]
    if (course) {
      const progress = wx.getStorageSync('learningProgress') || {}
      const chapterDone = course.chapters ? course.chapters.map((_, i) => {
        return !!(progress[id] && progress[id].includes(i))
      }) : []
      this.setData({ course, chapterDone })
      wx.setNavigationBarTitle({ title: course.title || '课程详情' })
    } else {
      wx.showToast({ title: '课程不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  openChapter(e) {
    const idx = e.currentTarget.dataset.idx
    const chapter = this.data.course.chapters[idx]
    this.setData({
      showModal: true,
      currentChapter: chapter,
      currentIdx: idx,
      aiContent: '',
      useAIContent: false,
    })

    // 如果章节内容为空，自动生成内容
    if (!chapter.content && this.data.aiConfigured) {
      this.generateChapterContent(chapter)
    }
  },

  generateChapterContent(chapter) {
    const { course } = this.data
    this.setData({ aiLoading: true, useAIContent: true })

    ai.generateCourseContent({
      title: course.title || '恋爱技巧',
      gender: course.gender || 'both',
      category: course.category || '进阶',
      chapterTitle: chapter.title,
    }, (content) => {
      this.setData({ aiContent: content, aiLoading: false })
    }, (err) => {
      console.error('[detail] 生成章节内容失败:', err)
      this.setData({
        aiContent: chapter.content || '内容加载失败，请检查网络后重试。',
        aiLoading: false,
      })
    })
  },

  reGenerateContent() {
    const chapter = this.data.currentChapter
    if (!chapter) return
    this.setData({ aiContent: '', aiLoading: true })
    this.generateChapterContent(chapter)
  },

  closeModal() {
    this.setData({ showModal: false })
  },

  markDone() {
    const { course, chapterDone, currentIdx } = this.data
    const newDone = [...chapterDone]
    newDone[currentIdx] = true

    const progress = wx.getStorageSync('learningProgress') || {}
    if (!progress[course.id]) progress[course.id] = []
    if (!progress[course.id].includes(currentIdx)) {
      progress[course.id].push(currentIdx)
    }
    wx.setStorageSync('learningProgress', progress)

    const isCompleted = newDone.every(v => v)
    this.setData({ chapterDone: newDone, showModal: false, isCompleted })

    if (isCompleted) {
      wx.showToast({ title: '🎉 课程学完啦！', icon: 'none', duration: 2000 })
    } else {
      wx.showToast({ title: '已记录学习进度', icon: 'success' })
    }
  },

  goBack() {
    wx.navigateBack()
  },
})
