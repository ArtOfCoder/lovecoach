/**
 * H5版本 个人中心页面逻辑
 */

function initProfile() {
  // 加载用户信息
  const userInfo = window.Storage.get('user_info', {});
  const userId = window.Storage.get('user_id', 'USER' + Date.now().toString(36).toUpperCase().slice(-6));
  
  // 如果没有用户ID，生成一个
  if (!window.Storage.get('user_id')) {
    window.Storage.set('user_id', userId);
  }
  
  // 更新显示
  document.querySelector('.profile-name').textContent = userInfo.nickName || '恋爱学员';
  document.querySelector('.profile-id').textContent = 'ID: ' + userId;
}

function goToPage(page) {
  // 简单的页面跳转提示
  const pageNames = {
    'user-stats': '使用统计',
    'soulmate-history': '测算历史',
    'settings': '设置',
    'help': '帮助与反馈',
    'about': '关于我们'
  };
  
  alert(`即将跳转到：${pageNames[page] || page}\n（功能开发中）`);
}

// 导出页面配置
window.ProfilePage = {
  init: initProfile,
  goToPage
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initProfile);
