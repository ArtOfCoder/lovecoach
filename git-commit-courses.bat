@echo off
chcp 65001 >nul
echo ==========================================
echo    提交120门课程数据到GitHub
echo ==========================================
echo.

cd /d "c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp"

echo [1/4] 添加新文件...
git add h5-version/data/courses.js
git add h5-version/pages/course/course.html
git add h5-version/pages/course/course.css
git add h5-version/pages/course/course.js
git add h5-version/index.html
git add git-commit-courses.bat

echo.
echo [2/4] 提交更改...
git commit -m "feat: 添加120门恋爱课程数据

- 新增120门系统恋爱课程，涵盖12个分类
- 每门课程包含完整大纲、标签、难度等级
- 课程页面支持分类筛选和搜索功能
- 添加课程详情弹窗展示
- 支持加载更多和统计展示

课程分类：
- 恋爱入门（10门）
- 聊天技巧（15门）
- 约会攻略（12门）
- 关系维护（12门）
- 形象提升（10门）
- 心理分析（10门）
- 挽回修复（10门）
- 长期关系（10门）
- 社交拓展（10门）
- 自我成长（11门）
- 情感疗愈（10门）
- 特殊场景（10门）"

echo.
echo [3/4] 推送到GitHub...
git push origin main

echo.
echo ==========================================
echo    提交完成！
echo ==========================================
echo.
echo Vercel将自动重新部署
echo 访问地址: https://lovecoach-gxf20jhfi-artofcoders-projects.vercel.app/
echo.
pause
