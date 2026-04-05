/**
 * H5版本 首页逻辑
 */

function initIndex() {
  console.log('Index page initialized');
}

function goToPage(page) {
  const pageNames = {
    'couple': '情侣档案',
    'chat-reply': '聊天回复',
    'detail': '课程详情',
    'course': '课程列表'
  };
  
  alert(`即将跳转到：${pageNames[page] || page}\n（功能开发中）`);
}

// 导出页面配置
window.IndexPage = {
  init: initIndex,
  goToPage
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initIndex);
