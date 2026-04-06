/**
 * 课程页面逻辑 - 支持分类搜索/支付解锁/课程阅读
 */

// 防止重复加载
if (window.CoursePageLoaded) {
  console.log('Course page already loaded, skipping...');
} else {
  window.CoursePageLoaded = true;

// ======= 页面状态 =======
let currentCategory = 'all';
let currentPage = 1;
const pageSize = 12;
let filteredCourses = [];
let searchKeyword = '';
let currentCourseId = null;  // 当前打开的课程ID（支付用）

// 课程阅读状态
let currentLessonCourse = null;
let currentLessonIndex = 0;

// 本地存储：已购买的课程ID列表
function getPurchasedCourses() {
  try {
    return JSON.parse(localStorage.getItem('purchased_courses') || '[]');
  } catch(e) { return []; }
}

function isPurchased(courseId) {
  return getPurchasedCourses().includes(courseId);
}

// ======= 初始化 =======
function initCourse() {
  loadCoursesData();

  // 绑定分类切换
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentCategory = item.dataset.cat;
      currentPage = 1;
      filterAndRenderCourses();
    });
  });

  updateStats();
}

// ======= 数据加载 =======
function loadCoursesData() {
  if (typeof COURSES_DATA !== 'undefined') {
    filteredCourses = [...COURSES_DATA];
    renderCourses();
  } else {
    document.getElementById('courseList').innerHTML = `
      <div class="course-loading">
        <div class="loading-spinner"></div>
        <p>加载课程中...</p>
      </div>
    `;
    setTimeout(loadCoursesData, 500);
  }
}

// ======= 筛选 =======
function filterAndRenderCourses() {
  filteredCourses = COURSES_DATA.filter(course => {
    const matchCategory = currentCategory === 'all' || course.category === currentCategory;
    const matchSearch = !searchKeyword ||
      course.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      course.desc.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (course.tags || []).some(tag => tag.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchCategory && matchSearch;
  });

  currentPage = 1;
  renderCourses();
  updateLoadMoreButton();
}

// ======= 渲染课程列表 =======
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

  const end = currentPage * pageSize;
  const coursesToShow = filteredCourses.slice(0, end);
  const html = coursesToShow.map(course => createCourseCard(course)).join('');

  if (currentPage === 1) {
    listContainer.innerHTML = html;
  } else {
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

// ======= 课程卡片HTML =======
function createCourseCard(course) {
  const isFree = course.price === '免费';
  const purchased = isPurchased(course.id);
  const priceClass = isFree ? 'course-free' : 'course-price';
  const badgeHtml = course.badge ? `<div class="course-badge">${course.badge}</div>` : '';
  const lockIcon = (!isFree && !purchased) ? '<div class="course-lock-icon">🔒</div>' : '';
  const purchasedBadge = purchased ? '<div class="course-bought-badge">已购买</div>' : '';

  return `
    <div class="course-card" data-id="${course.id}" data-cat="${course.category}">
      <div class="course-cover" style="background: ${course.gradient};">
        <div class="course-icon">${course.icon}</div>
        ${badgeHtml}
        ${lockIcon}
        ${purchasedBadge}
      </div>
      <div class="course-info">
        <div class="course-title">${course.title}</div>
        <div class="course-desc">${course.desc}</div>
        <div class="course-tags">
          ${(course.tags || []).slice(0, 3).map(tag => `<span class="course-tag">${tag}</span>`).join('')}
        </div>
        <div class="course-meta">
          <span class="course-lessons">${course.lessons}节课</span>
          <span class="course-duration">${course.duration}</span>
          <span class="${priceClass}">${isFree ? '免费' : (purchased ? '✅已购买' : course.price)}</span>
        </div>
      </div>
    </div>
  `;
}

// ======= 课程搜索 =======
function searchCourses(keyword) {
  searchKeyword = keyword.trim();
  currentPage = 1;
  filterAndRenderCourses();
}

// ======= 加载更多 =======
function loadMoreCourses() {
  currentPage++;
  renderCourses();
}

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

// ======= 统计数据 =======
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

// ======= 课程详情弹窗 =======
function showCourseDetail(courseId) {
  const course = COURSES_DATA.find(c => c.id === courseId);
  if (!course) return;

  currentCourseId = courseId;
  const isFree = course.price === '免费';
  const purchased = isPurchased(courseId);

  document.getElementById('modalIcon').textContent = course.icon;
  document.getElementById('modalTitle').textContent = course.title;
  document.getElementById('modalDesc').textContent = course.desc;
  document.getElementById('modalLessons').textContent = course.lessons + '节课';
  document.getElementById('modalDuration').textContent = course.duration;

  // 价格显示
  const priceEl = document.getElementById('modalPrice');
  if (isFree) {
    priceEl.textContent = '免费';
    priceEl.className = 'meta-price-free';
  } else if (purchased) {
    priceEl.textContent = '✅ 已购买';
    priceEl.className = 'meta-price-bought';
  } else {
    priceEl.textContent = course.price;
    priceEl.className = 'meta-price-paid';
  }

  document.getElementById('modalHeader').style.background = course.gradient;

  const badgeEl = document.getElementById('modalBadge');
  if (course.badge) {
    badgeEl.textContent = course.badge;
    badgeEl.style.display = 'block';
  } else {
    badgeEl.style.display = 'none';
  }

  document.getElementById('modalTags').innerHTML = (course.tags || [])
    .map(tag => `<span class="modal-tag">${tag}</span>`)
    .join('');

  const outlineItems = generateCourseOutline(course);
  document.getElementById('modalOutline').innerHTML = outlineItems
    .map((item, i) => `<li><span class="outline-num">${i + 1}</span>${item}</li>`)
    .join('');

  // 按钮逻辑
  document.getElementById('btnStartFree').style.display = isFree ? 'block' : 'none';
  document.getElementById('btnBuyPaid').style.display = (!isFree && !purchased) ? 'block' : 'none';
  document.getElementById('btnContinue').style.display = (purchased && !isFree) ? 'block' : 'none';

  document.getElementById('courseModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ======= 生成课程大纲 =======
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
      '常见问题与误区避坑',
    ],
    chat: [
      '高情商聊天的基本原则',
      '开场白设计与实践',
      '话题挖掘与延伸技巧',
      '幽默感的培养与运用',
      '倾听与共情的艺术',
      '聊天节奏与频率控制',
      '深夜聊天的特殊技巧',
      '冷场急救与尴尬化解',
    ],
    date: [
      '约会前的准备工作',
      '地点选择与氛围营造',
      '穿搭建议与形象管理',
      '约会话题与互动游戏',
      '肢体接触的时机与方式',
      '约会中的礼仪细节',
      '意外情况的处理方法',
      '约会后的跟进策略',
    ],
    relationship: [
      '长期关系的维护原则',
      '有效沟通与矛盾处理',
      '信任建立与边界设定',
      '新鲜感的保持方法',
      '异地恋的特殊挑战',
      '家庭关系的处理',
      '财务问题的协商',
      '未来规划与共同成长',
    ],
    psychology: [
      '爱情的心理学基础',
      '依附风格与关系模式',
      '认知行为与情感管理',
      '自我价值感的建立',
      '边界感与自我保护',
      '焦虑与安全感的来源',
      '讨好型人格的突破',
      '心理成长与关系升华',
    ],
    breakup: [
      '分手信号的识别',
      '如何有尊严地结束一段关系',
      '失恋心理阶段与应对',
      '走出失恋的实践方法',
      '复盘与成长',
      '挽回的时机与策略',
      '放手与接受的智慧',
      '重新开始的准备',
    ],
  };

  return outlines[course.category] || outlines.beginner;
}

// ======= 关闭课程弹窗 =======
function closeCourseModal(event) {
  if (!event || event.target.id === 'courseModal' || event.target.classList.contains('modal-close')) {
    document.getElementById('courseModal').style.display = 'none';
    document.body.style.overflow = '';
    currentCourseId = null;
  }
}

// ======= 开始学习（免费/已购买） =======
function startLearning() {
  const course = COURSES_DATA.find(c => c.id === currentCourseId);
  if (!course) return;
  closeCourseModal();
  openLessonReader(course);
}

// ======= 支付弹窗 =======
function showPayModal() {
  const course = COURSES_DATA.find(c => c.id === currentCourseId);
  if (!course) return;

  // 先关闭课程详情弹窗
  document.getElementById('courseModal').style.display = 'none';

  // 更新支付信息
  document.getElementById('payModalTitle').textContent = `解锁：${course.title}`;
  document.getElementById('payModalPrice').textContent = course.price.replace('¥', '');
  document.getElementById('payQrAmount').textContent = course.price;

  // 显示用户ID
  const userId = getOrCreateUserId();
  document.getElementById('payUserIdDisplay').textContent = userId;

  document.getElementById('payModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closePayModal(event) {
  if (!event || event.target.id === 'payModal' || event.target.classList.contains('pay-modal-close')) {
    document.getElementById('payModal').style.display = 'none';
    document.body.style.overflow = '';
    // 重新打开课程详情
    if (currentCourseId) {
      showCourseDetail(currentCourseId);
    }
  }
}

function copyPayUserId() {
  const userId = document.getElementById('payUserIdDisplay').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(userId).then(() => {
      showToast('用户ID已复制！');
    });
  } else {
    // 降级方案
    const el = document.createElement('input');
    el.value = userId;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('用户ID已复制！');
  }
}

function getOrCreateUserId() {
  let userId = localStorage.getItem('course_user_id');
  if (!userId) {
    userId = 'CU' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    localStorage.setItem('course_user_id', userId);
  }
  return userId;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'wx-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 1800);
}

// ======= 课程阅读弹窗 =======
function openLessonReader(course) {
  currentLessonCourse = course;

  // 构建虚拟章节（如果没有 chapters，用大纲生成）
  if (!course.chapters || course.chapters.length === 0) {
    const outlines = generateCourseOutline(course);
    course._chapters = outlines.map((title, i) => ({
      id: i + 1,
      title: `第${i + 1}章：${title}`,
      content: generateChapterContent(course, title, i),
    }));
  } else {
    course._chapters = course.chapters;
  }

  currentLessonIndex = 0;
  renderLesson();

  document.getElementById('lessonModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // 记录学习进度
  recordLearningProgress(course.id);
}

function renderLesson() {
  const course = currentLessonCourse;
  const chapters = course._chapters || [];
  const total = chapters.length;
  const current = chapters[currentLessonIndex];

  document.getElementById('lessonTitle').textContent = current ? current.title : course.title;
  document.getElementById('lessonProgressText').textContent = `${currentLessonIndex + 1} / ${total}`;
  document.getElementById('lessonProgressFill').style.width = `${((currentLessonIndex + 1) / total) * 100}%`;

  // 渲染内容（支持简单Markdown）
  const content = current ? current.content : '暂无内容';
  document.getElementById('lessonBody').innerHTML = formatLessonContent(content);

  // 控制按钮状态
  document.getElementById('btnPrevLesson').disabled = currentLessonIndex === 0;
  document.getElementById('btnPrevLesson').style.opacity = currentLessonIndex === 0 ? '0.4' : '1';

  const isLast = currentLessonIndex >= total - 1;
  const nextBtn = document.getElementById('btnNextLesson');
  nextBtn.textContent = isLast ? '完成课程 🎉' : '下一节 ›';
  nextBtn.onclick = isLast ? finishCourse : nextLesson;

  // 滚动到顶部
  document.getElementById('lessonBody').scrollTop = 0;
}

function prevLesson() {
  if (currentLessonIndex > 0) {
    currentLessonIndex--;
    renderLesson();
  }
}

function nextLesson() {
  const chapters = currentLessonCourse._chapters || [];
  if (currentLessonIndex < chapters.length - 1) {
    currentLessonIndex++;
    renderLesson();
  }
}

function finishCourse() {
  showToast('🎉 恭喜完成课程！');
  closeLessonModal();
  // 标记已学习
  const learnedList = JSON.parse(localStorage.getItem('learned_courses') || '[]');
  if (!learnedList.includes(currentLessonCourse.id)) {
    learnedList.push(currentLessonCourse.id);
    localStorage.setItem('learned_courses', JSON.stringify(learnedList));
  }
  // 刷新列表显示
  if (currentLessonCourse) {
    renderCourses();
  }
}

function closeLessonModal(event) {
  if (!event || event.target.id === 'lessonModal' || event.target.classList.contains('lesson-modal-close')) {
    document.getElementById('lessonModal').style.display = 'none';
    document.body.style.overflow = '';
  }
}

function recordLearningProgress(courseId) {
  const progress = JSON.parse(localStorage.getItem('course_progress') || '{}');
  if (!progress[courseId]) {
    progress[courseId] = { startedAt: Date.now(), lastAt: Date.now() };
  } else {
    progress[courseId].lastAt = Date.now();
  }
  localStorage.setItem('course_progress', JSON.stringify(progress));
}

// ======= Markdown简单渲染 =======
function formatLessonContent(content) {
  if (!content) return '';
  // 转义HTML
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')       // **粗体**
    .replace(/^#{1,3}\s+(.+)$/gm, '<h4 class="lesson-h4">$1</h4>')  // # 标题
    .replace(/^[-✅❌✓•]\s+(.+)$/gm, '<div class="lesson-li">$&</div>') // 列表项
    .replace(/\n{2,}/g, '</p><p class="lesson-p">')           // 段落
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p class="lesson-p">')
    .replace(/$/, '</p>');
}

// ======= 生成章节内容（无chapters数据时自动生成） =======
function generateChapterContent(course, chapterTitle, index) {
  const intros = [
    `**本章核心：${chapterTitle}**\n\n在恋爱中，${chapterTitle}是非常重要的一环。很多人忽视了这一点，导致错失了很多机会。\n\n**为什么这很重要？**\n\n通过本章学习，你将掌握具体可操作的技巧，让你在恋爱中更加自信和从容。\n\n**本章学习目标：**\n- 理解核心概念\n- 掌握实践方法\n- 避免常见误区\n\n**实践练习：**\n今天就尝试把本章的方法用在生活中，观察结果并记录下来。`,
    `**${chapterTitle} - 深度解析**\n\n很多人在这个阶段会遇到困惑，这很正常。本章将帮助你系统地理解和应对。\n\n**关键要点：**\n\n✅ 首先，你需要了解基本原理\n✅ 其次，掌握核心技巧\n✅ 最后，在实践中不断调整\n\n**常见误区：**\n❌ 不要过于心急\n❌ 不要忽视细节\n\n记住：每个人的情况不同，方法需要结合自身实际灵活运用。`,
  ];
  return intros[index % 2];
}

// ======= 导出页面配置 =======
window.CoursePage = {
  init: initCourse,
  searchCourses,
  loadMoreCourses,
  showCourseDetail,
  closeCourseModal,
  startLearning,
  showPayModal,
  closePayModal,
  copyPayUserId,
  closeLessonModal,
  prevLesson,
  nextLesson,
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCourse);
} else {
  initCourse();
}

} // 结束防止重复加载的if块
