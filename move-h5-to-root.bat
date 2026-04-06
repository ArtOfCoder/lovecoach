@echo off
chcp 65001 >nul
title 移动H5文件到根目录
echo ========================================
echo    移动H5文件到仓库根目录
echo ========================================
echo.

cd /d "c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp"

echo [步骤 1/4] 复制H5版本文件到根目录...

REM 复制主要文件
copy "h5-version\index.html" "index.html" /Y
copy "h5-version\vercel.json" "vercel.json" /Y
copy "h5-version\package.json" "package.json" /Y
copy "h5-version\README.md" "README-H5.md" /Y

echo [完成] 主要文件已复制
echo.

echo [步骤 2/4] 复制目录...

REM 复制js目录
if not exist "js" mkdir js
xcopy "h5-version\js\*" "js\" /E /Y /I

REM 复制utils目录  
if not exist "utils-h5" mkdir utils-h5
xcopy "h5-version\utils\*" "utils-h5\" /E /Y /I

REM 复制styles目录
if not exist "styles" mkdir styles
xcopy "h5-version\styles\*" "styles\" /E /Y /I

REM 复制pages目录
if not exist "pages-h5" mkdir pages-h5
xcopy "h5-version\pages\*" "pages-h5\" /E /Y /I

REM 复制images目录
if not exist "images-h5" mkdir images-h5
xcopy "h5-version\images\*" "images-h5\" /E /Y /I

echo [完成] 目录已复制
echo.

echo [步骤 3/4] 更新文件路径...

REM 更新index.html中的路径
powershell -Command "(Get-Content 'index.html') -replace './js/', './js/' -replace './utils/', './utils-h5/' -replace './styles/', './styles/' -replace './pages/', './pages-h5/' -replace './images/', './images-h5/' | Set-Content 'index.html'"

echo [完成] 路径已更新
echo.

echo [步骤 4/4] 提交到GitHub...

REM 查找Git
set "GIT_PATH="
if exist "C:\Program Files\Git\bin\git.exe" (
    set "GIT_PATH=C:\Program Files\Git\bin\git.exe"
) else (
    for /f "delims=" %%i in ('where git 2^>nul') do set "GIT_PATH=%%i"
)

if defined GIT_PATH (
    "%GIT_PATH%" add index.html vercel.json package.json README-H5.md js/ utils-h5/ styles/ pages-h5/ images-h5/
    "%GIT_PATH%" commit -m "Deploy: 将H5版本移到根目录用于Vercel部署"
    "%GIT_PATH%" push origin main 2>nul
    if errorlevel 1 "%GIT_PATH%" push origin master
    echo [完成] 已推送到GitHub
) else (
    echo [警告] 未找到Git，请手动提交
)

echo.
echo ========================================
echo [完成] H5文件已移到根目录！
echo ========================================
echo.
echo 请访问Vercel重新部署项目
echo.
pause
