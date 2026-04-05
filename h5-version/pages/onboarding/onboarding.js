// pages/onboarding/onboarding.js - 用户资料设置页面
Page({
  data: {
    selectedGender: '',  // 'male' | 'female'
    nickname: '',
    step: 1,  // 1:性别选择 2:昵称设置
    canProceed: false,
    isEditMode: false,  // 是否从"我的"页面进入的编辑模式
  },

  onLoad(options) {
    // 检查是否是编辑模式（从"我的"页面进入）
    const isEditMode = options && options.mode === 'edit'
    
    // 加载已有信息
    const userGender = wx.getStorageSync('userGender') || ''
    const userInfo = wx.getStorageSync('userInfo') || {}
    
    this.setData({
      selectedGender: userGender,
      nickname: userInfo.nickname || '',
      canProceed: !!userGender,
      isEditMode: isEditMode,
    })
  },

  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ selectedGender: gender, canProceed: true })
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  nextStep() {
    if (!this.data.selectedGender) {
      wx.showToast({ title: '请先选择你的性别', icon: 'none' })
      return
    }
    this.setData({ step: 2 })
  },

  skipNickname() {
    this.finishOnboarding()
  },

  confirmNickname() {
    const { nickname } = this.data
    if (nickname && nickname.trim()) {
      const userInfo = wx.getStorageSync('userInfo') || {}
      userInfo.nickname = nickname.trim()
      wx.setStorageSync('userInfo', userInfo)
    }
    this.finishOnboarding()
  },

  finishOnboarding() {
    const { selectedGender, isEditMode } = this.data
    
    // 保存性别
    wx.setStorageSync('userGender', selectedGender)
    // 标记已完成引导
    wx.setStorageSync('onboardingDone', true)

    if (isEditMode) {
      // 编辑模式：返回上一页
      wx.navigateBack()
    } else {
      // 首次引导：跳转到首页
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  // 返回（编辑模式可用）
  goBack() {
    wx.navigateBack()
  },
})
