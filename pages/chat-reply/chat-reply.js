// pages/chat-reply/chat-reply.js
// AI 聊天回复生成器 - 真实 AI 驱动版
const ai = require('../../utils/ai')

const SCENES = [
  { id: 'stranger_first', icon: '👋', name: '初次搭话', desc: '和陌生人第一次开始对话，留下好印象' },
  { id: 'ambiguous_invite', icon: '📅', name: '暧昧约会', desc: '处于暧昧期，想约对方出来见面' },
  { id: 'ambiguous_morning', icon: '☀️', name: '日常升温', desc: '暧昧期早晚问候、日常分享的升温技巧' },
  { id: 'dating_sweet', icon: '💕', name: '热恋甜蜜', desc: '恋爱期的日常甜蜜互动，不油腻地表达爱' },
  { id: 'dating_conflict', icon: '🌧️', name: '吵架修复', desc: '吵架或冷战后如何开口修复关系' },
  { id: 'stable_fresh', icon: '✨', name: '制造新鲜', desc: '稳定期关系有点例行公事，如何重燃新鲜感' },
  { id: 'cohabit_issue', icon: '🏡', name: '同居矛盾', desc: '同居期家务/习惯冲突的沟通技巧' },
  { id: 'proposal_hint', icon: '💍', name: '求婚暗示', desc: '想暗示对方可以准备求婚了' },
  { id: 'married_romance', icon: '👪', name: '婚后浪漫', desc: '婚后找回恋人感觉，不只是室友' },
]

const MOODS = [
  { id: 'happy', emoji: '😊', label: '开心' },
  { id: 'sad', emoji: '😢', label: '难过' },
  { id: 'busy', emoji: '😓', label: '很忙' },
  { id: 'bored', emoji: '😑', label: '无聊' },
  { id: 'cold', emoji: '🥶', label: '冷淡' },
  { id: 'warm', emoji: '🥰', label: '心动中' },
]

const GOALS = [
  { id: 'warm_up', label: '💛 拉近距离' },
  { id: 'invite', label: '📅 约出来见面' },
  { id: 'express', label: '💬 表达心意' },
  { id: 'repair', label: '🌧️ 修复关系' },
  { id: 'tease', label: '😏 轻松撩拨' },
  { id: 'care', label: '🤗 关心 TA' },
]

// AI 回复库（全场景）
const REPLY_BANK = {
  stranger_first: {
    male: {
      default: [
        { style: '场景切入法', text: '你刚才在看那本书，我也挺感兴趣的，是什么类型的？', explain: '利用当下场景自然开口，不显刻意，对方有话可接' },
        { style: '借助小问题', text: '不好意思，请问这里有人坐吗？（坐下后）顺便问一下，附近有什么好吃的推荐吗', explain: '用无压力的小问题打开对话，自然顺畅' },
        { style: '直接欣赏式', text: '你今天这件衣服搭配得很特别，是你自己搭的吗', explain: '具体的赞美比泛泛"你好漂亮"更有效且不尴尬' },
      ],
      happy: [{ style: '接话延伸', text: '你今天心情不错嘛，有什么好事可以分享吗？', explain: '顺着对方情绪延伸，自然邀请分享' }],
      cold: [{ style: '低压力破冰', text: '不打扰你，就是随口问一下……（问一个无害的小问题）', explain: '对方表现冷淡时，降低压力感更有效' }],
      invite: [{ style: '顺势要联系方式', text: '跟你聊了一会儿，感觉你很有意思，有没有微信？改天我们多聊聊', explain: '聊得来的时候自然过渡，不要突然问' }],
    },
    female: {
      default: [
        { style: '给他话题钩子', text: '真巧，我也喜欢这个（或：我也了解这方面）', explain: '找共同点，让他自然延伸话题，你不需要太主动' },
        { style: '好奇回应式', text: '哦？那你了解什么？可以推荐给我吗', explain: '表现出好奇心，鼓励他继续说，他会很有成就感' },
        { style: '给出暗示', text: '你有研究过这个？那改天有机会再聊（微笑）', explain: '给出"下次"的明确暗示，不显主动但有信号' },
      ],
    },
  },
  ambiguous_invite: {
    male: {
      default: [
        { style: '具体理由邀约', text: '你上次说喜欢看展，这周末XX美术馆在办一个特展，要不要一起去？', explain: '用她说过的话来邀约，显示你在意她，成功率高' },
        { style: '神秘感邀约', text: '我发现了一个你大概会喜欢的地方，周六下午有空吗？我带你去', explain: '保留悬念，让她好奇，她更可能答应' },
        { style: '以自己为主', text: '我这周末想去试那家一直想去的餐厅，你有没有兴趣一起？', explain: '以自己计划为主邀请她参与，没有求她的感觉，压力较低' },
      ],
      cold: [{ style: '不施压撤退', text: '不着急，等你忙完了再约，我就随口一说', explain: '遇到冷淡，不施压反而给她空间，更容易收到肯定回复' }],
    },
    female: {
      default: [
        { style: '顺势答应', text: '那家店啊，我也有在关注，好啊，那就一起去吧', explain: '表达接受，同时不过分热情，刚刚好' },
        { style: '好奇式答应', text: '什么地方？你卖关子啊……好吧，几点？', explain: '适度好奇，显示你有兴趣但不失主动权' },
        { style: '稍微犹豫式', text: '我看看那天有没有安排……（间隔片刻）好，有空', explain: '稍微"犹豫"一下再答应，保持一点主动权' },
      ],
    },
  },
  ambiguous_morning: {
    male: {
      default: [
        { style: '带内容的联系', text: '（转发一个内容）看到这个，想到你之前说过的事，分享给你', explain: '不是干巴巴问好，带来有价值的内容更有质感' },
        { style: '记住她的话', text: '你上次说最近在忙XX，今天好点了吗', explain: '记住她随口说过的事，效果极好，她会感到被在意' },
        { style: '轻松调侃', text: '还没起床嘛，我都工作一小时了……（配好笑的表情）', explain: '轻松有趣的互动比"早安"更有温度，让人想回复' },
      ],
      bored: [{ style: '制造话题', text: '你无聊的话，我来给你一个有趣的问题，你选一个：（给出2个选择题）', explain: '给她一个有意思的互动切入点，拯救无聊' }],
    },
    female: {
      default: [
        { style: '回应他的用心', text: '哈哈你居然记得这件事（配上一个惊喜的表情）', explain: '让他知道你发现了他的用心，他会很有成就感' },
        { style: '抛出钩子', text: '你说的这个，我今天刚好也……（故意说一半）', explain: '引他来追问，形成互动，不用你太主动' },
        { style: '偶尔先发', text: '（发一个你们共同感兴趣的内容）突然想到你，就发给你了', explain: '偶尔主动，显示你也在想他，对他是很大的鼓励' },
      ],
    },
  },
  dating_sweet: {
    male: {
      default: [
        { style: '生活细节法', text: '刚才路过我们第一次吃饭的那家店，突然想到你了', explain: '用生活细节表达心意，比"想你"更有质感和真实感' },
        { style: '把她说的变成行动', text: '你之前说想吃XX，今晚我来安排，你不用想', explain: '主动把她随口说的话变成行动，这是最有力的在意' },
        { style: '制造小期待', text: '我今天有个想法，不知道你能不能接受……（停顿）就是今晚陪我吃饭', explain: '用铺垫制造小期待，比直接说更有趣' },
      ],
      sad: [
        { style: '陪伴优先', text: '怎么了，说说吧，我在', explain: '不说大道理，不给建议，先给支持和陪伴，这才是热恋期男友的样子' },
        { style: '具体行动', text: '你告诉我在哪，我过来陪你，或者我们视频一会儿', explain: '具体的行动比安慰的话更有力，她会记住这个时刻' },
      ],
      express: [
        { style: '具体的爱', text: '你知道我最喜欢的一件事是什么吗——就是你讲话时会不自觉比手势', explain: '说对方身上的具体细节，比"我爱你"更打动人' },
      ],
    },
    female: {
      default: [
        { style: '记住他的事', text: '你之前说最近在搞那个项目，今天有没有好一点了', explain: '记得他说过的事，让他感受到被关心' },
        { style: '可爱撒娇', text: '我今天有点想你，不多，就一点点……其实很多', explain: '可爱又真实的表达，让他觉得幸福' },
        { style: '制造期待', text: '我今天想到了一件事，晚点告诉你（然后真的晚点再说）', explain: '制造小期待，让他主动找你' },
      ],
    },
  },
  dating_conflict: {
    male: {
      default: [
        { style: '先道歉方式', text: '我刚才说话方式不对，对不起。但那件事我还是有感受，我们能好好聊聊吗', explain: '先道歉方式（不是内容），再表达希望沟通，不是要赢' },
        { style: '冷静后开口', text: '我们都冷静了一下，我想再聊聊刚才那件事，我不想就这样算了', explain: '表示你重视这段关系，不是负气，而是真的想解决' },
        { style: '行动弥补', text: '（送来一件她喜欢的东西，或者出现在她面前）我不太会说，但我想让你知道，我在意你', explain: '行动有时比言语更有力量，但话也要说' },
      ],
      repair: [
        { style: '软化气氛', text: '（发一个你们之间的梗，不提吵架）', explain: '有时不需要直接道歉，一个轻松的信号就能融化冷战' },
      ],
    },
    female: {
      default: [
        { style: '表达感受', text: '我有点难过，不是因为要赢，是感觉我们没聊到点子上。我们能重来吗', explain: '用感受表达，不指责，这样他更容易听进去' },
        { style: '打开沟通', text: '你刚才说的那些，我现在能听进去了，你可以再说一遍吗', explain: '表示你愿意听，这是和解的信号，他会很感动' },
      ],
      cold: [
        { style: '无声软化', text: '（发一个你们之间的梗，不提吵架的事）', explain: '有时候不需要直接道歉，一个轻松的信号就够了' },
      ],
    },
  },
  stable_fresh: {
    male: {
      default: [
        { style: '打破惯例', text: '我们最近好像每次都去一样的地方，这次你闭眼，我来定，保证不一样', explain: '主动打破惯例，她会感受到你在努力' },
        { style: '说出观察', text: '我最近感觉我们聊正事多、聊彼此少了，今晚我们能不谈那些，就随便聊吗', explain: '说出你观察到的，让她感觉被看见，她会珍惜你的这份觉察' },
        { style: '复刻起点', text: '你还记得我们第一次约会去的地方吗，我在想，要不要再去一次', explain: '回到起点往往能唤起最初的感觉，很有仪式感' },
      ],
      tease: [
        { style: '神秘计划', text: '我最近有一个关于你的计划，但不告诉你……等你发现', explain: '制造悬念和期待，让她好奇，打破平淡' },
      ],
    },
    female: {
      default: [
        { style: '主动发起新事', text: '我们好久没做一件没做过的事了，你有没有什么一直想尝试的？我们来定一个', explain: '主动发起新鲜感，而不是等他来' },
        { style: '唤起旧记忆', text: '（发一张旧照片）我今天翻到这个，好想再这样出去玩一次', explain: '唤起共同记忆，比直接抱怨有效，他会主动响应' },
      ],
    },
  },
  cohabit_issue: {
    male: {
      default: [
        { style: '不辩解直接认', text: '你说得对，我之前没注意到这件事对你的影响，我会改', explain: '不辩解，先接受，再行动，比讲道理有效得多' },
        { style: '协商制度', text: '我们来定个规则吧，这样两个人都不用靠记忆，按规则来更轻松', explain: '把个人矛盾转化为制度问题，去除情绪色彩' },
      ],
      repair: [
        { style: '事后补偿', text: '我知道我今天这件事让你不爽了，今晚我做饭，你休息', explain: '用行动弥补，不用说太多' },
      ],
    },
    female: {
      default: [
        { style: '说感受不指责', text: '每次XXX的时候，我会积累一点情绪，不是很大，但我希望说出来，我们解决一下', explain: '用感受表达，不说"你总是"，对方更容易接受' },
        { style: '带方案来谈', text: '我想到了一个解决方法，你觉得怎么样——（给出具体方案）', explain: '带着方案来谈比单纯抱怨更容易达成共识' },
      ],
    },
  },
  proposal_hint: {
    male: {
      default: [
        { style: '未来探讨', text: '我最近在想我们的将来，你有没有想过我们大概什么时候会有下一步？', explain: '自然探讨未来，观察她的意愿，不是求婚，是试水' },
        { style: '借题发挥', text: '你喜欢什么风格的婚礼？我朋友最近在筹划，顺便想听听你的看法', explain: '借别人的事了解她的期望，她不会有压力' },
      ],
      express: [
        { style: '直接表达意向', text: '我最近会想，跟你在一起，我觉得是对的。你有没有想过我们的未来？', explain: '稍微直接一点地表达方向，给她一个回应的机会' },
      ],
    },
    female: {
      default: [
        { style: '路过展示', text: '（路过婚戒店时）这家的款式好好看，你有没有觉得哪款特别好看？', explain: '自然地透露你的期望和喜好，让他会意' },
        { style: '感叹式暗示', text: '我在想，我们一起住一个地方会是什么感觉……（等他回应）', explain: '让他顺着你的思路往下想，比催婚更聪明' },
      ],
    },
  },
  married_romance: {
    male: {
      default: [
        { style: '召唤约会感', text: '今晚不在家了，把孩子托给爸妈，我带你出去，就我们两个，像以前那样', explain: '主动创造只有两个人的时间，这是婚后最需要的' },
        { style: '说出来', text: '我今天翻到我们的婚礼照片，还是觉得你当天很好看。谢谢你嫁给我', explain: '婚后的爱要说出来，不要以为她知道就不说了' },
      ],
      busy: [
        { style: '减轻负担', text: '今天我来做饭，你去休息，不用做任何事', explain: '用行动表达爱，她压力大时，这句话价值千金' },
      ],
      care: [
        { style: '专注陪伴', text: '今晚我把手机关掉，我们好好说说话', explain: '在信息爆炸时代，专注陪伴是最高级的爱' },
      ],
    },
    female: {
      default: [
        { style: '说出需求', text: '我最近有点想只有我们两个人的时间，你能不能找一天，把孩子托给他们，我们出去？', explain: '清晰表达需求，而不是等他猜，男人需要明确指示' },
        { style: '唤起记忆', text: '（某天）你还记得我们第一次约会去哪里吗？我最近总是想起那天', explain: '唤起共同记忆，让他主动响应' },
      ],
    },
  },
}

// AI 优化版本库（对每种风格进行升级）
const UPGRADE_TEMPLATES = {
  // 基于原文升级的模板，实际应用时结合场景生成
  warm_up: ['在原来的基础上加入一个具体的共同记忆或细节，让对方感受到你真的在意 TA。', '把话说得更轻松自然一点，减少"套路感"，就像朋友说话那样。'],
  invite: ['邀约时加入一个"你会喜欢的理由"，让对方感觉你是为 TA 量身设计的。', '加入一点神秘感：不说全部，让对方好奇才会来。'],
  express: ['把"我爱你"换成一件具体的事：你爱 TA 哪里？TA 做了什么让你感动？具体的胜过泛泛的。', '表达后加一个轻松的调侃，不让气氛太沉重。'],
  repair: ['道歉时先说对方的感受，再说自己的：我知道你当时……我当时也……', '不翻旧账，只聚焦这一件事，聊完就放下。'],
  tease: ['加一点"坏坏的"悬念，让 TA 不得不回复你。', '用 TA 喜欢的梗或者共同经历来开头，然后转折。'],
  care: ['不说"没事的"，而是说"我在这里"——这是关心最有力的表达。', '具体问一件事，而不是泛泛问"怎么了"。'],
}

// 各场景阶段注意事项
const STAGE_TIPS_BANK = {
  stranger_first: ['不要一开口就问隐私（有没有男/女朋友）', '用场景化话题开口最自然，不要背台词', '获取联系方式要给出具体理由', '被拒绝时淡定离开才是最有风度的'],
  ambiguous_invite: ['暧昧期最大任务：把线上感情转化为线下约会', '约会要有具体地点和时间，不要问"你有空吗"', '被拒绝一次不等于没机会，观察理由再决定', '第2-3次约会时可以开始测试身体距离'],
  ambiguous_morning: ['不要每天干发"早安"，带内容的互动更有价值', '偶尔主动，但不要每天都是你先发', '记住对方随口说过的事并适时提起，效果极好'],
  dating_sweet: ['热恋期最忌讳"追到了就放松了"', '表达爱意要具体，说对方身上具体的事', '定期制造仪式感：纪念日、小惊喜', '在她/他身边的人面前也要表现良好'],
  dating_conflict: ['吵架时说感受，不要说指责', '就事论事，不要翻旧账', '冷战时先软化气氛，不一定要先道歉', '吵完要真正沟通清楚，不能靠"算了算了"解决'],
  stable_fresh: ['稳定不等于不用努力，感情需要持续投入', '新鲜感来自新体验，定期做没做过的事', '继续保持个人魅力，不要因为安全感而放松', '主动说出"我想我们更好"，比抱怨有效'],
  cohabit_issue: ['同居前一定要聊清楚家务分工和经济问题', '生活矛盾要及时说，不要积累', '给对方独处空间，不要因为住在一起就绑定', '保持恋人状态，不要变成纯粹的室友'],
  proposal_hint: ['确认对方意愿比给惊喜更重要', '求婚场地要有意义，不需要是最贵的', '提前通知双方家长', '求婚词要具体说出为什么爱对方'],
  married_romance: ['婚后要持续表达爱，"她知道"不是不说的理由', '定期有只属于两人的时间', '孩子来了之后更要经营感情', '说谢谢和我爱你，永远不嫌多'],
}

// 实战剧本
const SCRIPTS_BANK = {
  stranger_first: [{
    scene: '咖啡馆初次搭讪（男生主动）',
    lines: [
      { role: 'me', text: '不好意思，这里有人吗？（坐下后）你在看什么书？', tip: '用场景自然开口，不需要特别理由' },
      { role: 'ta', text: '在看小说，《三体》，你听说过吗？' },
      { role: 'me', text: '听说过！但一直没看，你觉得好看吗？从哪里开始读？', tip: '抓住关键词延伸，显示真诚兴趣' },
      { role: 'ta', text: '挺好看的，你喜欢看书吗？' },
      { role: 'me', text: '偶尔看，更喜欢你这种愿意推荐书的人（笑）顺便……你叫什么名字？', tip: '自然过渡到自我介绍，时机恰好' },
    ],
  }],
  ambiguous_invite: [{
    scene: '微信暧昧期约第一次见面',
    lines: [
      { role: 'me', text: '你上次说喜欢下午茶，这周六下午有没有空？我发现一家挺好的地方' },
      { role: 'ta', text: '周六啊……有可能有空，什么地方？' },
      { role: 'me', text: '先不说，去了你就知道了，保证你喜欢。2点可以吗？', tip: '保留悬念，她会好奇' },
      { role: 'ta', text: '好吧，那就2点' },
      { role: 'me', text: '好，发你地址，我先到等你', tip: '主动承担等候，体现用心' },
    ],
  }],
  dating_sweet: [{
    scene: '热恋期不油腻地表达想你',
    lines: [
      { role: 'me', text: '刚才经过一家店，里面放着那首你喜欢的歌，想到你了', tip: '用生活细节，不是直白说"想你"' },
      { role: 'ta', text: '哇你居然记得那首歌，怎么这么细心' },
      { role: 'me', text: '你说的话我基本都记着……有问题吗（笑）', tip: '轻松调侃，又显示在意' },
      { role: 'ta', text: '没问题，我很开心' },
    ],
  }],
  dating_conflict: [{
    scene: '吵架后第二天开口和解',
    lines: [
      { role: 'me', text: '昨天说话有点重，对不起。但我想再聊聊那件事，你有空吗', tip: '先道歉方式，再提沟通意愿' },
      { role: 'ta', text: '……好，说吧' },
      { role: 'me', text: '我当时是因为感觉自己没被听进去，所以情绪上来了。你当时是什么感受？', tip: '说感受，不翻旧账，邀请对方表达' },
      { role: 'ta', text: '我也觉得你没在听我说……' },
      { role: 'me', text: '对，我承认当时没够认真听。这次我在认真听。', tip: '承认，倾听，不辩解' },
    ],
  }],
}

// AI 解读 TA 消息的模板
const ANALYZE_TEMPLATES = [
  { keyword: ['好累', '累死了', '好烦'], result: '🧠 TA 可能正在经历压力，说这句话是在寻求情感支持和共鸣，而不是要你给建议。\n\n✅ 最好的回法：先表达理解，说"怎么了"或"我在"，然后主动提供陪伴。\n\n❌ 避免说：那你休息一下 / 这都是小事 / 你太脆弱了' },
  { keyword: ['随便', '都行', '你定就好'], result: '🧠 说"随便"可能有两种意思：①真的没有偏好；②在期待你主动、体贴地决定。\n\n✅ 最好的回法：给出2个具体选项，让 TA 二选一，不要继续问"那你要什么"。\n\n💡 如果 TA 经常这样说，试着问：你有什么特别不想去的地方吗？' },
  { keyword: ['没事', '无所谓', '没什么'], result: '🧠 说"没事"通常是有事的。TA 可能在等你追问，或者在用沉默表达某种情绪。\n\n✅ 最好的回法：不要接受"没事"，可以说："你说没事，但我感觉你不太对劲，告诉我好吗？"\n\n💡 在感情里，对"没事"追问一次，往往能避免一次冷战。' },
  { keyword: ['你真的不懂我', '你不了解我', '你根本不'], result: '🧠 TA 说这句话，通常是在某件事上感到失落或不被理解，而不是真的说你们不合适。\n\n✅ 最好的回法：不要急着解释，先说"那你告诉我，你希望我怎么做"。\n\n⚠️ 最差的回法：我已经很努力了 / 你才是不懂我' },
]

Page({
  data: {
    scenes: SCENES,
    moods: MOODS,
    goals: GOALS,
    currentScene: 'stranger_first',
    sceneInfo: SCENES[0],
    myGender: 'male',
    coupleStage: '',
    stageInfo: {},
    taText: '',
    taMood: '',
    myGoal: '',
    generating: false,
    replies: [],
    stageTips: [],
    scripts: [],
    savedReplies: [],
    aiConfigured: false,
    analyzeResult: '',
    showAnalyzeModal: false,
    analyzingTA: false,
  },

  onLoad(options) {
    const scene = options.scene || 'stranger_first'
    const sceneInfo = SCENES.find(s => s.id === scene) || SCENES[0]
    // 从情侣档案读取性别和阶段
    const profile = wx.getStorageSync('coupleProfile')
    const myGender = profile ? (profile.myGender || 'male') : 'male'
    const coupleStage = profile ? (profile.stage || '') : ''
    const stageInfo = coupleStage ? { icon: this.getStageIcon(coupleStage), name: this.getStageName(coupleStage) } : {}
    const scripts = SCRIPTS_BANK[scene] || []
    const stageTips = STAGE_TIPS_BANK[scene] || []
    const savedReplies = wx.getStorageSync('savedReplies') || []
    const aiConfigured = ai.isConfigured()
    this.setData({ currentScene: scene, sceneInfo, myGender, coupleStage, stageInfo, scripts, stageTips, savedReplies, aiConfigured })
  },

  getStageIcon(stage) {
    const map = { stranger: '🌱', ambiguous: '✨', dating: '💕', stable: '🌿', cohabit: '🏠', propose: '💍', married: '👪' }
    return map[stage] || '💕'
  },

  getStageName(stage) {
    const map = { stranger: '陌生人', ambiguous: '暧昧期', dating: '热恋期', stable: '稳定期', cohabit: '同居期', propose: '求婚准备', married: '婚后' }
    return map[stage] || '恋爱中'
  },

  switchScene(e) {
    const { id } = e.currentTarget.dataset
    const sceneInfo = SCENES.find(s => s.id === id)
    const scripts = SCRIPTS_BANK[id] || []
    const stageTips = STAGE_TIPS_BANK[id] || []
    this.setData({ currentScene: id, sceneInfo, scripts, stageTips, replies: [], taText: '', taMood: '', myGoal: '' })
  },

  setGender(e) {
    this.setData({ myGender: e.currentTarget.dataset.g, replies: [] })
  },

  onTaInput(e) {
    this.setData({ taText: e.detail.value })
  },

  setMood(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ taMood: id === this.data.taMood ? '' : id })
  },

  setGoal(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ myGoal: id === this.data.myGoal ? '' : id })
  },

  generate() {
    if (this.data.generating) return
    const { taText, aiConfigured, currentScene, myGender, taMood, myGoal } = this.data
    this.setData({ generating: true, replies: [] })

    if (aiConfigured && taText.trim()) {
      // 使用真实 AI 生成
      const profile = wx.getStorageSync('coupleProfile') || null
      ai.generateReply(
        { theirMessage: taText, myGender, scene: currentScene, goal: myGoal || 'warm_up', mood: taMood || 'default', profile },
        (raw) => {
          const parsed = ai.parseReplies(raw)
          if (parsed.length > 0) {
            this.setData({ generating: false, replies: parsed.map(r => ({ ...r, upgraded: '' })) })
          } else {
            // AI 返回了但解析失败，将原文按段落拆分展示
            const lines = raw.split('\n').filter(l => l.trim().length > 5)
            const fallbackReplies = lines.slice(0, 3).map((l, i) => ({
              style: ['温柔体贴', '幽默轻松', '真诚直接'][i] || 'AI生成',
              text: l.replace(/^[\d\.\-\*【】]+\s*/, '').trim(),
              explain: '',
              upgraded: '',
            })).filter(r => r.text.length > 3)
            if (fallbackReplies.length > 0) {
              this.setData({ generating: false, replies: fallbackReplies })
            } else {
              this.setData({ generating: false, replies: [{ style: 'AI 生成', text: raw.trim(), explain: '', upgraded: '' }] })
            }
          }
        },
        (err) => {
          console.error('[chat-reply] AI 生成失败:', err)
          this.setData({ generating: false })
          if (err === '__domain_blocked__') {
            ai.handleError(err)
          } else {
            wx.showToast({ title: 'AI 开小差了，已为你切换本地模板', icon: 'none', duration: 2500 })
            this.generateFromLocal()
          }
        }
      )
    } else {
      // 本地数据库生成（兜底）
      setTimeout(() => { this.generateFromLocal() }, 800)
    }
  },

  generateFromLocal() {
    const { currentScene, myGender, taMood, myGoal, taText } = this.data
    const sceneBank = REPLY_BANK[currentScene]
    let pool = []

    if (sceneBank) {
      const genderBank = sceneBank[myGender] || sceneBank.male || {}
      let moodKey = 'default'
      if (myGoal && genderBank[myGoal]) {
        moodKey = myGoal
      } else if (taMood && genderBank[taMood]) {
        moodKey = taMood
      }
      pool = genderBank[moodKey] || genderBank.default || []
    }

    if (pool.length === 0) {
      pool = [
        { style: '万能情感回应', text: '听起来你现在心情复杂，我在这里，想听你说说。', explain: '先表示你在意，再听对方说，永远不会错' },
        { style: '主动关怀式', text: '最近怎么样？有什么需要我的吗', explain: '简单真诚的关心，往往比华丽话术更打动人' },
      ]
    }

    if (taText && taText.length > 4) {
      const analyzed = this.quickAnalyze(taText)
      if (analyzed) {
        pool = [{ style: '🎯 精准分析', text: analyzed.suggest, explain: analyzed.reason }, ...pool]
      }
    }

    this.setData({ generating: false, replies: pool.slice(0, 4).map(r => ({ ...r, upgraded: '' })) })
  },

  quickAnalyze(text) {
    // 简单关键词分析
    if (text.includes('好累') || text.includes('累了') || text.includes('好烦')) {
      return { suggest: '你怎么了，说说吧，我在这儿', reason: '对方在倾诉压力，先给陪伴感，不要急着给建议' }
    }
    if (text.includes('随便') || text.includes('都行')) {
      return { suggest: '那我来定，你选一个：A……还是 B……', reason: '对方说随便通常是期待你主动决定，给出2个选项更有效' }
    }
    if (text.includes('没事') || text.includes('无所谓')) {
      return { suggest: '你说没事，但我感觉你不对劲，告诉我吧', reason: '说"没事"通常是有事，追问一次往往能避免一次冷战' }
    }
    if (text.includes('想你') || text.includes('想见你')) {
      return { suggest: '我也想你，这周我们约一次？', reason: '对方直接表达思念，最好的回应是具体的行动安排' }
    }
    if (text.includes('在吗') || text.includes('你在干嘛')) {
      return { suggest: '在！刚好在想你，怎么了', reason: '"刚好在想你"增加亲密感，然后追问让对方主动说出想说的话' }
    }
    return null
  },

  upgradeReply(e) {
    const { index } = e.currentTarget.dataset
    const replies = [...this.data.replies]
    const reply = replies[index]
    if (!reply || reply.upgrading) return

    // 始终走真实 AI（移除 isConfigured 判断）
    replies[index] = { ...reply, upgrading: true }
    this.setData({ replies })

    const { currentScene, myGender, myGoal, taText } = this.data
    const prompt = `帮我优化这条恋爱回复，让它更自然、更有吸引力：

原回复："${reply.text}"
场景：${this.data.sceneInfo ? this.data.sceneInfo.name : currentScene}
我的性别：${myGender === 'male' ? '男生' : '女生'}
目标：${myGoal || '拉近感情'}
${taText ? 'TA 说的原话："' + taText + '"' : ''}

请给出优化后的版本（只输出回复正文，不超过60字，不加解释）：`

    ai.ask(prompt, 'reply', (upgraded) => {
      const newReplies = [...this.data.replies]
      newReplies[index] = { ...reply, upgraded: upgraded.trim(), upgrading: false }
      this.setData({ replies: newReplies })
    }, (err) => {
      const newReplies = [...this.data.replies]
      newReplies[index] = { ...reply, upgrading: false }
      this.setData({ replies: newReplies })
      if (err === '__domain_blocked__') {
        ai.handleError(err)
      } else {
        wx.showToast({ title: 'AI 优化失败，请稍后再试', icon: 'none' })
      }
    }, 200)
  },

  saveReply(e) {
    const { index } = e.currentTarget.dataset
    const reply = this.data.replies[index]
    if (!reply) return
    const savedReplies = [...this.data.savedReplies]
    if (savedReplies.find(r => r.text === reply.text)) {
      wx.showToast({ title: '已经收藏过了', icon: 'none' })
      return
    }
    if (savedReplies.length >= 20) {
      wx.showModal({
        title: '收藏已满',
        content: '收藏夹最多保存20条回复，请先清理一些收藏后再试。',
        showCancel: false,
        confirmText: '知道了',
      })
      return
    }
    savedReplies.unshift({ text: reply.text, style: reply.style, scene: this.data.sceneInfo.name })
    wx.setStorageSync('savedReplies', savedReplies.slice(0, 20))
    this.setData({ savedReplies })
    wx.showToast({ title: '已收藏 🔖', icon: 'success' })
  },

  clearSaved() {
    wx.showModal({
      title: '清空收藏',
      content: '确定清空所有收藏的回复吗？',
      success: res => {
        if (res.confirm) {
          wx.removeStorageSync('savedReplies')
          this.setData({ savedReplies: [] })
        }
      },
    })
  },

  copyReply(e) {
    const { text } = e.currentTarget.dataset
    if (!text) return
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制！', icon: 'success' }),
    })
  },

  goAnalyze() {
    const { taText, myGender, currentScene } = this.data
    if (!taText.trim()) {
      wx.showToast({ title: '请先输入 TA 发的消息', icon: 'none' })
      return
    }

    // 先清空上次结果，始终调用真实 AI 解读
    this.setData({ analyzingTA: true, analyzeResult: '' })
    ai.analyzeTheirMessage({ theirMessage: taText, myGender, scene: currentScene }, (result) => {
      this.setData({ analyzingTA: false, analyzeResult: result })
    }, (err) => {
      this.setData({ analyzingTA: false })
      console.error('[chat-reply] AI 解读失败:', err)
      if (err === '__domain_blocked__') {
        ai.handleError(err)
      } else {
        wx.showToast({ title: 'AI 解读失败，请稍后再试', icon: 'none' })
      }
    })
  },

  closeAnalyze() {
    this.setData({ analyzeResult: '' })
  },

  copyAnalyzeResult() {
    const { analyzeResult } = this.data
    if (!analyzeResult) return
    wx.setClipboardData({
      data: analyzeResult,
      success: () => wx.showToast({ title: '已复制解读内容 ✅', icon: 'success' }),
    })
  },
})
