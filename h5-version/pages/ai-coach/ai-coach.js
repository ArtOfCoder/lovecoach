/**
 * H5版本 AI顾问页面逻辑
 */

// 页面状态
let currentMode = 'coach';
let messages = [];
let isTyping = false;
let userGender = null;

// 初始化页面
function initAICoach() {
  // 加载历史消息
  const saved = localStorage.getItem('ai_chat_history');
  if (saved) {
    messages = JSON.parse(saved);
    renderMessages();
  } else {
    // 显示欢迎消息
    addMessage('assistant', '你好呀！我是你的 AI 恋爱顾问小爱 🤖💕\n\n无论是搭讪技巧、暧昧推进、约会设计还是感情维系，都可以问我！\n\n先告诉我你是男生还是女生？这样我能给你更有针对性的建议～');
  }
  
  // 绑定输入框事件
  const input = document.getElementById('chatInput');
  input.addEventListener('input', updateSendBtn);
}

// 切换模式
function switchMode(mode) {
  currentMode = mode;
  
  // 更新UI
  document.querySelectorAll('.mode-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.mode === mode) {
      item.classList.add('active');
    }
  });
  
  // 模式切换提示
  const modeNames = {
    coach: 'AI顾问模式',
    signal: '信号分析模式',
    practice: '角色练习模式',
    vent: '倾诉模式'
  };
  
  addMessage('assistant', `已切换到${modeNames[mode]}。有什么可以帮你的吗？`);
}

// 发送消息
function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  
  if (!text || isTyping) return;
  
  // 添加用户消息
  addMessage('user', text);
  input.value = '';
  updateSendBtn();
  
  // 显示打字中
  showTyping();
  
  // 调用AI
  const history = messages.slice(-10).map(m => ({
    role: m.role,
    content: m.content
  }));
  
  window.AI.coachChat({
    userMessage: text,
    history: history,
    userGender: userGender,
    profile: null
  }, (response) => {
    hideTyping();
    addMessage('assistant', response);
    saveHistory();
  }, (error) => {
    hideTyping();
    addMessage('assistant', '抱歉，AI服务暂时不可用，请稍后再试。');
    console.error('AI Error:', error);
  });
}

// 发送快捷问题
function sendQuick(question) {
  document.getElementById('chatInput').value = question;
  updateSendBtn();
  sendMessage();
}

// 选择心情
function selectMood(mood, label) {
  const moodTexts = {
    happy: '今天心情不错！有什么开心的事想分享吗？',
    confused: '看起来你有些困惑，跟我说说吧，我帮你分析分析。',
    sad: '抱抱你，有什么难过的事可以跟我说，我会陪着你。',
    anxious: '焦虑的时候最需要倾诉，我在这里听着呢。',
    excited: '期待什么好事发生吗？跟我说说～'
  };
  
  addMessage('user', `我今天心情${label}`);
  showTyping();
  
  setTimeout(() => {
    hideTyping();
    addMessage('assistant', moodTexts[mood]);
    saveHistory();
  }, 800);
}

// 插入模板
function insertTemplate(type) {
  const templates = {
    situation: '我跟TA的情况是：',
    feeling: '我现在的感觉是：',
    help: '我需要你的建议是：'
  };
  
  const input = document.getElementById('chatInput');
  input.value = templates[type];
  input.focus();
  updateSendBtn();
}

// 添加消息
function addMessage(role, content) {
  const message = {
    id: Date.now(),
    role: role,
    content: content,
    time: new Date().toLocaleTimeString()
  };
  
  messages.push(message);
  renderMessage(message);
  scrollToBottom();
}

// 渲染单条消息
function renderMessage(message) {
  const list = document.getElementById('messageList');
  const div = document.createElement('div');
  div.className = `msg-row ${message.role === 'user' ? 'user-row' : 'ai-row'}`;
  div.id = `msg-${message.id}`;
  
  if (message.role === 'user') {
    div.innerHTML = `
      <div class="user-bubble">${escapeHtml(message.content)}</div>
    `;
  } else {
    div.innerHTML = `
      <div class="ai-ava">🤖</div>
      <div class="msg-col">
        <div class="ai-bubble">${formatMessage(message.content)}</div>
      </div>
    `;
  }
  
  list.appendChild(div);
}

// 渲染所有消息
function renderMessages() {
  const list = document.getElementById('messageList');
  list.innerHTML = '';
  messages.forEach(msg => renderMessage(msg));
}

// 显示打字中
function showTyping() {
  isTyping = true;
  document.getElementById('typingIndicator').style.display = 'flex';
  scrollToBottom();
}

// 隐藏打字中
function hideTyping() {
  isTyping = false;
  document.getElementById('typingIndicator').style.display = 'none';
}

// 滚动到底部
function scrollToBottom() {
  const scroll = document.getElementById('chatScroll');
  scroll.scrollTop = scroll.scrollHeight;
}

// 更新发送按钮状态
function updateSendBtn() {
  const input = document.getElementById('chatInput');
  const btn = document.getElementById('sendBtn');
  
  if (input.value.trim().length > 0) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
}

// 清空对话
function clearChat() {
  if (confirm('确定要清空所有对话吗？')) {
    messages = [];
    document.getElementById('messageList').innerHTML = '';
    localStorage.removeItem('ai_chat_history');
    
    // 重新显示欢迎消息
    addMessage('assistant', '对话已清空。我是你的 AI 恋爱顾问小爱，有什么可以帮你的吗？');
  }
}

// 保存历史
function saveHistory() {
  localStorage.setItem('ai_chat_history', JSON.stringify(messages));
}

// 格式化消息（支持简单Markdown）
function formatMessage(content) {
  return escapeHtml(content)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// HTML转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 导出页面配置
window.AICoachPage = {
  init: initAICoach,
  switchMode,
  sendMessage,
  sendQuick,
  selectMood,
  insertTemplate,
  clearChat
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initAICoach);
