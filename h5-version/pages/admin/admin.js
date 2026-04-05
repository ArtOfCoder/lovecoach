// pages/admin/admin.js
// 管理后台 - 手动解锁用户 & 黑名单管理 & OCR记录查看 & 支付记录 & 统计数据（本地存储模式）

const storage = require('../../utils/storage')

Page({
  data: {
    isLogin: false,
    password: '',
    activeTab: 'unlock',  // 'unlock' | 'banned' | 'ocr' | 'payments' | 'stats'
    bannedUsers: [],      // 黑名单
    unlockUserId: '',     // 输入的要解锁的用户ID
    recentUnlocks: [],    // 最近解锁记录
    ocrRecords: [],       // OCR识别记录
    soulmateUnlocks: [],  // 灵魂伴侣解锁记录（生图解锁）
    paymentRecords: [],   // 支付记录
    adminStats: null,     // 统计数据
    behaviorLogs: [],     // 用户行为日志
    showBanInput: false,  // 是否显示封禁输入弹窗
    banInputValue: '',    // 封禁输入值
    totalRevenue: '0.0',  // 总收入
  },

  onLoad() {
    const isLogin = wx.getStorageSync('adminLogin') || false
    this.setData({ isLogin })

    if (isLogin) {
      this.loadData()
    }
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  // 登录
  login() {
    if (this.data.password === 'love2026') {
      wx.setStorageSync('adminLogin', true)
      this.setData({ isLogin: true })
      this.loadData()
    } else {
      wx.showToast({ title: '密码错误', icon: 'none' })
    }
  },

  // 退出登录
  logout() {
    wx.setStorageSync('adminLogin', false)
    this.setData({ isLogin: false, password: '' })
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadData()
  },

  // 加载数据
  loadData() {
    this.loadBannedUsers()
    this.loadRecentUnlocks()
    this.loadOcrRecords()
    this.loadSoulmateUnlocks()
    this.loadPaymentRecords()
    this.loadAdminStats()
    this.loadBehaviorLogs()
  },

  // 加载支付记录
  loadPaymentRecords() {
    const paymentRecords = wx.getStorageSync('paymentRecords') || []
    // 格式化记录
    const formattedRecords = paymentRecords.map(r => ({
      ...r,
      formattedTime: this.formatDate(new Date(r.time)),
      statusText: r.status === 'success' ? '成功' : r.status === 'pending' ? '待审核' : '失败'
    })).reverse() // 最新的在前
    
    // 计算总收入
    const totalRevenue = paymentRecords
      .filter(r => r.status === 'success')
      .reduce((sum, r) => sum + (r.amount || 0), 0)
      .toFixed(1)
    
    this.setData({ 
      paymentRecords: formattedRecords.slice(0, 50),
      totalRevenue
    })
  },

  // 加载统计数据
  loadAdminStats() {
    const stats = storage.getAdminStats()
    this.setData({ adminStats: stats })
  },

  // 加载用户行为日志
  loadBehaviorLogs() {
    const logs = storage.getUserBehaviorLogs({ limit: 50 })
    const formattedLogs = logs.map(l => ({
      ...l,
      formattedTime: this.formatDate(new Date(l.timestamp))
    }))
    this.setData({ behaviorLogs: formattedLogs })
  },

  // 加载OCR识别记录
  loadOcrRecords() {
    const ocrRecords = wx.getStorageSync('ocr_records') || []
    this.setData({ ocrRecords: ocrRecords.slice(0, 20) }) // 只显示最近20条
  },

  // 加载灵魂伴侣解锁记录
  loadSoulmateUnlocks() {
    const soulmateUnlocks = wx.getStorageSync('soulmate_unlocks') || []
    this.setData({ soulmateUnlocks: soulmateUnlocks.slice(0, 20) })
  },

  // 输入要解锁的用户ID
  onUnlockUserIdInput(e) {
    this.setData({ unlockUserId: e.detail.value.trim() })
  },

  // ✅ 手动解锁用户（通过 userId）- 真正解锁灵魂伴侣生图功能
  unlockByUserId() {
    const userId = this.data.unlockUserId
    if (!userId) {
      wx.showToast({ title: '请输入用户ID', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认解锁',
      content: `用户ID：${userId}\n\n确认解锁该用户的灵魂伴侣生图功能？\n\n解锁后用户可以：\n• 查看高清无模糊图片\n• 保存图片到相册\n• 分享图片`,
      confirmText: '✅ 确认解锁',
      confirmColor: '#4CAF50',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return

        // 1. 保存到灵魂伴侣解锁记录（用于识别已解锁用户）
        const soulmateUnlocks = wx.getStorageSync('soulmate_unlocks') || []
        
        // 检查是否已解锁
        const existingIndex = soulmateUnlocks.findIndex(u => u.userId === userId)
        if (existingIndex >= 0) {
          // 更新解锁时间
          soulmateUnlocks[existingIndex].unlockTime = Date.now()
          soulmateUnlocks[existingIndex].formattedTime = this.formatDate(new Date())
          soulmateUnlocks[existingIndex].unlockType = 'manual'
        } else {
          // 新增解锁记录
          soulmateUnlocks.unshift({
            userId,
            unlockTime: Date.now(),
            formattedTime: this.formatDate(new Date()),
            unlockType: 'manual',  // manual | auto
            source: 'admin_manual'
          })
        }
        
        // 只保留最近50条
        if (soulmateUnlocks.length > 50) soulmateUnlocks.pop()
        wx.setStorageSync('soulmate_unlocks', soulmateUnlocks)

        // 2. 同时保存到最近解锁记录（用于显示）
        const recentUnlocks = wx.getStorageSync('recentUnlocks') || []
        recentUnlocks.unshift({
          userId,
          unlockTime: Date.now(),
          formattedTime: this.formatDate(new Date()),
          type: 'soulmate'
        })
        if (recentUnlocks.length > 20) recentUnlocks.pop()
        wx.setStorageSync('recentUnlocks', recentUnlocks)

        this.setData({ 
          unlockUserId: '', 
          recentUnlocks,
          soulmateUnlocks: soulmateUnlocks.slice(0, 20)
        })
        
        wx.showModal({
          title: '✅ 解锁成功',
          content: `用户 ${userId} 的灵魂伴侣功能已解锁！\n\n请告诉用户：\n"已为您解锁，请退出小程序重新进入即可查看高清图片"`,
          showCancel: false,
        })
      }
    })
  },

  // 🔍 查看用户解锁状态
  checkUserUnlockStatus() {
    const userId = this.data.unlockUserId
    if (!userId) {
      wx.showToast({ title: '请输入用户ID', icon: 'none' })
      return
    }

    const soulmateUnlocks = wx.getStorageSync('soulmateUnlocks') || []
    const isUnlocked = soulmateUnlocks.some(u => u.userId === userId)
    
    const bannedUsers = wx.getStorageSync('bannedUsers') || []
    const isBanned = bannedUsers.some(u => u.userId === userId)

    let content = `用户ID：${userId}\n\n`
    content += `灵魂伴侣解锁状态：${isUnlocked ? '✅ 已解锁' : '❌ 未解锁'}\n`
    content += `黑名单状态：${isBanned ? '🚫 已封禁' : '✅ 正常'}\n\n`
    
    if (isUnlocked) {
      const record = soulmateUnlocks.find(u => u.userId === userId)
      content += `解锁时间：${record.formattedTime || this.formatDate(new Date(record.unlockTime))}\n`
      content += `解锁方式：${record.unlockType === 'manual' ? '人工解锁' : '自动解锁'}`
    }

    wx.showModal({
      title: '用户状态查询',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // ❌ 取消用户解锁（撤销解锁）
  revokeUnlock(e) {
    const userId = e.currentTarget.dataset.userid
    
    wx.showModal({
      title: '确认取消解锁',
      content: `确定要取消用户 ${userId} 的灵魂伴侣解锁状态吗？\n\n取消后用户将无法查看高清图片。`,
      confirmText: '确认取消',
      confirmColor: '#f44336',
      cancelText: '保留',
      success: (res) => {
        if (!res.confirm) return
        
        let soulmateUnlocks = wx.getStorageSync('soulmateUnlocks') || []
        soulmateUnlocks = soulmateUnlocks.filter(u => u.userId !== userId)
        wx.setStorageSync('soulmateUnlocks', soulmateUnlocks)
        
        this.setData({ soulmateUnlocks: soulmateUnlocks.slice(0, 20) })
        wx.showToast({ title: '已取消解锁', icon: 'success' })
      }
    })
  },

  // 加载最近解锁记录
  loadRecentUnlocks() {
    const recentUnlocks = wx.getStorageSync('recentUnlocks') || []
    this.setData({ recentUnlocks })
  },

  // 加载黑名单
  loadBannedUsers() {
    const bannedUsers = wx.getStorageSync('bannedUsers') || []
    this.setData({ bannedUsers })
  },

  // 手动添加黑名单
  addToBanned() {
    // 使用 input 对话框代替 editable modal（兼容性更好）
    wx.showModal({
      title: '添加黑名单',
      content: '请输入要封禁的用户ID：',
      confirmText: '🚫 确认封禁',
      confirmColor: '#f44336',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return
        // 使用 prompt 方式获取输入
        this.showBanInputDialog()
      }
    })
  },

  // 显示封禁输入对话框
  showBanInputDialog() {
    // 尝试使用 editable modal（高版本基础库支持）
    if (wx.canIUse('showModal.editable')) {
      wx.showModal({
        title: '输入用户ID',
        editable: true,
        placeholderText: '请输入用户ID',
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm && res.content) {
            this.doBanUser(res.content.trim())
          }
        }
      })
    } else {
      // 低版本使用页面内输入框方式
      this.setData({ showBanInput: true, banInputValue: '' })
    }
  },

  // 执行封禁用户
  doBanUser(userId) {
    if (!userId) {
      wx.showToast({ title: '用户ID不能为空', icon: 'none' })
      return
    }
    
    const reason = '手动封禁'
    const bannedUsers = wx.getStorageSync('bannedUsers') || []
    
    // 检查是否已存在
    if (bannedUsers.some(u => u.userId === userId)) {
      wx.showToast({ title: '该用户已在黑名单', icon: 'none' })
      return
    }
    
    bannedUsers.push({
      userId,
      nickName: '未知用户',
      banReason: reason,
      banTime: Date.now(),
      formattedTime: this.formatDate(new Date())
    })
    
    wx.setStorageSync('bannedUsers', bannedUsers)
    this.loadBannedUsers()
    wx.showToast({ title: '已封禁', icon: 'success' })
  },

  // 输入封禁用户ID
  onBanInputChange(e) {
    this.setData({ banInputValue: e.detail.value })
  },

  // 确认封禁（页面内输入框方式）
  confirmBan() {
    const { banInputValue } = this.data
    this.setData({ showBanInput: false })
    this.doBanUser(banInputValue.trim())
  },

  // 取消封禁输入
  cancelBan() {
    this.setData({ showBanInput: false, banInputValue: '' })
  },

  // 解封用户
  unbanUser(e) {
    const userId = e.currentTarget.dataset.userid
    wx.showModal({
      title: '解封用户',
      content: '确定要解封该用户吗？',
      confirmText: '确认解封',
      success: (res) => {
        if (!res.confirm) return
        const bannedUsers = wx.getStorageSync('bannedUsers') || []
        const updated = bannedUsers.filter(u => u.userId !== userId)
        wx.setStorageSync('bannedUsers', updated)
        this.loadBannedUsers()
        wx.showToast({ title: '已解封', icon: 'success' })
      }
    })
  },

  // 格式化时间
  formatDate(date) {
    if (!date) return '-'
    const d = new Date(date)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  },
})
