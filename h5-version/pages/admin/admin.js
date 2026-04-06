/**
 * 管理后台页面逻辑
 */

// 防止重复加载
if (window.AdminPageLoaded) {
  console.log('Admin page already loaded, skipping...');
} else {
  window.AdminPageLoaded = true;

const ADMIN_PASSWORD = 'love2026';
let isLoggedIn = false;

// 初始化页面
function initAdmin() {
  // 检查登录状态
  const loginTime = sessionStorage.getItem('admin_login_time');
  if (loginTime && (Date.now() - parseInt(loginTime)) < 3600000) {
    // 1小时内自动登录
    showAdminPanel();
  }
  
  // 绑定回车登录
  document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') adminLogin();
  });
}

// 管理员登录
function adminLogin() {
  const password = document.getElementById('adminPassword').value;
  
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_login_time', Date.now().toString());
    showAdminPanel();
  } else {
    alert('密码错误');
  }
}

// 显示管理面板
function showAdminPanel() {
  isLoggedIn = true;
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminContent').style.display = 'block';
  
  // 加载统计数据
  loadStats();
  // 加载用户列表
  loadUserList();
  // 加载黑名单
  loadBlacklist();
}

// 退出登录
function adminLogout() {
  sessionStorage.removeItem('admin_login_time');
  isLoggedIn = false;
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminContent').style.display = 'none';
  document.getElementById('adminPassword').value = '';
}

// 加载统计数据
function loadStats() {
  // 统计用户数
  let totalUsers = 0;
  let totalCalculations = 0;
  let totalUnlocked = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('soulmate_data_')) {
      totalCalculations++;
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data.unlocked) {
          totalUnlocked++;
        }
      } catch (e) {}
    }
    if (key && key.startsWith('soulmate_user_id')) {
      totalUsers++;
    }
  }
  
  document.getElementById('totalUsers').textContent = totalUsers || Math.floor(totalCalculations * 0.8);
  document.getElementById('totalCalculations').textContent = totalCalculations;
  document.getElementById('totalUnlocked').textContent = totalUnlocked;
  document.getElementById('totalRevenue').textContent = '¥' + (totalUnlocked * 9.9).toFixed(1);
}

// 加载用户列表
function loadUserList() {
  const listEl = document.getElementById('userList');
  const users = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('soulmate_data_')) {
      const userId = key.replace('soulmate_data_', '');
      try {
        const data = JSON.parse(localStorage.getItem(key));
        users.push({
          id: userId,
          unlocked: data.unlocked || false,
          time: localStorage.getItem(`soulmate_unlocked_${userId}`) ? 
                new Date(parseInt(localStorage.getItem(`soulmate_time_${userId}`) || Date.now())).toLocaleString() :
                '未解锁'
        });
      } catch (e) {}
    }
  }
  
  // 按时间倒序
  users.reverse();
  
  if (users.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div>暂无用户数据</div>';
    return;
  }
  
  listEl.innerHTML = users.map(user => `
    <div class="user-item">
      <div class="user-info">
        <div class="user-id">${user.id}</div>
        <div class="user-time">${user.time}</div>
      </div>
      <span class="user-status ${user.unlocked ? 'unlocked' : 'locked'}">
        ${user.unlocked ? '已解锁' : '未解锁'}
      </span>
      <div class="user-actions">
        ${!user.unlocked ? `<button class="user-btn unlock" onclick="unlockUserById('${user.id}')">解锁</button>` : ''}
        <button class="user-btn blacklist" onclick="addToBlacklistById('${user.id}')">封禁</button>
      </div>
    </div>
  `).join('');
}

// 搜索用户
function searchUser() {
  const searchId = document.getElementById('searchUserId').value.trim();
  if (!searchId) {
    loadUserList();
    return;
  }
  
  const listEl = document.getElementById('userList');
  const data = localStorage.getItem(`soulmate_data_${searchId}`);
  
  if (!data) {
    listEl.innerHTML = '<div class="empty-state">未找到该用户</div>';
    return;
  }
  
  try {
    const userData = JSON.parse(data);
    const unlocked = localStorage.getItem(`soulmate_unlocked_${searchId}`) === 'true';
    
    listEl.innerHTML = `
      <div class="user-item">
        <div class="user-info">
          <div class="user-id">${searchId}</div>
          <div class="user-time">${userData.zodiac?.name || '未知'} | ${unlocked ? '已解锁' : '未解锁'}</div>
        </div>
        <span class="user-status ${unlocked ? 'unlocked' : 'locked'}">
          ${unlocked ? '已解锁' : '未解锁'}
        </span>
        <div class="user-actions">
          ${!unlocked ? `<button class="user-btn unlock" onclick="unlockUserById('${searchId}')">解锁</button>` : ''}
          <button class="user-btn blacklist" onclick="addToBlacklistById('${searchId}')">封禁</button>
        </div>
      </div>
    `;
  } catch (e) {
    listEl.innerHTML = '<div class="empty-state">用户数据错误</div>';
  }
}

// 解锁用户
function unlockUser() {
  const userId = document.getElementById('unlockUserId').value.trim();
  const note = document.getElementById('unlockNote').value.trim();
  
  if (!userId) {
    alert('请输入用户ID');
    return;
  }
  
  unlockUserById(userId, note);
}

// 通过ID解锁用户
function unlockUserById(userId, note = '') {
  // 检查用户是否存在
  const data = localStorage.getItem(`soulmate_data_${userId}`);
  if (!data) {
    alert('用户不存在');
    return;
  }
  
  // 执行解锁
  localStorage.setItem(`soulmate_unlocked_${userId}`, 'true');
  localStorage.setItem(`soulmate_time_${userId}`, Date.now().toString());
  if (note) {
    localStorage.setItem(`soulmate_note_${userId}`, note);
  }
  
  // 更新数据中的解锁状态
  try {
    const userData = JSON.parse(data);
    userData.unlocked = true;
    localStorage.setItem(`soulmate_data_${userId}`, JSON.stringify(userData));
  } catch (e) {}
  
  alert(`用户 ${userId} 已解锁`);
  loadStats();
  loadUserList();
}

// 加载黑名单
function loadBlacklist() {
  const listEl = document.getElementById('blacklistList');
  const blacklist = JSON.parse(localStorage.getItem('soulmate_blacklist') || '[]');
  
  if (blacklist.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🛡️</div>黑名单为空</div>';
    return;
  }
  
  listEl.innerHTML = blacklist.map(item => `
    <div class="blacklist-item">
      <div class="blacklist-info">
        <div class="blacklist-id">${item.userId}</div>
        <div class="blacklist-reason">${item.reason || '无原因'} | ${new Date(item.time).toLocaleString()}</div>
      </div>
      <button class="user-btn unlock" onclick="removeFromBlacklist('${item.userId}')">移除</button>
    </div>
  `).join('');
}

// 添加到黑名单
function addToBlacklist() {
  const userId = document.getElementById('blacklistUserId').value.trim();
  const reason = document.getElementById('blacklistReason').value.trim();
  
  if (!userId) {
    alert('请输入用户ID');
    return;
  }
  
  addToBlacklistById(userId, reason);
}

// 通过ID添加到黑名单
function addToBlacklistById(userId, reason = '') {
  let blacklist = JSON.parse(localStorage.getItem('soulmate_blacklist') || '[]');
  
  // 检查是否已在黑名单
  if (blacklist.some(item => item.userId === userId)) {
    alert('该用户已在黑名单');
    return;
  }
  
  blacklist.push({
    userId: userId,
    reason: reason,
    time: Date.now()
  });
  
  localStorage.setItem('soulmate_blacklist', JSON.stringify(blacklist));
  alert(`用户 ${userId} 已添加到黑名单`);
  loadBlacklist();
}

// 从黑名单移除
function removeFromBlacklist(userId) {
  let blacklist = JSON.parse(localStorage.getItem('soulmate_blacklist') || '[]');
  blacklist = blacklist.filter(item => item.userId !== userId);
  localStorage.setItem('soulmate_blacklist', JSON.stringify(blacklist));
  loadBlacklist();
}

// 保存设置
function saveSettings() {
  const price = document.getElementById('unlockPrice').value;
  const wechat = document.getElementById('wechatId').value;
  
  localStorage.setItem('soulmate_settings', JSON.stringify({
    price: price,
    wechat: wechat
  }));
  
  alert('设置已保存');
}

// 导出数据
function exportData() {
  const data = {
    exportTime: new Date().toISOString(),
    users: [],
    blacklist: JSON.parse(localStorage.getItem('soulmate_blacklist') || '[]')
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('soulmate_')) {
      data.users.push({
        key: key,
        value: localStorage.getItem(key)
      });
    }
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lovecoach_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert('数据已导出');
}

// 清空所有数据
function clearAllData() {
  if (!confirm('⚠️ 确定要清空所有数据吗？此操作不可恢复！')) {
    return;
  }
  
  if (!confirm('再次确认：真的要清空所有用户数据吗？')) {
    return;
  }
  
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('soulmate_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  alert('所有数据已清空');
  loadStats();
  loadUserList();
  loadBlacklist();
}

// 导出页面配置
window.AdminPage = {
  init: initAdmin,
  adminLogin,
  adminLogout,
  searchUser,
  unlockUser,
  unlockUserById,
  addToBlacklist,
  addToBlacklistById,
  removeFromBlacklist,
  saveSettings,
  exportData,
  clearAllData
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}

} // 结束防止重复加载的if块
