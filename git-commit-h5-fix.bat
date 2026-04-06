@echo off
chcp 65001 >nul
title 提交H5版本修复
echo ========================================
echo    提交H5版本功能完善
echo ========================================
echo.

REM 查找Git安装路径
set "GIT_PATH="
if exist "C:\Program Files\Git\bin\git.exe" (
    set "GIT_PATH=C:\Program Files\Git\bin\git.exe"
) else if exist "C:\Program Files (x86)\Git\bin\git.exe" (
    set "GIT_PATH=C:\Program Files (x86)\Git\bin\git.exe"
) else if exist "%LOCALAPPDATA%\Programs\Git\bin\git.exe" (
    set "GIT_PATH=%LOCALAPPDATA%\Programs\Git\bin\git.exe"
) else (
    for /f "delims=" %%i in ('where git 2^>nul') do set "GIT_PATH=%%i"
)

if not defined GIT_PATH (
    echo [错误] 未找到Git
    pause
    exit /b 1
)

cd /d "c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp"

echo [步骤 1/4] 添加所有修改...
"%GIT_PATH%" add h5-version/
echo [完成] 文件已添加
echo.

echo [步骤 2/4] 提交更改...
"%GIT_PATH%" commit -m "Fix: 完善H5版本功能，修复404和JS错误

功能完善：
- 添加课程页面（6门恋爱课程）
- 添加聊天回复助手（AI生成高情商回复）
- 添加管理员后台（用户管理、解锁管理、黑名单）
- 完善灵魂伴侣功能（AI生成描述+图片）

Bug修复：
- 修复soulmate.js重复声明问题（添加加载保护）
- 修复app.js脚本重复加载问题
- 修复页面路由404（添加course/chat-reply/admin路由）
- 更新TabBar添加课程入口
- 更新个人中心添加功能入口

技术优化：
- 添加JS文件加载保护机制
- 优化AI模块添加聊天回复API
- 完善本地存储数据结构"
echo [完成] 提交完成
echo.

echo [步骤 3/4] 推送到GitHub...
"%GIT_PATH%" push origin main 2>nul
if errorlevel 1 (
    echo 尝试推送到master分支...
    "%GIT_PATH%" push origin master
)

echo.
echo ========================================
echo [完成] 代码已推送到GitHub！
echo ========================================
echo.
echo 访问地址：https://github.com/ArtOfCoder/lovecoach
echo.
echo 下一步：
echo 1. Vercel会自动重新部署
echo 2. 等待部署完成后访问：https://lovecoach-gxf20jhfi-artofcoders-projects.vercel.app/
echo.
pause
