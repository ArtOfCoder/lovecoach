// pages/topics/topics.js
const { TOPICS, SWEET_WORDS } = require('../../data/courses')
const ai = require('../../utils/ai')

Page({
  data: {
    activeTab: 'topics',
    topics: TOPICS,
    showTopicModal: false,
    currentTopic: {},
    // 金句
    scenes: ['全部', '早安', '晚安', '表白', '约会', '撒娇', '男生专用', '女生专用', '挽回'],
    activeScene: '全部',
    filteredWords: SWEET_WORDS,
    showRandomModal: false,
    randomWordText: '',
    // ===== AI 生成功能 =====
    aiTopics: [],          // AI 生成的话题
    aiWords: [],           // AI 生成的金句
    generatingTopics: false, // 正在生成话题
    generatingWords: false,  // 正在生成金句
    userGender: 'both',    // 用户性别
  },

  onLoad() {
    // 获取用户性别，用于 AI 生成金句时调整语气
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.gender) {
      this.setData({ userGender: userInfo.gender })
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  // 话题
  openTopic(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ showTopicModal: true, currentTopic: TOPICS[idx] })
  },

  closeTopicModal() {
    this.setData({ showTopicModal: false })
  },

  copyQuestion(e) {
    const q = e.currentTarget.dataset.q
    wx.setClipboardData({
      data: q,
      success: () => wx.showToast({ title: '已复制话题', icon: 'success' })
    })
  },

  // 金句
  setScene(e) {
    const scene = e.currentTarget.dataset.scene
    const list = scene === '全部'
      ? SWEET_WORDS
      : SWEET_WORDS.filter(w => w.scene === scene)
    this.setData({ activeScene: scene, filteredWords: list })
  },

  randomWord() {
    const list = this.data.filteredWords.length > 0 ? this.data.filteredWords : SWEET_WORDS
    const idx = Math.floor(Math.random() * list.length)
    this.setData({ randomWordText: list[idx].text, showRandomModal: true })
  },

  closeRandomModal() {
    this.setData({ showRandomModal: false })
  },

  copyWord(e) {
    const text = e.currentTarget.dataset.text
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制金句', icon: 'success' })
    })
  },

  copyRandomWord() {
    wx.setClipboardData({
      data: this.data.randomWordText,
      success: () => {
        this.setData({ showRandomModal: false })
        wx.showToast({ title: '已复制，去用用吧 💕', icon: 'none', duration: 2000 })
      }
    })
  },

  // ===== AI 生成话题 =====
  generateAITopics() {
    if (this.data.generatingTopics) return

    this.setData({ generatingTopics: true })
    wx.showLoading({ title: 'AI 生成中...', mask: true })

    // 随机选择分类
    const categories = ['初次见面', '深入了解', '制造笑点', '聊价值观', '撩拨小话题']
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]

    ai.generateTopics(
      { category: randomCategory, count: 10 },
      (content) => {
        wx.hideLoading()
        const parsedTopics = ai.parseTopics(content)
        // 合并到现有话题中
        const newTopics = parsedTopics.map((item, idx) => ({
          id: 1000 + idx,
          category: '✨ ' + item.category,
          icon: '🤖',
          questions: item.questions,
          isAI: true,  // 标记为 AI 生成
        }))
        this.setData({
          aiTopics: newTopics,
          generatingTopics: false,
        })
        wx.showToast({ title: '话题已生成 ✨', icon: 'success' })
      },
      (err) => {
        wx.hideLoading()
        this.setData({ generatingTopics: false })
        ai.handleError(err, '生成话题失败，请重试')
      }
    )
  },

  // ===== AI 生成金句 =====
  generateAIWords() {
    if (this.data.generatingWords) return

    this.setData({ generatingWords: true })
    wx.showLoading({ title: 'AI 生成中...', mask: true })

    // 随机选择场景
    const scenes = ['早安', '晚安', '表白', '约会', '撒娇', '挽回']
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)]

    ai.generateSweetWords(
      { scene: randomScene, gender: this.data.userGender, count: 8 },
      (content) => {
        wx.hideLoading()
        const parsedWords = ai.parseSweetWords(content)
        // 转换为金句格式
        const newWords = parsedWords.map((item, idx) => ({
          id: 2000 + idx,
          scene: item.scene,
          text: item.text,
          isAI: true,
        }))
        this.setData({
          aiWords: newWords,
          generatingWords: false,
        })
        wx.showToast({ title: '金句已生成 💕', icon: 'success' })
      },
      (err) => {
        wx.hideLoading()
        this.setData({ generatingWords: false })
        ai.handleError(err, '生成金句失败，请重试')
      }
    )
  },

  // 复制 AI 生成的话题
  copyAITopic(e) {
    const q = e.currentTarget.dataset.q
    wx.setClipboardData({
      data: q,
      success: () => wx.showToast({ title: '已复制话题', icon: 'success' })
    })
  },

  // 复制 AI 生成的金句
  copyAIWord(e) {
    const text = e.currentTarget.dataset.text
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制金句', icon: 'success' })
    })
  },
})
