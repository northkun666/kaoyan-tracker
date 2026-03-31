# 考研学习打卡助手

一个专为考研学生设计的学习打卡记录工具，帮助记录学习进度、分析学习习惯、保持考研动力。

## 🎯 功能特点

- **每日打卡**：记录学习科目、时长、内容和状态
- **数据统计**：实时统计学习时长、连续打卡天数等
- **目标管理**：设置考研目标、考试日期和每日学习目标
- **倒计时**：实时显示距离考研还有多少天
- **详细统计**：科目分布、学习趋势、状态分布等可视化图表
- **数据管理**：数据导出/导入、本地存储

## 📱 手机使用

### 方案一：通过GitHub Pages（推荐）
1. 将本仓库推送到GitHub
2. 在仓库设置中开启GitHub Pages
3. 访问生成的网址，在手机浏览器中打开
4. 点击"添加到主屏幕"安装为PWA应用

### 方案二：通过二维码
1. 将网站部署到任何静态托管服务
2. 生成访问二维码
3. 手机扫码即可使用

### 方案三：打包为原生APP
1. 使用Capacitor或Cordova打包
2. 发布到应用商店

## 🚀 快速开始

### 在线使用
访问部署地址：`https://[your-username].github.io/kaoyan-tracker/`

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/[your-username]/kaoyan-tracker.git

# 进入项目目录
cd kaoyan-tracker

# 启动本地服务器
python -m http.server 8080

# 打开浏览器访问
# http://localhost:8080
```

## 🛠️ 技术栈

- **前端**：HTML5、CSS3、JavaScript（ES6+）
- **图表**：Chart.js
- **数据存储**：浏览器LocalStorage
- **图标**：Font Awesome 6
- **PWA**：Service Worker + Web App Manifest

## 📊 核心功能

### 1. 打卡管理
- 选择学习科目（政治、英语、数学、专业课等）
- 输入学习时长（分钟）
- 记录学习内容
- 选择学习状态（高效/一般/疲惫）

### 2. 数据统计
- 今日学习时长统计
- 连续打卡天数统计
- 总学习时长统计
- 累计打卡天数统计

### 3. 目标管理
- 设置目标院校和专业
- 设置考研日期
- 设置每日学习目标
- 实时进度条显示

### 4. 详细统计
- 科目学习分布饼图
- 最近7天学习趋势图
- 学习状态分布图
- 学习时段分布图

## 🔧 部署指南

### GitHub Pages部署
1. 在GitHub上创建新仓库 `kaoyan-tracker`
2. 将本地代码推送到仓库：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[your-username]/kaoyan-tracker.git
git push -u origin main
```

3. 进入仓库设置 > Pages
4. 选择分支 `main` 和文件夹 `/`
5. 保存后访问 `https://[your-username].github.io/kaoyan-tracker/`

### Vercel部署（推荐）
1. 访问 [vercel.com](https://vercel.com)
2. 导入GitHub仓库
3. 自动部署，获得生产网址

## 🎨 图标生成

网站需要以下尺寸的图标文件，放在 `icons/` 目录：

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

可以使用在线工具生成：
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## 📁 项目结构

```
kaoyan-tracker/
├── index.html              # 主页面
├── manifest.json           # PWA配置文件
├── sw.js                   # Service Worker
├── README.md               # 项目说明
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── app.js             # 主应用逻辑
│   ├── storage.js         # 数据存储模块
│   └── charts.js          # 图表模块
├── icons/                  # 应用图标
└── data/                  # 数据存储目录
```

## 📱 PWA安装指南

### Android
1. 在Chrome浏览器中打开网站
2. 点击右上角菜单（三个点）
3. 选择"添加到主屏幕"
4. 点击"添加"安装

### iOS
1. 在Safari浏览器中打开网站
2. 点击分享按钮（方框带向上箭头）
3. 选择"添加到主屏幕"
4. 点击"添加"安装

## 🔒 数据安全

- 所有数据存储在浏览器本地
- 无服务器，无数据泄露风险
- 支持数据导出/导入备份
- 无用户账号系统，完全匿名使用

## 📈 后续计划

- [ ] 学习报告PDF生成
- [ ] 多人学习小组功能
- [ ] 微信小程序版本
- [ ] 云端同步功能
- [ ] 学习提醒推送
- [ ] 成就系统扩展

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 👏 贡献

欢迎提交 Issue 和 Pull Request！

---

**开发状态**：✅ 核心功能完成  
**部署状态**：🟡 可部署到GitHub Pages  
**PWA支持**：✅ 支持安装到手机桌面