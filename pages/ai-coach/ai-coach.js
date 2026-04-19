// pages/ai-coach/ai-coach.js - 恋爱顾问（本地知识库版）
const ai = require('../../utils/ai')
const storage = require('../../utils/storage')

// ============================================================
// 本地知识库 - 精准场景问答库（大幅扩充版）
// ============================================================
const ADVICE_KB = [
  // ===== 搭讪/初次认识 =====
  {
    keywords: ['搭讪', '怎么认识', '开口说话', '如何开口', '陌生人怎么', '不认识', '第一句话', '怎么追', '如何追', '怎么接近'],
    response: '搭讪的核心是"自然"，不是完美台词。\n\n✅ 万能公式：观察 + 感受 + 问题\n例："你这本书看起来很有意思（观察），我最近也在找书看（感受），这是什么类型的？（问题）"\n\n✅ 3秒法则：心动后3秒内开口，想越久越不敢。\n\n✅ 搭讪地点选择：\n• 书店/展览：话题自带（书、艺术）\n• 健身房：运动兴趣共同话题\n• 咖啡馆：最放松，最自然\n\n❌ 避免：背台词、上来就说"你好漂亮"（太直接且油腻）\n\n你现在想在哪个场景认识TA？我帮你设计具体台词。'
  },
  {
    keywords: ['被拒绝了', '拒绝了我', '搭讪失败', '没有回应', '冷漠对待'],
    response: '被拒绝是正常的，这不代表你不好。\n\n💡 被拒绝后正确做法：\n\n1. 微笑说"没事，随缘哈" → 礼貌离开\n2. 不要追问原因，不要道歉道个没完\n3. 保持尊严离开 = 留下好印象\n\n被拒绝的两种情况：\n• 时机不对（对方有事/状态不好）→ 下次再试\n• 对方确实没兴趣 → 接受并继续前行\n\n每次被拒绝都是在锻炼你的判断力。高质量的人不怕被拒，因为他们知道合适的人自然会留下。'
  },
  // ===== 判断喜不喜欢 =====
  {
    keywords: ['喜不喜欢我', '对我有没有意思', '单方面', '怎么判断', '是不是喜欢', '有没有好感', '怎么看出来', '绿灯信号'],
    response: '判断对方是否喜欢你，看这3类信号：\n\n💚 强信号（大概率有意思）：\n• 主动找你聊天，不等你先开口\n• 记住你说过的细节，下次提起\n• 约会时主动延长时间\n• 朋友圈发内容@你或专门让你看\n• 身体语言：靠近你、眼神停留久\n\n🟡 弱信号（有好感但不确定）：\n• 回消息快，但不主动发起话题\n• 答应邀约，但说"只是朋友"\n• 偶尔调侃你，偶尔又很正式\n\n❌ 可能只是客气：\n• 每次回复都是"嗯/哦/哈哈"\n• 你约时总有事，从不主动约你\n\n你可以把TA具体的行为描述给我，我帮你分析。'
  },
  // ===== 暧昧期 =====
  {
    keywords: ['暧昧', '暧昧期', '不确定关系', '不知道算不算', '没有挑明', '说不清的关系'],
    response: '暧昧期的核心任务：把线上关系变成线下真实接触。\n\n📍 暧昧期三大误区：\n❌ 无限期聊微信等"时机成熟"\n❌ 一直发表情包"撩了又怕"\n❌ 让对方猜你的心思\n\n✅ 正确推进步骤：\n1. 创造见面机会（"我发现一家店你肯定喜欢，有空一起去？"）\n2. 建立专属感（专属称呼、你们的梗、独特记忆）\n3. 给出信号测试（轻轻触碰手臂、眼神停留久一点）\n4. 明确表态（暧昧超3个月不推进 = 被列为"聊天朋友"）\n\n暧昧最长期限：2-3个月。再长，磁场会消散。\n\n你们暧昧多久了？我帮你制定下一步计划。'
  },
  {
    keywords: ['让他主动', '等他追', '让对方追', '让她先开口', '怎么让对方喜欢', '吸引他来追'],
    response: '想让对方主动追你，核心是提升"吸引力"，不是玩消失或故意冷淡。\n\n💡 让对方主动的5个方法：\n\n1. 【有自己的生活】\n不要随时待机等TA，朋友圈晒出你充实的状态，让TA觉得"你很忙、很有趣"\n\n2. 【选择性回复】\n不每条消息秒回，偶尔晚点回，让TA有期待感\n\n3. 【话留三分，不全说完】\n聊天时主动结束："好了我要去忙了，改天聊"，让对方意犹未尽\n\n4. 【给机会表现】\n需要帮忙时找TA，让TA有"被需要"的成就感\n\n5. 【表达好感但不过度依赖】\n一点点好感暗示，但不要24小时粘着\n\n记住：你越有自己的生活，对方就越想靠近你。'
  },
  // ===== 约会 =====
  {
    keywords: ['第一次约会', '初次约会', '第一次见面', '见面去哪', '约会地点', '约会去哪'],
    response: '第一次约会，地点和节奏比礼物更重要。\n\n✅ 最佳第一次约会地点：\n• 咖啡馆：轻松、可以聊天，不尴尬\n• 文艺书店/展览：话题自带，显品位\n• 公园散步：无压力，随时可以结束\n• 有特色的街区：边走边聊，氛围好\n\n❌ 不建议：\n• 电影院（全程无法交流）\n• 高档餐厅（第一次见面压力太大）\n\n⏱ 时间控制：\n• 第一次：2-3小时最佳\n• 在气氛最好的时候结束，让对方意犹未尽\n• 结束时埋伏笔："下次带你去更好玩的地方"\n\n约会中尴尬了怎么办？主动说"好奇怪我今天有点紧张"——坦诚反而消除尴尬。'
  },
  {
    keywords: ['约会冷场', '不知道聊什么', '约会聊天', '约会话题', '约会尴尬', '无话可说', '冷场了'],
    response: '约会冷场很常见，这几招立刻破冰：\n\n🚀 万能破冰话题：\n• "你最近有没有做过让自己后悔的决定？"（引发深度聊天）\n• "如果有一周假期什么都不用做，你最想干嘛？"（了解对方理想）\n• "你有什么特别怪的习惯吗？"（好玩，容易引发笑声）\n• 聊身边的事："这家店的装修挺特别的，你觉得呢..."\n\n💡 冷场其实是机会：\n不要怕安静，微笑着说"哈，突然不知道聊什么了，我今天有点紧张"，坦诚反而让气氛轻松。\n\n❌ 不要做的：\n• 低头玩手机\n• 没完没了夸对方漂亮/帅\n\n记住：有趣 > 有料。你的有趣比你的学识更吸引人。'
  },
  {
    keywords: ['约出来', '怎么邀约', '如何约', '约她出来', '约他出来', '怎么约', '如何邀请'],
    response: '邀约成功率高的方式：\n\n✅ 高成功率话术：\n• "周末我发现一家好玩的展览，你有兴趣一起去看看吗？"\n• "最近有家奶茶店排队好长，你帮我一起去尝尝？"\n• "这周六下午我们去[地点]转转？"\n\n💡 邀约3个原则：\n1. 给理由（"发现了XX"比"我们出去玩"容易说yes）\n2. 给时间（"周六下午"比"有空时"成功率高3倍）\n3. 给备选（"周六不行周日可以吗？"，显示诚意）\n\n❌ 避免的邀约方式：\n• "有空吗？"（太模糊，容易被忽略）\n• "我们出去玩？"（没有理由，压力大）\n\n被婉拒了怎么办？"没关系，下次有机会"，保持轻松，下周再约。'
  },
  // ===== 表白 =====
  {
    keywords: ['要不要表白', '该不该表白', '想表白', '表白时机', '先表白吗', '能表白吗'],
    response: '表白前先确认这3个信号都出现了吗？\n\n💚 可以表白的信号：\n1. TA主动找你聊天（而不是你追着聊）\n2. TA记得你说过的细节\n3. 你们单独约过2次以上，TA都答应了\n\n如果3个都有了，可以表白了。\n\n✅ 好的表白方式：\n• 地点：轻松的地方（不要人多的场合）\n• 语气：真诚轻松，不要跪地表白（给对方压力）\n• 内容：说具体原因，"我喜欢你喜欢你[具体的事情]"\n• 例句："和你在一起总是很开心，我发现我喜欢上你了，你怎么看？"\n\n❌ 错误表白方式：\n• 发微信/短信表白（正式关系要面对面）\n• 大庭广众下表白（给对方压力）\n\n无论结果如何：保持自尊，不纠缠。'
  },
  {
    keywords: ['被拒了', '表白失败', '被拒绝表白', '说不喜欢我', '只是朋友', '拒绝了我'],
    response: '被拒绝表白了，照这样做：\n\n第1周：\n• 减少联系，给彼此空间\n• 不要问"为什么不喜欢我"\n• 不要马上说"我们还能做朋友吗"\n\n第2-4周：\n• 充实自己（运动/学习/社交）\n• 朋友圈偶尔发出你生活的精彩\n• 慢慢减少对这段感情的执念\n\n1个月后：\n• 如果对方主动联系，正常回应\n• 如果完全释怀了，可以恢复正常互动\n• 如果还喜欢，观察对方态度变化，再决定要不要再次争取\n\n💡 被拒绝的本质是：缘分时机未到，或方向不对。不是你不好，是不适合。\n\n接下来你想怎么做？'
  },
  // ===== 分手/挽回 =====
  {
    keywords: ['分手了', '失恋', '分了', '分开了', '刚分手'],
    response: '刚分手，这段时间最重要的是：先照顾好自己。\n\n刚分手1周内，避免做：\n❌ 反复发消息求复合\n❌ 深夜刷对方朋友圈\n❌ 找对方谈"最后一次"\n\n刚分手应该做：\n✅ 屏蔽对方朋友圈（减少刺激）\n✅ 和最亲近的朋友倾诉（释放情绪，不要憋着）\n✅ 保持运动和规律作息（身体影响心情）\n✅ 不做任何决定（不要赌气干什么）\n\n你现在是想挽回，还是想走出来？告诉我，我帮你分析下一步。'
  },
  {
    keywords: ['挽回', '复合', '想复合', '前任', '怎么挽回', '挽回他', '挽回她'],
    response: '想挽回前任，先想清楚：\n\n🔍 先做这个判断：\n• 分手原因是什么？（沟通问题/性格不合/外部因素）\n• 分手原因可以改变吗？\n• 你挽回是真的爱，还是不甘心？\n\n如果想挽回，正确步骤：\n\n第1阶段（1个月）：冷静期，不联系\n• 专注提升自己（外形/事业/状态）\n• 真正改变分手原因（不是表面改变）\n\n第2阶段：重建联系\n• 用自然话题重新联系（不是"我想你"）\n• 例："看到这个想到你当时说的话，发来给你看"\n\n第3阶段：见面，表达意图\n• "我这段时间想了很多，我觉得我们之间还有可能，你愿意给我一个机会吗？"\n\n放弃挽回的信号：\n• 对方已有稳定新伴侣\n• 多次明确拒绝\n• 分手原因根本无法改变\n\n你们是什么原因分手的？'
  },
  // ===== 冷淡/不回消息 =====
  {
    keywords: ['不回消息', '已读不回', '消息不回', '很久没回', '突然不回了'],
    response: '对方不回消息，不要连环发！\n\n先判断原因：\n\n情况1：真的很忙\n• 表现：不回消息，但偶尔发状态\n• 对策：发一条"看到回我"，然后等着，最多1次\n\n情况2：在考验/试探你\n• 表现：突然不回，过两天又主动找你\n• 对策：保持生活节奏，不要表现得很在意\n\n情况3：慢慢疏远\n• 表现：回复越来越短，越来越晚，不再主动\n• 对策：减少主动，观察1-2周\n\n❌ 绝对不要：\n• 连续发3条以上消息\n• 发"你是不是不想理我了"\n• 用朋友去打听\n\n不焦虑的人更有吸引力。'
  },
  {
    keywords: ['忽冷忽热', '时好时坏', '热一阵冷一阵', '捉摸不透', '态度不稳定', '冷热不定'],
    response: '对方忽冷忽热，有3种原因：\n\n原因1：喜欢你，但不确定要不要发展\n• 应对：不追着问"你到底怎么想"，给TA时间，但你也要有自己的节奏\n\n原因2：把你当备选\n• 应对：你值得更好的对待，直接问清楚关系\n\n原因3：情绪化，不稳定型依恋\n• 应对：不要把TA的冷热都往自己身上揽\n\n💡 应对忽冷忽热的核心策略：\n"你热的时候我回应，你冷的时候我有自己的生活"\n\n不追、不逃，保持平静。这是最有效的应对方式。\n\n你能描述一下具体的冷热表现吗？我帮你分析。'
  },
  {
    keywords: ['变冷淡了', '突然冷了', '不主动了', '越来越少联系', '他变了', '她变了'],
    response: '对方突然变冷淡了，先冷静分析：\n\n🔍 排查可能的原因：\n1. 真的很忙（工作/考试/家事）→ 短暂，会恢复\n2. 你做了什么让TA不舒服的事 → 回想最近是否有矛盾\n3. 对你的兴趣下降 → 需要重新激发\n4. 外部因素（情绪不好，和你没关系）\n\n✅ 正确做法：\n• 发一条："最近有点忙吧？等你有空我们聊聊"\n• 然后不再主动，给TA空间\n• 2-3天没回音：暂时搁置，不要继续追\n\n⚠️ 千万别做：\n• "你是不是不想理我了？"\n• 一天内发多条消息\n\n你有自己的生活和圈子，不依赖某一个人才是最稳的状态。'
  },
  // ===== 吵架/矛盾 =====
  {
    keywords: ['吵架了', '吵了', '争执', '闹矛盾', '起争议', '冷战中'],
    response: '吵架了，最重要的是先冷静，再沟通。\n\n🚫 吵架中绝对不说的话：\n• "你从来都是这样"\n• "当初就不该和你在一起"\n• "随便，你开心就好"\n• 翻旧账\n\n✅ 吵架后和好步骤：\n\n第1步：给彼此2小时冷静（不要在情绪激动时沟通）\n\n第2步：先开口说：\n"我知道你刚才也很难受，我们都冷静了，能不能聊一聊？"\n\n第3步：说"我感受"，不说"你的错"\n• 说："我那时候感觉被忽视了，很难过"\n• 不说："你就是不在乎我"\n\n第4步：提出具体解决方法\n\n吵架不是为了赢，是为了解决问题。赢了争论，输了感情。\n\n你们是因为什么吵架的？'
  },
  {
    keywords: ['怎么道歉', '如何道歉', '说对不起', '认错', '主动和好'],
    response: '道歉要有效，不只是说"对不起"。\n\n✅ 有效道歉公式：\n[承认错误] + [理解对方感受] + [说明改变] + [具体行动]\n\n示例：\n"我之前那样说话确实不对（承认），你当时一定很委屈（理解），我不应该那么冲动（说明），下次有情绪我会先冷静再说（行动）"\n\n❌ 无效的道歉：\n• "我说对不起了还想怎样"（带情绪）\n• "都是我的错，行了吧"（敷衍）\n• "我道歉了，你也有责任"（反将一军）\n\n💡 道歉的时机很重要：\n• 对方还在气头上 = 道歉没用\n• 等对方情绪稳定了再道歉，效果好10倍\n\n如果你已经道歉了，对方还在冷战：\n给对方时间，不要强求立刻和好。真诚的道歉是种下了种子，等待它发芽。'
  },
  // ===== 维系感情/稳定期 =====
  {
    keywords: ['新鲜感', '感情变淡了', '没有激情', '没感觉了', '感情平淡', '无聊了'],
    response: '稳定期感情变淡，解法不是"制造激情"，而是"更新共同记忆"。\n\n💡 5个恢复新鲜感的方法：\n\n1. 去一个从没去过的地方（哪怕只是隔壁区）\n2. 一起学一个新技能（做饭/学舞/打球）\n3. 各自花1小时写下"最近让你感动的3件小事"\n4. 重走第一次约会的路线，聊聊当时的感受\n5. 给对方发一封长信，说说你有多欣赏TA\n\n⚠️ 不要用来"恢复新鲜感"的方法：\n• 故意冷淡让对方紧张（有风险）\n• 用嫉妒来刺激对方（伤害信任）\n\n感情的深度不来自激情，而来自共同经历的积累。\n你们在一起多久了？我帮你设计适合你们的计划。'
  },
  {
    keywords: ['异地恋', '两地恋', '不在一个城市', '远距离', '异地怎么维持'],
    response: '异地恋的核心挑战：物理距离不能变成心理距离。\n\n✅ 维持异地恋的关键：\n\n1. 固定的"见面节奏"\n哪怕1-2个月一次，也要有计划，给彼此盼头\n\n2. 保持"日常感"\n睡前语音5分钟，不用说大道理，就聊今天遇到的小事\n\n3. 给对方惊喜\n突然叫外卖送到对方门口、寄一个小包裹\n\n4. 有明确的"在一起时间线"\n"我们什么时候能结束异地"要有计划，而不是无限期等待\n\n⚠️ 异地最大的风险：\n• 各自的生活圈越来越不重叠\n• 用"太忙了"代替真实的疏远\n\n你们异地多久了？有计划结束异地吗？'
  },
  {
    keywords: ['送什么礼物', '生日礼物', '如何送礼', '礼物选择', '该送什么'],
    response: '礼物的核心不是价格，是用心和恰当。\n\n💡 送礼物的黄金法则：\n"送TA一直想要，但没有主动买给自己的东西"\n\n✅ 男生送女生：\n• 记录她随口提过的东西 → 找到再买\n• 体验类：手工课/陶艺/下午茶（比实物记忆更深）\n• 解决她的痛点（她说颈酸，送一次肩颈按摩）\n• 亲手做（时间和心意最贵）\n\n✅ 女生送男生：\n• 他玩的游戏周边/皮肤\n• 他喜欢的运动装备\n• 一顿他最爱吃的家乡菜（你自己做）\n• 记忆相册/定制周边\n\n❌ 送礼雷区：\n• 不了解喜好就送香水（容易选错）\n• 太贵重（早期不要超过500，有压力）\n\n最好的礼物往往需要细心观察，而不是钱多。'
  },
  // ===== 不安全感/嫉妒 =====
  {
    keywords: ['嫉妒', '不安全感', '不放心', '担心对方', '害怕失去', '管不住自己'],
    response: '感情里的不安全感，往往来自：\n\n1. 过去有过被背叛的经历\n2. 自我价值感不足（"我值不值得被爱"的疑虑）\n3. 对方确实给出了不安全的行为信号\n\n💡 处理不安全感的方法：\n\n✅ 短期：\n• 说出来，但注意方式："我有点不安，不是怀疑你，只是我自己需要确认"\n• 不要用控制对方来获得安全感（会反效果）\n\n✅ 长期：\n• 建立你自己的生活（有自己的朋友圈、爱好、成就）\n• 安全感来自内心，不来自另一个人\n\n⚠️ 需要和TA沟通的情况：\n如果TA确实有让你不放心的行为，直接说："我需要你告诉我XX，这对我很重要"\n\n你是因为什么感到不安？具体说一下。'
  },
  // ===== 同居/婚恋 =====
  {
    keywords: ['同居', '一起住', '住一起了', '要不要同居'],
    response: '同居是关系的重要升级，提前沟通这几点很关键：\n\n📋 同居前要谈好的事：\n1. 家务怎么分工（明确说，不要靠猜）\n2. 各自的"独处空间"（每人需要多少私人时间）\n3. 经济怎么分担（房租、日用品）\n4. 有了矛盾怎么处理\n\n💡 同居后保持感情的方法：\n• 每周至少1次"约会"（哪怕只是出门吃顿饭）\n• 保持独立的社交圈，不要24小时粘在一起\n• 尊重对方的生活习惯，慢慢磨合而不是要求TA改变\n\n⚠️ 同居常见矛盾：\n• 家务分配不均\n• 生活作息习惯不同\n\n你们是准备同居，还是已经住在一起了？'
  },
  {
    keywords: ['婚后', '结婚了', '夫妻关系', '老公', '老婆', '已婚', '婚姻问题'],
    response: '婚后维系感情，重点是"不要把对方的爱当成理所当然"。\n\n💡 婚后感情保鲜的5个习惯：\n\n1. 每天说一次"谢谢"和"我爱你"\n（对方"知道"不是不说的理由）\n\n2. 每月1次"二人约会"\n（不带孩子，只是你们两个人）\n\n3. 保持身体接触\n（握手、拥抱、睡前亲吻，物理接触是感情的"充电宝"）\n\n4. 在外人面前维护对方\n（就算有矛盾，当众不贬低对方）\n\n5. 了解对方最近的烦恼\n（不要只聊孩子和家务）\n\n婚姻不是终点，是需要持续用心的旅程。\n\n你们现在遇到了什么具体的问题？'
  },
  // ===== 暗恋 =====
  {
    keywords: ['暗恋', '单相思', '一直喜欢他', '一直喜欢她', '不敢说出来', '不敢告白'],
    response: '暗恋很甜，但要给暗恋一个期限。\n\n💡 暗恋的3个阶段建议：\n\n第1阶段（认识不深）：先成为朋友\n• 增加自然接触机会（不是刻意制造）\n• 了解对方的喜好、价值观\n• 让对方记住你（有特点，有话题）\n\n第2阶段（已经认识）：给出信号\n• 主动约单独见面（用"顺便"降低压力）\n• 在聊天中给出模糊的"好感信号"\n• 观察对方的反应\n\n第3阶段（有信号了）：表态\n• 不要无限期暗恋，说出来，给自己一个结果\n• 被拒绝了也好，至少不会后悔\n\n⏱ 暗恋期限：3个月内没有任何进展信号，是时候重新评估了。\n\n你暗恋对方多久了？'
  },
  // ===== 放手/走出来 =====
  {
    keywords: ['要不要放弃', '该放手了', '走不出来', '忘不了', '放不下他', '放不下她'],
    response: '放手不是失败，是一种智慧。\n\n💡 判断要不要放手的3个问题：\n\n1. 如果再努力6个月还没有结果，你接受得了吗？\n2. 为了这段感情，你失去了哪些其他重要的东西？\n3. 你现在的坚持，是因为真的爱，还是不甘心？\n\n✅ 帮助你走出来的方法：\n• 屏蔽/删除对方（减少刺激）\n• 和好朋友多聊，把情绪说出来\n• 全力投入一件有意义的事（工作/健身/旅行）\n• 给自己定一个"解禁日期"，那天之前不联系对方\n\n走不出来的原因往往是：还在看对方的朋友圈，还在等消息，还在希望。\n\n先做到"信息断联"，其他才能慢慢改变。'
  },
  // ===== 撩人技巧 =====
  {
    keywords: ['怎么撩', '如何撩', '怎么让他喜欢我', '怎么让她喜欢我', '怎么有魅力', '怎么吸引人'],
    response: '真正的"撩"不是套路，是让对方感受到你的真实魅力。\n\n💡 高情商撩人的4个核心：\n\n1. 【保持神秘感，不要一次说完】\n聊天时适当"留白"，"之后再说"、"改天见面告诉你"\n\n2. 【制造"专属化"体验】\n"这件事我只告诉你一个人"、记住TA说过的小事并提起\n\n3. 【微妙的身体语言信号】\n面对面时眼神停留久一点、说话时不自觉靠近\n\n4. 【适度的"退一步"】\n热情之后突然"忙了"，让对方感到"TA是不是对我没那么感兴趣了"\n\n⚠️ 撩人但维持真诚：\n套路可以用，但不能让对方觉得被耍。最终打动人的，还是真诚和个性。\n\n你想撩的人是什么类型的？我帮你出招。'
  },
  // ===== 出轨/背叛 =====
  {
    keywords: ['出轨', '背叛了', '劈腿', '有了别人', '被骗了'],
    response: '这是感情里最难处理的情况，你现在一定很难受。\n\n先冷静下来，不要在情绪激动时做决定。\n\n📋 你需要考虑的问题：\n\n1. 这是第一次，还是一直都有？\n2. 对方有没有主动坦白？还是你发现的？\n3. 对方现在的态度是什么？（真诚悔改/理直气壮/推卸责任）\n\n如果对方真诚悔改，想继续：\n• 需要时间重建信任（不是原谅就立刻恢复正常）\n• 明确说出你的底线\n• 关注TA的改变，而不是反复追问细节（越追问越伤）\n\n如果选择分开：\n• 这是你的权利，不需要说服自己"宽容"\n• 找专业的人倾诉\n• 给自己时间，不要立刻开始新恋情\n\n无论做什么决定，都优先照顾好自己。'
  },
  // ===== 性格差异 =====
  {
    keywords: ['性格不合', '价值观不同', '太不一样了', '合适吗', '适不适合'],
    response: '性格差异不一定是障碍，关键看哪些方面不同。\n\n✅ 差异反而可以互补的方面：\n• 内向外向（一人活跃，一人稳重）\n• 冒险vs谨慎\n• 感性vs理性\n\n⚠️ 可能有问题的差异：\n• 对"忠诚"的定义不同\n• 对"金钱"的态度完全相反\n• 对"家庭"的重视程度差异很大\n• 对"未来规划"方向完全不同\n\n💡 判断差异是否可以克服：\n不看当下，看"你们是否都愿意为对方做一些改变"\n\n如果双方都愿意成长和适应，差异可以成为关系的养分。\n如果一方完全不愿意妥协，这段关系会很累。\n\n你们的差异具体是哪方面？'
  },
  // ===== 性别识别引导 =====
  {
    keywords: ['我是男生', '男生视角', '作为男生', '男生怎么'],
    response: '好，我会从男生的视角来帮你分析。\n\n你现在面对的是哪个阶段的问题？\n\n• 💘 想追一个女生，不知道怎么开始\n• 🌸 暧昧中，不知道怎么推进\n• 💑 在一起了，想维系/提升感情质量\n• 💔 出了问题，想修复或挽回\n• 💍 到了谈婚论嫁阶段\n\n说说你的具体情况，越详细我帮你越多！'
  },
  {
    keywords: ['我是女生', '女生视角', '作为女生', '女生怎么'],
    response: '好，我会从女生的视角来帮你分析。\n\n你现在最困惑的是什么？\n\n• 💕 喜欢一个人，不知道他是否喜欢我\n• 😔 被忽冷忽热，不知道该不该继续\n• 💬 关系遇到了问题，不知道怎么沟通\n• 💔 分手了，想走出来或挽回\n• 🌹 想让自己在感情里更有主动权\n\n告诉我具体的情况，我帮你分析！'
  },
]

function getRandomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 精准匹配知识库的函数（多关键词评分排序）
function findBestAdvice(input) {
  var lowerInput = input.toLowerCase()
  var bestMatch = null
  var bestScore = 0

  for (var i = 0; i < ADVICE_KB.length; i++) {
    var item = ADVICE_KB[i]
    var score = 0
    for (var j = 0; j < item.keywords.length; j++) {
      var kw = item.keywords[j]
      if (lowerInput.indexOf(kw) !== -1) {
        score += kw.length // 越长的关键词权重越高
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = item
    }
  }
  return bestScore > 0 ? bestMatch : null
}

// 根据关键词精准匹配本地回复（升级版）
function getLocalAdvice(input) {
  var matched = findBestAdvice(input)
  if (matched && matched.response) {
    return matched.response
  }

  // 兜底默认回复
  var defaultReplies = [
    '能把你的情况说得更具体一些吗？\n\n比如：\n• 你们现在是什么关系？（陌生人/朋友/暧昧/在一起）\n• 认识多久了？\n• 最近发生了什么具体的事？\n\n越具体，我给的建议就越准！',
    '我需要了解更多背景～\n\n• TA是什么样的人？（外向/内向、直接/含蓄）\n• 你们平时怎么联系？\n• 你最想解决的核心问题是什么？\n\n告诉我，我帮你出方案！',
    '恋爱里的问题往往藏在细节里，你可以说一个具体的场景吗？\n\n比如："TA上次发了条消息说……我当时是这样回的……然后TA就……"\n\n从这里入手，我能帮你分析TA的心理和最佳应对策略。',
  ]
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
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
2. 生成角色的台词（作为第一句回复）
3. 给出用户的3个开场白选项（适合的话术）
4. 给出1条教练建议（该场景的注意事项）

格式：
【场景】
（场景描述）

【角色台词】
（第一句回复，自然真实）

【你的开场白选项】
1. （选项1）
2. （选项2）
3. （选项3）

【教练建议】
（该场景的注意事项和技巧）`

    if (this.data.aiConfigured) {
      // 调用知识库生成
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

【角色台词】
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

【角色台词】
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
        console.error('[ai-coach] 调用失败:', err)
        this.setData({ isTyping: false, aiStatus: 'idle' })
        if (err === '__domain_blocked__') {
          ai.handleError(err)
          this.typewriterAdd('assistant', '⚠️ 请先配置网络权限后再试（详见弹窗提示）', ['重新提问'], null)
        } else {
          // 将错误统一转换为字符串，避免 [object Object]
          const errStr = (typeof err === 'string') ? err : (err && err.errMsg) ? err.errMsg : '网络开小差了，请稍后再试 😅'
          this.typewriterAdd('assistant', '⚠️ ' + errStr, ['重新提问', '换个话题'], null)
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
