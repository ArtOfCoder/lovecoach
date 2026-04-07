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

// 建议库（按阶段+性别）- 每阶段男女各3-5条
const ADVICE_POOL = {
  stranger: {
    male: [
      { main: '今天的任务只有一个：找到一个自然搭话的机会，不追求结果，只练习开口。', actions: ['在咖啡馆/书店观察她，找一个场景化切入点', '用"观察+感受+问题"公式开口', '不管结果如何，开口本身就是胜利'] },
      { main: '陌生人阶段，吸引力来自你的"有趣"，而不是你的"努力"。让自己有话可说。', actions: ['今天读一篇有意思的文章或看一个短视频', '想好3个可以展开的话题', '记住：不是表演，是真实的你'] },
      { main: '第一印象决定后续走向。今天专注展示你的"状态"，而不是你的"条件"。', actions: ['出门前打扮好，自信是最好的吸引力', '开口时先给她一个真诚的微笑', '结束对话前给个明确的"下次"钩子'] },
      { main: '今天试着用"间接法"接近她——不是直接说喜欢，而是创造一个共同话题。', actions: ['找到一件你们都感兴趣的事，用它开口', '多听她说话，少说自己的事', '结尾时说"你说的这个我也很感兴趣，之后可以聊聊"'] },
      { main: '好奇心是陌生人之间最好的桥梁。今天问她一个你真的想知道答案的问题。', actions: ['准备一个开放式问题，让她可以展开说', '认真听她的回答，然后顺着延伸', '不要急着展示自己，先让她说'] },
    ],
    female: [
      { main: '对陌生人展示你的好奇心，而不是你的热情。让他来靠近你。', actions: ['对他感兴趣的事问一个真诚的问题', '给一个具体的、不泛泛的赞美', '保持适度神秘，不要全盘托出'] },
      { main: '今天不主动靠近，但给出清晰的"可以来"的信号。', actions: ['和他有眼神接触时微微一笑，然后移开视线', '回他消息时提问，给他继续的理由', '偶尔提到自己的兴趣，等他来追问'] },
      { main: '第一印象最重要的不是外貌，是"感觉"。今天展示你真实而有趣的一面。', actions: ['分享一个你最近真心喜欢的事物', '表达一个自己独特的观点，让他觉得你不一样', '结束对话前留一个"悬念"让他记住你'] },
      { main: '让他先主动，但让他感受到你的接受信号。拿捏好进退距离。', actions: ['他说话时给予真诚的回应，不冷漠', '适度透露自己的空闲时间，但不明说', '用"你下次可以……"暗示下一次接触的机会'] },
    ],
  },
  ambiguous: {
    male: [
      { main: '暧昧最大的敌人是"等"。今天就约！一个具体的时间和地点，比100条微信有效。', actions: ['想一个她说过喜欢的事，设计成邀约理由', '发消息时带上具体时间：这周六下午2点', '准备一个神秘感：我发现了一个你应该会喜欢的地方'] },
      { main: '你记住的每一个细节，都是她心里的一分。今天把她随口提过的事变成行动。', actions: ['翻翻聊天记录，她说过什么想做但没做的事？', '发消息提起那件事，自然地引出约会邀请', '记住：不是告白，是让她感受到你在意她'] },
      { main: '暧昧期最容易犯的错是"太透明"。保留一点神秘感，让她来好奇你。', actions: ['今天少主动发消息，但回复要有质量', '分享一件有趣的事，但不说完——等她来问', '偶尔让她先等你一会儿，不要每次秒回'] },
      { main: '今天做一件"记住了她喜欢的东西"的事，让她知道你在意。', actions: ['找她说过喜欢的歌/电影/食物，发给她', '用"突然想到你"开头，然后说为什么', '不要解释太多，就是分享给她'] },
      { main: '暧昧期消息质量比数量重要。今天发一条让她忍不住回复的消息。', actions: ['想一个你们共同感兴趣的话题，用新角度切入', '引发她好奇或反驳的观点往往最有效', '结尾用问句，确保她有话可接'] },
    ],
    female: [
      { main: '暧昧期女生的核心策略：若即若离，让他觉得"还有机会但要加油"。', actions: ['回消息不要秒回，但回的时候要有质量', '发一条"突然想到你"的消息，然后不解释', '适度主动一次，然后等他跟进'] },
      { main: '给他一个信号，但不给他全部。今天稍微主动一次，然后把球踢还给他。', actions: ['主动分享一件今天有趣的事', '回复他消息时多说一句"你呢"，引他说话', '发完消息不要一直守着手机等回复'] },
      { main: '今天关注一下他最近在忙什么，适时问一句——让他感觉被在意。', actions: ['找一个他说过关心的事，今天主动问进展', '不要问太多，一个问题，等他展开', '他说完后给出真诚的回应，不要敷衍'] },
      { main: '暧昧期最容易破功的就是"太好猜"。今天给他一点小小的意外。', actions: ['做一件他不预期的事（比他期待的早一步）', '拒绝或者推迟一次，让他感觉有点不确定', '然后在他不确定的时候给他一点甜'] },
    ],
  },
  dating: {
    male: [
      { main: '热恋期最忌讳"追到了就放松"。今天做一件让她觉得"他还在认真对我"的事。', actions: ['记住她最近在烦恼的一件事，今天主动问', '策划一个这周末的小约会，提前告诉她', '发一条具体的消息，不是"想你"，是"你今天穿了什么颜色"'] },
      { main: '制造仪式感不需要花大钱，你只需要比她"多想一步"。', actions: ['记住你们在一起的纪念日（月纪念日也算）', '今晚准备一个小惊喜：可以是她喜欢的零食、一条未预期的消息', '主动说出来：谢谢你陪着我'] },
      { main: '今天说出一件她身上你真的很喜欢的、具体的事。', actions: ['不是"你很漂亮"，而是"你解释事情的方式让我觉得很有意思"', '说完就放，不用等她反应', '让她感受到，你在认真观察她'] },
      { main: '今天主动承担一件她不用你做、但你做了她会很开心的事。', actions: ['她说过担心的事，今天帮她处理一个', '不要等她开口，主动说"这件事我来"', '做完后不邀功，让她自己发现'] },
      { main: '在热恋期给她一次"惊喜出现"，在她没料到的时候出现在她面前。', actions: ['她在某个地方的时候，带着她喜欢的东西出现', '不要提前说，出现了再解释', '记住：你出现本身就是最好的礼物'] },
    ],
    female: [
      { main: '热恋期女生也需要主动。偶尔的主动表达，会让他觉得被珍惜。', actions: ['今天先发一条消息找他', '记得他最近在忙的事，主动问一下', '说一件他做过的让你感动的小事，告诉他你记得'] },
      { main: '今天让他感受到你在"选择"他，而不是"依赖"他。', actions: ['做一件展示你独立魅力的事，分享给他', '告诉他你欣赏他身上的某一点（具体的）', '让他知道，和他在一起是你的主动选择'] },
      { main: '今天给他一个"只有他能懂"的互动，强化你们的专属感。', actions: ['用一个只有你们俩有的梗开头', '做一件参考了他偏好的决定，让他感受到', '说一句"你才会懂这个"'] },
      { main: '在他压力大的时候，做一件减轻他负担的事。', actions: ['问他今天最累的是什么', '帮他分担一件实际的事，或者陪他发泄', '不给建议，只给陪伴'] },
    ],
  },
  stable: {
    male: [
      { main: '稳定期的关系最需要"打破惯例"。今天主动发起一件你们没做过的事。', actions: ['提议一个新的活动或地点（不要再去老地方）', '关掉手机，给她一段完整的"只有你们"的时间', '说出你最近注意到她身上的一个变化'] },
      { main: '稳定期最容易被忽视的事：把感谢说出来。今天具体地谢谢她一件事。', actions: ['不是"谢谢你"，是"谢谢你上次帮我处理了XXX"', '让她知道你记着，而且很在意', '说完就拥抱她'] },
      { main: '今天给关系注入一点新鲜感——哪怕只是换个新地方吃饭。', actions: ['搜索你们城市里没去过的地方', '今晚不问"去哪"，直接带她去', '拍一张照，说"我们第一次来这里"'] },
      { main: '稳定期男生最需要的不是"新招"，是"继续用力"。今天用力一次。', actions: ['翻她最近发的朋友圈，找一条去评论一下', '给她的日常一个惊喜，不用大，但要真诚', '今晚问她：你最近有什么想做但还没做的事？'] },
    ],
    female: [
      { main: '稳定期的你可能已经"太懂他了"——但他也需要被惊到。', actions: ['做一件他不知道你会做的事，给他惊喜', '主动发起一次约会，不等他', '告诉他一件他让你很满意的事（具体的）'] },
      { main: '今天主动表达你对这段关系的"满意感"——让他知道他做得好。', actions: ['说出他最近做的一件让你觉得幸福的事', '不要只说"我很好"，说"因为你，所以很好"', '让他感受到被你认可的成就感'] },
      { main: '今天做一件让你们共同拥有一个"新记忆"的事。', actions: ['提议一个你们没做过的事，比如一起学做一道菜', '不需要多特别，关键是"第一次一起做"', '拍一张照片记录下来'] },
      { main: '今天观察他最近有什么在意但没说的事，主动问他。', actions: ['找一个安静的时间问他"最近有什么在烦你"', '认真听，不打断，不立刻给建议', '问完说"我在，你说"] },
    ],
  },
  cohabit: {
    male: [
      { main: '同居之后，关系最大的威胁是"室友化"。今天找回一点恋人的感觉。', actions: ['今晚不在家吃外卖，带她出去约会', '做完家务后不是坐下玩手机，而是陪她聊天', '睡前说一句具体的感谢'] },
      { main: '今天主动承担一件她一直在做、你没主动帮过的家务。', actions: ['不要等她提，直接去做', '做完后说：以后这件事我负责', '认真做，不要敷衍'] },
      { main: '同居后最容易忘的事：用眼神和触碰表达爱。今天多用非语言的方式表达。', actions: ['路过她的时候停下来拥抱一下', '睡前不刷手机，聊5分钟今天的事', '在她做事的时候靠近，说一句肯定的话'] },
      { main: '今天给同居生活制造一点仪式感，哪怕是一顿认真准备的饭。', actions: ['今晚提前告诉她"今晚我做饭，等我"', '关掉电视，认真面对面吃这顿饭', '饭后问她：我们最近有什么想一起做的事？'] },
    ],
    female: [
      { main: '同居后也要保持自己的魅力。不要因为"安全"了就完全放松。', actions: ['今天出门的时候花时间打扮一下', '给他一个他没料到的小惊喜', '主动说出最近同居里让你满意的一件事'] },
      { main: '今天给他独处充电的空间，然后在他回来时给他一个温暖的接收。', actions: ['让他有一段自己的时间不被打扰', '他回来时（或结束独处时），给他一个拥抱', '问他：刚才做了什么，感觉怎么样？'] },
      { main: '同居的小摩擦往往来自"没说清楚"。今天把一件心里有的小不满说出来。', actions: ['选一个平静的时机，用"我感受到"而不是"你总是"开头', '说完一件，就放下，不要积累多件一起说', '结尾加一句"我只是想让你知道，不是要争对错"'] },
      { main: '今天给同居增加一个"只有你们"的小仪式——哪怕是每晚10分钟聊天。', actions: ['今晚睡前提议：我们聊10分钟，不看手机', '聊今天各自发生的事，哪怕是小事', '形成习惯，每天都做'] },
    ],
  },
  propose: {
    male: [
      { main: '求婚前最重要的不是准备钻戒，而是确认她也准备好了。今天可以开始"试探"。', actions: ['和她聊聊未来的计划（不要说求婚，说"长远打算"）', '留意她对结婚话题的反应', '告诉她你在想你们的未来，看她怎么回应'] },
      { main: '一场好的求婚，胜在"有意义"而不是"有钱"。今天开始回忆你们的故事。', actions: ['列出你们在一起的5个重要时刻', '想想哪个地点对你们最有意义', '求婚词里一定要说出"为什么是她"'] },
      { main: '今天提前和她的好友/家人建立好关系，求婚前悄悄获取她的偏好。', actions: ['找她最信任的朋友，了解她对戒指/仪式的偏好', '不要透露求婚计划，就说"想给她一个特别的惊喜"', '收集信息后再做最终决策'] },
    ],
    female: [
      { main: '如果你觉得时候到了，可以让他感受到你的期待——不是催婚，是表达向往。', actions: ['自然地聊起婚礼风格或者未来住在哪', '路过婚戒店，说一句"这家的款式好好看"', '聊到朋友结婚时，表达你的看法'] },
      { main: '今天给他一个"未来感"的信号——让他感受到你在认真考虑你们的将来。', actions: ['聊到一个具体的未来场景（住哪/有孩子后）', '用"我们"说话，而不是"我"', '在他说到未来时，认真参与讨论，不敷衍'] },
      { main: '确认他的时间线前，先让他感受到你的稳定和安全感。', actions: ['今天表达一件他做得让你很有安全感的事', '不催，不焦虑——让他觉得你是他最好的选择', '用行动展示你对这段关系的认真'] },
    ],
  },
  married: {
    male: [
      { main: '婚后的爱不会自动维持，需要你持续选择她。今天做一件"只为她"的事。', actions: ['今晚不看手机，专心陪她', '说一句你很久没说的话：谢谢你嫁给我', '策划一个只有你们的晚上，不谈孩子家事'] },
      { main: '婚后男人最容易犯的错是"以为她知道"。今天把爱说出来。', actions: ['说一件她做的让你很感动的具体小事', '不要等特殊场合，就是今天普通的一天说', '说完了就说，不用等她回应'] },
      { main: '今天给她找回一点"被追求"的感觉，哪怕只是一个小举动。', actions: ['送她一件她随口提过想要的东西', '或者订一家她说过想去的餐厅', '说：我一直记着你说的这件事'] },
      { main: '婚后最好的礼物是时间。今天安排一次只有你们两个人的"约会"。', actions: ['把孩子/家务安排好，告诉她今晚是你们的时间', '去一个你们恋爱时常去或特别的地方', '像谈恋爱时一样认真对待这次约会'] },
    ],
    female: [
      { main: '婚后也要给自己留时间，也要给他看到你的需求。', actions: ['告诉他你最近想要的一段两人时光', '做一件让他眼前一亮的事（哪怕是小的）', '说出来：我今天很需要你的陪伴'] },
      { main: '今天感谢他一件最近做的让你很轻松的事，让他感受到被认可。', actions: ['找一件他做的家务/付出，具体地说谢谢', '不是"辛苦了"，是"因为你做了这件事，我今天轻松很多"', '说完了就陪他待一会儿'] },
      { main: '今天给婚姻注入一点"当年的感觉"。', actions: ['翻出你们恋爱时的照片，发给他', '说一件他在恋爱时做的、你现在还记得的事', '问他：你最喜欢我们在一起的哪个时刻？'] },
      { main: '婚后女生最需要的是"被看见"。今天表达你的一个真实感受或需求。', actions: ['选一个安静的时间，说一件最近积压的感受', '用"我感觉"而不是"你没有"开头', '说完后问他：你觉得我们可以怎么改善一下？'] },
    ],
  },
}

// 陌生人案例库（本地模板，可随机切换）
const STRANGER_CASE_TEMPLATES = [
  {
    type: '第一次约会',
    title: '约会时冷场怎么办？',
    situation: '你和TA第一次正式约会，在餐厅吃饭，突然没话题了，气氛尴尬。',
    bad: '继续沉默，或者不停看手机，让对方觉得你对他/她不感兴趣。',
    good: '可以主动分享一个小趣事，或者询问对方的兴趣爱好，表达真诚的好奇心。',
    points: ['保持微笑，放松心情，不要因为冷场而紧张', '提前准备2-3个可以展开的话题（旅行、美食、兴趣爱好）', '真诚地倾听对方，给予回应，让对方感受到你的关注'],
  },
  {
    type: '初次搭话',
    title: '如何自然开口搭讪不尴尬？',
    situation: '在咖啡馆/书店看到心仪的人，想开口但不知道说什么，怕太刻意。',
    bad: '用"你好，我觉得你很漂亮，可以加个微信吗"这种直白方式，让对方没有缓冲余地。',
    good: '找一个场景化的切入点：比如"你在看《三体》？我也在读这本，你看到哪里了？"，让对话从共同话题开始。',
    points: ['用"场景+观察+问题"公式，让开口有理由', '保持放松，让对方感受到你是真心好奇而不是搭讪', '第一次不需要留联系方式，聊得来自然会有机会'],
  },
  {
    type: '获取联系方式',
    title: '想要联系方式但怕太唐突',
    situation: '和对方聊了一会儿，感觉不错，但不知道怎么自然地要联系方式。',
    bad: '直接说"你微信多少"或"能加个好友吗"，显得太功利，让对方有压力。',
    good: '找一个具体的理由：比如"你说你也喜欢这个类型的展览，我最近在关注几个，可以加个联系方式，我发你"，给出加联系方式的价值。',
    points: ['给出一个自然的"理由"，不是为了加而加', '把请求变成"对对方有利的事"，降低被拒绝率', '如果对方犹豫，说"不方便也没事，就是随口一说"，放松气氛'],
  },
  {
    type: '暧昧期约会',
    title: '如何邀约不显得太主动？',
    situation: '处于暧昧期，想邀请对方周末出去，但怕显得太急或被拒绝很尴尬。',
    bad: '问"你周末有空吗？"然后等对方回答，结果对方说"还不确定"，陷入僵局。',
    good: '给出具体的理由和时间："你上次说喜欢这类展览，我查了一下这周六还有票，要不要一起？"，给邀约一个具体的出发点。',
    points: ['用对方说过的话来邀约，显示你有在听', '给出具体时间和活动，减少对方"不知道怎么接话"的尴尬', '被拒绝一次不等于没机会，观察理由再决定下一步'],
  },
  {
    type: '吵架后和好',
    title: '吵完架怎么开口和解？',
    situation: '和对方因为一件小事吵了架，冷战了一天，不知道怎么先开口。',
    bad: '继续冷战等对方来道歉，或者突然发一条"没事了"但什么都不解释，让对方云里雾里。',
    good: '主动发一条：先道歉说话的方式，再表达希望好好沟通："我刚才说话的方式不对，对不起。但那件事我还是有感受，我们能好好聊聊吗？"',
    points: ['先道歉"方式"而不是全盘认错，保留真实感受', '表达你重视这段关系，想解决问题而不是要赢', '冷战时间不要太长，48小时内最好有人开口'],
  },
  {
    type: '稳定期新鲜感',
    title: '在一起久了感情变平淡怎么办？',
    situation: '交往快一年，感觉每次见面都是吃饭、刷手机，缺乏新鲜感，偶尔会觉得腻。',
    bad: '开始抱怨"你最近越来越无聊了"或者靠自己一直主动刺激，结果越来越累。',
    good: '主动提议做一件你们从没做过的事，不需要多特别，关键是"第一次一起做"：一起学做一道菜、去一家新开的展览、报一个周末短程自驾。',
    points: ['新鲜感不是靠买买买，而是创造"第一次"体验', '提议时不要商量太多，说"我来安排，你跟着我走"更有吸引力', '事后拍一张照，说"这是我们第一次来这里"，建立新记忆'],
  },
  {
    type: '同居矛盾',
    title: '同居后因为家务吵架了怎么处理？',
    situation: '刚开始同居，因为家务分工不均产生矛盾，双方都觉得对方不够体贴。',
    bad: '双方都在等对方先主动做，或者用讽刺方式提醒，结果演变成大吵架。',
    good: '找一个平静的时间，提议制定一个家务分工表：把常见家务列出来，双方各选自己愿意负责的，写下来。这样矛盾变成了制度问题，而不是"谁不爱谁"的问题。',
    points: ['把矛盾"制度化"，减少情绪化的反复提醒', '每人选自己不反感的家务，而不是均分所有家务', '定期（比如每个月）重新review，有问题就说出来调整'],
  },
]

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

    // 本地案例库（随机切换，不重复当前案例）
    const getRandomCase = () => {
      const pool = STRANGER_CASE_TEMPLATES
      let idx = Math.floor(Math.random() * pool.length)
      // 避免和当前相同
      if (this.data.currentCase) {
        let tries = 0
        while (tries < 5 && pool[idx].title === this.data.currentCase.title) {
          idx = Math.floor(Math.random() * pool.length)
          tries++
        }
      }
      return pool[idx]
    }

    if (!ai.isConfigured()) {
      const template = getRandomCase()
      setTimeout(() => { this.setData({ caseLoading: false, currentCase: template }) }, 500)
      return
    }

    // 使用网络生成
    ai.ask(prompt, 'advice', (content) => {
      const parsed = this.parseCase(content)
      this.setData({ caseLoading: false, currentCase: parsed })
    }, (err) => {
      console.error('[couple] 案例生成失败:', err)
      // 降级到本地模板
      const template = getRandomCase()
      this.setData({ caseLoading: false, currentCase: template })
    }, 800)
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
      // 本地兜底惊喜方案库（按阶段分类，丰富内容）
      const SURPRISE_POOL_BY_STAGE = {
        stranger: [
          `找到一个 ${profile.taName} 说过喜欢的地方或活动，以"顺路"的方式提起，给 TA 一个惊喜邀约`,
          `记住 TA 随口提过的一本书、一部电影或一首歌，今天发给 TA 说"突然想到你"`,
          `找一个只有你们才懂的小话题，发给 TA 开启对话——让 TA 感受到你在认真听 TA 说话`,
          `在 TA 提到某个兴趣的时候，认真找资料研究一下，下次聊天时展示你的了解`,
        ],
        ambiguous: [
          `带 ${profile.taName} 去 TA 随口提过但没去过的地方，出发前不说目的地，让 TA 在途中才知道`,
          `记录你们聊天里 TA 说过"有机会想做"的一件事，这次主动把它安排成真实约会`,
          `给 ${profile.taName} 准备 TA 说过喜欢的东西，在约会里自然出现——不是礼物，是"记住了"`,
          `策划一个"只有你知道 TA 会喜欢"的约会地点，说：我带你去一个你应该会喜欢的地方`,
          `找到你们聊天中提到过的共同话题，转化成一次真实的线下体验`,
        ],
        dating: [
          `用你们在一起最喜欢的歌/电影场景，复刻一个真实的约会场景给 ${profile.taName}`,
          `提前记住 ${profile.taName} 说过想去的地方，出发前不告诉 TA 目的地，出发时直接说"走吧"`,
          `在一个平凡的普通日子，带 ${profile.taName} 去 TA 喜欢的地方，说：不需要特别理由，就是想陪你`,
          `给 ${profile.taName} 写一封短信或便利贴，说三件 TA 做的让你很感动的具体的事`,
          `帮 ${profile.taName} 记住 TA 朋友/家人的重要日期，在那天提醒 TA 或帮 TA 准备礼物`,
          `策划一次"复刻第一次约会"：去相同的地点，做相同的事，拍同款照片`,
        ],
        stable: [
          `用 ${profile.taName} 没想到你记得的细节，给 TA 一个小惊喜——越具体越打动人`,
          `记录你们在一起的珍贵瞬间，做成截图或照片合集，今天发给 ${profile.taName}`,
          `主动提议做一件你们还没做过的事，说：我来安排，你只需要跟着我`,
          `在 ${profile.taName} 最忙最累的时候，出现在 TA 面前，带 TA 最喜欢的东西`,
          `策划一次只有你们两个人的周末：不看手机，不谈工作，只是两个人在一起`,
          `找出你们恋爱以来的一张有意义的照片，打印出来，附上一句话送给 TA`,
        ],
        cohabiting: [
          `在 ${profile.taName} 下班前，把家里收拾好，准备好 TA 喜欢吃的东西，让 TA 一进门就感受到`,
          `在 ${profile.taName} 不知道的情况下，把 TA 一直想做但还没做的事帮 TA 安排好`,
          `今晚不看手机、不追剧，专门留一段时间和 ${profile.taName} 好好聊聊最近的感受`,
          `为你们的同居生活设计一个新的小仪式——比如每周五晚上一起做一顿好吃的`,
          `在 ${profile.taName} 最累的时候，主动接手 TA 的那份家务，说：今天我来，你休息`,
        ],
        engaged: [
          `找到你们在一起最有意义的那个地方，策划一次重温之旅，不说目的，只说"跟我走"`,
          `把你们恋爱以来最重要的时刻做成一个有仪式感的回忆册，在特别的场合送给 ${profile.taName}`,
          `提前了解 ${profile.taName} 对婚戒/婚礼的具体偏好，悄悄记下来，给 TA 一个"你真的懂我"的惊喜`,
          `为求婚地点选一个对你们有独特意义的地方，而不是最贵最热门的`,
        ],
        married: [
          `安排一次"像谈恋爱时一样的约会"：把孩子家事都安排好，带 ${profile.taName} 重游你们的一个特别地方`,
          `找出一张你们早期的照片，写一段话说这些年 TA 在你心里的变化，悄悄放在 TA 会看到的地方`,
          `在一个普通的周末早晨，做好 ${profile.taName} 喜欢的早餐，什么都不说，就是陪 TA 慢慢吃`,
          `记住 ${profile.taName} 最近提到过想要的东西，在 TA 没预期的时候出现`,
          `提议一次只有你们两人的"小逃跑"：不带孩子，不谈家事，就是两个人出去玩一次`,
        ],
      }

      const personality = PERSONALITY_ACTIVITIES.find(p => p.type === profile.taPersonality)
      const guide = STAGE_GUIDE[profile.stage]
      const genderGuide = profile.myGender === 'male' ? (guide && guide.male) : (guide && guide.female)
      const surprises = []

      // 先加当前阶段的专属惊喜
      const stagePool = SURPRISE_POOL_BY_STAGE[profile.stage] || SURPRISE_POOL_BY_STAGE.dating
      surprises.push(...stagePool)

      // 再加性格相关的活动惊喜
      if (genderGuide && genderGuide.surpriseIdeas) surprises.push(...genderGuide.surpriseIdeas)
      if (personality) {
        const acts = personality.activities[profile.stage] || personality.activities.dating || []
        acts.forEach(a => surprises.push(`带 ${profile.taName} 去${a}，${personality.label}型的人很享受这类体验，会给 TA 留下深刻的记忆`))
      }

      // 避免重复
      let available = surprises.filter(s => s !== this.data.currentSurprise)
      if (available.length === 0) available = surprises

      const idx = Math.floor(Math.random() * available.length)
      setTimeout(() => { this.setData({ currentSurprise: available[idx], surpriseLoading: false }) }, 300)
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
        this.setData({ currentSurprise: `给 ${profile.taName} 策划一个 TA 完全没预料到的小惊喜——从 TA 最近的只言片语里找灵感，越具体越打动人` })
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
