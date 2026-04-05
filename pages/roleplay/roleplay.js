// pages/roleplay/roleplay.js - 转向 AI 顾问角色练习模式
Page({
  onLoad() {
    // ai-coach 是 tabBar 页面，使用 switchTab 并带参数
    // 先存储模式，在 ai-coach 的 onShow 中读取
    wx.setStorageSync('pendingMode', 'practice')
    // 使用 redirectTo 跳转到 ai-coach，这样可以触发 onLoad
    wx.redirectTo({
      url: '/pages/ai-coach/ai-coach?mode=practice',
      fail: () => {
        // 如果失败（因为 ai-coach 是 tabBar 页面），使用 switchTab
        wx.switchTab({ url: '/pages/ai-coach/ai-coach' })
      }
    })
  },
})
