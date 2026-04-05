/**
 * H5版本 AI 统一调用层 - 保留完整AI功能
 * 使用 DeepSeek API 提供真实AI能力
 */

// ============================================================
// 配置区 - H5版本使用真实AI API
// ============================================================
const API_CONFIG = {
  // DeepSeek API
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: 'sk-dc86cbd1925a4bbcb7d267eb210d0bfc',
  model: 'deepseek-chat',
  maxTokens: 1000,
  temperature: 0.8,
}

// 启用真实AI模式（H5版本不受小程序审核限制）
const USE_REAL_AI = true

// ============================================================
// 系统提示词
// ============================================================
const SYSTEM_PROMPTS = {
  coach: `你是"小爱"，一位专业、温暖、接地气的AI恋爱顾问。你的特点：
1. 基于用户的具体情况给出有针对性的建议，绝对不给空话
2. 语气亲切自然，像闺蜜/好兄弟倾谈，而不是机械的说教
3. 每个建议都带具体可执行的行动步骤
4. 懂得分辨用户是男生还是女生，给出性别差异化建议
5. 回复控制在300字以内，干货优先`,

  reply: `你是一位恋爱话术专家，专门帮用户生成高情商的聊天回复。你的原则：
1. 回复要自然真实，不油腻、不做作
2. 根据用户的性别、场景、目标定制化生成
3. 男生和女生的回复风格完全不同：男生主动阳光、女生适度矜持
4. 每次生成3条回复，风格各异（温柔/幽默/浪漫）
5. 附上每条回复的使用场景说明`,

  advice: `你是一位情感关系专家。根据用户提供的关系信息（阶段、性别、性格），生成今日个性化建议。
规则：
1. 建议要具体、可执行，不是"多沟通"这类废话
2. 根据阶段（陌生人/暧昧/热恋/稳定/同居/求婚/已婚）给不同建议
3. 根据用户性别（男/女）给不同视角的建议
4. 根据TA的性格（冒险/宅家/文艺/浪漫/理性）定制活动推荐
5. 回复格式：一段主要建议（50字）+ 3条今日行动`,

  surprise: `你是浪漫惊喜策划专家。根据关系阶段和TA的性格，生成一个具体的惊喜创意。
要求：有创意、可实现、不千篇一律，要结合用户填写的具体信息（名字、性格、阶段）个性化。100字以内。`,

  course: `你是恋爱教练，专注于教导真实有效的感情技巧。生成一篇恋爱课程内容。
要求：
1. 实用性强，有具体案例和对话示例
2. 不说废话，每一段都有价值
3. 使用Markdown格式（**加粗**、> 引用、❌✅对比）
4. 根据目标性别（男/女/通用）调整视角
5. 长度控制在400-600字`,

  soulmate: `你是一位精通西方占星学和东方玄学的AI占星师，能用诗意而神秘的语言描述一个人命中注定的灵魂伴侣。
要求：
1. 根据用户的太阳星座、月亮星座、上升星座和出生地，描述其灵魂伴侣的特质
2. 语言要温柔、诗意、有玄学神秘感，让人觉得这是命运安排
3. 内容80字以内，不要废话，每个字都有画面感
4. 直接描述人物特征，如"他温柔安静，会在你最脆弱的时候陪着你..."
5. 不要出现"根据星盘"、"分析"等开头语，直接进入描述
6. 要描述灵魂伴侣的性格、相处方式、对你的意义`,

  topics: `你是"小爱"，一位恋爱话题策划专家。你的任务是根据用户的需求生成有趣的约会话题。
要求：
1. 生成8-12个高质量话题，每个话题20字以内
2. 话题要有趣、能引发深入对话、适合约会场景
3. 分类展示，每类3-4个话题
4. 不要老生常谈，要有新意和趣味性
5. 直接列出话题，不需要解释`,

  sweetwords: `你是"小爱"，一位恋爱文案大师。你的任务是为用户生成撩人金句。
要求：
1. 生成6-10条不同风格的金句，每条15-30字
2. 风格包括：温柔、幽默、浪漫、真诚
3. 适合不同场景：早安、晚安、表白、约会、撒娇、挽回
4. 根据用户性别调整语气（男生主动阳光、女生适度矜持）
5. 直接列出金句，不需要解释`,
}

// ============================================================
// 核心调用函数
// ============================================================

/**
 * AI对话调用
 */
function chat({ messages, systemPrompt, onSuccess, onError, maxTokens }) {
  const sys = typeof systemPrompt === 'string' && SYSTEM_PROMPTS[systemPrompt]
    ? SYSTEM_PROMPTS[systemPrompt]
    : (typeof systemPrompt === 'string' ? systemPrompt : SYSTEM_PROMPTS.coach)

  const fullMessages = [
    { role: 'system', content: sys }
  ].concat(messages)

  console.log('[AI] 发起请求:', API_CONFIG.baseUrl)

  fetch(API_CONFIG.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_CONFIG.apiKey,
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      messages: fullMessages,
      max_tokens: maxTokens || API_CONFIG.maxTokens,
      temperature: API_CONFIG.temperature,
      stream: false,
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('[AI] 收到响应:', data)
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content || ''
      onSuccess && onSuccess(content.trim())
    } else if (data.error) {
      onError && onError(data.error.message || 'AI服务异常')
    } else {
      onError && onError('AI响应格式异常')
    }
  })
  .catch(err => {
    console.error('[AI] 请求失败:', err)
    onError && onError('网络连接失败，请检查网络后重试')
  })
}

/**
 * 快速单轮问答
 */
function ask(userPrompt, systemKey, onSuccess, onError, maxTokens) {
  chat({
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt: systemKey || 'coach',
    onSuccess,
    onError,
    maxTokens,
  })
}

/**
 * 生成聊天回复
 */
function generateReply({ theirMessage, myGender, scene, goal, mood, profile }, onSuccess, onError) {
  const genderStr = myGender === 'male' ? '男生' : '女生'
  const sceneMap = {
    stranger_first: '初次搭话（陌生人）',
    ambiguous_invite: '暧昧期约会邀请',
    ambiguous_morning: '暧昧期日常升温',
    dating_sweet: '热恋期甜蜜互动',
    dating_conflict: '吵架/冷战后修复',
    stable_fresh: '稳定期制造新鲜感',
    cohabit_issue: '同居期矛盾沟通',
    proposal_hint: '求婚暗示',
    married_romance: '婚后找回浪漫',
  }
  const goalMap = {
    warm_up: '拉近感情距离',
    invite: '约对方出来见面',
    express: '表达心意',
    repair: '修复关系',
    tease: '轻松撩拨',
    care: '关心对方',
  }
  const moodMap = {
    happy: '对方心情开心',
    sad: '对方心情难过',
    busy: '对方很忙',
    bored: '对方无聊',
    cold: '对方有点冷淡',
    warm: '对方心动中',
  }

  const profileContext = profile
    ? `\n用户信息：我叫${profile.myName}，TA叫${profile.taName}，TA的性格是${profile.taPersonality}，我们目前处于${profile.stage}阶段。`
    : ''

  const prompt = `请帮我生成3条高情商的聊天回复。

背景信息：
- 我的身份：${genderStr}
- 当前场景：${sceneMap[scene] || scene}
- 我的目标：${goalMap[goal] || goal}
- TA的心情：${moodMap[mood] || '不确定'}${profileContext}

TA 发来的消息："${theirMessage}"

请生成3条风格不同的回复，格式如下（严格按此格式，方便解析）：
【回复1】
风格：温柔体贴
内容：（回复正文）
说明：（为什么这样回更好）

【回复2】
风格：幽默轻松
内容：（回复正文）
说明：（为什么这样回更好）

【回复3】
风格：真诚直接
内容：（回复正文）
说明：（为什么这样回更好）

注意：回复要自然真实，适合直接发送，不能过于肉麻或油腻。`

  chat({
    messages: [{ role: 'user', content: prompt }],
    systemPrompt: 'reply',
    maxTokens: 800,
    onSuccess,
    onError,
  })
}

/**
 * 解析聊天回复
 */
function parseReplies(rawText) {
  const results = []
  const blocks = rawText.split(/【回复\d+】/).filter(b => b.trim())
  for (const block of blocks) {
    const styleMatch = block.match(/风格[：:]\s*(.+)/)
    const contentMatch = block.match(/内容[：:]\s*([\s\S]+?)(?=说明[：:]|$)/)
    const explainMatch = block.match(/说明[：:]\s*([\s\S]+?)(?=【|$)/)
    if (contentMatch) {
      results.push({
        style: styleMatch ? styleMatch[1].trim() : '自然',
        text: contentMatch[1].trim(),
        explain: explainMatch ? explainMatch[1].trim() : '',
      })
    }
  }
  if (results.length === 0 && rawText.trim()) {
    const lines = rawText.split('\n').filter(l => l.trim() && !l.includes('【') && !l.includes('风格') && !l.includes('说明'))
    lines.slice(0, 3).forEach((line, i) => {
      results.push({ style: ['温柔', '幽默', '真诚'][i] || '自然', text: line.replace(/^[0-9\.\-\*]+\s*/, '').trim(), explain: '' })
    })
  }
  return results.slice(0, 3)
}

/**
 * 生成灵魂伴侣描述
 */
function generateSoulmateDesc({ zodiac, moonSign, ascendant, birthCity, userGender }, onSuccess, onError) {
  const genderStr = userGender === 'male' ? '男生' : '女生'
  const prompt = `我是一位${genderStr}，太阳星座是${zodiac}，月亮星座是${moonSign}，上升星座是${ascendant}，出生城市是${birthCity || '未知'}。

请为我描述命中注定的灵魂伴侣。`

  ask(prompt, 'soulmate', onSuccess, onError, 300)
}

/**
 * 生成灵魂伴侣图片（使用AI生图服务）
 */
function generateSoulmateImage({ zodiac, gender, desc, seed }, onSuccess, onError) {
  // H5版本可以使用真实的AI生图服务
  // 这里使用占位图，实际部署时可接入真实API
  const placeholderUrls = {
    male: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop',
    ],
    female: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    ],
  }
  
  const urls = placeholderUrls[gender] || placeholderUrls['female']
  const index = (seed || 0) % urls.length
  
  setTimeout(() => {
    onSuccess && onSuccess(urls[index])
  }, 800)
}

/**
 * 生成约会话题
 */
function generateTopics({ category, count = 10 }, onSuccess, onError) {
  const categoryMap = {
    '初次见面': '轻松有趣的话题，适合第一次约会或刚认识的人',
    '深入了解': '能加深了解的话题，了解对方内心世界和价值观',
    '制造笑点': '有趣、幽默、能让人开怀大笑的话题',
    '聊价值观': '关于人生、爱情、生活态度的深度话题',
    '撩拨小话题': '轻微暧昧、能让心跳加速的话题',
  }
  const categoryDesc = categoryMap[category] || '约会话题'

  const prompt = `请帮我生成${count}个约会话题。

分类：${category}
要求：${categoryDesc}

格式（严格按此格式）：
【分类名称】
话题1
话题2
...

不要解释，直接列出话题。每个话题12-20字，要有趣味性和深度。`

  ask(prompt, 'topics', onSuccess, onError, 400)
}

/**
 * 解析话题
 */
function parseTopics(rawText) {
  const results = []
  const blocks = rawText.split(/【([^】]+)】/).filter(b => b.trim())

  for (let i = 0; i < blocks.length; i += 2) {
    const category = blocks[i] || '其他'
    const questionsText = blocks[i + 1] || ''
    const questions = questionsText.split('\n')
      .map(q => q.replace(/^[0-9\.\-\s]+/, '').trim())
      .filter(q => q && q.length > 3)

    if (questions.length > 0) {
      results.push({ category, questions: questions.slice(0, 5) })
    }
  }

  if (results.length === 0 && rawText.trim()) {
    const lines = rawText.split('\n').filter(l => l.trim() && l.length > 5)
    results.push({
      category: 'AI生成话题',
      questions: lines.slice(0, 10).map(l => l.replace(/^[0-9\.\-\s]+/, '').trim())
    })
  }

  return results
}

/**
 * 生成撩人金句
 */
function generateSweetWords({ scene, gender = 'both', count = 8 }, onSuccess, onError) {
  const sceneMap = {
    '早安': '温馨甜蜜的早安问候，让对方一天心情好',
    '晚安': '温柔深情的晚安祝福，带一点思念',
    '表白': '真诚直接的告白，适合表白场景',
    '约会': '约会中或约会后说的话，甜蜜又自然',
    '撒娇': '轻微撒娇、可爱俏皮的语气',
    '挽回': '挽回关系时说的话，真诚且打动人心',
    '通用': '任何场景都适用的恋爱金句',
  }
  const genderStr = gender === 'male' ? '男生' : (gender === 'female' ? '女生' : '通用')
  const sceneDesc = sceneMap[scene] || '恋爱金句'

  const prompt = `请帮我生成${count}条撩人金句。

场景：${scene}
受众：${genderStr}
要求：${sceneDesc}

格式（严格按此格式）：
【场景名称】
金句1
金句2
...

每条15-30字，要自然真实，不要油腻。直接列出，不要解释。`

  ask(prompt, 'sweetwords', onSuccess, onError, 400)
}

/**
 * 解析金句
 */
function parseSweetWords(rawText) {
  const results = []
  const blocks = rawText.split(/【([^】]+)】/).filter(b => b.trim())

  for (let i = 0; i < blocks.length; i += 2) {
    const scene = blocks[i] || '通用'
    const wordsText = blocks[i + 1] || ''
    const lines = wordsText.split('\n').filter(l => l.trim() && l.length > 5)

    for (const line of lines) {
      results.push({
        scene,
        text: line.replace(/^[0-9\.\-\s]+/, '').trim()
      })
    }
  }

  if (results.length === 0 && rawText.trim()) {
    const lines = rawText.split('\n').filter(l => l.trim() && l.length > 5)
    results.push(...lines.map(l => ({
      scene: '通用',
      text: l.replace(/^[0-9\.\-\s]+/, '').trim()
    })))
  }

  return results.slice(0, 10)
}

/**
 * 恋爱顾问多轮对话
 */
function coachChat({ userMessage, history, userGender, profile }, onSuccess, onError) {
  const genderStr = userGender === 'male' ? '男生' : (userGender === 'female' ? '女生' : '用户')
  const profileCtx = profile
    ? `（用户档案：${genderStr}，对方叫${profile.taName}，目前${profile.stage}阶段）`
    : `（用户性别：${genderStr}）`

  const recentHistory = history ? history.slice(-10) : []
  const messages = [
    ...recentHistory,
    { role: 'user', content: `${profileCtx}\n${userMessage}` },
  ]

  chat({
    messages,
    systemPrompt: 'coach',
    maxTokens: 600,
    onSuccess,
    onError,
  })
}

// 导出API
window.AI = {
  chat,
  ask,
  generateReply,
  parseReplies,
  generateSoulmateDesc,
  generateSoulmateImage,
  generateTopics,
  parseTopics,
  generateSweetWords,
  parseSweetWords,
  coachChat,
  SYSTEM_PROMPTS,
  USE_REAL_AI,
}
