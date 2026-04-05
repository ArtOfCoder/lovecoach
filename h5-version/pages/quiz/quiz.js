// pages/quiz/quiz.js
const QUIZ_TYPES = [
  { id: 'love_style', icon: '💕', name: '恋爱风格测评', desc: '了解你的恋爱模式和心理类型' },
  { id: 'attraction', icon: '✨', name: '吸引力测评', desc: '你的魅力在哪里？' },
  { id: 'readiness', icon: '🌱', name: '感情准备度', desc: '你现在准备好谈恋爱了吗？' },
]

// 恋爱风格测评题目
const LOVE_STYLE_QUESTIONS = [
  {
    q: '在喜欢一个人的时候，你通常会？',
    options: [
      { text: '观察很久，确定再开口', val: 'A' },
      { text: '感觉对了就直接表达', val: 'B' },
      { text: '通过行动慢慢靠近', val: 'C' },
      { text: '等对方先开口', val: 'D' },
    ]
  },
  {
    q: '约会结束后，你更倾向于？',
    options: [
      { text: '当天回复总结今天的美好', val: 'B' },
      { text: '等第二天再发，不想太急', val: 'A' },
      { text: '等对方先发', val: 'D' },
      { text: '发一个和约会有关的有趣内容', val: 'C' },
    ]
  },
  {
    q: '在感情中，你最看重的是？',
    options: [
      { text: '安全感和稳定', val: 'A' },
      { text: '心动感和激情', val: 'B' },
      { text: '共同成长', val: 'C' },
      { text: '被理解和接纳', val: 'D' },
    ]
  },
  {
    q: '当你喜欢的人有一段时间没主动联系你，你会？',
    options: [
      { text: '有点焦虑，但忍着不先发', val: 'D' },
      { text: '直接发消息，没什么大不了', val: 'B' },
      { text: '找个话题自然联系', val: 'C' },
      { text: '开始怀疑对方是否喜欢自己', val: 'A' },
    ]
  },
  {
    q: '朋友描述你在感情里是？',
    options: [
      { text: '专情、认真，但有时想太多', val: 'A' },
      { text: '直接、热情，行动力强', val: 'B' },
      { text: '有策略，懂得经营', val: 'C' },
      { text: '温柔、体贴，但容易委屈自己', val: 'D' },
    ]
  },
  {
    q: '两个人在一起后，你对自我空间的需求是？',
    options: [
      { text: '需要很多独处时间', val: 'C' },
      { text: '希望天天在一起', val: 'B' },
      { text: '适度的陪伴就好', val: 'A' },
      { text: '以对方需求为主', val: 'D' },
    ]
  },
  {
    q: '分手后，你通常会？',
    options: [
      { text: '很难走出来，反复想', val: 'A' },
      { text: '难过但很快投入新生活', val: 'B' },
      { text: '总结经验，继续成长', val: 'C' },
      { text: '默默消化，不轻易表现出来', val: 'D' },
    ]
  },
  {
    q: '你理想中的爱情是？',
    options: [
      { text: '像电影一样浪漫有激情', val: 'B' },
      { text: '平淡但踏实，互相依靠', val: 'A' },
      { text: '两个独立的人互相促进', val: 'C' },
      { text: '彼此深度理解，被接纳', val: 'D' },
    ]
  },
  {
    q: '在感情里，你更容易出现？',
    options: [
      { text: '过度担心被抛弃', val: 'A' },
      { text: '冲动，行动前没想好', val: 'B' },
      { text: '太理性，缺少感性流露', val: 'C' },
      { text: '过度迁就，委屈自己', val: 'D' },
    ]
  },
  {
    q: '如果恋爱是一种动物，你是？',
    options: [
      { text: '狗 — 忠诚专一，认准就不回头', val: 'A' },
      { text: '猫 — 自信独立，但给爱时全心全意', val: 'C' },
      { text: '狮子 — 主动热情，爱就要让对方感受到', val: 'B' },
      { text: '兔子 — 温柔善良，但需要安全感', val: 'D' },
    ]
  },
]

// 吸引力测评题目
const ATTRACTION_QUESTIONS = [
  {
    q: '别人第一眼见到你，通常注意到的是？',
    options: [
      { text: '我的眼神和笑容', val: 'B' },
      { text: '我的穿搭和整体形象', val: 'C' },
      { text: '我的开口方式和声音', val: 'A' },
      { text: '我认真听别人说话的样子', val: 'D' },
    ]
  },
  {
    q: '在社交场合，你通常是？',
    options: [
      { text: '主动打招呼，气场很强', val: 'B' },
      { text: '先观察，选择性交流', val: 'A' },
      { text: '很会照顾每个人的感受', val: 'D' },
      { text: '风格鲜明，让人印象深刻', val: 'C' },
    ]
  },
  {
    q: '朋友评价你时，最常说的是？',
    options: [
      { text: '你很风趣，跟你在一起很开心', val: 'B' },
      { text: '你很有品位，审美很好', val: 'C' },
      { text: '你很聪明，说话有深度', val: 'A' },
      { text: '你很温暖，让人想靠近', val: 'D' },
    ]
  },
  {
    q: '你认为自己最大的魅力是？',
    options: [
      { text: '我有自己的想法，不随波逐流', val: 'A' },
      { text: '我很直接，表达清楚', val: 'B' },
      { text: '我的外在和品位', val: 'C' },
      { text: '我懂得包容和理解别人', val: 'D' },
    ]
  },
  {
    q: '在约会时，你擅长？',
    options: [
      { text: '制造笑点，让气氛轻松', val: 'B' },
      { text: '认真倾听，让对方觉得被重视', val: 'D' },
      { text: '提前规划，带对方体验新奇', val: 'C' },
      { text: '有深度的对话，让对方刮目相看', val: 'A' },
    ]
  },
]

// 感情准备度题目
const READINESS_QUESTIONS = [
  {
    q: '你上一段感情结束多久了？',
    options: [
      { text: '还没有过恋爱', val: 'A' },
      { text: '1年以上', val: 'B' },
      { text: '6个月到1年', val: 'C' },
      { text: '6个月以内', val: 'D' },
    ]
  },
  {
    q: '你现在一个人的时候，状态是？',
    options: [
      { text: '很享受，生活很充实', val: 'B' },
      { text: '有时孤单，但还好', val: 'C' },
      { text: '很渴望有人陪', val: 'D' },
      { text: '刻意让自己很忙，避免感受孤独', val: 'A' },
    ]
  },
  {
    q: '如果现在有人喜欢你，你的第一反应是？',
    options: [
      { text: '认真考虑，看对方是否合适', val: 'B' },
      { text: '有点开心，但需要时间', val: 'C' },
      { text: '很期待，想快点在一起', val: 'D' },
      { text: '有些不知所措，不确定自己准备好了吗', val: 'A' },
    ]
  },
  {
    q: '关于前任，你现在的状态是？',
    options: [
      { text: '完全走出来了', val: 'B' },
      { text: '基本走出来，偶尔会想', val: 'C' },
      { text: '还没有，但努力让自己忘', val: 'A' },
      { text: '没有前任', val: 'B' },
    ]
  },
  {
    q: '谈恋爱对你现在最大的意义是？',
    options: [
      { text: '有人陪伴，不孤独', val: 'D' },
      { text: '找到一起成长的人', val: 'B' },
      { text: '体验心动的感觉', val: 'C' },
      { text: '还没想清楚', val: 'A' },
    ]
  },
]

// 结果定义
const RESULTS = {
  love_style: {
    A: {
      type: '安全型恋人',
      emoji: '🌿',
      color: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      tagline: '认真专情，是最好的伴侣',
      traits: ['忠诚专一', '感情认真', '需要安全感', '容易想太多'],
      desc: '你在感情里非常认真专一，一旦爱上就全力投入。你渴望稳定的感情，害怕不确定性，有时会因为对方一点点的态度变化而焦虑。\n\n你的爱很深，但有时候需要学会把安全感建立在自己身上，而不是完全依赖对方的反应。',
      pros: ['极度忠诚专一', '感情里非常用心', '不会轻易放弃'],
      cons: ['容易过度焦虑', '有时需要过多的确认', '有时会压抑自己的需求'],
      match: '你需要一个能给你明确安全感、表达直接的伴侣。对方不需要多完美，但要让你感到稳定和被重视。',
      advice: ['练习把安全感建立在自己的生活和价值上', '学会说出自己的需求，而不是等对方猜', '给对方空间，信任是一点一点建立的'],
    },
    B: {
      type: '热情型恋人',
      emoji: '🔥',
      color: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
      tagline: '敢爱敢恨，感情里的勇者',
      traits: ['行动力强', '热情直接', '感情丰富', '有时冲动'],
      desc: '你在感情里非常有热情，行动力超强，想到就做。你不喜欢拖拖拉拉，有感觉就会直接表达。你的爱很热烈，让对方感受到你的心意。\n\n不过有时候热情来得快去得也快，要注意在热情之后，沉下心来经营感情。',
      pros: ['行动力超强', '感情真诚热烈', '不让对方猜测你的感受'],
      cons: ['有时冲动，没有想清楚就行动', '热恋期后可能热情下降', '需要学习慢下来倾听'],
      match: '你需要一个能跟上你节奏、同样热情的伴侣，或者能给你稳定感的人，帮助你把热情转化为持久的感情。',
      advice: ['在行动前，给自己几天时间确认感受', '热恋后主动维持关系的新鲜感', '学习倾听，不只是表达'],
    },
    C: {
      type: '独立型恋人',
      emoji: '🦁',
      color: 'linear-gradient(135deg, #6C63FF 0%, #a78bfa 100%)',
      tagline: '自信独立，在爱中保持自我',
      traits: ['自我意识强', '理性经营', '保持独立', '感情有策略'],
      desc: '你在感情里保持高度的自我意识，不会为了一段感情失去自己。你理性，会经营感情，有自己的节奏和空间需求。\n\n你的魅力在于自信独立，但有时候可能因为太理性，而让对方感觉你不够投入。学会在保持自我的同时，适度地让对方感受到你的温度。',
      pros: ['有自己的生活和魅力', '感情中保持独立', '不会盲目付出'],
      cons: ['有时太理性，感情表达不够', '可能让对方觉得你不够在乎', '有时过于保护自己'],
      match: '你需要一个同样独立、有自己追求的伴侣，两个人各自精彩，又互相欣赏。',
      advice: ['适时表达你的感受，不要总是等对方先说', '在感情中允许自己偶尔软下来', '告诉对方你喜欢他/她的具体原因'],
    },
    D: {
      type: '付出型恋人',
      emoji: '🌸',
      color: 'linear-gradient(135deg, #FF6B8A 0%, #ec4899 100%)',
      tagline: '温柔体贴，爱里最温暖的人',
      traits: ['体贴温柔', '善解人意', '容易委屈', '需要被表达重视'],
      desc: '你在感情里非常善解人意，总是先考虑对方的感受。你温柔体贴，会把对方照顾得很好，是很多人梦想中的伴侣。\n\n但你容易把自己放在次要位置，习惯委屈自己。要记住：好的感情是双向的，你也值得被认真对待。',
      pros: ['极度体贴温柔', '善于照顾对方感受', '感情里很有安全感'],
      cons: ['容易委屈自己', '不擅长说出自己的需求', '有时太在意对方的评价'],
      match: '你需要一个懂得感恩、会主动表达爱意的伴侣，让你感受到你的付出是被看见和珍惜的。',
      advice: ['学会说出你的需求，这不是自私，是真实', '建立健康的边界，什么可以接受什么不行', '记住：你值得被同等对待'],
    },
  },
  attraction: {
    A: {
      type: '智识型魅力',
      emoji: '🧠',
      color: 'linear-gradient(135deg, #3b82f6 0%, #6C63FF 100%)',
      tagline: '你的大脑，是最性感的器官',
      traits: ['思维深度', '独特见解', '沉稳气场', '让人想了解你'],
      desc: '你的魅力来自思维深度和独特视角。你说话有内容有深度，让人觉得"跟你聊天很涨知识"，这种魅力持久且稀缺。',
      pros: ['让人越了解越喜欢', '深层次的吸引力', '有智慧有内涵'],
      cons: ['初见时不够显眼', '需要时间才能展现魅力', '有时看起来难以接近'],
      match: '欣赏有深度有内涵的人，希望在感情中也能有精神共鸣的伴侣。',
      advice: ['多参与社交活动，展示你的想法', '适当降低门槛，先建立轻松的连接', '用故事和例子让你的观点更生动'],
    },
    B: {
      type: '社交型魅力',
      emoji: '🌟',
      color: 'linear-gradient(135deg, #f97316 0%, #FF6B8A 100%)',
      tagline: '你走进的每个房间，气氛都不一样',
      traits: ['热情开朗', '感染力强', '善于制造笑点', '人际吸引力高'],
      desc: '你的魅力来自热情和感染力。你走到哪里都能活跃气氛，让身边的人感到轻松和快乐。这种魅力容易让人第一眼就注意到你。',
      pros: ['第一印象极强', '让人在你身边感到快乐', '行动力强，敢于表达'],
      cons: ['有时显得缺乏深度', '容易被认为"只是外向"', '需要真实感来支撑魅力'],
      match: '能欣赏你的热情，同时也能让你安静下来的人。',
      advice: ['在轻松之外，偶尔展示你深思熟虑的一面', '学会安静地陪伴，不是每次都要制造热闹', '培养一个能代表你的核心爱好'],
    },
    C: {
      type: '品位型魅力',
      emoji: '✨',
      color: 'linear-gradient(135deg, #7c3aed 0%, #6C63FF 100%)',
      tagline: '你的审美就是你的名片',
      traits: ['高品位', '形象鲜明', '个人风格强', '让人印象深刻'],
      desc: '你的魅力来自鲜明的个人品位和风格。你的穿搭、生活方式、空间审美都有自己的语言，让人第一眼就记住你。',
      pros: ['外在吸引力强', '个人标签鲜明', '有自己的生活美学'],
      cons: ['容易被外表所定义', '需要内在匹配品位', '有时让人感觉"很难接近"'],
      match: '同样注重生活品质、有审美有品位的伴侣。',
      advice: ['用内在的深度来巩固外在的吸引', '偶尔展示"不完美"的真实一面，更有亲和力', '记住：最好的穿搭是自信'],
    },
    D: {
      type: '温暖型魅力',
      emoji: '🌻',
      color: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
      tagline: '你的温柔，让人想一直靠近',
      traits: ['温暖体贴', '善解人意', '让人感到被重视', '长期魅力强'],
      desc: '你的魅力来自温暖和善解人意。跟你在一起的人会感到放松和被重视，这种魅力虽然不是第一眼就显眼，但是最持久的。',
      pros: ['让人感到被理解', '长期相处魅力持续增强', '建立深层连接的能力强'],
      cons: ['第一眼不够抢眼', '容易被人忽视', '需要主动一点展示自己'],
      match: '能感受到你温暖、懂得感恩、会主动回馈你的伴侣。',
      advice: ['主动多一点，不要等别人来发现你的好', '展示你有趣、有主见的一面', '记住：你的温暖是稀缺品，不要轻易给不珍惜的人'],
    },
  },
  readiness: {
    B: {
      type: '完全准备好了',
      emoji: '🚀',
      color: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      tagline: '你已经准备好迎接一段好感情',
      traits: ['情绪独立', '走出过去', '清楚自己想要什么', '生活充实'],
      desc: '你已经很好地从过去中走出来，现在生活充实，情绪稳定，对感情有清晰的期待，而不是出于孤独或逃避而恋爱。\n\n这是最好的恋爱状态——带着完整的自己去爱，而不是靠感情来完成自己。',
      pros: ['情绪稳定，不会迁怒对方', '清楚自己的边界和需求', '不会因为孤独而将就'],
      cons: ['可能标准很高，容易错过合适的人', '有时候过于独立，忘了主动'],
      match: '同样成熟独立、有自己生活的人，两个人可以互相欣赏，一起成长。',
      advice: ['保持开放的心态，给更多人机会', '主动迈出第一步，好感情不会自己送上门', '享受过程，不要太急于求"对的人"'],
    },
    C: {
      type: '基本准备好了',
      emoji: '🌱',
      color: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      tagline: '再给自己一点时间，就是最好的状态',
      traits: ['走出大半', '偶尔还有过去的影子', '生活稳定', '感情期待中'],
      desc: '你大部分时候已经走出了过去，但偶尔还会想起。这完全正常。你现在可以尝试新的关系，但要注意不要把新的对象当作"愈合工具"。\n\n以朋友的方式先慢慢认识，让感情自然发展，而不是急于确认关系。',
      pros: ['对感情有期待有热情', '基本情绪稳定', '有足够的生活经验'],
      cons: ['有时候过去的影子会影响判断', '可能把新恋人和前任做比较'],
      match: '耐心温柔、不会给你太大压力的伴侣，允许你按自己的节奏来。',
      advice: ['在认识新的人时，先专注于"这个人本身"，而不是感情的结果', '给自己做一件之前想做但没做的事', '跟亲近的朋友聊聊你的感受'],
    },
    D: {
      type: '渴望型',
      emoji: '🌊',
      color: 'linear-gradient(135deg, #f97316 0%, #FF6B8A 100%)',
      tagline: '对感情的渴望是美好的，但要先充实自己',
      traits: ['渴望陪伴', '感情需求高', '行动积极', '有时容易将就'],
      desc: '你现在非常渴望一段感情，这种渴望是真实的。但要注意，在最渴望的时候，往往最容易将就或者吓跑对方。\n\n先把对"陪伴"的需求转化为对自己的投资——充实你的生活，让你在没有伴侣时也很好，那时候吸引到的感情才是真正想要的。',
      pros: ['感情里会很用心', '不会畏首畏尾', '有热情有行动力'],
      cons: ['容易因为孤独而将就', '需求太强烈可能给对方压力', '有时不够挑剔'],
      match: '能给你稳定感的伴侣，而不是同样漂浮不定的人。',
      advice: ['先做三件让自己快乐的事，不依赖任何人', '建立自己的社交圈，让生活丰富起来', '记住：感情应该是生活的加分项，而不是填补空白'],
    },
    A: {
      type: '疗愈进行中',
      emoji: '🦋',
      color: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
      tagline: '先好好爱自己，最好的感情在等你',
      traits: ['还在疗愈', '需要更多时间', '有成长动力', '情绪复杂'],
      desc: '你现在还在疗愈的过程中，有时候会逃避感受，用忙碌来麻醉自己。这是完全正常的应对方式，但在真正走出来之前进入新的感情，往往会让自己和对方都受伤。\n\n给自己一段时间，这不是放弃，是为了带着更完整的自己去遇见更好的人。',
      pros: ['对感情有更深的理解', '经历让你成长', '比以前更了解自己想要什么'],
      cons: ['可能还有未处理的情绪', '容易把情绪带入新的关系', '需要更多自我关怀'],
      match: '当你准备好了，你需要一个有耐心、温柔而坚定的伴侣。',
      advice: ['允许自己感受情绪，不要只是压抑', '跟信任的朋友或专业人士聊聊', '每天做一件只为自己的事'],
    },
  },
}

Page({
  data: {
    phase: 'cover', // cover | doing | result
    quizTypes: QUIZ_TYPES,
    selectedType: 'love_style',
    questions: [],
    currentIdx: 0,
    totalQ: 0,
    currentQ: {},
    selectedAns: '',
    answers: [],
    progressPct: 0,
    result: null,
  },

  onLoad() {},

  selectType(e) {
    this.setData({ selectedType: e.currentTarget.dataset.id })
  },

  startQuiz() {
    const type = this.data.selectedType
    let questions = LOVE_STYLE_QUESTIONS
    if (type === 'attraction') questions = ATTRACTION_QUESTIONS
    if (type === 'readiness') questions = READINESS_QUESTIONS

    this.setData({
      phase: 'doing',
      questions,
      currentIdx: 0,
      totalQ: questions.length,
      currentQ: questions[0],
      selectedAns: '',
      answers: [],
      progressPct: 0,
    })
  },

  selectAnswer(e) {
    this.setData({ selectedAns: e.currentTarget.dataset.val })
  },

  nextQuestion() {
    const { selectedAns, currentIdx, questions, answers, totalQ } = this.data
    if (!selectedAns) return

    const newAnswers = [...answers, selectedAns]
    const nextIdx = currentIdx + 1

    if (nextIdx >= totalQ) {
      // 计算结果
      this.calcResult(newAnswers)
    } else {
      this.setData({
        answers: newAnswers,
        currentIdx: nextIdx,
        currentQ: questions[nextIdx],
        selectedAns: '',
        progressPct: Math.round(nextIdx / totalQ * 100),
      })
    }
  },

  calcResult(answers) {
    // 统计各选项出现次数
    const count = {}
    answers.forEach(a => { count[a] = (count[a] || 0) + 1 })
    // 找出最多的选项
    let maxVal = 'A'
    let maxCount = 0
    Object.keys(count).forEach(k => {
      if (count[k] > maxCount) { maxCount = count[k]; maxVal = k }
    })

    const type = this.data.selectedType
    const resultMap = RESULTS[type] || RESULTS.love_style
    const result = resultMap[maxVal] || Object.values(resultMap)[0]

    // 保存结果
    const savedResults = wx.getStorageSync('quizResults') || {}
    savedResults[type] = { result: maxVal, time: Date.now() }
    wx.setStorageSync('quizResults', savedResults)

    this.setData({ phase: 'result', result })
  },

  retakeQuiz() {
    this.setData({ phase: 'cover' })
  },

  askAboutResult() {
    const type = this.data.result ? this.data.result.type : ''
    wx.setStorageSync('pendingAIQuestion', `我的恋爱风格测评结果是"${type}"，请给我更详细的建议`)
    wx.navigateTo({ url: '/pages/ai-coach/ai-coach' })
  },
})
