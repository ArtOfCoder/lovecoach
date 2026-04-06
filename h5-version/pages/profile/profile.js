/**
 * H5版本 个人中心页面逻辑
 */

// 版本号点击计数（5次进入管理后台）
let _versionClickCount = 0;
let _versionClickTimer = null;

function onVersionClick() {
  _versionClickCount++;
  clearTimeout(_versionClickTimer);
  _versionClickTimer = setTimeout(() => { _versionClickCount = 0; }, 2000);
  if (_versionClickCount >= 5) {
    _versionClickCount = 0;
    // 显示隐藏入口并跳转
    if (typeof loadPage === 'function') {
      loadPage('admin');
    }
  }
}

function initProfile() {
  // 加载用户信息
  const userInfo = window.Storage ? window.Storage.get('user_info', {}) : {};
  const storedId = window.Storage ? window.Storage.get('user_id', null) : localStorage.getItem('user_id');
  const userId = storedId || ('USER' + Date.now().toString(36).toUpperCase().slice(-6));
  if (!storedId) {
    if (window.Storage) window.Storage.set('user_id', userId);
    else localStorage.setItem('user_id', userId);
  }

  // 会员状态
  const memberLevel = localStorage.getItem('member_level') || 'free';
  const memberLabels = { free: '免费用户', monthly: '月度会员', quarterly: '季度会员', yearly: '年度会员', lifetime: '终身会员' };

  // 更新显示
  const nameEl = document.querySelector('.profile-name');
  const idEl = document.querySelector('.profile-id');
  if (nameEl) nameEl.textContent = userInfo.nickName || '恋爱学员';
  if (idEl) idEl.textContent = 'ID: ' + userId;

  // 显示会员状态
  const memberBadge = document.getElementById('memberBadge');
  if (memberBadge) {
    memberBadge.textContent = memberLabels[memberLevel] || '免费用户';
    if (memberLevel !== 'free') memberBadge.classList.add('is-member');
  }
}

function goToPage(page) {
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
  goToPage,
  onVersionClick
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initProfile);
