@echo off
chcp 65001 >nul
title 更新GitHub代码
echo ========================================
echo    更新GitHub代码（修复Vercel 404）
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

REM 进入项目目录
cd /d "c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp"

echo [步骤 1/3] 添加修改的文件...
"%GIT_PATH%" add h5-version/vercel.json h5-version/package.json
echo [完成] 文件已添加
echo.

echo [步骤 2/3] 提交更改...
"%GIT_PATH%" commit -m "Fix: 添加Vercel配置文件修复404错误

- 添加vercel.json配置静态站点路由
- 添加package.json定义项目元数据
- 配置rewrites规则确保SPA路由正常工作"
echo [完成] 提交完成
echo.

echo [步骤 3/3] 推送到GitHub...
"%GIT_PATH%" push origin main 2>nul
if errorlevel 1 (
    "%GIT_PATH%" push origin master
)

echo.
echo ========================================
echo [完成] 代码已更新到GitHub！
echo ========================================
echo.
echo 接下来请在Vercel重新部署：
echo 1. 访问 https://vercel.com/dashboard
echo 2. 找到 lovecoach-theta 项目
echo 3. 点击 Redeploy 重新部署
echo.
pause
