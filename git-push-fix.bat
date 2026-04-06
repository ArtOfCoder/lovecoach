@echo off
chcp 65001 >nul
title 修复Git推送问题
echo ========================================
echo    修复Git推送问题
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

echo [信息] 使用Git: %GIT_PATH%
echo.

REM 进入项目目录
cd /d "c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp"

echo [步骤 1/3] 拉取远程仓库内容...
"%GIT_PATH%" pull origin main --allow-unrelated-histories 2>nul
if errorlevel 1 (
    "%GIT_PATH%" pull origin master --allow-unrelated-histories 2>nul
)
echo [完成] 拉取完成
echo.

echo [步骤 2/3] 再次提交本地更改...
"%GIT_PATH%" add .
"%GIT_PATH%" commit -m "Update: 添加小程序双版本代码" 2>nul
echo [完成] 提交完成
echo.

echo [步骤 3/3] 推送到GitHub...
"%GIT_PATH%" push -u origin main 2>nul
if errorlevel 1 (
    echo 尝试推送到master分支...
    "%GIT_PATH%" push -u origin master
)

echo.
echo ========================================
if errorlevel 1 (
    echo [错误] 推送失败
    echo.
    echo 尝试强制推送（会覆盖远程内容）...
    echo 注意：这将覆盖GitHub上的现有内容！
    set /p CONFIRM="确定要继续吗？(y/n): "
    if /i "%CONFIRM%"=="y" (
        "%GIT_PATH%" push -f origin main 2>nul
        if errorlevel 1 (
            "%GIT_PATH%" push -f origin master
        )
        echo [完成] 强制推送完成
    ) else (
        echo 已取消
    )
) else (
    echo [成功] 代码已推送到GitHub！
)
echo ========================================
echo.
pause
