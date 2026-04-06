// pages/ai-coach/ai-coach.js - 恋爱顾问（本地知识库版）
const ai = require('../../utils/ai')
const storage = require('../../utils/storage')

// 本地知识库 - 恋爱建议回复库
const ADVICE_LIBRARY = {
  // 搭讪相关
  搭讪: [
    "搭讪最重要的是自然，不要背台词。观察对方的当下状态，从环境切入话题，比如她正在看的书、喝的咖啡。",
    "3秒法则：看到想认识的人，3秒内开口。想太久会给自己太多压力，反而说不出口。",
    "被拒绝很正常，不要把它当作个人价值的否定。保持礼貌离开，留下好印象，说不定下次还有机会。"
  ],
  // 暧昧期
  暧昧: [
    "暧昧期最大的任务是创造线下见面的机会。线上聊得再好，不如一次真实的约会。",
    "制造专属感：记住她随口说过的小事，下次提起时她会觉得很特别。",
    "适当保持神秘感，不要一次性把自己全部展示完。留一些让对方慢慢发现的空间。"
  ],
  // 约会
  约会: [
    "第一次约会不要选电影院，要选能聊天的地方。咖啡馆、文创园区、展览都是不错的选择。",
    "约会结束时给下一次埋下伏笔：'下次带你去我发现的一家店'，而不是'今天很开心'就结束。",
    "约会质量 > 约会花费。用心设计的简单约会，比昂贵的餐厅更能打动人。"
  ],
  // 表白
  表白: [
    "表白的时机比方式更重要。确认对方也对你有好感（3个以上积极信号）再表白。",
    "好的表白要具体：说出你喜欢对方哪里，而不是泛泛的'我喜欢你'。",
    "给对方选择权，不要施压。'我想和你在一起，你怎么看？'比'做我女朋友吧'更好。"
  ],
  // 分手挽回
  分手: [
    "刚分手不要急着挽回。给彼此冷静期，情绪平复后再沟通。",
    "挽回的核心是改变，不是承诺。让对方看到你真的在改变，而不只是说说。",
    "如果对方已经明确拒绝，尊重对方的选择。有时候放手也是爱的方式。"
  ],
  // 婚后
  婚后: [
    "婚后要持续表达爱，'她知道'不是不说的理由。每天一句'我爱你'永远不嫌多。",
    "定期创造二人世界，不要让生活完全被孩子和工作填满。",
    "学会说谢谢。即使是小事，也要感谢对方的付出。"
  ],
  // 通用
  通用: [
    "恋爱没有标准答案，最重要的是真诚。套路可以学，但真心是装不出来的。",
    "沟通是关键。很多矛盾不是因为不爱，而是因为没说清楚。",
    "爱自己才能爱别人。不要为了迎合对方而失去自我。"
  ]
}

// 根据关键词匹配本地回复
function getLocalAdvice(input) {
  const lowerInput = input.toLowerCase()
  
  // 关键词匹配
  if (/搭讪|认识|开场|陌生人/.test(lowerInput)) {
    return getRandomResponse(ADVICE_LIBRARY.搭讪)
  }
  if (/暧昧|约出来|约会|见面/.test(lowerInput)) {
    return getRandomResponse(ADVICE_LIBRARY.暧昧)
  }
  if (/表白|告白|喜欢|在一起/.test(lowerInput)) {
    return getRandomResponse(ADVICE_LIBRARY.表白)
  }
  if (/分手|挽回|前任|复合/.test(lowerInput)) {
    return getRandomResponse(ADVICE_LIBRARY.分手)
  }
  if (/婚后|结婚|夫妻|老公|老婆/.test(lowerInput)) {
    return getRandomResponse(ADVICE_LIBRARY.婚后)
  }
  if (/约会|吃饭|看电影|出去玩/.test(lowerInput)) {
    return getRandomResponse(ADVICE_LIBRARY.约会)
  }
  
  // 默认回复
  return getRandomResponse(ADVICE_LIBRARY.通用)
}

function getRandomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 练习模式的本地角色扮演回复
const PRACTICE_RESPONSES = [
  "（抬头看了你一眼，微微一笑）你好，有什么事吗？\n\n【教练建议】她给了你一个友好的信号，继续保持自然，不要紧张。",
  "嗯，这本书挺有意思的，你也喜欢看书吗？\n\n【教练建议】她接话了！说明对你不排斥。可以顺着书的话题深入。",
  "哈哈，你说得挺有意思的。\n\n【教练建议】她在笑，氛围不错。可以尝试要联系方式了。"
]

// 倾诉模式的本地回复
const CONSOLE_RESPONSES = [
  "听起来你最近挺不容易的，愿意多说一些吗？",
  "我理解你的感受，这种时候确实会让人难过。",
  "你已经很努力了，不要太苛责自己。",
  "想聊聊是什么让你这么想的吗？"
]

// 信号分析的本地回复模板
function getAnalysisResponse(input) {
  return `📊 信号分析

根据你描述的情况，我注意到几个关键点：

🟡 信号强度：中等
对方的反应显示有一定兴趣，但还在观察阶段。

💡 建议策略：
1. 继续保持当前的互动频率
2. 尝试创造更多线下见面的机会
3. 注意观察对方是否主动找你聊天

⚠️ 注意事项：
不要过度解读，给对方一些空间，让关系自然发展。`
}

// 模式欢迎语（动态注入性别）
function getModeWelcome(mode, profile, userGender) {
  const name = profile ? `${profile.myName}，` : ''
  const genderHint = profile
    ? (profile.myGender === 'male' ? '👦 男生视角' : '👧 女生视角')
    : (userGender === 'male' ? '👦 男生视角' : userGender === 'female' ? '👧 女生视角' : '')
  const genderPrompt = !userGender && !profile
    ? '\n\n先告诉我你是男生还是女生？这样我能给你更有针对性的建议～'
    : (genderHint ? '\n\n（已识别：' + genderHint + '，我会从你的视角给建议）' : '')

  const welcomes = {
    normal: `你好！我是你的专属恋爱顾问小爱 💕\n\n有什么恋爱烦恼，随时说来听听～${genderPrompt}`,
    analysis: `📊 信号分析模式已开启\n\n把 TA 的行为、消息、或者你们的互动细节告诉我，我来帮你解读 TA 的真实想法。\n\n分析越详细，结论越准确。`,
    practice: `🎭 角色扮演练习开始！\n\n我现在扮演你喜欢的人，正坐在咖啡馆里看书。\n\n场景：你走进来，发现了我，想来搭讪...\n\n来吧，先开口！（我会给你实时的技巧反馈）`,
    console: `🤗 倾诉模式已开启\n\n今天有什么想说的吗？\n\n不用有逻辑，不用有结论，就是说说心里的话。我在这里。`,
  }
  return welcomes[mode] || welcomes.normal
}

let msgIdCounter = 0
let typingTimer = null
let abortController = null  // 用于中止请求（未来扩展）

Page({
  data: {
    currentMode: 'normal',
    modes: [
      { id: 'normal', icon: '💬', name: '恋爱顾问' },
      { id: 'analysis', icon: '📊', name: '信号分析' },
      { id: 'practice', icon: '🎭', name: '角色练习' },
      { id: 'console', icon: '🤗', name: '倾诉模式' },
    ],
    practiceStarted: false,  // 新增：练习模式是否已开始
    moods: [
      { id: 'happy', emoji: '😊', label: '开心' },
      { id: 'confused', emoji: '🤔', label: '困惑' },
      { id: 'sad', emoji: '😢', label: '难过' },
      { id: 'nervous', emoji: '😰', label: '紧张' },
      { id: 'excited', emoji: '🥰', label: '心动' },
    ],
    currentMood: '',
    messages: [],
    inputText: '',
    isTyping: false,
    scrollToId: '',
    // 快速问题（根据性别动态切换）
    quickQuestions: [
      '怎么自然地搭讪一个人？',
      '暧昧期怎么约出来见面？',
      '如何判断对方喜不喜欢我？',
      '热恋期怎么制造新鲜感？',
      '分手后想挽回怎么做？',
      '婚后怎么找回恋爱的感觉？',
    ],
    // 上下文历史（用于多轮对话）
    chatHistory: [],
    // 用户信息
    userGender: '',
    userProfile: null,
    // AI 状态
    aiStatus: 'idle', // idle | thinking | typing
    aiConfigured: false,
    usingLocalMode: false,  // 新增：是否使用本地模式
    // 实战对话剧本场景
    selectedScene: '',
    practiceScenes: [
      { id: 'cafe', icon: '☕', title: '咖啡馆搭讪', desc: '偶遇心动对象，如何自然开口' },
      { id: 'date', icon: '🎬', title: '第一次约会', desc: '约会时的对话技巧和氛围营造' },
      { id: 'ambiguous', icon: '💕', title: '暧昧期试探', desc: '如何推进关系，确定心意' },
      { id: 'conflict', icon: '💔', title: '吵架后修复', desc: '冷战后如何开口和好' },
      { id: 'proposal', icon: '💍', title: '求婚表白', desc: '如何策划浪漫的表白' },
      { id: 'surprise', icon: '🎁', title: '惊喜制造', desc: '为对方创造难忘的惊喜时刻' },
    ],
  },

  onLoad(options) {
    // 读取用户信息
    const userGender = wx.getStorageSync('userGender') || ''
    const userProfile = wx.getStorageSync('coupleProfile') || null
    const usingLocalMode = ai.USE_LOCAL_MODE  // 检查是否使用本地模式
    const usingCloudFunction = ai.USE_CLOUD_FUNCTION  // 检查是否使用云函数
    // 本地模式、云函数模式或直接API模式下，都认为AI已配置
    const aiConfigured = usingCloudFunction || usingLocalMode || ai.isConfigured()

    console.log('[ai-coach] onLoad - aiConfigured:', aiConfigured, 'usingLocalMode:', usingLocalMode, 'usingCloudFunction:', usingCloudFunction, 'options:', options)

    this.setData({ userGender, userProfile, aiConfigured, usingLocalMode })

    // 根据性别切换快速问题
    if (userGender === 'female') {
      this.setData({
        quickQuestions: [
          '怎么让他主动追我？',
          '他突然变冷淡是什么意思？',
          '如何判断他真的喜欢我？',
          '暧昧期要不要先表白？',
          '被冷落了怎么办？',
          '如何在关系里保持自我？',
        ]
      })
    }

    // 检查是否从 URL 参数传入了模式
    let initialMode = 'normal'
    if (options.mode === 'practice') {
      initialMode = 'practice'
    } else if (options.mode === 'console') {
      initialMode = 'console'
    } else if (options.mode === 'analysis') {
      initialMode = 'analysis'
    }

    // 检查是否从 roleplay 页面带来了模式（使用 switchTab 无法带参数）
    const pendingMode = wx.getStorageSync('pendingMode')
    if (pendingMode) {
      wx.removeStorageSync('pendingMode')
      initialMode = pendingMode
    }

    // 检查是否从首页带来了问题
    const pendingQ = wx.getStorageSync('pendingAIQuestion')
    if (pendingQ) {
      wx.removeStorageSync('pendingAIQuestion')
      this.initMode(initialMode)
      // 减少延迟时间，让用户更快看到问题被发送
      setTimeout(() => {
        this.setData({ inputText: pendingQ }, () => {
          this.sendMessage()
        })
      }, 300)
    } else {
      this.initMode(initialMode)
    }
  },

  onShow() {
    // 刷新用户档案（可能在情侣档案页更新了）
    const userProfile = wx.getStorageSync('coupleProfile') || null
    const userGender = wx.getStorageSync('userGender') || this.data.userGender
    this.setData({ userProfile, userGender })

    // 检查是否从 roleplay 页面带来了模式
    const pendingMode = wx.getStorageSync('pendingMode')
    if (pendingMode) {
      wx.removeStorageSync('pendingMode')
      // 只在当前模式不是目标模式时才切换
      if (this.data.currentMode !== pendingMode) {
        this.initMode(pendingMode)
      }
    }

    // 检查是否有从首页"大家都在问"带来的问题（处理 switchTab 触发 onShow 而非 onLoad 的情况）
    const pendingQ = wx.getStorageSync('pendingAIQuestion')
    if (pendingQ) {
      wx.removeStorageSync('pendingAIQuestion')
      // 如果 AI 不在忙，则在当前对话中直接发送这个问题
      if (!this.data.isTyping) {
        // 切换到普通顾问模式（如果当前不在普通模式）
        const sendQuestion = () => {
          this.setData({ inputText: pendingQ }, () => {
            this.sendMessage()
          })
        }
        if (this.data.currentMode !== 'normal' || this.data.messages.length === 0) {
          // 先初始化到普通模式
          this.initMode('normal')
          setTimeout(sendQuestion, 400)
        } else {
          sendQuestion()
        }
      }
    }
  },

  initMode(modeId) {
    console.log('[ai-coach] initMode - modeId:', modeId)
    if (typingTimer) clearTimeout(typingTimer)
    const { userProfile } = this.data

    // 练习模式特殊处理：先显示场景选择，不立即添加欢迎语
    if (modeId === 'practice') {
      this.setData({
        messages: [],
        chatHistory: [],
        currentMode: modeId,
        isTyping: false,
        aiStatus: 'idle',
        practiceStarted: false,  // 重置练习状态
        selectedScene: '',  // 重置场景选择
      })
      return  // 不添加欢迎语
    }

    // 其他模式：正常显示欢迎语
    this.setData({
      messages: [],
      chatHistory: [],
      currentMode: modeId,
      isTyping: false,
      aiStatus: 'idle',
      practiceStarted: false,
    })
    const welcome = getModeWelcome(modeId, userProfile, this.data.userGender)
    console.log('[ai-coach] initMode - welcome:', welcome)
    // 减少延迟时间，避免用户感觉有"闪现"
    setTimeout(() => {
      console.log('[ai-coach] initMode - calling typewriterAdd')
      this.typewriterAdd('assistant', welcome, this.getDefaultSuggestions(modeId), null)
    }, 100)
  },

  getDefaultSuggestions(mode) {
    const map = {
      normal: ['怎么搭讪？', '如何表白？', '怎么约会？'],
      analysis: ['分析TA的冷淡', '解读TA的行为', '判断TA的感情'],
      practice: ['（开始对话）你好', '你在看什么书？', '好巧，我也喜欢这里'],
      console: ['我最近很难过', '我不知道该怎么办', '想找个人说说话'],
    }
    return map[mode] || []
  },

  switchMode(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.currentMode) return
    wx.showModal({
      title: '切换模式',
      content: '切换后当前对话将清空，确定吗？',
      success: res => {
        if (res.confirm) this.initMode(id)
      }
    })
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  selectMood(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ currentMood: id })
    const moodMessages = {
      happy: '我今天心情很好，想聊聊感情的事',
      confused: '我现在有点困惑，关于喜欢的人，想听听建议',
      sad: '我今天心情不太好，有点难过，想说说',
      nervous: '我最近很紧张，有件感情上的事不知道怎么做',
      excited: '我有点心动了，不知道该怎么办',
    }
    this.setData({ inputText: moodMessages[id] || '' }, () => {
      this.sendMessage()
    })
  },

  sendQuick(e) {
    const q = e.currentTarget.dataset.q
    this.setData({ inputText: q }, () => {
      this.sendMessage()
    })
  },

  clickSuggestion(e) {
    const q = e.currentTarget.dataset.q
    this.setData({ inputText: q }, () => {
      this.sendMessage()
    })
  },

  // 选择练习场景
  selectScene(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ selectedScene: id })
  },

  // 生成练习剧本
  generatePracticeScenario() {
    if (!this.data.selectedScene) return

    const sceneMap = {
      cafe: {
        name: '咖啡馆搭讪',
        description: '你在一家咖啡馆，看到对面座位有一个让你心动的陌生人（根据你的性别，对方是异性）',
        target: '自然地开始搭讪，获取联系方式',
      },
      date: {
        name: '第一次约会',
        description: '你和TA第一次正式约会，在一家有氛围的餐厅',
        target: '营造轻松愉快的氛围，建立良好的第一印象',
      },
      ambiguous: {
        name: '暧昧期试探',
        description: '你和TA已经认识一段时间，关系很暧昧，你想要推进关系',
        target: '试探对方的心意，看是否可以表白',
      },
      conflict: {
        name: '吵架后修复',
        description: '你和TA刚吵完架，已经冷战了两天，你想要和好',
        target: '主动破冰，修复关系',
      },
      proposal: {
        name: '求婚表白',
        description: '你们已经在一起很久了，你决定今天求婚/表白',
        target: '策划一个浪漫的求婚/表白仪式',
      },
      surprise: {
        name: '惊喜制造',
        description: '你想给TA一个惊喜，但不知道该做什么',
        target: '创造一个让TA难忘的惊喜时刻',
      },
    }

    const scene = sceneMap[this.data.selectedScene]

    // 标记练习已开始
    this.setData({ isTyping: true, aiStatus: 'thinking', practiceStarted: true })

    const prompt = `请为恋爱实战练习生成一个对话剧本。

场景：${scene.name}
场景描述：${scene.description}
目标：${scene.target}

要求：
1. 生成一个开场场景描述（50字以内）
2. 生成AI角色的台词（作为第一句回复）
3. 给出用户的3个开场白选项（适合的话术）
4. 给出1条教练建议（该场景的注意事项）

格式：
【场景】
（场景描述）

【AI角色台词】
（第一句回复，自然真实）

【你的开场白选项】
1. （选项1）
2. （选项2）
3. （选项3）

【教练建议】
（该场景的注意事项和技巧）`

    if (this.data.aiConfigured) {
      // 使用 AI 生成
      ai.ask(prompt, 'coach', (content) => {
        this.setData({ isTyping: false, aiStatus: 'typing' })
        this.typewriterAdd('assistant', content, ['开始练习', '换一个场景'], null)
      }, (err) => {
        console.error('[ai-coach] 剧本生成失败:', err)
        this.setData({ isTyping: false, aiStatus: 'idle', practiceStarted: false })
        this.typewriterAdd('assistant', '⚠️ 生成失败，请稍后再试', ['重新生成', '换一个场景'], null)
      })
    } else if (this.data.usingLocalMode) {
      // 本地模式模板
      const template = `【场景】
${scene.description}

【AI角色台词】
（微笑着看过来）你好，有什么我可以帮你的吗？

【你的开场白选项】
1. 你好，请问这里有人坐吗？
2. 我注意到你在看书，能问一下是什么书吗？
3. 这里的咖啡好像很不错，你推荐哪一款？

【教练建议】
开场要自然，避免过于直接。先观察对方的状态（是否忙碌、是否想被打扰），选择合适的时机开口。保持微笑，眼神交流要自然。`
      this.setData({ isTyping: false, aiStatus: 'typing' })
      this.typewriterAdd('assistant', template, ['开始练习', '换一个场景'], null)
    } else {
      // 演示模式
      const template = `【场景】
${scene.description}

【AI角色台词】
（微笑着看过来）你好，有什么我可以帮你的吗？

【你的开场白选项】
1. 你好，请问这里有人坐吗？
2. 我注意到你在看书，能问一下是什么书吗？
3. 这里的咖啡好像很不错，你推荐哪一款？

【教练建议】
开场要自然，避免过于直接。先观察对方的状态（是否忙碌、是否想被打扰），选择合适的时机开口。保持微笑，眼神交流要自然。`
      this.setData({ isTyping: false, aiStatus: 'typing' })
      this.typewriterAdd('assistant', template, ['开始练习', '换一个场景'], null)
    }
  },

  insertTemplate(e) {
    const type = e.currentTarget.dataset.type
    const templates = {
      situation: '我的情况是：',
      feeling: '我的感受是：',
      help: '我需要建议，关于',
    }
    const current = this.data.inputText
    this.setData({ inputText: current + (templates[type] || '') })
  },

  sendMessage() {
    const text = this.data.inputText.trim()
    if (!text || this.data.isTyping) return

    const userMsg = {
      id: ++msgIdCounter,
      role: 'user',
      content: text,
      showTime: this.shouldShowTime(),
      timeStr: this.getTimeStr(),
    }
    const chatHistory = [...this.data.chatHistory, { role: 'user', content: text }]
    this.setData({
      messages: [...this.data.messages, userMsg],
      inputText: '',
      isTyping: true,
      aiStatus: 'thinking',
      chatHistory,
    })
    this.scrollToBottom()

    // 检查模式：本地模式 vs 真实 AI
    console.log('[ai-coach] sendMessage - usingLocalMode:', this.data.usingLocalMode, 'aiConfigured:', this.data.aiConfigured)

    // 使用本地知识库模式
    console.log('[ai-coach] 使用本地知识库')
    const delay = Math.min(600 + text.length * 20, 1800)
    setTimeout(() => {
      this.setData({ isTyping: false, aiStatus: 'typing' })
      let response = ''
      
      // 根据模式选择回复来源
      const mode = this.data.currentMode
      if (mode === 'analysis') {
        response = getAnalysisResponse(text)
      } else if (mode === 'practice') {
        response = PRACTICE_RESPONSES[Math.floor(Math.random() * PRACTICE_RESPONSES.length)]
      } else if (mode === 'console') {
        response = CONSOLE_RESPONSES[Math.floor(Math.random() * CONSOLE_RESPONSES.length)]
      } else {
        response = getLocalAdvice(text)
      }
      
      const suggestions = this.extractSuggestions(response, mode)
      this.typewriterAdd('assistant', response, suggestions, null)
    }, delay)
  },

  callRealAI(text, chatHistory) {
    const { currentMode, userGender, userProfile } = this.data

    // 构建系统提示词
    let systemPrompt
    if (currentMode === 'practice') {
      systemPrompt = PRACTICE_SYSTEM
    } else if (currentMode === 'console') {
      systemPrompt = CONSOLE_SYSTEM
    } else if (currentMode === 'analysis') {
      systemPrompt = ANALYSIS_SYSTEM
    } else {
      systemPrompt = ai.SYSTEM_PROMPTS.coach
    }

    // 构建历史消息（保留最近12条）
    const history = chatHistory.slice(-12)
    const genderStr = userGender === 'male' ? '男生' : (userGender === 'female' ? '女生' : '')
    const profileContext = userProfile
      ? `\n[用户档案] 叫${userProfile.myName}，${genderStr}，对方叫${userProfile.taName}，目前处于${userProfile.stage}阶段`
      : (genderStr ? `\n[用户性别] ${genderStr}` : '')

    // 给最后一条用户消息附加上下文
    const messagesForAI = [...history.slice(0, -1), {
      role: 'user',
      content: history[history.length - 1].content + profileContext,
    }]

    ai.chat({
      messages: messagesForAI,
      systemPrompt,
      maxTokens: currentMode === 'practice' ? 400 : 600,
      onSuccess: (content) => {
        if (!this.data.isTyping) return // 用户已切换模式
        this.setData({ isTyping: false, aiStatus: 'typing' })

        // 提取建议按钮（从回复末尾检测"你可以问我..."等）
        const suggestions = this.extractSuggestions(content, currentMode)
        this.typewriterAdd('assistant', content, suggestions, null)
        
        // 记录用户行为日志
        storage.logUserBehavior('ai_' + currentMode, {
          mode: currentMode,
          question: text,
          answer: content,
        })
      },
      onError: (err) => {
        console.error('[ai-coach] AI 调用失败:', err)
        this.setData({ isTyping: false, aiStatus: 'idle' })
        if (err === '__domain_blocked__') {
          ai.handleError(err)
          this.typewriterAdd('assistant', '⚠️ 请先配置网络权限后再试（详见弹窗提示）', ['重新提问'], null)
        } else {
          // 显示真实错误方便调试（上线前可改回通用提示）
          const displayErr = err || 'AI 开小差了，请稍后再试 😅'
          this.typewriterAdd('assistant', '⚠️ ' + displayErr, ['重新提问', '换个话题'], null)
        }
      },
    })
  },

  extractSuggestions(content, mode) {
    // 固定模式：返回专属建议按钮
    if (mode === 'practice') return ['继续练习', '换个场景', '问教练意见']
    if (mode === 'analysis') return ['再分析一个', '如何应对？', '判断TA的感情']
    if (mode === 'console') return ['继续说', '我需要建议', '谢谢你']

    // 普通模式：尝试从 AI 回复中动态提取追问建议
    const suggestions = []

    // 策略1：提取数字序号结尾的问句（如"1. 你们认识多久了？"）
    const numberedQ = content.match(/[①②③④⑤1234567]\s*[\.、]?\s*([^？\n]{6,20}(?:吗|呢|？|\?))/g)
    if (numberedQ && numberedQ.length > 0) {
      numberedQ.slice(0, 2).forEach(q => {
        const clean = q.replace(/^[①②③④⑤1234567]\s*[\.、]?\s*/, '').replace(/[？?]$/, '').trim()
        if (clean.length >= 5 && clean.length <= 18) suggestions.push(clean + '？')
      })
    }

    // 策略2：提取"你…吗/呢"结构的短问句（末尾2段内）
    if (suggestions.length < 2) {
      const lastPart = content.slice(-200)
      const shortQ = lastPart.match(/你[^，。\n]{3,15}[吗呢？?]/g)
      if (shortQ) {
        shortQ.slice(0, 3 - suggestions.length).forEach(q => {
          const clean = q.replace(/[？?]$/, '').trim()
          if (clean.length >= 5 && clean.length <= 16 && !suggestions.includes(clean + '？')) {
            suggestions.push(clean + '？')
          }
        })
      }
    }

    // 策略3：兜底追问建议（按话题关键词匹配）
    if (suggestions.length === 0) {
      const lower = content.toLowerCase()
      if (lower.includes('约会') || lower.includes('约出来') || lower.includes('见面')) {
        suggestions.push('约会有什么注意事项？', '被拒绝了怎么办？')
      } else if (lower.includes('表白') || lower.includes('告白')) {
        suggestions.push('表白被拒后怎么处理？', '如何判断时机成熟？')
      } else if (lower.includes('暧昧') || lower.includes('心动')) {
        suggestions.push('怎么让TA对我感兴趣？', '暧昧多久可以表白？')
      } else if (lower.includes('分手') || lower.includes('挽回') || lower.includes('冷淡')) {
        suggestions.push('冷静期应该怎么做？', '值不值得挽回？')
      } else if (lower.includes('吵架') || lower.includes('冷战') || lower.includes('矛盾')) {
        suggestions.push('如何主动开口和好？', '避免下次吵架的方法？')
      } else {
        suggestions.push('能给个具体的建议吗？', '还有其他方法吗？')
      }
    }

    return suggestions.slice(0, 3)
  },

  getMockResponse(text, history) {
    const lower = text.toLowerCase()
    const mode = this.data.currentMode

    if (mode === 'practice') {
      return {
        answer: `（抬头看了你一眼，微微一笑）你好。\n\n【教练建议】⭐ 7/10 - 开场可以，但可以加一个话题钩子。比如观察你周围环境，说"你在看什么书？"`,
        suggestions: ['你在看什么书？', '这里的咖啡不错', '好巧，我也常来'],
        emotion: null,
      }
    }
    if (mode === 'console') {
      const responses = [
        '我听到了。你现在一定不好受，能把更多说出来吗？',
        '谢谢你愿意告诉我这些。这种感觉很正常，你不是一个人在经历。',
        '我在这里，你可以继续说。不需要逻辑，说就好了。',
        '听起来你最近承受了很多。能告诉我，这件事最让你难受的是哪一部分？',
      ]
      return { answer: responses[history.length % responses.length], suggestions: null, emotion: null }
    }

    // 性别相关输入
    if (lower === '男' || lower === '男生' || lower === '我是男生' || lower === '男的') {
      return {
        answer: '好的，我知道了！你是男生 👦\n\n我会从男生视角给你建议。现在遇到什么感情问题了？直接说～',
        suggestions: ['想追一个女生', '不知道怎么搭讪', '暧昧期怎么推进'],
        emotion: null,
      }
    }
    if (lower === '女' || lower === '女生' || lower === '我是女生' || lower === '女的') {
      return {
        answer: '好的，我知道了！你是女生 👧\n\n我会从女生视角给你建议。现在遇到什么感情问题了？直接说～',
        suggestions: ['他突然变冷淡了', '暧昧期不知道他什么意思', '被喜欢的人忽视'],
        emotion: null,
      }
    }

    // 普通模式关键词匹配
    const KB = [
      { keys: ['搭讪', '开口', '初次', '怎么认识'], answer: `搭讪的核心是"自然"，不是完美台词。\n\n公式：观察 + 感受 + 问题\n例："你这本书很特别（观察），看起来很有意思（感受），是什么类型的？（问题）"\n\n**3秒法则**：心动后3秒内开口，超过就会越想越不敢。\n\n你现在想搭讪陌生人还是认识的人？说说具体情况。`, sug: ['被拒绝了怎么办', '怎么要微信', '搭讪后如何延续'] },
      { keys: ['表白', '告白', '说喜欢', '表达感情'], answer: `表白的关键不是台词，而是**时机和真诚**。\n\n时机判断：对方给了3个以上绿色信号再表白（主动找你聊、记得你的细节、不排斥单独约）\n\n好的表白 = 具体原因 + 表达意图 + 给对方选择权\n\n被拒绝后：微笑说"没关系，感谢你告诉我"，然后优雅退出，不纠缠。\n\n你们现在是什么关系？我帮你判断时机。`, sug: ['怎么判断对方喜没喜欢我', '表白被拒后怎么办', '暗示还是直接说？'] },
      { keys: ['暧昧', '暧昧期', '不确定'], answer: `暧昧期核心任务：**把线上化学反应变成线下真实接触**。\n\n你应该做的：\n① 约见面！微信聊再多不如一次真实约会\n② 制造专属感：专属称呼、共同的梗\n③ 读信号：主动找你聊+记住细节+不拒绝约会 = 可以推进\n\n不要做的：❌ 无限期线上暧昧等"时机成熟"\n\n你们暧昧多久了？见过几次面？`, sug: ['暧昧期怎么约出来', '怎么制造专属感', '暧昧多久可以表白'] },
      { keys: ['分手', '挽回', '失恋', '复合', '前任'], answer: `挽回的核心逻辑：让对方"重新看见你的好"，不是"不停求回来"。\n\n**30天冷静期（不联系）：**\n① 身材/穿搭提升\n② 充实社交圈（朋友圈偶尔晒出你过得好）\n③ 处理分手原因（真正改变）\n\n冷静期后：用自然话题重新联系，像朋友一样，慢慢重建。\n\n放弃挽回的信号：对方有稳定新恋人、明确拒绝联系、价值观根本不合。\n\n你们分手多久了？什么原因分手的？`, sug: ['冷静期怎么度过', '30天后如何联系', '值不值得挽回？'] },
    ]
    for (const item of KB) {
      if (item.keys.some(k => lower.includes(k))) {
        return { answer: item.answer, suggestions: item.sug, emotion: null }
      }
    }

    // 多样化的默认回复
    const defaultReplies = [
      { answer: `能具体说说你的情况吗？\n\n比如：\n• 你们现在是什么关系？（陌生人/朋友/暧昧中/在一起）\n• 认识多久了？\n• 具体发生了什么事？\n\n说得越具体，建议越有用！`, sug: ['搭讪技巧', '如何表白', '约会设计'] },
      { answer: `我需要了解一下背景～\n\n• **TA 是什么样的人？**（性格、平时话多不多）\n• **你们平时怎么联系？**（微信/见面/一起上学/上班）\n• **你最想解决的是什么？**\n\n给我更多信息，我帮你想办法！`, sug: ['判断TA的心意', '约会时聊什么', '怎么维持感情'] },
      { answer: `有点抽象，你展开说说？😄\n\n可以告诉我：TA 说了什么？做了什么？你当时是怎么回应的？\n\n从具体细节入手，我能帮你分析 TA 的心理和最佳应对策略。`, sug: ['分析TA的信号', '搭讪技巧', '如何表白'] },
    ]
    const idx = history.length % defaultReplies.length
    return { answer: defaultReplies[idx].answer, suggestions: defaultReplies[idx].sug, emotion: null }
  },

  // 长按复制消息
  copyMessage(e) {
    const text = e.currentTarget.dataset.text
    if (!text) return
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制 ✅', icon: 'success' }),
    })
  },

  // 打字机效果
  typewriterAdd(role, fullContent, suggestions, emotion) {
    const msgId = ++msgIdCounter
    const newMsg = {
      id: msgId,
      role,
      content: fullContent,
      displayContent: '',
      suggestions: null,
      emotionTag: null,
      showTime: this.shouldShowTime(),
      timeStr: this.getTimeStr(),
    }
    this.setData({ messages: [...this.data.messages, newMsg], aiStatus: 'typing' })
    this.scrollToBottom()

    let charIdx = 0
    const totalLen = fullContent.length

    const tick = () => {
      charIdx = Math.min(charIdx + 8, totalLen)
      const displayContent = fullContent.substring(0, charIdx)
      const msgs = this.data.messages.map(m => m.id === msgId ? { ...m, displayContent } : m)
      this.setData({ messages: msgs })

      if (charIdx < totalLen) {
        typingTimer = setTimeout(tick, 25)
      } else {
        const final = this.data.messages.map(m => {
          if (m.id === msgId) return { ...m, displayContent: fullContent, suggestions, emotionTag: emotion }
          return m
        })
        this.setData({ messages: final, aiStatus: 'idle' })
        this.scrollToBottom()
        const chatHistory = [...this.data.chatHistory, { role: 'assistant', content: fullContent }]
        this.setData({ chatHistory })
      }
    }
    typingTimer = setTimeout(tick, 200)
  },

  shouldShowTime() {
    const msgs = this.data.messages
    if (msgs.length === 0) return true
    const lastMsg = msgs[msgs.length - 1]
    return !lastMsg.showTime
  },

  getTimeStr() {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollToId: 'scroll-bottom' })
    }, 100)
  },

  clearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: res => {
        if (res.confirm) {
          if (typingTimer) clearTimeout(typingTimer)
          this.initMode(this.data.currentMode)
        }
      }
    })
  },

  onUnload() {
    if (typingTimer) clearTimeout(typingTimer)
  },
})
