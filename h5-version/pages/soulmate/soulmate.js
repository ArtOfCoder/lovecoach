/**
 * H5版本 灵魂伴侣页面逻辑 - 保留完整AI功能
 */

// 防止重复加载
if (window.SoulmatePageLoaded) {
  console.log('Soulmate page already loaded, skipping...');
} else {
  window.SoulmatePageLoaded = true;

// 页面状态
let currentStep = 'input';
let userGender = null;
let birthDate = { year: '', month: '', day: '' };
let birthCity = '';
let soulmateData = null;
let userId = '';

// 星座数据
const ZODIAC_DATA = [
  { name: '白羊座', symbol: '♈', dates: [[3, 21], [4, 19]], soulmate: '天秤座' },
  { name: '金牛座', symbol: '♉', dates: [[4, 20], [5, 20]], soulmate: '天蝎座' },
  { name: '双子座', symbol: '♊', dates: [[5, 21], [6, 21]], soulmate: '射手座' },
  { name: '巨蟹座', symbol: '♋', dates: [[6, 22], [7, 22]], soulmate: '摩羯座' },
  { name: '狮子座', symbol: '♌', dates: [[7, 23], [8, 22]], soulmate: '水瓶座' },
  { name: '处女座', symbol: '♍', dates: [[8, 23], [9, 22]], soulmate: '双鱼座' },
  { name: '天秤座', symbol: '♎', dates: [[9, 23], [10, 23]], soulmate: '白羊座' },
  { name: '天蝎座', symbol: '♏', dates: [[10, 24], [11, 22]], soulmate: '金牛座' },
  { name: '射手座', symbol: '♐', dates: [[11, 23], [12, 21]], soulmate: '双子座' },
  { name: '摩羯座', symbol: '♑', dates: [[12, 22], [1, 19]], soulmate: '巨蟹座' },
  { name: '水瓶座', symbol: '♒', dates: [[1, 20], [2, 18]], soulmate: '狮子座' },
  { name: '双鱼座', symbol: '♓', dates: [[2, 19], [3, 20]], soulmate: '处女座' },
];

// 初始化页面
function initSoulmate() {
  // 生成用户ID
  userId = generateUserId();
  document.getElementById('userIdDisplay').textContent = userId;
  
  // 检查是否已解锁
  const unlocked = localStorage.getItem(`soulmate_unlocked_${userId}`);
  if (unlocked === 'true') {
    // 从本地存储加载结果
    const saved = localStorage.getItem(`soulmate_data_${userId}`);
    if (saved) {
      soulmateData = JSON.parse(saved);
      showResult(true);
    }
  }
  
  // 绑定输入事件
  document.getElementById('birthYear').addEventListener('input', (e) => {
    birthDate.year = e.target.value;
  });
  document.getElementById('birthMonth').addEventListener('input', (e) => {
    birthDate.month = e.target.value;
  });
  document.getElementById('birthDay').addEventListener('input', (e) => {
    birthDate.day = e.target.value;
  });
  document.getElementById('birthCity').addEventListener('input', (e) => {
    birthCity = e.target.value;
  });
}

// 生成用户ID
function generateUserId() {
  const saved = localStorage.getItem('soulmate_user_id');
  if (saved) return saved;
  
  const id = 'USER' + Date.now().toString(36).toUpperCase();
  localStorage.setItem('soulmate_user_id', id);
  return id;
}

// 选择性别
function selectGender(gender) {
  userGender = gender;
  document.getElementById('genderMale').classList.toggle('active', gender === 'male');
  document.getElementById('genderFemale').classList.toggle('active', gender === 'female');
}

// 开始生成
function startGenerate() {
  // 验证输入
  if (!userGender) {
    alert('请选择性别');
    return;
  }
  
  const year = parseInt(birthDate.year);
  const month = parseInt(birthDate.month);
  const day = parseInt(birthDate.day);
  
  if (!year || !month || !day) {
    alert('请填写完整的出生日期');
    return;
  }
  
  if (year < 1950 || year > 2020) {
    alert('请输入有效的年份（1950-2020）');
    return;
  }
  
  if (month < 1 || month > 12) {
    alert('请输入有效的月份（1-12）');
    return;
  }
  
  if (day < 1 || day > 31) {
    alert('请输入有效的日期（1-31）');
    return;
  }
  
  // 切换到加载页
  showStep('loading');
  
  // 计算星盘
  const zodiac = getZodiac(month, day);
  const moonSign = getMoonSign(month, day);
  const ascendant = getAscendant(month, day, birthCity);
  
  soulmateData = {
    zodiac,
    moonSign,
    ascendant,
    soulmateZodiac: zodiac.soulmate,
    birthDate: { year, month, day },
    birthCity,
    userGender,
    unlocked: false
  };
  
  // 模拟加载步骤
  const loadingTexts = [
    'AI正在分析星盘...',
    'AI正在计算月亮星座...',
    'AI正在推算上升星座...',
    'AI正在寻找灵魂伴侣...',
    'AI正在生成专属画像...'
  ];
  
  let step = 0;
  const interval = setInterval(() => {
    if (step < loadingTexts.length) {
      document.getElementById('loadingText').textContent = loadingTexts[step];
      document.getElementById(`dot${step}`).classList.add('done');
      step++;
    } else {
      clearInterval(interval);
      // 调用AI生成描述
      generateSoulmateDesc();
    }
  }, 600);
}

// 获取星座
function getZodiac(month, day) {
  for (const z of ZODIAC_DATA) {
    const [start, end] = z.dates;
    if ((month === start[0] && day >= start[1]) || 
        (month === end[0] && day <= end[1]) ||
        (start[0] > end[0] && (month > start[0] || month < end[0]))) {
      return z;
    }
  }
  return ZODIAC_DATA[0];
}

// 获取月亮星座（简化算法）
function getMoonSign(month, day) {
  const signs = ['巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', 
                 '摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座'];
  const index = (month + day) % 12;
  return signs[index];
}

// 获取上升星座（简化算法）
function getAscendant(month, day, city) {
  const signs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
                 '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
  const cityOffset = city ? city.length % 6 : 0;
  const index = (month + day + cityOffset) % 12;
  return signs[index];
}

// AI生成灵魂伴侣描述
function generateSoulmateDesc() {
  window.AI.generateSoulmateDesc({
    zodiac: soulmateData.zodiac.name,
    moonSign: soulmateData.moonSign,
    ascendant: soulmateData.ascendant,
    birthCity: soulmateData.birthCity,
    userGender: soulmateData.userGender
  }, (desc) => {
    soulmateData.desc = desc;
    showResult(false);
  }, (error) => {
    console.error('AI生成失败:', error);
    // 使用本地备用描述
    soulmateData.desc = generateLocalDesc(soulmateData.zodiac.name, soulmateData.soulmateZodiac);
    showResult(false);
  });
}

// 生成本地备用描述
function generateLocalDesc(zodiac, soulmateZodiac) {
  const descs = [
    `TA是${soulmateZodiac}的灵魂，温柔而坚定。你们会在一个意想不到的时刻相遇，TA会懂你的沉默，也会陪你疯陪你闹。`,
    `命中注定的${soulmateZodiac}，有着让你心安的力量。不需要太多言语，一个眼神就能明白彼此。`,
    `你的${soulmateZodiac}灵魂伴侣，会在你最需要的时候出现。TA会包容你的小脾气，也会陪你一起成长。`
  ];
  return descs[Math.floor(Math.random() * descs.length)];
}

// 显示结果页
function showResult(unlocked) {
  soulmateData.unlocked = unlocked;
  
  // 保存数据
  localStorage.setItem(`soulmate_data_${userId}`, JSON.stringify(soulmateData));
  
  // 更新UI
  document.getElementById('zodiacSymbol').textContent = soulmateData.zodiac.symbol;
  document.getElementById('zodiacName').textContent = soulmateData.zodiac.name;
  document.getElementById('moonSign').textContent = soulmateData.moonSign;
  document.getElementById('soulmateSubtitle').textContent = 
    `你的${soulmateData.zodiac.name}星盘，与${soulmateData.soulmateZodiac}灵魂共鸣`;
  document.getElementById('soulmateDesc').textContent = soulmateData.desc;
  document.getElementById('sunSign').textContent = `${soulmateData.zodiac.symbol} ${soulmateData.zodiac.name}`;
  document.getElementById('ascendant').textContent = `↑ ${soulmateData.ascendant}`;
  document.getElementById('moonSignDetail').textContent = `🌙 ${soulmateData.moonSign}`;
  document.getElementById('soulmateZodiac').textContent = `💕 ${soulmateData.soulmateZodiac}`;
  
  if (unlocked) {
    document.getElementById('avatarBlur').style.display = 'none';
    document.getElementById('avatarUnlocked').style.display = 'block';
    document.getElementById('paySection').style.display = 'none';
    document.getElementById('unlockedActions').style.display = 'flex';
    document.getElementById('regenBtn').style.display = 'block';
    
    // 生成AI图片
    generateSoulmateImage();
  }
  
  showStep('result');
}

// 生成灵魂伴侣图片
function generateSoulmateImage() {
  const targetGender = soulmateData.userGender === 'male' ? 'female' : 'male';
  
  window.AI.generateSoulmateImage({
    zodiac: soulmateData.soulmateZodiac,
    gender: targetGender,
    desc: soulmateData.desc,
    seed: soulmateData.birthDate.day + soulmateData.birthDate.month
  }, (imageUrl) => {
    document.getElementById('unlockedImage').src = imageUrl;
    soulmateData.imageUrl = imageUrl;
    localStorage.setItem(`soulmate_data_${userId}`, JSON.stringify(soulmateData));
  }, (error) => {
    console.error('图片生成失败:', error);
  });
}

// 显示打赏弹窗
function showPayModal() {
  // 滚动到打赏区域
  document.getElementById('paySection').scrollIntoView({ behavior: 'smooth' });
}

// 复制用户ID
function copyUserId() {
  navigator.clipboard.writeText(userId).then(() => {
    alert('用户ID已复制：' + userId);
  }).catch(() => {
    // 降级方案
    const input = document.createElement('input');
    input.value = userId;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    alert('用户ID已复制：' + userId);
  });
}

// 保存图片
function saveImage() {
  const img = document.getElementById('unlockedImage');
  if (img.src) {
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `灵魂伴侣_${userId}.jpg`;
    link.click();
  }
}

// 分享结果
function shareResult() {
  if (navigator.share) {
    navigator.share({
      title: '我的AI灵魂伴侣测算结果',
      text: `我是${soulmateData.zodiac.name}，命中注定的灵魂伴侣是${soulmateData.soulmateZodiac}！`,
      url: window.location.href
    });
  } else {
    alert('分享功能需要在支持的浏览器中使用');
  }
}

// 返回重新测算
function goBack() {
  showStep('input');
}

// 切换步骤
function showStep(step) {
  currentStep = step;
  document.getElementById('stepInput').style.display = step === 'input' ? 'block' : 'none';
  document.getElementById('stepLoading').style.display = step === 'loading' ? 'block' : 'none';
  document.getElementById('stepResult').style.display = step === 'result' ? 'block' : 'none';
  
  // 滚动到顶部
  window.scrollTo(0, 0);
}

// 导出页面配置
window.SoulmatePage = {
  init: initSoulmate,
  selectGender,
  startGenerate,
  showPayModal,
  copyUserId,
  saveImage,
  shareResult,
  goBack
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSoulmate);
} else {
  // DOM已加载，直接初始化
  initSoulmate();
}

} // 结束防止重复加载的if块
