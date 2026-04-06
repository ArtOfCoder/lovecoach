/**
 * 聊天回复页面逻辑
 */

// 防止重复加载
if (window.ChatReplyPageLoaded) {
  console.log('ChatReply page already loaded, skipping...');
} else {
  window.ChatReplyPageLoaded = true;

// 当前选择
let currentRelation = 'friend';
let currentStyle = 'funny';

// 初始化页面
function initChatReply() {
  // 绑定关系标签
  document.querySelectorAll('.relation-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.relation-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      currentRelation = tag.dataset.value;
    });
  });
  
  // 绑定风格标签
  document.querySelectorAll('.style-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.style-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      currentStyle = tag.dataset.value;
    });
  });
  
  // 加载历史记录
  loadHistory();
}

// 生成回复
function generateReply() {
  const input = document.getElementById('chatInput').value.trim();
  
  if (!input) {
    alert('请输入对方的消息内容');
    return;
  }
  
  // 显示加载
  document.getElementById('loadingSection').style.display = 'block';
  document.getElementById('resultSection').style.display = 'none';
  
  // 调用AI生成回复
  if (window.AI && window.AI.generateChatReply) {
    window.AI.generateChatReply({
      message: input,
      relation: currentRelation,
      style: currentStyle
    }, (replies) => {
      showReplies(replies, input);
    }, (error) => {
      console.error('生成失败:', error);
      // 使用本地备用回复
      const fallbackReplies = generateLocalReplies(input, currentStyle);
      showReplies(fallbackReplies, input);
    });
  } else {
    // AI模块未加载，使用本地回复
    setTimeout(() => {
      const replies = generateLocalReplies(input, currentStyle);
      showReplies(replies, input);
    }, 1500);
  }
}

// 生成本地备用回复
function generateLocalReplies(input, style) {
  const styleReplies = {
    funny: [
      "哈哈，你这话说得我都不知道怎么接了😂",
      "你这么会说，是不是偷偷练过？",
      "我怀疑你在暗示什么，但我没有证据🤔",
      "这句话我要记下来，以后用来怼你😏"
    ],
    gentle: [
      "嗯，我理解你的感受，确实不容易",
      "谢谢你愿意和我分享这些",
      "不管发生什么，我都在",
      "你的感受很重要，我认真听着"
    ],
    teasing: [
      "哦？继续说，我在听👀",
      "你这是在暗示什么吗？😏",
      "这么会说话，是不是想我了？",
      "我要截图保存，以后当证据🤭"
    ],
    sincere: [
      "说实话，我也一直在想这个问题",
      "我觉得我们可以好好聊聊",
      "你的看法对我很重要",
      "我想更了解你的想法"
    ]
  };
  
  const replies = styleReplies[style] || styleReplies.funny;
  
  // 根据输入内容生成更相关的回复
  if (input.includes('在干嘛') || input.includes('在吗')) {
    return [
      { text: "在想你啊，不然还能干嘛😊", style: "调皮" },
      { text: "刚忙完，正好想找你聊天", style: "真诚" },
      { text: "在等你的消息呢，终于等到了", style: "温柔" }
    ];
  }
  
  if (input.includes('累') || input.includes('忙')) {
    return [
      { text: "辛苦啦，抱抱你💕 要不要休息一下？", style: "温柔" },
      { text: "忙完这阵就好了，加油！", style: "鼓励" },
      { text: "这么努力，奖励你一杯奶茶🧋", style: "调皮" }
    ];
  }
  
  if (input.includes('好看') || input.includes('漂亮') || input.includes('帅')) {
    return [
      { text: "你眼光真好，我也这么觉得😎", style: "幽默" },
      { text: "哪有，你更好看", style: "谦虚" },
      { text: "被你夸了我都不好意思了", style: "害羞" }
    ];
  }
  
  // 通用回复
  return [
    { text: replies[0], style: currentStyle === 'funny' ? '幽默' : '温柔' },
    { text: replies[1], style: '真诚' },
    { text: replies[2], style: '调皮' }
  ];
}

// 显示回复结果
function showReplies(replies, originalInput) {
  document.getElementById('loadingSection').style.display = 'none';
  document.getElementById('resultSection').style.display = 'block';
  
  const listEl = document.getElementById('replyList');
  listEl.innerHTML = '';
  
  replies.forEach((reply, index) => {
    const card = document.createElement('div');
    card.className = 'reply-card';
    card.innerHTML = `
      <div class="reply-text">${reply.text}</div>
      <div class="reply-style">${reply.style || '推荐'}</div>
      <div class="reply-copy-hint">点击复制</div>
    `;
    card.addEventListener('click', () => copyReply(reply.text, originalInput));
    listEl.appendChild(card);
  });
  
  // 滚动到结果
  document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}

// 复制回复
function copyReply(text, originalInput) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已复制到剪贴板');
    // 保存到历史
    saveToHistory(originalInput, text);
  }).catch(() => {
    // 降级方案
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('已复制到剪贴板');
    saveToHistory(originalInput, text);
  });
}

// 显示提示
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => document.body.removeChild(toast), 2000);
}

// 保存到历史
function saveToHistory(input, reply) {
  let history = JSON.parse(localStorage.getItem('chat_reply_history') || '[]');
  history.unshift({
    input: input.substring(0, 50),
    reply: reply,
    time: Date.now()
  });
  // 只保留最近20条
  history = history.slice(0, 20);
  localStorage.setItem('chat_reply_history', JSON.stringify(history));
  loadHistory();
}

// 加载历史
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('chat_reply_history') || '[]');
  const listEl = document.getElementById('historyList');
  
  if (history.length === 0) {
    listEl.innerHTML = '<div class="history-empty">暂无历史记录</div>';
    return;
  }
  
  listEl.innerHTML = '';
  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-input">对方：${item.input}</div>
      <div class="history-reply">回复：${item.reply}</div>
    `;
    div.addEventListener('click', () => {
      document.getElementById('chatInput').value = item.input;
    });
    listEl.appendChild(div);
  });
}

// 清空历史
function clearHistory() {
  if (confirm('确定要清空历史记录吗？')) {
    localStorage.removeItem('chat_reply_history');
    loadHistory();
  }
}

// 导出页面配置
window.ChatReplyPage = {
  init: initChatReply,
  generateReply,
  clearHistory
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatReply);
} else {
  initChatReply();
}

} // 结束防止重复加载的if块
