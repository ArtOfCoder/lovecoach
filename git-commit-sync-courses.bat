@echo off
chcp 65001 >nul
echo ========================================
echo    同步课程数据 + H5功能完善 提交脚本
echo ========================================
echo.

cd /d "c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp"

echo [1/4] 查看当前状态...
git status
echo.

echo [2/4] 添加所有文件...
git add -A
echo.

echo [3/4] 提交代码...
git commit -m "feat: 同步120门课程到小程序+搜索分类功能+H5完善

小程序版本:
- data/courses.js: 新增40+门课程(入门/聊天/约会/关系/心理/分手分类)
- pages/course/course.js: 重写分类逻辑，支持新6大分类+关键词搜索
- pages/course/course.wxml: 添加搜索栏、课程数量徽章、改善空状态
- pages/course/course.wxss: 搜索栏样式、数量徽章、空状态美化

H5版本:
- 新增课程页面、聊天回复页面、管理员后台
- 120门课程数据 (入门/聊天/约会/关系维护/进阶心理)
- 修复JS重复声明、路由404等问题"

echo.

echo [4/4] 推送到GitHub...
git push origin main
echo.

if %errorlevel% == 0 (
  echo ✅ 推送成功！代码已更新到 GitHub
) else (
  echo ❌ 推送失败，尝试先拉取远程更新...
  git pull origin main --allow-unrelated-histories
  git push origin main
)

echo.
pause
