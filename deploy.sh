#!/bin/bash

# 考研打卡助手部署脚本

echo "📦 准备部署考研打卡助手到 GitHub Pages..."

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
    echo "❌ 当前目录不是Git仓库"
    echo "请先初始化Git仓库:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    exit 1
fi

# 检查是否有远程仓库
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE_URL" ]; then
    echo "❌ 未设置远程仓库"
    echo "请先添加远程仓库:"
    echo "  git remote add origin https://github.com/用户名/kaoyan-tracker.git"
    exit 1
fi

echo "✅ 远程仓库: $REMOTE_URL"

# 推送代码
echo "🚀 推送代码到远程仓库..."
git push origin main

echo ""
echo "🎉 代码已推送到GitHub！"
echo ""
echo "📱 接下来请手动完成以下步骤："
echo ""
echo "1. 🔧 在GitHub仓库设置中启用GitHub Pages："
echo "   - 进入仓库 Settings > Pages"
echo "   - Source选择 'Deploy from a branch'"
echo "   - Branch选择 'main' 或 'master'"
echo "   - Folder选择 '/' (根目录)"
echo "   - 点击 Save"
echo ""
echo "2. ⏳ 等待部署完成（约1-2分钟）"
echo ""
echo "3. 🌐 访问你的网站："
echo "   https://[你的用户名].github.io/kaoyan-tracker/"
echo ""
echo "4. 📱 手机使用："
echo "   - 在手机浏览器中打开上述网址"
echo "   - 点击'添加到主屏幕'安装为PWA应用"
echo ""
echo "5. 🎨 可选：添加应用图标"
echo "   - 将图标文件放入 icons/ 目录"
echo "   - 更新 manifest.json 中的图标路径"
echo ""
echo "💡 提示：如果遇到部署问题，可以："
echo "   - 检查 .github/workflows/deploy.yml 配置"
echo "   - 查看仓库的 Actions 标签页"
echo "   - 确保所有文件已提交"