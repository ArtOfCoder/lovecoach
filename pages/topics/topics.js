// pages/topics/topics.js
const { TOPICS, SWEET_WORDS } = require('../../data/courses')

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
    userGender: 'both',
  },

  onLoad() {
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
})
