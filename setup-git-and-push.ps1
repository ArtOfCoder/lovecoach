# 恋爱进化论小程序 - Git安装和代码提交脚本
# 运行此脚本将自动下载安装Git并提交代码到GitHub

param(
    [string]$GitHubRepo = "https://github.com/ArtOfCoder/lovecoach.git",
    [string]$ProjectPath = "c:\Users\Administrator\WorkBuddy\20260328223626\lovecoach-miniapp"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git安装与代码提交脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  建议以管理员身份运行此脚本，以便安装Git到系统路径" -ForegroundColor Yellow
    Write-Host ""
}

# 步骤1: 检查Git是否已安装
Write-Host "步骤 1/5: 检查Git安装状态..." -ForegroundColor Green
$gitPath = Get-Command git -ErrorAction SilentlyContinue

if ($gitPath) {
    Write-Host "✅ Git已安装: $($gitPath.Source)" -ForegroundColor Green
    $gitVersion = git --version
    Write-Host "   版本: $gitVersion" -ForegroundColor Gray
} else {
    Write-Host "❌ Git未安装，开始下载安装..." -ForegroundColor Yellow
    
    # 创建临时目录
    $tempDir = "$env:TEMP\git-installer"
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    
    # 下载Git安装程序 (64位Windows)
    $gitInstallerUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $installerPath = "$tempDir\Git-2.43.0-64-bit.exe"
    
    Write-Host "📥 正在下载Git安装程序..." -ForegroundColor Cyan
    Write-Host "   下载地址: $gitInstallerUrl" -ForegroundColor Gray
    
    try {
        Invoke-WebRequest -Uri $gitInstallerUrl -OutFile $installerPath -UseBasicParsing
        Write-Host "✅ 下载完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 下载失败，尝试备用地址..." -ForegroundColor Red
        # 备用下载地址
        $gitInstallerUrl = "https://registry.npmmirror.com/-/binary/git-for-windows/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
        Invoke-WebRequest -Uri $gitInstallerUrl -OutFile $installerPath -UseBasicParsing
    }
    
    # 安装Git (静默安装)
    Write-Host "🔧 正在安装Git..." -ForegroundColor Cyan
    $installArgs = "/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS=`"icons,ext\reg\shellhere,assoc,assoc_sh`""
    Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait
    
    # 刷新环境变量
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    # 验证安装
    $gitPath = Get-Command git -ErrorAction SilentlyContinue
    if ($gitPath) {
        Write-Host "✅ Git安装成功!" -ForegroundColor Green
        $gitVersion = git --version
        Write-Host "   版本: $gitVersion" -ForegroundColor Gray
    } else {
        Write-Host "❌ Git安装后仍无法找到，请手动安装Git后重试" -ForegroundColor Red
        Write-Host "   手动下载地址: https://git-scm.com/download/win" -ForegroundColor Yellow
        exit 1
    }
    
    # 清理临时文件
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}

Write-Host ""

# 步骤2: 配置Git用户信息
Write-Host "步骤 2/5: 配置Git用户信息..." -ForegroundColor Green

$gitName = git config --global user.name
$gitEmail = git config --global user.email

if (-not $gitName) {
    $defaultName = "Developer"
    $gitName = Read-Host "请输入你的Git用户名 (直接回车使用 '$defaultName')"
    if ([string]::IsNullOrWhiteSpace($gitName)) {
        $gitName = $defaultName
    }
    git config --global user.name "$gitName"
}

if (-not $gitEmail) {
    $defaultEmail = "developer@example.com"
    $gitEmail = Read-Host "请输入你的Git邮箱 (直接回车使用 '$defaultEmail')"
    if ([string]::IsNullOrWhiteSpace($gitEmail)) {
        $gitEmail = $defaultEmail
    }
    git config --global user.email "$gitEmail"
}

Write-Host "✅ Git用户配置完成" -ForegroundColor Green
Write-Host "   用户名: $(git config --global user.name)" -ForegroundColor Gray
Write-Host "   邮箱: $(git config --global user.email)" -ForegroundColor Gray

Write-Host ""

# 步骤3: 进入项目目录并初始化Git
Write-Host "步骤 3/5: 初始化Git仓库..." -ForegroundColor Green

Set-Location $ProjectPath
Write-Host "📁 进入项目目录: $ProjectPath" -ForegroundColor Gray

# 检查是否已有.git目录
if (Test-Path ".git") {
    Write-Host "⚠️  项目已存在Git仓库，跳过初始化" -ForegroundColor Yellow
} else {
    git init
    Write-Host "✅ Git仓库初始化完成" -ForegroundColor Green
}

Write-Host ""

# 步骤4: 添加文件并提交
Write-Host "步骤 4/5: 添加文件并提交..." -ForegroundColor Green

# 创建.gitignore文件（如果不存在）
$gitignoreContent = @"
# 小程序开发工具配置
project.private.config.json

# 依赖目录
node_modules/
miniprogram_npm/

# 日志文件
*.log
npm-debug.log*

# 临时文件
*.tmp
*.temp

# 系统文件
.DS_Store
Thumbs.db

# 编辑器配置
.vscode/
.idea/
*.swp
*.swo

# 云开发环境配置（包含敏感信息）
cloudfunctions/*/config.json

# 工作记忆（可选，根据需要决定是否提交）
.workbuddy/memory/

# 生成的图片（可选）
generated-images/
"@

if (-not (Test-Path ".gitignore")) {
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host "✅ 创建.gitignore文件" -ForegroundColor Green
}

# 检查是否有文件需要提交
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  没有需要提交的文件变更" -ForegroundColor Yellow
} else {
    # 添加所有文件
    git add .
    Write-Host "✅ 已添加所有文件到暂存区" -ForegroundColor Green
    
    # 提交
    $commitMessage = @"
Initial commit: 恋爱进化论小程序双版本

- 小程序版本：移除AI功能，符合个人主体审核要求
- H5版本：保留完整AI功能（DeepSeek API）
- 添加灵魂伴侣测算功能（星盘+本地算法）
- 添加支付解锁功能（微信打赏+客服解锁）
- 添加管理员后台（本地存储模式）
- 添加AI顾问、聊天回复、情侣档案等功能

技术栈：微信小程序原生 + H5适配
"@
    
    git commit -m $commitMessage
    Write-Host "✅ 代码提交完成" -ForegroundColor Green
}

Write-Host ""

# 步骤5: 推送到GitHub
Write-Host "步骤 5/5: 推送到GitHub..." -ForegroundColor Green

# 检查远程仓库
$remote = git remote -v
if ([string]::IsNullOrWhiteSpace($remote)) {
    git remote add origin $GitHubRepo
    Write-Host "✅ 添加远程仓库: $GitHubRepo" -ForegroundColor Green
} else {
    Write-Host "⚠️  远程仓库已存在" -ForegroundColor Yellow
    $updateRemote = Read-Host "是否更新远程仓库地址为 $GitHubRepo ? (y/n)"
    if ($updateRemote -eq "y" -or $updateRemote -eq "Y") {
        git remote remove origin
        git remote add origin $GitHubRepo
        Write-Host "✅ 远程仓库已更新" -ForegroundColor Green
    }
}

# 检查分支
$currentBranch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    git checkout -b main
    $currentBranch = "main"
}

Write-Host "📤 正在推送到GitHub ($currentBranch 分支)..." -ForegroundColor Cyan

try {
    git push -u origin $currentBranch
    Write-Host "✅ 推送成功!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  🎉 代码已成功提交到GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "仓库地址: $GitHubRepo" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "项目包含：" -ForegroundColor White
    Write-Host "  • 小程序版本（根目录）- 用于微信审核" -ForegroundColor Gray
    Write-Host "  • H5版本（h5-version/）- 完整AI功能" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host "错误信息: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的解决方案：" -ForegroundColor Yellow
    Write-Host "1. 检查网络连接" -ForegroundColor Gray
    Write-Host "2. 确认GitHub仓库存在且有写入权限" -ForegroundColor Gray
    Write-Host "3. 如果需要身份验证，运行: git config --global credential.helper manager" -ForegroundColor Gray
    Write-Host "4. 手动推送: git push -u origin $currentBranch" -ForegroundColor Gray
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
