// app.js - 恋爱进化论小程序
App({
  onLaunch() {
    // 云开发初始化（当前未使用）
    // 如需启用云开发，取消下面的注释并填写你的云环境 ID
    /*
    if (wx.cloud) {
      wx.cloud.init({
        env: 'your-env-id',
        traceUser: true,
      })
      console.log('[App] 云开发初始化完成')
    }
    */

    // 读取本地用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }

    // 读取学习进度
    const progress = wx.getStorageSync('learningProgress') || {}
    this.globalData.learningProgress = progress

    // 检查是否需要显示引导页（仅首次使用）
    const onboardingDone = wx.getStorageSync('onboardingDone')
    const userGender = wx.getStorageSync('userGender')

    // 如果已经完成引导且有性别设置，不再自动初始化
    if (!onboardingDone && !userGender) {
      // 首次使用：自动分配默认性别和昵称，不强制跳引导页
      this.autoInitUserInfo()
    }
    
    // 获取用户登录凭证（用于获取唯一标识）
    this.getUserLoginCode()

    // 检查是否需要跳转到引导页（在 onLaunch 结束后执行）
    this.checkOnboardingRedirect()
  },

  // 检查是否需要跳转到引导页
  checkOnboardingRedirect() {
    const onboardingDone = wx.getStorageSync('onboardingDone')
    const userGender = wx.getStorageSync('userGender')
    
    // 如果没有完成引导或没有性别设置，跳转到引导页
    if (!onboardingDone || !userGender) {
      // 延迟执行，确保页面栈初始化完成
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/onboarding/onboarding',
          fail: (err) => {
            console.error('[App] 跳转引导页失败:', err)
          }
        })
      }, 100)
    }
  },
  
  // 获取用户登录 code，用于生成唯一用户标识
  getUserLoginCode() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 保存登录 code，可用于后续换取 OpenID
          // 注意：code 5分钟有效，这里仅用于生成临时唯一标识
          const userInfo = wx.getStorageSync('userInfo') || {}
          // 生成基于 code 的临时用户标识（用于支付记录关联）
          const tempUserId = this.generateTempUserId(res.code)
          userInfo.tempUserId = tempUserId
          userInfo.loginCode = res.code
          userInfo.loginTime = Date.now()
          wx.setStorageSync('userInfo', userInfo)
          this.globalData.userInfo = userInfo
          console.log('[App] 用户登录标识已获取:', tempUserId)
        }
      },
      fail: (err) => {
        console.error('[App] 获取登录 code 失败:', err)
      }
    })
  },
  
  // 生成临时用户标识（基于登录 code）
  generateTempUserId(code) {
    // 取 code 的前 16 位作为标识（code 是 28 位字符串）
    // 这样同一用户每次登录的标识会不同，但可以关联到同一设备/会话
    const prefix = code.substring(0, 16)
    // 添加时间戳后缀，确保唯一性
    const timestamp = Date.now().toString(36).substring(0, 4).toUpperCase()
    return `USER-${prefix}-${timestamp}`
  },

  // 自动初始化用户信息（首次使用）
  autoInitUserInfo() {
    // 随机分配性别（50%概率）
    const randomGender = Math.random() > 0.5 ? 'male' : 'female'
    wx.setStorageSync('userGender', randomGender)
    this.globalData.userGender = randomGender

    // 生成随机昵称
    const nicknames = {
      male: ['阳光少年', '追风少年', '星辰', '清风', '少年', '小哥哥', '萌新'],
      female: ['甜心少女', '樱花', '小鹿', '月光', '小仙女', '萌妹子', '小可爱']
    }
    const genderNicknames = nicknames[randomGender]
    const randomNickname = genderNicknames[Math.floor(Math.random() * genderNicknames.length)]
    const timestamp = Date.now().toString().slice(-4)
    const defaultNickname = `${randomNickname}${timestamp}`

    const userInfo = {
      nickname: defaultNickname,
      avatar: '',
      gender: randomGender,
    }
    wx.setStorageSync('userInfo', userInfo)
    this.globalData.userInfo = userInfo

    // 标记已完成引导（自动分配也算完成）
    wx.setStorageSync('onboardingDone', true)

    console.log('[App] 自动初始化用户信息:', { gender: randomGender, nickname: defaultNickname })
  },

  globalData: {
    userInfo: null,
    learningProgress: {},
    // 用户性别：'male' | 'female'，影响推荐内容
    userGender: wx.getStorageSync('userGender') || '',
  }
})
