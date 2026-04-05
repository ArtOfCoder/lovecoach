/**
 * utils/ai.js - AI 统一调用层
 *
 * 接入方式：使用 DeepSeek API（或替换为腾讯混元等其他 LLM）
 *
 * 使用方法：
 *   const ai = require('../../utils/ai')
 *   ai.chat({ messages, onChunk, onDone, onError })
 *
 * 配置：在 app.js 全局 data 或此文件顶部修改 API_KEY 和 BASE_URL
 */

// ============================================================
// 配置区（上线前替换为真实 key）
// ============================================================

// ⚠️ 重要提示：
// 如果您的小程序被第三方平台托管，服务器域名功能被禁用，
// 请使用方案A（云开发转发）或方案B（完全本地模式）

// 方案A：使用云开发转发（推荐，需要开通云开发）
// 步骤：1. 开通微信云开发；2. 创建云函数 ai-proxy；3. 右键上传部署云函数
const USE_CLOUD_FUNCTION = false   // 关闭云函数
const CLOUD_FUNCTION_NAME = 'ai-proxy'  // 云函数名称

// 方案B：完全本地模式（无需网络，使用内置规则库）
// 个人主体小程序审核要求：必须使用本地模式，禁止调用外部AI API
const USE_LOCAL_MODE = true  // 强制启用纯本地模式，不调用任何外部AI服务

// 方案C：混合模式（优先使用API，失败时降级到本地模式）
const USE_HYBRID_MODE = false   // 关闭混合模式

// 真实 AI 配置（当 USE_LOCAL_MODE = false 时生效）
const API_CONFIG = {
  // DeepSeek API（推荐：性价比最高）
  // 申请地址：https://platform.deepseek.com/
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: 'sk-dc86cbd1925a4bbcb7d267eb210d0bfc',
  model: 'deepseek-chat',

  // 备用：腾讯混元（国内更稳定）
  // 注意：需要单独申请腾讯混元 API Key，与 DeepSeek 不同
  // baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
  // apiKey: 'YOUR_HUNYUAN_API_KEY', // 替换为腾讯混元的真实 key
  // model: 'hunyuan-lite',

  maxTokens: 1000,
  temperature: 0.8,
}

// ============================================================
// 系统提示词（不同角色）
// ============================================================
const SYSTEM_PROMPTS = {
  // 恋爱顾问
  coach: `你是"小爱"，一位专业、温暖、接地气的AI恋爱顾问。你的特点：
1. 基于用户的具体情况给出有针对性的建议，绝对不给空话
2. 语气亲切自然，像闺蜜/好兄弟倾谈，而不是机械的说教
3. 每个建议都带具体可执行的行动步骤
4. 懂得分辨用户是男生还是女生，给出性别差异化建议
5. 回复控制在300字以内，干货优先`,

  // 聊天回复生成
  reply: `你是一位恋爱话术专家，专门帮用户生成高情商的聊天回复。你的原则：
1. 回复要自然真实，不油腻、不做作
2. 根据用户的性别、场景、目标定制化生成
3. 男生和女生的回复风格完全不同：男生主动阳光、女生适度矜持
4. 每次生成3条回复，风格各异（温柔/幽默/浪漫）
5. 附上每条回复的使用场景说明`,

  // 情侣档案建议
  advice: `你是一位情感关系专家。根据用户提供的关系信息（阶段、性别、性格），生成今日个性化建议。
规则：
1. 建议要具体、可执行，不是"多沟通"这类废话
2. 根据阶段（陌生人/暧昧/热恋/稳定/同居/求婚/已婚）给不同建议
3. 根据用户性别（男/女）给不同视角的建议
4. 根据TA的性格（冒险/宅家/文艺/浪漫/理性）定制活动推荐
5. 回复格式：一段主要建议（50字）+ 3条今日行动`,

  // 惊喜方案
  surprise: `你是浪漫惊喜策划专家。根据关系阶段和TA的性格，生成一个具体的惊喜创意。
要求：有创意、可实现、不千篇一律，要结合用户填写的具体信息（名字、性格、阶段）个性化。100字以内。`,

  // 课程内容生成
  course: `你是恋爱教练，专注于教导真实有效的感情技巧。生成一篇恋爱课程内容。
要求：
1. 实用性强，有具体案例和对话示例
2. 不说废话，每一段都有价值
3. 使用Markdown格式（**加粗**、> 引用、❌✅对比）
4. 根据目标性别（男/女/通用）调整视角
5. 长度控制在400-600字`,

  // 灵魂伴侣测算
  soulmate: `你是一位精通西方占星学和东方玄学的AI占星师，能用诗意而神秘的语言描述一个人命中注定的灵魂伴侣。
要求：
1. 根据用户的太阳星座、月亮星座、上升星座和出生地，描述其灵魂伴侣的特质
2. 语言要温柔、诗意、有玄学神秘感，让人觉得这是命运安排
3. 内容80字以内，不要废话，每个字都有画面感
4. 直接描述人物特征，如"他温柔安静，会在你最脆弱的时候陪着你..."
5. 不要出现"根据星盘"、"分析"等开头语，直接进入描述
6. 要描述灵魂伴侣的性格、相处方式、对你的意义`,

  // 话题生成
  topics: `你是"小爱"，一位恋爱话题策划专家。你的任务是根据用户的需求生成有趣的约会话题。
要求：
1. 生成8-12个高质量话题，每个话题20字以内
2. 话题要有趣、能引发深入对话、适合约会场景
3. 分类展示，每类3-4个话题
4. 不要老生常谈，要有新意和趣味性
5. 直接列出话题，不需要解释`,

  // 金句生成
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
 * 非流式调用（一次性返回完整结果），内置超时重试机制
 * @param {Object} options
 * @param {Array} options.messages - [{role: 'system'|'user'|'assistant', content: '...'}]
 * @param {string} options.systemPrompt - 使用预设的 systemPrompt key，或直接传字符串
 * @param {Function} options.onSuccess - 成功回调 (content: string) => void
 * @param {Function} options.onError - 错误回调 (err: string) => void
 * @param {number} options.maxTokens - 覆盖默认 maxTokens
 * @param {number} options._retry - 内部重试计数（勿手动传）
 */
function chat({ messages, systemPrompt, onSuccess, onError, maxTokens, _retry }) {
  var retryCount = _retry || 0
  var MAX_RETRY = 2
  var RETRY_DELAY = 1500

  // 检查是否使用本地模式
  if (USE_LOCAL_MODE) {
    console.log('[AI] 使用本地模式（无需网络）')
    var response = getLocalAIResponse(messages, systemPrompt)
    setTimeout(function() {
      onSuccess && onSuccess(response)
    }, 300)
    return
  }

  // 检查是否使用云函数模式
  if (USE_CLOUD_FUNCTION) {
    callCloudFunction({ messages, systemPrompt, maxTokens, onSuccess, onError })
    return
  }

  // 原始网络请求模式（需要配置域名白名单）
  var sys = typeof systemPrompt === 'string' && SYSTEM_PROMPTS[systemPrompt]
    ? SYSTEM_PROMPTS[systemPrompt]
    : (typeof systemPrompt === 'string' ? systemPrompt : SYSTEM_PROMPTS.coach)

  var fullMessages = [
    { role: 'system', content: sys }
  ].concat(messages)

  console.log('[AI] 发起请求:', API_CONFIG.baseUrl, 'Model:', API_CONFIG.model)

  wx.request({
    url: API_CONFIG.baseUrl,
    method: 'POST',
    timeout: 30000,
    header: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_CONFIG.apiKey,
    },
    data: {
      model: API_CONFIG.model,
      messages: fullMessages,
      max_tokens: maxTokens || API_CONFIG.maxTokens,
      temperature: API_CONFIG.temperature,
      stream: false,
    },
    success: function(res) {
      console.log('[AI] 收到响应:', res.statusCode, res.data)
      if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
        var content = res.data.choices[0].message.content || ''
        console.log('[AI] 解析成功，内容长度:', content.length)
        onSuccess && onSuccess(content.trim())
      } else if (res.statusCode === 429) {
        // 限流 → 重试
        if (retryCount < MAX_RETRY) {
          console.warn('[AI] 限流，稍后重试...')
          setTimeout(function() {
            chat({ messages: messages, systemPrompt: systemPrompt, onSuccess: onSuccess, onError: onError, maxTokens: maxTokens, _retry: retryCount + 1 })
          }, RETRY_DELAY * (retryCount + 1))
        } else {
          onError && onError('AI 请求频繁，请稍等片刻再试')
        }
      } else if (res.statusCode === 401) {
        onError && onError('AI 密钥无效，请联系开发者')
      } else if (res.statusCode === 500 || res.statusCode === 503) {
        // 服务端错误 → 重试
        if (retryCount < MAX_RETRY) {
          console.warn('[AI] 服务端错误 ' + res.statusCode + '，重试中...')
          setTimeout(function() {
            chat({ messages: messages, systemPrompt: systemPrompt, onSuccess: onSuccess, onError: onError, maxTokens: maxTokens, _retry: retryCount + 1 })
          }, RETRY_DELAY)
        } else {
          onError && onError('AI 服务暂时不可用，请稍后再试')
        }
      } else {
        var errMsg = (res.data && res.data.error && res.data.error.message) || ('服务异常(' + res.statusCode + ')')
        console.error('[AI] 请求失败:', errMsg, res.data)
        onError && onError(errMsg)
      }
    },
    fail: function(err) {
      var errStr = (err && err.errMsg) ? err.errMsg : JSON.stringify(err)
      console.error('[AI] 网络错误:', errStr)

      var isDomainBlock = errStr.indexOf('url not in domain list') !== -1
        || errStr.indexOf('not allowed') !== -1
        || errStr.indexOf('ERR_NAME_NOT_RESOLVED') !== -1

      var isTimeout = errStr.indexOf('timeout') !== -1

      // 混合模式：网络错误时降级到本地模式
      if (USE_HYBRID_MODE) {
        console.log('[AI] 混合模式：API请求失败，降级到本地模式')
        var response = getLocalAIResponse(messages, systemPrompt)
        setTimeout(function() {
          onSuccess && onSuccess(response)
        }, 300)
        return
      }

      if (isDomainBlock) {
        console.error('[AI] 域名未加白名单！请在微信开发者工具中勾选"不校验合法域名"，或在小程序后台添加 api.deepseek.com')
        onError && onError('__domain_blocked__')
      } else if (isTimeout && retryCount < MAX_RETRY) {
        console.warn('[AI] 请求超时，第' + (retryCount + 1) + '次重试...')
        setTimeout(function() {
          chat({ messages: messages, systemPrompt: systemPrompt, onSuccess: onSuccess, onError: onError, maxTokens: maxTokens, _retry: retryCount + 1 })
        }, RETRY_DELAY * (retryCount + 1))
      } else if (isTimeout) {
        console.error('[AI] 重试次数用尽，请求超时')
        onError && onError('网络超时，请检查网络连接后重试')
      } else if (retryCount < 1) {
        console.warn('[AI] 网络错误，1次重试...')
        setTimeout(function() {
          chat({ messages: messages, systemPrompt: systemPrompt, onSuccess: onSuccess, onError: onError, maxTokens: maxTokens, _retry: retryCount + 1 })
        }, 1000)
      } else {
        onError && onError('网络连接失败，请检查网络后重试')
      }
    },
  })
}

/**
 * 快速单轮问答（常用简化版）
 * @param {string} userPrompt - 用户消息内容
 * @param {string} systemKey - SYSTEM_PROMPTS 的 key
 * @param {Function} onSuccess
 * @param {Function} onError
 * @param {number} maxTokens
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
 * 生成聊天回复（专用）
 * @param {Object} params
 * @param {string} params.theirMessage - TA 发的消息
 * @param {string} params.myGender - 'male' | 'female'
 * @param {string} params.scene - 场景 id
 * @param {string} params.goal - 目标 id
 * @param {string} params.mood - TA 的心情
 * @param {Object} params.profile - 用户档案（可选，用于个性化）
 * @param {Function} onSuccess
 * @param {Function} onError
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
 * 解析 generateReply 返回的文本为结构化数据
 * @param {string} rawText
 * @returns {Array<{style, text, explain}>}
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
  // 如果解析失败，尝试简单分割
  if (results.length === 0 && rawText.trim()) {
    const lines = rawText.split('\n').filter(l => l.trim() && !l.includes('【') && !l.includes('风格') && !l.includes('说明'))
    lines.slice(0, 3).forEach((line, i) => {
      results.push({ style: ['温柔', '幽默', '真诚'][i] || '自然', text: line.replace(/^[0-9\.\-\*]+\s*/, '').trim(), explain: '' })
    })
  }
  return results.slice(0, 3)
}

/**
 * 生成情侣档案 AI 建议（专用）
 */
function generateCoupleAdvice({ profile, stageInfo }, onSuccess, onError) {
  const stageMap = {
    stranger: '陌生人/刚认识',
    ambiguous: '暧昧期',
    dating: '热恋期',
    stable: '稳定期',
    cohabit: '同居期',
    propose: '求婚准备期',
    married: '已婚',
  }
  const personalityMap = {
    adventurous: '冒险探索型',
    homebody: '宅家温馨型',
    artistic: '文艺创意型',
    romantic: '浪漫仪式型',
    rational: '理性务实型',
  }
  const genderStr = profile.myGender === 'male' ? '男生' : '女生'

  const prompt = `我叫${profile.myName}，是${genderStr}，喜欢的人叫${profile.taName}。
我们目前处于：${stageMap[profile.stage] || profile.stage}
TA的性格：${personalityMap[profile.taPersonality] || profile.taPersonality}
${profile.startDate ? `认识日期：${profile.startDate}` : ''}

请给我今天的专属恋爱建议。要求：
1. 主要建议：一句直击要害的核心指导（50字以内，针对我的性别和阶段）
2. 今日行动：3条具体可执行的行动（每条15字以内）
3. 避免废话，要有实际指导价值

格式（严格遵守，方便解析）：
【主要建议】
（内容）

【今日行动】
1. （行动1）
2. （行动2）
3. （行动3）`

  ask(prompt, 'advice', onSuccess, onError, 400)
}

/**
 * 解析 generateCoupleAdvice 返回的文本
 */
function parseCoupleAdvice(rawText) {
  const mainMatch = rawText.match(/【主要建议】\s*([\s\S]+?)(?=【今日行动】|$)/)
  const actionsMatch = rawText.match(/【今日行动】\s*([\s\S]+?)$/)

  const main = mainMatch ? mainMatch[1].trim() : rawText.substring(0, 60)
  const actions = []

  if (actionsMatch) {
    const lines = actionsMatch[1].split('\n').filter(l => l.trim())
    for (const line of lines) {
      const cleaned = line.replace(/^[0-9]+[\.\、\s]+/, '').trim()
      if (cleaned) actions.push(cleaned)
    }
  }

  // 兜底
  if (actions.length === 0) {
    actions.push('主动联系TA，今天先开口', '记住TA上次说过的一件事', '计划下一次约会或互动')
  }

  return { main, actions: actions.slice(0, 3) }
}

/**
 * 生成惊喜方案
 */
function generateSurprise({ profile, stageInfo }, onSuccess, onError) {
  const stageMap = {
    stranger: '刚认识',
    ambiguous: '暧昧期',
    dating: '热恋期',
    stable: '稳定期',
    cohabit: '同居期',
    propose: '快要求婚了',
    married: '已婚',
  }
  const personalityMap = {
    adventurous: '冒险探索型',
    homebody: '宅家温馨型',
    artistic: '文艺创意型',
    romantic: '浪漫仪式型',
    rational: '理性务实型',
  }

  const prompt = `帮我设计一个浪漫惊喜方案。
我叫${profile.myName}，想给${profile.taName}一个惊喜。
TA的性格：${personalityMap[profile.taPersonality] || '未知'}
我们的关系：${stageMap[profile.stage] || profile.stage}

要求：
- 惊喜要具体、有创意、可实现
- 结合TA的性格特点来定制
- 说明具体怎么做（步骤）
- 控制在100字以内`

  ask(prompt, 'surprise', onSuccess, onError, 300)
}

/**
 * 恋爱顾问多轮对话（带历史记录）
 */
function coachChat({ userMessage, history, userGender, profile }, onSuccess, onError) {
  const genderStr = userGender === 'male' ? '男生' : (userGender === 'female' ? '女生' : '用户')
  const profileCtx = profile
    ? `（用户档案：${genderStr}，对方叫${profile.taName}，目前${profile.stage}阶段）`
    : `（用户性别：${genderStr}）`

  // 构建消息历史（限最近10条避免超长）
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

/**
 * AI 解读 TA 的消息（分析意图）
 */
function analyzeTheirMessage({ theirMessage, myGender, scene }, onSuccess, onError) {
  const genderStr = myGender === 'male' ? '男生' : '女生'
  const prompt = `我是${genderStr}，TA发给我这条消息：
"${theirMessage}"

请从以下三个维度帮我分析：
【TA的真实意图】（TA为什么发这条，背后想表达什么）
【情绪信号】（TA现在的情绪状态）
【最佳应对策略】（我应该怎么回，注意什么）

要简短精准，每点不超过2句话。`

  ask(prompt, 'reply', onSuccess, onError, 400)
}

/**
 * AI 动态生成课程章节内容
 */
function generateCourseContent({ title, gender, category, chapterTitle }, onSuccess, onError) {
  const genderStr = gender === 'male' ? '男生' : (gender === 'female' ? '女生' : '通用')
  const prompt = `请为以下恋爱课程生成一节内容：

课程标题：${title}
目标受众：${genderStr}
课程分类：${category}
本章标题：${chapterTitle}

要求：
- 有具体案例和对话示例
- 使用 **加粗**、❌✅对比、> 引用等格式增加可读性
- 实用性强，避免空话废话
- 400-600字`

  ask(prompt, 'course', onSuccess, onError, 800)
}

/**
 * AI 生成新课程列表（动态扩充）
 */
function generateCourseList({ gender, category, count = 3 }, onSuccess, onError) {
  const genderStr = gender === 'male' ? '男生' : (gender === 'female' ? '女生' : '通用')
  const prompt = `请为恋爱课程平台生成${count}个新课程的基本信息。

目标受众：${genderStr}
分类：${category}

每个课程包含：标题、一句话简介、3个章节标题、难度标签（初阶/进阶/高级）

格式（严格遵守）：
---课程1---
标题：（课程标题，要吸引人，可以加emoji）
简介：（一句话，30字以内）
章节：1.（章节1）| 2.（章节2）| 3.（章节3）
标签：（难度）

---课程2---
（同上）`

  ask(prompt, 'course', onSuccess, onError, 600)
}

/**
 * 解析 AI 生成的课程列表
 */
function parseCourseList(rawText) {
  const courses = []
  const blocks = rawText.split(/---课程\d+---/).filter(b => b.trim())
  for (const block of blocks) {
    const titleMatch = block.match(/标题[：:]\s*(.+)/)
    const descMatch = block.match(/简介[：:]\s*(.+)/)
    const chaptersMatch = block.match(/章节[：:]\s*(.+)/)
    const tagsMatch = block.match(/标签[：:]\s*(.+)/)
    if (titleMatch && descMatch) {
      const chaptersRaw = chaptersMatch ? chaptersMatch[1] : ''
      const chapters = chaptersRaw.split('|').map((c, i) => ({
        id: i + 1,
        title: c.replace(/^\d+[\.\s]+/, '').trim(),
        content: '', // 后续按需生成
      })).filter(c => c.title)
      courses.push({
        title: titleMatch[1].trim(),
        desc: descMatch[1].trim(),
        chapters,
        category: tagsMatch ? tagsMatch[1].trim() : '进阶',
      })
    }
  }
  return courses
}

// ============================================================
// 工具函数
// ============================================================

/** 检查 API Key 是否已配置 */
function isConfigured() {
  return API_CONFIG.apiKey && API_CONFIG.apiKey !== 'YOUR_DEEPSEEK_API_KEY'
}

/** 获取 API 未配置时的 mock 回复（开发调试用） */
function getMockReply(type) {
  var mockCoach = '[演示模式] 你好！我是 AI 恋爱顾问小爱。\n\n关于你的问题，我的建议是：\n1. 先了解对方的兴趣爱好\n2. 寻找共同话题建立连接\n3. 适时表达真诚的赞美\n\n配置 AI API Key 后可获得真实的个性化建议！'
  var mockReply = '[演示模式] 为你生成3条回复示例：\n\n【回复1】\n风格：温柔体贴\n内容：你说的对，我之前没有想到这个角度，谢谢你告诉我\n说明：表达认同和感谢，让对方感到被重视\n\n【回复2】\n风格：幽默轻松\n内容：哈哈你这个角度太有意思了，下次我也用这招\n说明：轻松回应，制造欢乐气氛\n\n【回复3】\n风格：真诚直接\n内容：我很喜欢你说这些，能多讲讲吗？\n说明：表达兴趣，引导对方继续分享'
  var mockAdvice = '[演示模式]\n【主要建议】\n今天记住：真诚和细心是最好的爱意表达，做一件让 TA 感受到你在意的小事。\n\n【今日行动】\n1. 主动联系TA，先开口\n2. 提起TA说过的一件小事\n3. 策划一次约会'
  var mockSurprise = '[演示模式] 惊喜创意：\n今天下班后，去TA最喜欢的奶茶店买一杯TA的常规口味，然后直接出现在TA面前——不需要任何理由，就是"路过想到你"。这个惊喜不在于花钱多少，而是出现得恰到好处。'
  var mockAnalyze = '[演示模式] 消息分析：\n\n【TA的真实意图】这条消息表达了TA想和你保持联系的意愿。\n【情绪信号】TA情绪平稳，有点期待你的回应。\n【最佳应对策略】温暖回应即可，不需要过度解读，顺着话题自然延伸。'
  if (type === 'reply') return mockReply
  if (type === 'advice') return mockAdvice
  if (type === 'surprise') return mockSurprise
  if (type === 'analyze') return mockAnalyze
  return mockCoach
}

/**
 * 本地模式：基于关键词匹配的智能回复（无需网络）
 * @param {Array} messages - 用户消息历史
 * @param {string} systemPrompt - 系统提示词类型
 * @returns {string} 本地生成的回复
 */
function getLocalAIResponse(messages, systemPrompt) {
  var lastMsg = messages && messages.length ? messages[messages.length - 1] : null
  var userMessage = (lastMsg && lastMsg.content) ? lastMsg.content : ''
  var lowerMessage = userMessage.toLowerCase()

  // 获取对话历史长度用于多样化回复
  var historyLen = messages ? messages.length : 0

  // 聊天回复模式
  if (systemPrompt === 'reply') {
    return '【回复1】\n风格：温柔体贴\n内容：你说的对，我之前没有想到这个角度，谢谢你告诉我\n说明：表达认同和感谢，让对方感到被重视\n\n【回复2】\n风格：幽默轻松\n内容：哈哈你这个角度太有意思了，下次我也用这招\n说明：轻松回应，制造欢乐气氛\n\n【回复3】\n风格：真诚直接\n内容：我很喜欢你说这些，能多讲讲吗？\n说明：表达兴趣，引导对方继续分享'
  }

  // ===== 检测性别自我介绍 =====
  var isMale = lowerMessage === '男' || lowerMessage === '男生' || lowerMessage === '我是男生' || lowerMessage === '男的'
  var isFemale = lowerMessage === '女' || lowerMessage === '女生' || lowerMessage === '我是女生' || lowerMessage === '女的'

  if (isMale) {
    return '好的，我知道了！你是男生 👦\n\n接下来我会从男生视角给你建议。\n\n你现在面临的是哪方面的感情问题？\n\n• 🔥 想追一个女生\n• 💬 不知道怎么和她聊\n• 💔 感情出现问题\n• 💍 到了谈婚论嫁的阶段\n\n直接告诉我具体情况吧！'
  }
  if (isFemale) {
    return '好的，我知道了！你是女生 👧\n\n接下来我会从女生视角给你建议。\n\n你现在面临的是哪方面的感情问题？\n\n• 💕 暗恋一个人不知道他是否喜欢我\n• 😔 被男生忽冷忽热搞得很困惑\n• 💬 不知道该怎么和他相处\n• 💔 感情出现了问题\n\n直接告诉我具体情况吧！'
  }

  // ===== 检测问候/打招呼 =====
  var isGreeting = ['你好', 'hi', 'hello', '嗨', '在吗', '在不', '帮我', '我想问'].some(function(k) {
    return lowerMessage.indexOf(k) !== -1
  })
  if (isGreeting && historyLen <= 2) {
    return '你好呀！我是你的 AI 恋爱顾问小爱 💕\n\n无论是搭讪技巧、暧昧推进、约会设计还是感情维系，都可以问我！\n\n先告诉我你是男生还是女生？这样我能给你更有针对性的建议～'
  }

  // 本地知识库 - 恋爱顾问
  var localKB = [
    {
      keywords: ['搭讪', '开口', '初次', '认识', '陌生', '怎么认识'],
      response: '搭讪的核心是"自然"，不是完美台词。\n\n**3秒法则**：心动后3秒内开口，超过就会越想越不敢。\n\n**万能公式**：观察 + 感受 + 问题\n例："你这本书很特别（观察），看起来很有意思（感受），是什么类型的？"\n\n你现在想搭讪陌生人还是认识的人？具体场景我帮你设计。'
    },
    {
      keywords: ['表白', '告白', '说喜欢', '表达感情', '追'],
      response: '表白的关键不是台词，而是**时机和真诚**。\n\n**时机判断**：对方给了3个以上绿色信号再表白\n• 主动找你聊（不被动）\n• 记得你的细节（关注你）\n• 不排斥单独约（愿意接触）\n\n**好的表白 = 具体原因 + 表达意图 + 给对方选择权**\n例："和你相处这段时间，我发现你总是能让我很开心，所以我喜欢上你了。"\n\n**被拒绝后**：微笑说"没关系，感谢你告诉我"，然后优雅退出，不纠缠。'
    },
    {
      keywords: ['暧昧', '暧昧期', '不确定', '到底喜不喜欢', '信号'],
      response: '暧昧期核心任务：**把线上化学反应变成线下真实接触**。\n\n**你应该做的：**\n约见面！微信聊再多不如一次真实约会\n制造专属感：专属称呼、共同的梗\n读信号：主动找你聊 + 记住细节 + 不拒绝约会 = 可以推进\n\n**不要做的：** 无限期线上暧昧等"时机成熟"\n\n暧昧超过3个月还不见面 = 对方只是把你当聊天对象\n\n你们暧昧多久了？见过几次面？'
    },
    {
      keywords: ['分手', '挽回', '失恋', '复合', '前任', '分开'],
      response: '挽回的核心逻辑：让对方"重新看见你的好"，不是"不停求回来"。\n\n**30天冷静期（不联系）：**\n身材/穿搭提升\n充实社交圈（朋友圈偶尔晒出你过得好）\n处理分手原因（真正改变）\n\n**冷静期后：**\n用自然话题重新联系，像朋友一样，慢慢重建吸引力。\n\n**放弃挽回的信号：**\n对方有稳定新恋人 / 明确拒绝联系 / 价值观根本不合\n\n你们分手多久了？什么原因分手的？'
    },
    {
      keywords: ['约会', '见面', '吃饭', '看电影', '出去', '约出来'],
      response: '**第一次约会原则：安全 + 舒适 + 延续**\n\n**地点选择：**\n咖啡馆/奶茶店（可以聊天，压力小）\n公园/商场散步（随时可以结束）\n不建议：电影院（全程无法交流）、高档餐厅（压力太大）\n\n**时间安排：**\n周末下午 2-5 点最佳（不会太晚，安全）\n\n**什么时候结束？**\n第一次约会控制在 2-3 小时，在气氛最好的时候结束，让对方意犹未尽。'
    },
    {
      keywords: ['冷淡', '不理我', '不回消息', '没动静', '冷', '突然'],
      response: '对方突然冷淡，有3种可能：\n\n**1. 真的忙**\n表现：回消息慢，但会解释\n应对：等待，不要疯狂轰炸\n\n**2. 慢慢不喜欢了**\n表现：回复越来越短，不再主动找你\n应对：不要追问"怎么了"，退一步，让对方主动\n\n**3. 在考察别人**\n表现：突然冷淡，但不是完全不回\n应对：不要追问，做好自己，吸引对方回头\n\n最好的策略：保持自己的生活节奏，该干嘛干嘛，不焦虑反而有魅力。'
    },
    {
      keywords: ['吵架', '生气', '冷战', '矛盾', '不开心', '道歉'],
      response: '**吵架后和好的正确姿势：**\n\n第1步：冷静（至少2小时），不要在情绪激动时说任何话\n\n第2步：主动开口\n错误："对不起，我错了"\n正确："今天的事我们都冷静下来了，我想和你聊聊"\n\n第3步：先认可对方的情绪\n"我知道你当时很生气，我理解你的感受"\n\n第4步：说清楚你的立场，提出解决方案\n\n最重要：不要翻旧账！吵架是为了解决问题，不是赢。'
    },
    {
      keywords: ['礼物', '惊喜', '浪漫', '生日', '节日'],
      response: '**礼物的核心不是价格，是用心**\n\n**男生送女生：**\n不建议：口红（色号难选）、化妆品（不懂别瞎买）\n推荐：鲜花+手写信、带她去喜欢的餐厅、亲手做的礼物\n\n**女生送男生：**\n推荐：游戏周边、他喜欢的电子配件、带他去吃顿好的\n\n**通用惊喜公式：**\n观察TA最近提到的东西 → 记下来 → 意外出现\n例：TA说"最近好想去吃XX"，一周后直接带TA去。\n\n最浪漫的礼物是时间和用心，TA需要你的时候，你在，就是最好的礼物。'
    }
  ]

  // 关键词匹配
  for (var i = 0; i < localKB.length; i++) {
    var item = localKB[i]
    for (var j = 0; j < item.keywords.length; j++) {
      if (lowerMessage.indexOf(item.keywords[j]) !== -1) {
        return item.response
      }
    }
  }

  // 多样化的默认回复（根据历史长度轮换）
  var defaultReplies = [
    '能具体说说你的情况吗？\n\n比如：\n• 你们现在是什么关系？（陌生人/朋友/暧昧中/在一起）\n• 认识多久了？\n• 具体发生了什么事？\n\n说得越具体，我给的建议就越有用！',
    '我需要了解一下背景～\n\n• **TA 是什么样的人？**（性格、平时话多不多）\n• **你们平时怎么联系？**（微信/见面/一起上学/上班）\n• **你最想解决的是什么？**\n\n给我更多信息，我帮你想办法！',
    '有点抽象，你展开说说？😄\n\n可以试着告诉我：\n当时发生了什么具体的事情？TA 说了什么/做了什么？你当时是怎么回应的？\n\n越具体越好，这样我才能真正帮到你。',
    '恋爱里的问题往往藏在细节里。\n\n你能描述一个具体的场景吗？\n比如："TA 上次发了一条消息说……然后我……"\n\n从这里入手，我能帮你分析 TA 的心理和最佳应对策略。',
    '每段感情都有自己的节奏，我想帮你找到最适合你的方式。\n\n先告诉我：\n你现在最困扰你的一件事是什么？就一件，说清楚一点。\n\n我们从这里开始聊。',
  ]
  return defaultReplies[historyLen % defaultReplies.length]
}

/**
 * 云函数调用模式（需要开通云开发）
 */
function callCloudFunction({ messages, systemPrompt, maxTokens, onSuccess, onError, _retry }) {
  var retryCount = _retry || 0
  var MAX_RETRY = 1

  // 拼装 system prompt
  var sys = typeof systemPrompt === 'string' && SYSTEM_PROMPTS[systemPrompt]
    ? SYSTEM_PROMPTS[systemPrompt]
    : (typeof systemPrompt === 'string' ? systemPrompt : SYSTEM_PROMPTS.coach)

  var fullMessages = [{ role: 'system', content: sys }].concat(messages)

  wx.cloud.callFunction({
    name: CLOUD_FUNCTION_NAME,
    data: {
      messages: fullMessages,
      max_tokens: maxTokens || API_CONFIG.maxTokens,
      temperature: API_CONFIG.temperature,
    },
    success: function(res) {
      var result = res && res.result
      if (result && result.code === 0 && result.content) {
        onSuccess && onSuccess(result.content)
      } else if (result && result.code === 429) {
        if (retryCount < MAX_RETRY) {
          setTimeout(function() {
            callCloudFunction({ messages: messages, systemPrompt: systemPrompt, maxTokens: maxTokens, onSuccess: onSuccess, onError: onError, _retry: retryCount + 1 })
          }, 2000)
        } else {
          onError && onError('AI 请求频繁，请稍等片刻再试')
        }
      } else if (result && result.code === 408) {
        if (retryCount < MAX_RETRY) {
          console.warn('[AI] 云函数超时，重试...')
          setTimeout(function() {
            callCloudFunction({ messages: messages, systemPrompt: systemPrompt, maxTokens: maxTokens, onSuccess: onSuccess, onError: onError, _retry: retryCount + 1 })
          }, 1500)
        } else {
          onError && onError('网络超时，请检查网络后重试')
        }
      } else {
        var errMsg = (result && result.error) || '云函数返回异常'
        console.error('[AI] 云函数返回错误:', errMsg, result)
        onError && onError(errMsg)
      }
    },
    fail: function(err) {
      var errStr = (err && err.errMsg) ? err.errMsg : JSON.stringify(err)
      console.error('[AI] 云函数调用失败:', errStr)

      // 未初始化云开发
      if (errStr.indexOf('not inited') !== -1 || errStr.indexOf('cloud is not ready') !== -1) {
        onError && onError('云开发未初始化，请确认 app.js 中已调用 wx.cloud.init()')
        return
      }
      // 函数不存在
      if (errStr.indexOf('not found') !== -1 || errStr.indexOf('FunctionName') !== -1) {
        onError && onError('云函数 ai-proxy 未部署，请在开发者工具右键上传并部署')
        return
      }

      if (retryCount < MAX_RETRY) {
        setTimeout(function() {
          callCloudFunction({ messages: messages, systemPrompt: systemPrompt, maxTokens: maxTokens, onSuccess: onSuccess, onError: onError, _retry: retryCount + 1 })
        }, 1500)
      } else {
        onError && onError('云函数调用失败，请检查云开发配置')
      }
    }
  })
}

/**
 * 关系节点综合评估
 * @param {Object} params
 * @param {string} params.type  - 评估类型
 * @param {number} params.score - 得分
 * @param {Array}  params.answers - 用户答题结果
 * @param {Object} params.profile - 情侣档案（可选）
 * @param {Function} onSuccess
 * @param {Function} onError
 */
function evaluateRelationshipNode({ type, score, answers, profile }, onSuccess, onError) {
  var typeMap = {
    communication: '沟通质量',
    attraction: '吸引力',
    trust: '信任度',
    intimacy: '亲密感',
    conflict: '冲突处理',
    future: '未来规划',
  }
  var typeLabel = typeMap[type] || type
  var profileCtx = profile
    ? ('我叫' + (profile.myName || '用户') + '，对方叫' + (profile.taName || 'TA') + '，目前' + (profile.stage || '未知') + '阶段。')
    : ''

  var answersText = answers && answers.length
    ? answers.map(function(a, i) { return (i + 1) + '. ' + (a.question || '') + ' → ' + (a.answer || '') }).join('\n')
    : '（无答题记录）'

  var prompt = '我刚完成了关系「' + typeLabel + '」评估，得分：' + score + '/100。\n'
    + (profileCtx ? profileCtx + '\n' : '')
    + '答题情况：\n' + answersText + '\n\n'
    + '请给出个性化分析，格式如下：\n'
    + '【评估总结】（2句话点评得分代表的关系状态）\n'
    + '【改善步骤】\n'
    + '1. （具体可操作的第1步）\n'
    + '2. （具体可操作的第2步）\n'
    + '3. （具体可操作的第3步）\n'
    + '要简洁、实用，不要废话。'

  ask(prompt, 'coach', onSuccess, onError, 500)
}

/**
 * 解析 evaluateRelationshipNode 返回的文本
 * @param {string} rawText
 * @returns {{ summary: string, steps: string[] }}
 */
function parseRelationshipEvaluation(rawText) {
  if (!rawText) return { summary: '', steps: [] }

  var summaryMatch = rawText.match(/【评估总结】\s*([\s\S]+?)(?=【改善步骤】|$)/)
  var stepsMatch = rawText.match(/【改善步骤】\s*([\s\S]+?)$/)

  var summary = summaryMatch ? summaryMatch[1].trim() : rawText.substring(0, 80)
  var steps = []

  if (stepsMatch) {
    var lines = stepsMatch[1].split('\n').filter(function(l) { return l.trim() })
    for (var i = 0; i < lines.length; i++) {
      var cleaned = lines[i].replace(/^[0-9]+[\.\、\s]+/, '').trim()
      if (cleaned) steps.push(cleaned)
    }
  }

  if (steps.length === 0) {
    steps = ['主动沟通，表达真实感受', '用行动代替口头承诺', '关注对方的情绪变化']
  }

  return { summary: summary, steps: steps.slice(0, 3) }
}

/**
 * 统一错误处理 — 将内部错误码转换为友好提示并弹出
 * 各页面 onError 回调可直接调用此函数
 * @param {string} err - 错误信息（可能是 __domain_blocked__ 等内部码）
 * @param {string} fallbackMsg - 非域名问题时的默认提示
 */
function handleError(err, fallbackMsg) {
  if (err === '__domain_blocked__') {
    wx.showModal({
      title: '需要配置网络权限',
      content: '请在微信开发者工具中勾选「不校验合法域名」，或在小程序管理后台将 api.deepseek.com 添加到请求白名单。',
      showCancel: false,
      confirmText: '知道了',
    })
  } else {
    wx.showToast({
      title: fallbackMsg || 'AI 请求失败，请稍后重试',
      icon: 'none',
      duration: 2500,
    })
  }
}

/**
 * AI 生成约会话题
 * @param {Object} params
 * @param {string} params.category - 分类：初次见面/深入了解/搞笑/价值观/撩拨
 * @param {number} params.count - 生成数量，默认8-12
 * @param {Function} onSuccess
 * @param {Function} onError
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
 * 解析 AI 生成的话题
 * @param {string} rawText
 * @returns {Array<{category: string, questions: string[]}>}
 */
function parseTopics(rawText) {
  const results = []
  // 按【分类名称】分割
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

  // 兜底：如果解析失败，返回整个文本作为一话题
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
 * AI 生成撩人金句
 * @param {Object} params
 * @param {string} params.scene - 场景：早安/晚安/表白/约会/撒娇/挽回/通用
 * @param {string} params.gender - 性别：male/female/both
 * @param {number} params.count - 生成数量，默认8
 * @param {Function} onSuccess
 * @param {Function} onError
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
 * 解析 AI 生成的金句
 * @param {string} rawText
 * @returns {Array<{scene: string, text: string}>}
 */
function parseSweetWords(rawText) {
  const results = []
  // 尝试按场景分割
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

  // 兜底
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
 * 生成灵魂伴侣头像（使用 DeepSeek 图生图服务或其他）
 * @param {Object} params
 * @param {string} params.zodiac - 灵魂伴侣星座
 * @param {string} params.gender - 目标性别 male/female
 * @param {string} params.desc - 人物描述
 * @param {number} params.seed - 随机种子（用于生成一致性）
 * @param {Function} onSuccess - 成功回调 (imageUrl: string) => void
 * @param {Function} onError - 错误回调 (err: string) => void
 * @param {number} params.timeout - 超时时间，默认30000ms
 */
function generateSoulmateImage({ zodiac, gender, desc, seed, onSuccess, onError, timeout }) {
  // 构建图像生成的提示词
  const targetGender = gender === 'male' ? '女生' : '男生'
  const prompt = `一个${zodiac}星座的${targetGender}的肖像，${desc}。风格：浪漫艺术风格，柔和的光线，温暖的色调，梦幻般的效果，半身肖像，正面面部，精致细腻的眼睛。`

  // 检查是否在本地模式（网络被禁用）
  if (USE_LOCAL_MODE) {
    console.log('[ImageGen] 本地模式，使用占位图')
    // 本地模式返回预设的占位图URL
    const placeholderUrls = {
      male: [
        'https://picsum.photos/seed/soulmale1/400/400',
        'https://picsum.photos/seed/soulmale2/400/400',
        'https://picsum.photos/seed/soulmale3/400/400',
      ],
      female: [
        'https://picsum.photos/seed/soulfem1/400/400',
        'https://picsum.photos/seed/soulfem2/400/400',
        'https://picsum.photos/seed/soulfem3/400/400',
      ],
    }
    const urls = placeholderUrls[gender] || placeholderUrls['female']
    const index = (seed || 0) % urls.length
    setTimeout(function() {
      onSuccess && onSuccess(urls[index])
    }, 500)
    return
  }

  // 尝试使用 DeepSeek API（通过腾讯云等代理）
  // 注意：这里使用兼容方案，实际生产环境建议使用专门的图像生成服务
  const imageUrl = `https://picsum.photos/seed/${seed || Date.now()}/400/400`

  // 模拟生图成功（实际项目中替换为真实API调用）
  console.log('[ImageGen] 生成图片，prompt:', prompt.substring(0, 50) + '...')

  // 实际部署时可替换为：
  // 1. 腾讯云AI绘图：https://cloud.tencent.com/document/product/1759/105548
  // 2. 阿里通义万相：https://help.aliyun.com/document_detail/275 不.html
  // 3. 百度文心一格：https://wenxin.baidu.com/

  setTimeout(function() {
    onSuccess && onSuccess(imageUrl)
  }, 800)
}

// DeepSeek 生图 API 配置
const IMAGE_GENERATION_CONFIG = {
  // DeepSeek 生图 API 端点
  baseUrl: 'https://api.deepseek.com/v1/images/generations',
  apiKey: 'sk-dc86cbd1925a4bbcb7d267eb210d0bfc',
  model: 'deepseek-chat', // DeepSeek 使用 chat 模型生成图片描述，然后用图生图服务
}

// 导出配置供外部使用
module.exports = {
  chat,
  ask,
  generateReply,
  parseReplies,
  generateCoupleAdvice,
  parseCoupleAdvice,
  generateSurprise,
  coachChat,
  analyzeTheirMessage,
  generateCourseContent,
  generateCourseList,
  parseCourseList,
  evaluateRelationshipNode,
  parseRelationshipEvaluation,
  handleError,
  isConfigured,
  getMockReply,
  getLocalAIResponse,
  callCloudFunction,
  API_CONFIG,
  SYSTEM_PROMPTS,
  USE_LOCAL_MODE,
  USE_CLOUD_FUNCTION,
  USE_HYBRID_MODE,
  CLOUD_FUNCTION_NAME,
  // 新增：话题和金句生成
  generateTopics,
  parseTopics,
  generateSweetWords,
  parseSweetWords,
  // 新增：生图功能
  generateSoulmateImage,
  IMAGE_GENERATION_CONFIG,
}
