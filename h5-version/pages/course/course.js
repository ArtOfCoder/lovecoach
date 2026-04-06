/**
 * 课程页面逻辑 - 动态渲染120门课程
 */

// 防止重复加载
if (window.CoursePageLoaded) {
  console.log('Course page already loaded, skipping...');
} else {
  window.CoursePageLoaded = true;

// 页面状态
let currentCategory = 'all';
let currentPage = 1;
const pageSize = 12;
let filteredCourses = [];
let searchKeyword = '';

// 初始化页面
function initCourse() {
  // 加载课程数据
  loadCoursesData();
  
  // 绑定分类切换
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      // 更新激活状态
      document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // 筛选课程
      currentCategory = item.dataset.cat;
      currentPage = 1;
      filterAndRenderCourses();
    });
  });
  
  // 初始化统计
  updateStats();
}

// 加载课程数据
function loadCoursesData() {
  // 使用全局的COURSES_DATA
  if (typeof COURSES_DATA !== 'undefined') {
    filteredCourses = [...COURSES_DATA];
    renderCourses();
  } else {
    // 如果数据未加载，显示加载中
    document.getElementById('courseList').innerHTML = `
      <div class="course-loading">
        <div class="loading-spinner"></div>
        <p>加载课程中...</p>
      </div>
    `;
    
    // 延迟重试
    setTimeout(loadCoursesData, 500);
  }
}

// 筛选并渲染课程
function filterAndRenderCourses() {
  // 根据分类和关键词筛选
  filteredCourses = COURSES_DATA.filter(course => {
    const matchCategory = currentCategory === 'all' || course.category === currentCategory;
    const matchSearch = !searchKeyword || 
      course.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      course.desc.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchCategory && matchSearch;
  });
  
  currentPage = 1;
  renderCourses();
  updateLoadMoreButton();
}

// 渲染课程列表
function renderCourses() {
  const listContainer = document.getElementById('courseList');
  const emptyState = document.getElementById('courseEmpty');
  
  if (filteredCourses.length === 0) {
    listContainer.innerHTML = '';
    emptyState.style.display = 'block';
    document.getElementById('loadMore').style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  
  // 分页
  const start = 0;
  const end = currentPage * pageSize;
  const coursesToShow = filteredCourses.slice(start, end);
  
  // 生成HTML
  const html = coursesToShow.map(course => createCourseCard(course)).join('');
  
  if (currentPage === 1) {
    listContainer.innerHTML = html;
  } else {
    // 追加更多课程
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const newCards = Array.from(tempDiv.children).slice((currentPage - 1) * pageSize);
    newCards.forEach(card => listContainer.appendChild(card));
  }
  
  // 绑定点击事件
  document.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', () => {
      const courseId = parseInt(card.dataset.id);
      showCourseDetail(courseId);
    });
  });
  
  updateLoadMoreButton();
}

// 创建课程卡片HTML
function createCourseCard(course) {
  const priceClass = course.price === '免费' ? 'course-free' : 'course-price';
  const badgeHtml = course.badge ? `<div class="course-badge">${course.badge}</div>` : '';
  
  return `
    <div class="course-card" data-id="${course.id}" data-cat="${course.category}">
      <div class="course-cover" style="background: ${course.gradient};">
        <div class="course-icon">${course.icon}</div>
        ${badgeHtml}
      </div>
      <div class="course-info">
        <div class="course-title">${course.title}</div>
        <div class="course-desc">${course.desc}</div>
        <div class="course-tags">
          ${course.tags.slice(0, 3).map(tag => `<span class="course-tag">${tag}</span>`).join('')}
        </div>
        <div class="course-meta">
          <span class="course-lessons">${course.lessons}节课</span>
          <span class="course-duration">${course.duration}</span>
          <span class="${priceClass}">${course.price}</span>
        </div>
      </div>
    </div>
  `;
}

// 搜索课程
function searchCourses(keyword) {
  searchKeyword = keyword.trim();
  currentPage = 1;
  filterAndRenderCourses();
}

// 加载更多课程
function loadMoreCourses() {
  currentPage++;
  renderCourses();
}

// 更新加载更多按钮
function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById('loadMore');
  const totalShown = currentPage * pageSize;
  
  if (totalShown >= filteredCourses.length) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'flex';
    loadMoreBtn.querySelector('span').textContent = `加载更多 (${filteredCourses.length - totalShown}门)`;
  }
}

// 更新统计数据
function updateStats() {
  if (typeof COURSES_DATA !== 'undefined') {
    const total = COURSES_DATA.length;
    const totalHours = COURSES_DATA.reduce((sum, c) => {
      const hours = parseFloat(c.duration);
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);
    const freeCount = COURSES_DATA.filter(c => c.price === '免费').length;
    
    document.getElementById('totalCourses').textContent = total;
    document.getElementById('totalHours').textContent = Math.round(totalHours) + '+';
    document.getElementById('freeCourses').textContent = freeCount;
  }
}

// 显示课程详情
function showCourseDetail(courseId) {
  const course = COURSES_DATA.find(c => c.id === courseId);
  if (!course) return;
  
  // 填充弹窗数据
  document.getElementById('modalIcon').textContent = course.icon;
  document.getElementById('modalTitle').textContent = course.title;
  document.getElementById('modalDesc').textContent = course.desc;
  document.getElementById('modalLessons').textContent = course.lessons + '节课';
  document.getElementById('modalDuration').textContent = course.duration;
  document.getElementById('modalPrice').textContent = course.price;
  
  // 设置头部背景
  document.getElementById('modalHeader').style.background = course.gradient;
  
  // 徽章
  const badgeEl = document.getElementById('modalBadge');
  if (course.badge) {
    badgeEl.textContent = course.badge;
    badgeEl.style.display = 'block';
  } else {
    badgeEl.style.display = 'none';
  }
  
  // 标签
  document.getElementById('modalTags').innerHTML = course.tags
    .map(tag => `<span class="modal-tag">${tag}</span>`)
    .join('');
  
  // 生成课程大纲
  const outlineItems = generateCourseOutline(course);
  document.getElementById('modalOutline').innerHTML = outlineItems
    .map((item, i) => `<li><span class="outline-num">${i + 1}</span>${item}</li>`)
    .join('');
  
  // 显示弹窗
  document.getElementById('courseModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// 生成课程大纲
function generateCourseOutline(course) {
  const outlines = {
    beginner: [
      '恋爱观念建立与自我认知',
      '形象管理与第一印象打造',
      '社交圈拓展与认识TA的方法',
      '聊天破冰与话题延续技巧',
      '约会准备与礼仪规范',
      '表白时机与方式选择',
      '关系推进与节奏把控',
      '常见问题与误区避坑'
    ],
    chat: [
      '高情商聊天的基本原则',
      '开场白设计与实践',
      '话题挖掘与延伸技巧',
      '幽默感的培养与运用',
      '倾听与共情的艺术',
      '聊天节奏与频率控制',
      '深夜聊天的特殊技巧',
      '冷场急救与尴尬化解'
    ],
    date: [
      '约会前的准备工作',
      '地点选择与氛围营造',
      '穿搭建议与形象管理',
      '约会话题与互动游戏',
      '肢体接触的时机与方式',
      '约会中的礼仪细节',
      '意外情况的处理方法',
      '约会后的跟进策略'
    ],
    relationship: [
      '长期关系的维护原则',
      '有效沟通与矛盾处理',
      '信任建立与边界设定',
      '新鲜感的保持方法',
      '异地恋的特殊挑战',
      '家庭关系的处理',
      '财务问题的协商',
      '未来规划与共同成长'
    ]
  };
  
  return outlines[course.category] || outlines.beginner;
}

// 关闭课程详情弹窗
function closeCourseModal(event) {
  if (!event || event.target.id === 'courseModal' || event.target.classList.contains('modal-close')) {
    document.getElementById('courseModal').style.display = 'none';
    document.body.style.overflow = '';
  }
}

// 开始学习
function startLearning() {
  alert('课程学习功能即将上线，敬请期待！\n\n您可以先收藏本课程，上线后第一时间通知您。');
  closeCourseModal();
}

// 导出页面配置
window.CoursePage = {
  init: initCourse,
  searchCourses,
  loadMoreCourses,
  showCourseDetail,
  closeCourseModal,
  startLearning
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCourse);
} else {
  initCourse();
}

} // 结束防止重复加载的if块
