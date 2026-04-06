// pages/couple/couple.js
const { STAGES, STAGE_GUIDE, PERSONALITY_ACTIVITIES } = require('../../data/relationship')
const ai = require('../../utils/ai')

const HEALTH_ITEMS = [
  { id: 'communication', icon: '💬', label: '沟通', score: 75 },
  { id: 'romance', icon: '💕', label: '浪漫', score: 70 },
  { id: 'trust', icon: '🤝', label: '信任', score: 80 },
  { id: 'fun', icon: '😄', label: '趣味', score: 65 },
]

const HEALTH_TIPS = {
  high: '🌟 你们的关系非常健康！继续保持，享受彼此。',
  mid: '💡 关系整体良好，在低分项目上多花一点心思。',
  low: '💬 建议打开恋爱顾问聊聊，找到当前关系的突破口。',
}

const READINESS_LIST = [
  { id: 'kiss', icon: '💋', title: '初吻/接吻时机', desc: '现在是否是合适的时机？' },
  { id: 'cohabit', icon: '🏠', title: '同居准备度', desc: '你们是否已准备好同居？' },
  { id: 'propose', icon: '💍', title: '求婚时机评估', desc: '综合评估求婚的成熟度' },
]

const REPLY_SCENARIOS = [
  { id: 'stranger_first', icon: '👋', title: '初次搭话', tag: '陌生人' },
  { id: 'ambiguous_invite', icon: '📅', title: '暧昧约会', tag: '暧昧期' },
  { id: 'dating_sweet', icon: '💕', title: '热恋甜蜜', tag: '热恋期' },
  { id: 'dating_conflict', icon: '🌧️', title: '吵架修复', tag: '修复' },
  { id: 'stable_fresh', icon: '✨', title: '制造新鲜感', tag: '稳定期' },
  { id: 'cohabit_issue', icon: '🏡', title: '同居矛盾', tag: '同居期' },
]

// 建议库（按阶段+性别）
const ADVICE_POOL = {
  stranger: {
    male: [
      { main: '今天的任务只有一个：找到一个自然搭话的机会，不追求结果，只练习开口。', actions: ['在咖啡馆/书店观察她，找一个场景化切入点', '用"观察+感受+问题"公式开口', '不管结果如何，开口本身就是胜利'] },
      { main: '陌生人阶段，吸引力来自你的"有趣"，而不是你的"努力"。让自己有话可说。', actions: ['今天读一篇有意思的文章或看一个短视频', '想好3个可以展开的话题', '记住：不是表演，是真实的你'] },
    ],
    female: [
      { main: '对陌生人展示你的好奇心，而不是你的热情。让他来靠近你。', actions: ['对他感兴趣的事问一个真诚的问题', '给一个具体的、不泛泛的赞美', '保持适度神秘，不要全盘托出'] },
    ],
  },
  ambiguous: {
    male: [
      { main: '暧昧最大的敌人是"等"。今天就约！一个具体的时间和地点，比100条微信有效。', actions: ['想一个她说过喜欢的事，设计成邀约理由', '发消息时带上具体时间：这周六下午2点', '准备一个神秘感：我发现了一个你应该会喜欢的地方'] },
      { main: '你记住的每一个细节，都是她心里的一分。今天把她随口提过的事变成行动。', actions: ['翻翻聊天记录，她说过什么想做但没做的事？', '发消息提起那件事，自然地引出约会邀请', '记住：不是告白，是让她感受到你在意她'] },
    ],
    female: [
      { main: '暧昧期女生的核心策略：若即若离，让他觉得"还有机会但要加油"。', actions: ['回消息不要秒回，但回的时候要有质量', '发一条"突然想到你"的消息，然后不解释', '适度主动一次，然后等他跟进'] },
    ],
  },
  dating: {
    male: [
      { main: '热恋期最忌讳"追到了就放松"。今天做一件让她觉得"他还在认真对我"的事。', actions: ['记住她最近在烦恼的一件事，今天主动问', '策划一个这周末的小约会，提前告诉她', '发一条具体的消息，不是"想你"，是"你今天穿了什么颜色"'] },
      { main: '制造仪式感不需要花大钱，你只需要比她"多想一步"。', actions: ['记住你们在一起的纪念日（月纪念日也算）', '今晚准备一个小惊喜：可以是她喜欢的零食、一条未预期的消息', '主动说出来：谢谢你陪着我'] },
    ],
    female: [
      { main: '热恋期女生也需要主动。偶尔的主动表达，会让他觉得被珍惜。', actions: ['今天先发一条消息找他', '记得他最近在忙的事，主动问一下', '说一件他做过的让你感动的小事，告诉他你记得'] },
    ],
  },
  stable: {
    male: [
      { main: '稳定期的关系最需要"打破惯例"。今天主动发起一件你们没做过的事。', actions: ['提议一个新的活动或地点（不要再去老地方）', '关掉手机，给她一段完整的"只有你们"的时间', '说出你最近注意到她身上的一个变化'] },
    ],
    female: [
      { main: '稳定期的你可能已经"太懂他了"——但他也需要被惊到。', actions: ['做一件他不知道你会做的事，给他惊喜', '主动发起一次约会，不等他', '告诉他一件他让你很满意的事（具体的）'] },
    ],
  },
  cohabit: {
    male: [
      { main: '同居之后，关系最大的威胁是"室友化"。今天找回一点恋人的感觉。', actions: ['今晚不在家吃外卖，带她出去约会', '做完家务后不是坐下玩手机，而是陪她聊天', '睡前说一句具体的感谢'] },
    ],
    female: [
      { main: '同居后也要保持自己的魅力。不要因为"安全"了就完全放松。', actions: ['今天出门的时候花时间打扮一下', '给他一个他没料到的小惊喜', '主动说出最近同居里让你满意的一件事'] },
    ],
  },
  propose: {
    male: [
      { main: '求婚前最重要的不是准备钻戒，而是确认她也准备好了。今天可以开始"试探"。', actions: ['和她聊聊未来的计划（不要说求婚，说"长远打算"）', '留意她对结婚话题的反应', '告诉她你在想你们的未来，看她怎么回应'] },
    ],
    female: [
      { main: '如果你觉得时候到了，可以让他感受到你的期待——不是催婚，是表达向往。', actions: ['自然地聊起婚礼风格或者未来住在哪', '路过婚戒店，说一句"这家的款式好好看"', '聊到朋友结婚时，表达你的看法'] },
    ],
  },
  married: {
    male: [
      { main: '婚后的爱不会自动维持，需要你持续选择她。今天做一件"只为她"的事。', actions: ['今晚不看手机，专心陪她', '说一句你很久没说的话：谢谢你嫁给我', '策划一个只有你们的晚上，不谈孩子家事'] },
    ],
    female: [
      { main: '婚后也要给自己留时间，也要给他看到你的需求。', actions: ['告诉他你最近想要的一段两人时光', '做一件让他眼前一亮的事（哪怕是小的）', '说出来：我今天很需要你的陪伴'] },
    ],
  },
}

Page({
  data: {
    hasProfile: false,
    profile: null,
    stages: [],
    caseLoading: false,
    currentCase: null,
    stagesForSelect: [],
    stageInfo: {},
    daysTogether: 0,
    personalityLabel: '',
    milestone: '',        // 当前里程碑（100天/1周年等）
    nextMilestone: '',    // 下个里程碑倒计时
    todayAdvice: { main: '', actions: [] },
    adviceLoading: false,
    healthItems: JSON.parse(JSON.stringify(HEALTH_ITEMS)),
    healthTotal: 0,
    healthTip: '',
    healthDiagLoading: false,
    healthDiagnosis: '',
    readinessList: READINESS_LIST,
    replyScenarios: REPLY_SCENARIOS,
    currentSurprise: '',
    surpriseLoading: false,
    showModal: false,
    editMode: false,
    form: {
      myName: '',
      myGender: 'male',
      taName: '',
      taPersonality: 'adventurous',
      stage: 'ambiguous',
      startDate: '',
    },
    personalityTypes: PERSONALITY_ACTIVITIES.map(p => ({ type: p.type, icon: p.icon, label: p.label })),
  },

  onLoad() {
    const stagesForSelect = STAGES.map(s => ({ ...s }))
    this.setData({ stagesForSelect })
    this.loadProfile()
  },

  onShow() {
    this.loadProfile()
  },

  loadProfile() {
    const profile = wx.getStorageSync('coupleProfile')
    if (profile && profile.myName && profile.taName) {
      const stageInfo = STAGES.find(s => s.id === profile.stage) || STAGES[1]
      const stageIdx = STAGES.findIndex(s => s.id === profile.stage)
      const stages = STAGES.map((s, i) => ({ ...s, passed: i < stageIdx }))
      const daysTogether = this.calcDays(profile.startDate)
      const pItem = PERSONALITY_ACTIVITIES.find(p => p.type === profile.taPersonality)
      const personalityLabel = pItem ? `${pItem.icon} ${pItem.label}` : '性格未知'
      this.setData({ hasProfile: true, profile, stageInfo, stages, daysTogether, personalityLabel })
      this.loadHealthScores()
      this.calcMilestone(daysTogether)
      this.generateAdvice()
      this.refreshSurprise()
    } else {
      const stages = STAGES.map(s => ({ ...s, passed: false }))
      this.setData({ hasProfile: false, stages })
    }
  },

  calcDays(dateStr) {
    if (!dateStr) return 0
    try {
      const start = new Date(dateStr)
      const now = new Date()
      return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
    } catch (e) { return 0 }
  },

  // 计算里程碑和下一个里程碑倒计时
  calcMilestone(days) {
    const milestones = [7, 30, 60, 100, 180, 200, 300, 365, 500, 600, 700, 730, 1000]
    let milestone = ''
    let nextMilestone = ''

    // 当前里程碑（当天或刚刚经过的1-3天内）
    for (const m of milestones) {
      if (days >= m && days <= m + 3) {
        if (m === 365) milestone = '1周年纪念日 🎂'
        else if (m === 730) milestone = '2周年纪念日 🎂'
        else milestone = `${m}天纪念日`
        break
      }
    }

    // 下一个里程碑
    const next = milestones.find(m => m > days)
    if (next) {
      const diff = next - days
      if (next === 365) nextMilestone = `距1周年还有 ${diff} 天`
      else nextMilestone = `距 ${next} 天还有 ${diff} 天`
    }

    this.setData({ milestone, nextMilestone })
  },

  // AI 关系健康度诊断
  aiDiagnoseHealth() {
    if (this.data.healthDiagLoading) return
    const { profile, healthItems, healthTotal, stageInfo } = this.data
    if (!profile) return

    this.setData({ healthDiagLoading: true, healthDiagnosis: '' })

    const itemsDesc = healthItems.map(h => `${h.label}：${h.score}分`).join('、')
    const prompt = `我和${profile.taName}目前处于${stageInfo.name || profile.stage}，关系健康度各项评分：${itemsDesc}，综合${healthTotal}分。
请给出：
1. 一句直击要害的诊断（不说废话，30字以内）
2. 最需要提升的1个维度及具体建议（20字以内）

格式：
【诊断】（内容）
【重点】（内容）`

    ai.ask(prompt, 'advice', (raw) => {
      const diagMatch = raw.match(/【诊断】\s*([\s\S]+?)(?=【重点】|$)/)
      const focusMatch = raw.match(/【重点】\s*([\s\S]+?)$/)
      let result = ''
      if (diagMatch) result += diagMatch[1].trim()
      if (focusMatch) result += '\n\n💡 重点提升：' + focusMatch[1].trim()
      if (!result) result = raw.trim()
      this.setData({ healthDiagLoading: false, healthDiagnosis: result })
    }, () => {
      this.setData({ healthDiagLoading: false })
      ai.handleError('', 'AI 诊断失败，请重试')
    }, 300)
  },

  loadHealthScores() {
    const saved = wx.getStorageSync('healthScores')
    if (saved) {
      const healthItems = HEALTH_ITEMS.map(h => ({ ...h, score: saved[h.id] !== undefined ? saved[h.id] : h.score }))
      this.setData({ healthItems })
    }
    this.calcHealthTotal()
  },

  calcHealthTotal() {
    const items = this.data.healthItems
    const total = Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length)
    const tip = total >= 80 ? HEALTH_TIPS.high : total >= 60 ? HEALTH_TIPS.mid : HEALTH_TIPS.low
    this.setData({ healthTotal: total, healthTip: tip })
  },

  // slider 拖动中（实时更新显示，不存储）
  onHealthSliding(e) {
    const { id } = e.currentTarget.dataset
    const val = e.detail.value
    const healthItems = this.data.healthItems.map(h =>
      h.id === id ? { ...h, score: val } : h
    )
    this.setData({ healthItems })
    this.calcHealthTotal()
  },

  // slider 拖动结束（持久化存储）
  onHealthChange(e) {
    const { id } = e.currentTarget.dataset
    const val = e.detail.value
    const healthItems = this.data.healthItems.map(h =>
      h.id === id ? { ...h, score: val } : h
    )
    this.setData({ healthItems })
    this.calcHealthTotal()
    const scores = {}
    healthItems.forEach(h => { scores[h.id] = h.score })
    wx.setStorageSync('healthScores', scores)
  },

  generateAdvice() {
    this.setData({ adviceLoading: true })
    const { profile } = this.data
    if (!profile) { this.setData({ adviceLoading: false }); return }

    if (!ai.isConfigured()) {
      // 未配置 API 时使用本地数据兜底
      const pool = ADVICE_POOL[profile.stage] || ADVICE_POOL.dating
      const genderPool = pool[profile.myGender] || pool.male || []
      const fallback = genderPool.length > 0 ? genderPool[Math.floor(Math.random() * genderPool.length)] : {
        main: `${profile.myName}，今天记住：真诚是最好的吸引力。做一件让 ${profile.taName} 感受到你在意 TA 的事。`,
        actions: ['主动联系 TA', '记起 TA 说过的一件小事并提起', '计划下一次约会'],
      }
      setTimeout(() => { this.setData({ adviceLoading: false, todayAdvice: fallback }) }, 400)
      return
    }

    // 使用真实生成
    ai.generateCoupleAdvice({ profile, stageInfo: this.data.stageInfo }, (raw) => {
      const parsed = ai.parseCoupleAdvice(raw)
      this.setData({ adviceLoading: false, todayAdvice: parsed })
    }, (err) => {
      console.error('[couple] 建议生成失败:', err)
      this.setData({ adviceLoading: false })
      if (err === '__domain_blocked__') {
        ai.handleError(err)
      } else {
        // 域名OK但生成失败 → 降级到本地数据，静默处理
        const pool = ADVICE_POOL[profile.stage] || ADVICE_POOL.dating
        const genderPool = pool[profile.myGender] || pool.male || [{ main: '今天主动关心一下 TA 吧', actions: ['发一条问候', '记住TA的烦恼', '策划约会'] }]
        const fallback = genderPool[Math.floor(Math.random() * genderPool.length)]
        this.setData({ todayAdvice: fallback })
      }
    })
  },

  generateCase() {
    this.setData({ caseLoading: true })
    const { profile, stageInfo } = this.data
    if (!profile) { this.setData({ caseLoading: false }); return }

    const stageMap = {
      stranger: '陌生人/刚认识',
      ambiguous: '暧昧期',
      dating: '热恋期',
      stable: '稳定期',
      cohabiting: '同居期',
      engaged: '求婚准备期',
      married: '婚后生活',
    }

    const prompt = `我是${profile.myGender==='male'?'男生':'女生'}，和喜欢的人处于${stageMap[profile.stage]}。
请为我生成一个具体的恋爱案例说明。

要求：
1. 选择一个该阶段的典型场景（如：第一次约会、吵架后修复、见面尴尬等）
2. 给出错误的处理方式和后果
3. 给出正确的处理方式和效果
4. 提炼3个关键要点

格式（严格遵守）：
【案例类型】
（场景类型，如：初次约会）

【案例标题】
（一个吸引人的标题）

【情景描述】
（50字以内的场景背景）

【错误做法】
（错误的行为及后果）

【正确做法】
（正确的行为及效果）

【关键要点】
1. （要点1）
2. （要点2）
3. （要点3）`

    if (!ai.isConfigured()) {
      // 本地模板
      const template = {
        type: '第一次约会',
        title: '约会时冷场怎么办？',
        situation: '你和TA第一次正式约会，在餐厅吃饭，突然没话题了，气氛尴尬。',
        bad: '继续沉默，或者不停看手机，让对方觉得你对他/她不感兴趣。',
        good: '可以主动分享一个小趣事，或者询问对方的兴趣爱好，表达真诚的好奇心。',
        points: [
          '保持微笑，放松心情，不要因为冷场而紧张',
          '提前准备2-3个可以展开的话题（旅行、美食、兴趣爱好）',
          '真诚地倾听对方，给予回应，让对方感受到你的关注',
        ],
      }
      setTimeout(() => { this.setData({ caseLoading: false, currentCase: template }) }, 500)
      return
    }

    // 使用生成
    if (ai.isConfigured()) {
      ai.ask(prompt, 'advice', (content) => {
        const parsed = this.parseCase(content)
        this.setData({ caseLoading: false, currentCase: parsed })
      }, (err) => {
        console.error('[couple] 案例生成失败:', err)
        this.setData({ caseLoading: false })
        wx.showToast({ title: '生成失败，请稍后重试', icon: 'none' })
      }, 800)
    } else if (ai.USE_LOCAL_MODE) {
      // 本地模式：使用本地模板
      const template = {
        type: '第一次约会',
        title: '约会时冷场怎么办？',
        situation: '你和TA第一次正式约会，在餐厅吃饭，突然没话题了，气氛尴尬。',
        bad: '继续沉默，或者不停看手机，让对方觉得你对他/她不感兴趣。',
        good: '可以主动分享一个小趣事，或者询问对方的兴趣爱好，表达真诚的好奇心。',
        points: [
          '保持微笑，放松心情，不要因为冷场而紧张',
          '提前准备2-3个可以展开的话题（旅行、美食、兴趣爱好）',
          '真诚地倾听对方，给予回应，让对方感受到你的关注',
        ],
      }
      setTimeout(() => { this.setData({ caseLoading: false, currentCase: template }) }, 500)
    }
  },

  parseCase(rawText) {
    const typeMatch = rawText.match(/【案例类型】\s*(.+)/)
    const titleMatch = rawText.match(/【案例标题】\s*(.+)/)
    const situationMatch = rawText.match(/【情景描述】\s*(.+)/)
    const badMatch = rawText.match(/【错误做法】\s*([\s\S]+?)(?=【正确做法】|$)/)
    const goodMatch = rawText.match(/【正确做法】\s*([\s\S]+?)(?=【关键要点】|$)/)
    const pointsMatch = rawText.match(/【关键要点】\s*([\s\S]+)/)

    const points = []
    if (pointsMatch) {
      const lines = pointsMatch[1].split('\n').filter(l => l.trim())
      for (const line of lines) {
        const cleaned = line.replace(/^[0-9]+[\.\、\s]+/, '').trim()
        if (cleaned) points.push(cleaned)
      }
    }

    return {
      type: typeMatch ? typeMatch[1].trim() : '通用案例',
      title: titleMatch ? titleMatch[1].trim() : '恋爱案例',
      situation: situationMatch ? situationMatch[1].trim() : '具体场景',
      bad: badMatch ? badMatch[1].trim() : '错误做法',
      good: goodMatch ? goodMatch[1].trim() : '正确做法',
      points: points.length > 0 ? points.slice(0, 3) : ['要点1', '要点2', '要点3'],
    }
  },

  refreshSurprise() {
    const { profile } = this.data
    if (!profile) return

    this.setData({ surpriseLoading: true })

    if (!ai.isConfigured()) {
      // 本地兜底
      const personality = PERSONALITY_ACTIVITIES.find(p => p.type === profile.taPersonality)
      const guide = STAGE_GUIDE[profile.stage]
      const genderGuide = profile.myGender === 'male' ? (guide && guide.male) : (guide && guide.female)
      const surprises = []
      if (genderGuide && genderGuide.surpriseIdeas) surprises.push(...genderGuide.surpriseIdeas)
      if (personality) {
        const acts = personality.activities[profile.stage] || personality.activities.dating || []
        acts.forEach(a => surprises.push(`带 ${profile.taName} 去${a}，${personality.label}型的人会很享受这种体验`))
      }
      const fallbacks = [
        `给 ${profile.taName} 准备 TA 随口提过但忘了的东西，出现的那一刻会让 TA 很感动`,
        `记录你们在一起的一个珍贵瞬间，做成截图合集发给 ${profile.taName}`,
        `给 ${profile.taName} 写一封短信，说三件 TA 做的让你很感动的具体的事`,
        `策划一次"复刻第一次约会"：去相同的地点，做相同的事`,
      ]
      if (surprises.length === 0) surprises.push(...fallbacks)
      const idx = Math.floor(Math.random() * surprises.length)
      setTimeout(() => { this.setData({ currentSurprise: surprises[idx], surpriseLoading: false }) }, 300)
      return
    }

    ai.generateSurprise({ profile, stageInfo: this.data.stageInfo }, (text) => {
      this.setData({ currentSurprise: text.trim(), surpriseLoading: false })
    }, (err) => {
      console.error('[couple] 惊喜生成失败:', err)
      this.setData({ surpriseLoading: false })
      if (err === '__domain_blocked__') {
        ai.handleError(err)
      } else {
        this.setData({ currentSurprise: `给 ${profile.taName} 策划一个TA完全没预料到的小惊喜——从TA最近的只言片语里找灵感` })
      }
    })
  },

  copySurprise() {
    wx.setClipboardData({
      data: this.data.currentSurprise,
      success: () => wx.showToast({ title: '已复制！', icon: 'success' }),
    })
  },

  onStageClick(e) {
    const { id } = e.currentTarget.dataset
    const stageInfo = STAGES.find(s => s.id === id)
    if (!stageInfo) return
    wx.showModal({
      title: `${stageInfo.icon} ${stageInfo.name}`,
      content: stageInfo.desc || '这个阶段需要用心经营每一天。',
      showCancel: false,
      confirmText: '知道了',
    })
  },

  goReadinessCheck(e) {
    const { type } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/relationship/relationship?type=${type}` })
  },

  goChatReply(e) {
    const { scene } = e.currentTarget.dataset
    const stage = this.data.profile ? this.data.profile.stage : 'ambiguous'
    wx.navigateTo({ url: `/pages/chat-reply/chat-reply?scene=${scene}&stage=${stage}` })
  },

  // ===== 弹窗相关 =====
  showCreateStep() {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    this.setData({
      showModal: true,
      editMode: false,
      form: {
        myName: '',
        myGender: 'male',
        taName: '',
        taPersonality: 'adventurous',
        stage: 'ambiguous',
        startDate: dateStr,
      },
    })
  },

  showEditStep() {
    const { profile } = this.data
    if (!profile) return
    this.setData({
      showModal: true,
      editMode: true,
      form: {
        myName: profile.myName || '',
        myGender: profile.myGender || 'male',
        taName: profile.taName || '',
        taPersonality: profile.taPersonality || 'adventurous',
        stage: profile.stage || 'ambiguous',
        startDate: profile.startDate || '',
      },
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  // 阻止弹窗内部点击冒泡到遮罩（修复 input 无法输入 bug 的关键）
  stopBubble() {},

  onOverlayTap() {
    this.setData({ showModal: false })
  },

  // 分开绑定 input，避免 dataset field 的问题
  onMyNameInput(e) {
    this.setData({ 'form.myName': e.detail.value })
  },

  onTaNameInput(e) {
    this.setData({ 'form.taName': e.detail.value })
  },

  setGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ 'form.myGender': gender })
  },

  setPersonality(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ 'form.taPersonality': type })
  },

  setStage(e) {
    const stage = e.currentTarget.dataset.stage
    this.setData({ 'form.stage': stage })
  },

  onDateChange(e) {
    this.setData({ 'form.startDate': e.detail.value })
  },

  saveProfile() {
    const { form } = this.data
    const myName = (form.myName || '').trim()
    const taName = (form.taName || '').trim()
    if (!myName) {
      wx.showToast({ title: '请填写你的名字', icon: 'none' })
      return
    }
    if (!taName) {
      wx.showToast({ title: '请填写 TA 的名字', icon: 'none' })
      return
    }
    const myEmoji = form.myGender === 'male' ? '👦' : '👧'
    const taEmoji = form.myGender === 'male' ? '👧' : '👦'
    const profile = { ...form, myName, taName, myEmoji, taEmoji }
    try {
      wx.setStorageSync('coupleProfile', profile)
      this.setData({ showModal: false })
      this.loadProfile()
      wx.showToast({ title: this.data.editMode ? '修改成功 ✅' : '档案已创建 ✨', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  },
})
