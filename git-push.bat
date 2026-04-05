@echo off
chcp 65001 >nul
title 提交代码到GitHub
echo ========================================
echo    恋爱进化论小程序 - Git提交脚本
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
    echo 正在搜索Git...
    for /f "delims=" %%i in ('where git 2^>nul') do set "GIT_PATH=%%i"
)

if not defined GIT_PATH (
    echo [错误] 未找到Git，请确保Git已正确安装
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [信息] 使用Git: %GIT_PATH%
echo.

REM 进入项目目录
cd /d "c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp"

REM 检查Git版本
echo [步骤 1/6] 检查Git版本...
"%GIT_PATH%" --version
echo.

REM 配置Git用户信息
echo [步骤 2/6] 配置Git用户信息...
set /p GIT_NAME="请输入你的Git用户名: "
if "%GIT_NAME%"=="" set GIT_NAME=Developer

set /p GIT_EMAIL="请输入你的Git邮箱: "
if "%GIT_EMAIL%"=="" set GIT_EMAIL=developer@example.com

"%GIT_PATH%" config --global user.name "%GIT_NAME%"
"%GIT_PATH%" config --global user.email "%GIT_EMAIL%"
echo [完成] Git用户配置完成
echo.

REM 初始化Git仓库
echo [步骤 3/6] 初始化Git仓库...
if exist ".git" (
    echo [提示] Git仓库已存在，跳过初始化
) else (
    "%GIT_PATH%" init
    echo [完成] Git仓库初始化完成
)
echo.

REM 创建.gitignore
echo [步骤 4/6] 创建.gitignore文件...
if not exist ".gitignore" (
    (
        echo # 小程序开发工具配置
        echo project.private.config.json
        echo.
        echo # 依赖目录
        echo node_modules/
        echo miniprogram_npm/
        echo.
        echo # 日志文件
        echo *.log
        echo npm-debug.log*
        echo.
        echo # 临时文件
        echo *.tmp
        echo *.temp
        echo.
        echo # 系统文件
        echo .DS_Store
        echo Thumbs.db
        echo.
        echo # 编辑器配置
        echo .vscode/
        echo .idea/
        echo *.swp
        echo *.swo
        echo.
        echo # 云开发环境配置
        echo cloudfunctions/*/config.json
        echo.
        echo # 工作记忆
        echo .workbuddy/memory/
        echo.
        echo # 生成的图片
        echo generated-images/
    ) > .gitignore
    echo [完成] .gitignore创建完成
) else (
    echo [提示] .gitignore已存在
)
echo.

REM 添加文件
echo [步骤 5/6] 添加文件到Git...
"%GIT_PATH%" add .
echo [完成] 文件已添加到暂存区
echo.

REM 提交
echo [步骤 6/6] 提交代码...
"%GIT_PATH%" commit -m "Initial commit: 恋爱进化论小程序双版本

- 小程序版本：移除AI功能，符合个人主体审核要求
- H5版本：保留完整AI功能（DeepSeek API）
- 添加灵魂伴侣测算功能（星盘+本地算法）
- 添加支付解锁功能（微信打赏+客服解锁）
- 添加管理员后台（本地存储模式）
- 添加AI顾问、聊天回复、情侣档案等功能

技术栈：微信小程序原生 + H5适配"

echo.
echo ========================================
echo [完成] 代码已提交到本地仓库！
echo ========================================
echo.

REM 添加远程仓库并推送
echo 准备推送到GitHub...
"%GIT_PATH%" remote add origin https://github.com/ArtOfCoder/lovecoach.git 2>nul

echo 正在推送到GitHub...
"%GIT_PATH%" push -u origin main 2>nul
if errorlevel 1 (
    "%GIT_PATH%" push -u origin master
)

echo.
echo ========================================
echo    提交完成！
echo ========================================
echo.
echo 仓库地址: https://github.com/ArtOfCoder/lovecoach
echo.
pause
