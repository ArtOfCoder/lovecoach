// pages/relationship/relationship.js
const { READINESS_QUESTIONS } = require('../../data/relationship')
const ai = require('../../utils/ai')

const TYPE_INFO = {
  kiss: {
    icon: '💋',
    title: '初吻 / 接吻时机评估',
    sub: '看看你们现在的相处是否已经到了可以自然亲吻的阶段',
  },
  cohabit: {
    icon: '🏠',
    title: '同居准备度评估',
    sub: '评估双方是否做好了共同生活的心理和实际准备',
  },
  propose: {
    icon: '💍',
    title: '求婚时机评估',
    sub: '综合评估你们的关系是否已经准备好迈向婚姻',
  },
}

// 本地兜底建议（网络失败时使用）
const FALLBACK_STEPS = {
  kiss: {
    high: ['选一个气氛好的时刻，比如分别时或看完夕阳后', '眼神停留2秒，微笑，然后自然靠近', '如果对方没有后退，那就是时机到了'],
    mid: ['先多创造能自然靠近的时刻（并肩散步、一起看电影）', '通过拥抱/牵手来测试对方的接受度', '等到对方对肢体接触很自然时，再进一步'],
    low: ['现在阶段先专注增进了解，不要急于身体接触', '多创造1-1约会的机会，增加相处时间', '等到感觉互相都在期待更近距离时再行动'],
  },
  cohabit: {
    high: ['可以提出"先试住一段时间"——从周末开始，再到长期', '提前讨论好家务分工、经济分担、各自私人空间', '告知双方家长，避免未来产生误解'],
    mid: ['先从更多"过夜"的机会开始，测试生活习惯的契合度', '找个机会认真聊聊同居期望和担忧', '观察对方对家务/整洁度的态度，确认你能接受'],
    low: ['目前条件还不太成熟，继续发展关系深度', '先讨论清楚双方对"家"的理解和期望', '等关系稳定性更高时再考虑'],
  },
  propose: {
    high: ['可以开始考虑求婚了！先从选戒指和选地点入手', '和你信任的朋友商量，但注意保密', '选一个对你们有意义的地点，准备几句真心话'],
    mid: ['先处理还不满足的条件（比如见家长/财务讨论）', '找时间认真聊一次关于婚姻的具体计划', '半年内可以重新评估'],
    low: ['还需要更多时间和经历来打好关系基础', '专注于当前阶段的相处质量', '解决目前关系中存在的未处理问题'],
  },
}

Page({
  data: {
    type: 'kiss',
    typeInfo: TYPE_INFO.kiss,
    questions: [],
    totalQ: 0,
    currentQ: 0,
    answers: [],
    showResult: false,
    score: 0,
    resultEmoji: '',
    resultTitle: '',
    resultDesc: '',
    resultDetails: [],
    nextSteps: [],
    // 动态结果
    aiSummary: '',
    aiNote: '',
    aiLoading: false,
  },

  onLoad(options) {
    const type = options.type || 'kiss'
    const questions = READINESS_QUESTIONS[type] || []
    this.setData({
      type,
      typeInfo: TYPE_INFO[type] || TYPE_INFO.kiss,
      questions,
      totalQ: questions.length,
      currentQ: 0,
      answers: [],
      showResult: false,
    })
  },

  answer(e) {
    const { val } = e.currentTarget.dataset
    const { currentQ, questions, answers } = this.data
    const q = questions[currentQ]
    const point = val === 'yes' ? q.weight : val === 'partial' ? Math.floor(q.weight / 2) : 0
    const newAnswers = [...answers, { q: q.q, pass: val !== 'no', val, point, maxPoint: q.weight }]

    if (currentQ + 1 >= questions.length) {
      // 计算结果
      const total = newAnswers.reduce((s, a) => s + a.point, 0)
      const maxTotal = questions.reduce((s, q) => s + q.weight, 0)
      const score = Math.round((total / maxTotal) * 100)
      this.calcResult(score, newAnswers)
      this.setData({ answers: newAnswers, showResult: true, score })
      // 异步请求 AI 个性化建议
      this.fetchAIAdvice(score, newAnswers)
    } else {
      this.setData({ answers: newAnswers, currentQ: currentQ + 1 })
    }
  },

  calcResult(score, answers) {
    const { type } = this.data
    let emoji, title, desc, level

    if (score >= 75) {
      emoji = '🟢'
      title = '时机已成熟！'
      desc = '综合评估显示你们已经达到了这个阶段的准备条件。选一个好时机，大胆迈出这一步吧。'
      level = 'high'
    } else if (score >= 45) {
      emoji = '🟡'
      title = '基本准备好了，再打磨一下'
      desc = '你们已经有了不错的基础，但还有几个方面需要关注。建议先处理这些，时机会更好。'
      level = 'mid'
    } else {
      emoji = '🔴'
      title = '还需要一些时间'
      desc = '目前条件还不太成熟，不是说感情不好，而是时机需要多一点准备。放轻松，一步一步来。'
      level = 'low'
    }

    // 先用本地兜底数据填充
    const fallback = (FALLBACK_STEPS[type] && FALLBACK_STEPS[type][level]) || []
    const resultDetails = answers.map(a => ({ q: a.q, pass: a.pass }))

    this.setData({
      resultEmoji: emoji,
      resultTitle: title,
      resultDesc: desc,
      resultDetails,
      nextSteps: fallback,
      aiSummary: '',
      aiNote: '',
    })
  },

  fetchAIAdvice(score, answers) {
    this.setData({ aiLoading: true })
    const { type } = this.data
    const profile = wx.getStorageSync('coupleProfile') || null

    ai.evaluateRelationshipNode(
      { type, score, answers, profile },
      (raw) => {
        const parsed = ai.parseRelationshipEvaluation(raw)
        const updates = { aiLoading: false }
        if (parsed.summary) updates.aiSummary = parsed.summary
        if (parsed.steps && parsed.steps.length > 0) updates.nextSteps = parsed.steps
        if (parsed.note) updates.aiNote = parsed.note
        this.setData(updates)
      },
      (err) => {
        console.error('[relationship] 评估失败:', err)
        this.setData({ aiLoading: false })
        // 保留本地兜底数据，不额外提示
      }
    )
  },

  retry() {
    this.setData({ currentQ: 0, answers: [], showResult: false, aiSummary: '', aiNote: '', aiLoading: false })
  },

  goBack() {
    wx.navigateBack()
  },
})
