// 考研打卡助手 - 主应用逻辑

class KaoyanApp {
    constructor() {
        this.storage = storage;
        this.currentMood = '高效';
        this.countdownTimer = null;
        this.reminderTimer = null;
        this.newsData = null;
        this.newsBasePath = '';
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._boot());
        } else {
            this._boot();
        }
    }

    _boot() {
        this.detectNewsBasePath();
        this.setupEventListeners();
        this.updateUI();
        this.startCountdownTimer();
        this.registerServiceWorker();
        this.checkFirstTime();
        this.initAchievements();
        this.initReminder();
        this.checkWeeklyReport();
    }

    // ===================== 资讯数据路径 =====================
    detectNewsBasePath() {
        // GitHub Pages 部署在子目录时需要路径前缀
        const path = window.location.pathname;
        if (path.includes('/kaoyan-tracker/')) {
            this.newsBasePath = '/kaoyan-tracker';
        } else {
            this.newsBasePath = '';
        }
    }

    setupEventListeners() {
        // 打卡按钮
        document.getElementById('punch-btn')?.addEventListener('click', () => this.handlePunch());

        // 心情按钮
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMoodSelect(e));
        });

        // 底部导航按钮
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // 目标模态框
        document.getElementById('save-goal')?.addEventListener('click', () => this.saveGoal());
        document.getElementById('close-goal')?.addEventListener('click', () => this.hideGoalModal());

        // 点击模态框背景关闭
        document.getElementById('goal-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideGoalModal();
        });
        document.getElementById('achievement-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideAchievementModal();
        });
        document.getElementById('weekly-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideWeeklyModal();
        });

        // 成就和周报关闭按钮
        document.getElementById('close-achievement')?.addEventListener('click', () => this.hideAchievementModal());
        document.getElementById('close-weekly')?.addEventListener('click', () => this.hideWeeklyModal());

        // 输入框快捷键
        document.getElementById('duration')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handlePunch();
        });
        document.getElementById('content')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this.handlePunch();
        });

        // 返回按钮
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showPage('home');
            });
        });

        // 设置页面按钮
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportData());
        document.getElementById('import-btn')?.addEventListener('click', () => this.importData());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.clearData());

        // 主题切换按钮（5套主题）
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                document.body.dataset.theme = theme;
                localStorage.setItem('kaoyan_theme', theme);
            });
        });

        // 资讯刷新按钮
        document.getElementById('news-refresh-btn')?.addEventListener('click', () => {
            this.loadNewsData(true);
        });

        // 设置页目标按钮
        document.getElementById('settings-edit-goal-btn')?.addEventListener('click', () => {
            this.showGoalModal();
        });

        // 恢复主题
        const savedTheme = localStorage.getItem('kaoyan_theme') || 'slate';
        document.body.dataset.theme = savedTheme;
        document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`)?.classList.add('active');

        // 提醒设置
        document.getElementById('reminder-toggle')?.addEventListener('change', (e) => {
            this.toggleReminder(e.target.checked);
        });
        document.getElementById('reminder-time')?.addEventListener('change', (e) => {
            localStorage.setItem('kaoyan_reminder_time', e.target.value);
            if (this.reminderTimer) {
                clearInterval(this.reminderTimer);
                this.reminderTimer = null;
            }
            const toggle = document.getElementById('reminder-toggle');
            if (toggle?.checked) this.startReminderTimer(e.target.value);
        });
    }

    // ===================== 打卡逻辑 =====================
    handlePunch() {
        const subject = document.getElementById('subject').value;
        const durationInput = document.getElementById('duration');
        const contentInput = document.getElementById('content');
        const duration = parseInt(durationInput.value);
        const content = contentInput.value.trim();

        if (!duration || duration <= 0) {
            this.showToast('请输入有效的学习时长', 'error');
            durationInput.focus();
            return;
        }
        if (duration > 720) {
            this.showToast('学习时长不能超过12小时（720分钟）', 'error');
            durationInput.focus();
            return;
        }
        if (!content) {
            this.showToast('请输入学习内容', 'error');
            contentInput.focus();
            return;
        }

        const record = { subject, duration, content, mood: this.currentMood };
        this.storage.addRecord(record);

        this.showToast('✅ 打卡成功！继续加油～', 'success');
        contentInput.value = '';
        durationInput.value = '120';
        this.updateUI();
        contentInput.focus();

        // 检查成就
        this.checkAchievements();
    }

    handleMoodSelect(event) {
        const btn = event.target.closest('.mood-btn');
        if (!btn) return;
        this.currentMood = btn.dataset.mood;
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // ===================== 导航 =====================
    handleNavClick(event) {
        const btn = event.target.closest('.nav-btn');
        if (!btn) return;
        const page = btn.dataset.page;
        this.showPage(page);
    }

    showPage(page) {
        // 更新导航高亮
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.nav-btn[data-page="${page}"]`)?.classList.add('active');

        // 隐藏所有区域
        const main = document.querySelector('.main-content');
        const statsPage = document.getElementById('stats-page');
        const settingsPage = document.getElementById('settings-page');
        const historyPage = document.getElementById('history-page');
        const newsPage = document.getElementById('news-page');

        main?.classList.add('hidden');
        statsPage?.classList.add('hidden');
        settingsPage?.classList.add('hidden');
        historyPage?.classList.add('hidden');
        newsPage?.classList.add('hidden');

        switch (page) {
            case 'home':
                main?.classList.remove('hidden');
                this.updateUI();
                break;
            case 'history':
                historyPage?.classList.remove('hidden');
                this.renderHistoryPage();
                break;
            case 'news':
                newsPage?.classList.remove('hidden');
                this.loadNewsData();
                break;
            case 'stats':
                statsPage?.classList.remove('hidden');
                this.updateStatsTodayRecords();
                setTimeout(() => window.kaoyanCharts?.updateAllCharts(), 150);
                break;
            case 'settings':
                settingsPage?.classList.remove('hidden');
                this.updateGoalDisplay();
                break;
        }
    }

    // ===================== UI 更新 =====================
    updateUI() {
        // 日期
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const el = document.getElementById('current-date');
        if (el) el.textContent = now.toLocaleDateString('zh-CN', options);

        this.updateStats();
        this.updateGoalProgress();
        this.updateCountdownDisplay();
    }

    updateStats() {
        const stats = this.storage.getStats();
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('today-duration', stats.todayDuration);
        set('streak-days', stats.streakDays);
        set('total-duration', stats.totalDuration);
        set('punch-days', stats.totalPunchDays);
    }

    // ===================== 设置页目标显示 =====================
    updateGoalDisplay() {
        const textEl = document.getElementById('goal-display-text');
        if (!textEl) return;

        const goal = this.storage.getGoal();
        if (!goal.targetSchool && !goal.examDate) {
            textEl.innerHTML = '<span class="goal-not-set">未设置考研目标，点击下方按钮设置</span>';
            return;
        }

        const school = goal.targetSchool || '未设置';
        const major = goal.targetMajor ? `（${goal.targetMajor}）` : '';
        const date = goal.examDate || '未设置';
        const daily = goal.dailyGoal ? `${goal.dailyGoal} 分钟/天` : '未设置';

        textEl.innerHTML = `
            <div class="goal-info-row"><i class="fas fa-school"></i> 目标院校：${school}${major}</div>
            <div class="goal-info-row"><i class="fas fa-calendar"></i> 考试日期：${date}</div>
            <div class="goal-info-row"><i class="fas fa-clock"></i> 每日目标：${daily}</div>
        `;
    }

    updateStatsTodayRecords() {
        const records = this.storage.getTodayRecords();
        const list = document.getElementById('stats-today-list');
        if (!list) return;
        list.innerHTML = '';

        if (records.length === 0) {
            list.innerHTML = `
                <tr id="stats-empty-row">
                    <td colspan="6" class="empty-message">
                        <i class="fas fa-clipboard-list"></i>
                        <span>今天还没有打卡记录</span>
                    </td>
                </tr>`;
        } else {
            records.forEach(r => list.appendChild(this.createStatsTodayRow(r)));
        }
    }

    createStatsTodayRow(record) {
        const row = document.createElement('tr');
        const moodClass = { '高效': 'efficient', '一般': 'normal', '疲惫': 'tired' }[record.mood] || 'normal';
        row.innerHTML = `
            <td>${this.storage.formatTime(record.timestamp)}</td>
            <td>${record.subject}</td>
            <td>${record.duration} 分钟</td>
            <td class="content-cell">${record.content}</td>
            <td><span class="status-badge status-${moodClass}">${record.mood}</span></td>
            <td>
                <button class="action-btn delete-btn" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </td>`;
        row.querySelector('.delete-btn').addEventListener('click', () => this.deleteRecord(record.id));
        return row;
    }

    deleteRecord(id) {
        if (confirm('确定要删除这条打卡记录吗？')) {
            this.storage.deleteRecord(id);
            this.updateUI();
            this.updateStatsTodayRecords();
            this.showToast('记录已删除', 'info');
        }
    }

    updateGoalProgress() {
        const progress = this.storage.getTodayGoalProgress();
        const goal = this.storage.getGoal();
        const today = this.storage.getTodayDuration();

        const bar = document.getElementById('goal-progress');
        const text = document.getElementById('goal-text');
        if (bar) bar.style.width = `${progress}%`;
        if (text) text.textContent = `${today} / ${goal.dailyGoal} 分钟（${progress}%）`;
    }

    // ===================== 倒计时 =====================
    startCountdownTimer() {
        this.updateCountdownDisplay();
        this.countdownTimer = setInterval(() => this.updateCountdownDisplay(), 60000);
    }

    updateCountdownDisplay() {
        const goal = this.storage.getGoal();
        const daysEl = document.getElementById('countdown-days');
        const hoursEl = document.getElementById('countdown-hours');
        const minutesEl = document.getElementById('countdown-minutes');
        const infoEl = document.getElementById('goal-info');

        if (!goal.examDate) {
            if (daysEl) daysEl.textContent = '--';
            if (hoursEl) hoursEl.textContent = '--';
            if (minutesEl) minutesEl.textContent = '--';
            if (infoEl) {
                infoEl.textContent = '未设置考研目标，请在「设置」页面设置';
                infoEl.classList.remove('has-goal');
            }
            return;
        }

        const now = new Date();
        const exam = new Date(goal.examDate);
        exam.setHours(9, 0, 0, 0); // 考研一般9点开始

        const diff = exam - now;

        if (diff <= 0) {
            if (daysEl) daysEl.textContent = '0';
            if (hoursEl) hoursEl.textContent = '0';
            if (minutesEl) minutesEl.textContent = '0';
            if (infoEl) {
                infoEl.innerHTML = '<span class="goal-achieved">🎉 考研已经结束，祝你旗开得胜！</span>';
                infoEl.classList.add('has-goal');
            }
            return;
        }

        const totalMinutes = Math.floor(diff / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;

        if (daysEl) {
            daysEl.textContent = days;
            daysEl.classList.toggle('urgent', days <= 7);
        }
        if (hoursEl) {
            hoursEl.textContent = hours;
            hoursEl.classList.toggle('urgent', days <= 7);
        }
        if (minutesEl) {
            minutesEl.textContent = minutes;
            minutesEl.classList.toggle('urgent', days <= 7);
        }

        if (infoEl) {
            const school = goal.targetSchool || '目标院校';
            const major = goal.targetMajor ? `（${goal.targetMajor}）` : '';
            infoEl.textContent = `目标：${school}${major}  |  考试日期：${goal.examDate}`;
            infoEl.classList.add('has-goal');
        }
    }

    // ===================== 目标模态框 =====================
    checkFirstTime() {
        const goal = this.storage.getGoal();
        if (!goal.targetSchool && !goal.examDate) {
            setTimeout(() => this.showGoalModal(), 800);
        }
    }

    showGoalModal() {
        const modal = document.getElementById('goal-modal');
        if (!modal) return;
        const goal = this.storage.getGoal();
        document.getElementById('target-school').value = goal.targetSchool || '';
        document.getElementById('target-major').value = goal.targetMajor || '';
        document.getElementById('exam-date').value = goal.examDate || '';
        document.getElementById('daily-goal').value = goal.dailyGoal || 480;
        modal.style.display = 'flex';
    }

    hideGoalModal() {
        const modal = document.getElementById('goal-modal');
        if (modal) modal.style.display = 'none';
        // 回到首页导航状态
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-btn[data-page="home"]')?.classList.add('active');
    }

    saveGoal() {
        const targetSchool = document.getElementById('target-school').value.trim();
        const targetMajor = document.getElementById('target-major').value.trim();
        const examDate = document.getElementById('exam-date').value;
        const dailyGoal = parseInt(document.getElementById('daily-goal').value);

        if (!targetSchool) { this.showToast('请输入目标院校', 'error'); return; }
        if (!examDate) { this.showToast('请选择考研日期', 'error'); return; }
        if (!dailyGoal || dailyGoal < 30) { this.showToast('每日目标至少30分钟', 'error'); return; }

        this.storage.saveGoal({
            targetSchool, targetMajor, examDate, dailyGoal,
            updatedAt: new Date().toISOString()
        });
        this.hideGoalModal();
        this.updateGoalProgress();
        this.updateCountdownDisplay();
        this.showToast('🎯 目标设置已保存！', 'success');
    }

    // ===================== 数据管理 =====================
    exportData() {
        const data = this.storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `考研打卡数据_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('📦 数据已导出', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const ok = this.storage.importData(ev.target.result);
                if (ok) {
                    this.showToast('✅ 数据导入成功！', 'success');
                    this.updateUI();
                } else {
                    this.showToast('导入失败，请检查文件格式', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    clearData() {
        if (confirm('⚠️ 这将清除所有打卡记录和目标设置，无法恢复！\n\n确定要继续吗？')) {
            this.storage.clearData();
            this.updateUI();
            this.showToast('已清除所有数据', 'info');
        }
    }

    // ===================== Toast 提示 =====================
    showToast(message, type = 'success') {
        // 移除已有 toast
        const old = document.querySelector('.toast-popup');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.className = `toast-popup toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 触发动画
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('toast-visible'));
        });

        setTimeout(() => {
            toast.classList.remove('toast-visible');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }

    // ===================== Service Worker =====================
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    }

    // ===================== 成就系统 =====================
    initAchievements() {
        // 确保成就数据已初始化
        if (!localStorage.getItem('kaoyan_achievements')) {
            localStorage.setItem('kaoyan_achievements', JSON.stringify({}));
        }
    }

    checkAchievements() {
        const stats = this.storage.getStats();
        const streak = stats.streakDays;
        const totalDays = stats.totalPunchDays;

        const milestones = [
            { key: 'streak_7',  type: 'streak', value: 7,   icon: 'fa-fire',        title: '🔥 连续7天打卡！', desc: '坚持就是胜利，你已经连续打卡一周了！' },
            { key: 'streak_30', type: 'streak', value: 30,  icon: 'fa-fire-flame-curved', title: '🔥 连续30天打卡！', desc: '一个月不间断，你的毅力令人佩服！' },
            { key: 'streak_100',type: 'streak', value: 100, icon: 'fa-meteor',       title: '☄️ 连续100天打卡！', desc: '百日征途，你已经是真正的考研战士！' },
            { key: 'streak_365',type: 'streak', value: 365, icon: 'fa-crown',        title: '👑 连续365天打卡！', desc: '整整一年！你就是考研界的传奇！' },
            { key: 'days_7',    type: 'total',  value: 7,   icon: 'fa-seedling',     title: '🌱 初出茅庐', desc: '累计打卡7天，种下了一颗学习的种子！' },
            { key: 'days_30',   type: 'total',  value: 30,  icon: 'fa-leaf',         title: '🌿 茁壮成长', desc: '累计打卡30天，学习之树正在成长！' },
            { key: 'days_100',  type: 'total',  value: 100, icon: 'fa-tree',         title: '🌳 学海无涯', desc: '累计打卡100天，已经是一棵大树了！' },
            { key: 'days_200',  type: 'total',  value: 200, icon: 'fa-star',         title: '⭐ 星辰大海', desc: '200天，你的努力已经可以汇聚成星辰！' },
            { key: 'hours_100', type: 'hours',  value: 100, icon: 'fa-hourglass-half', title: '⏳ 百时之功', desc: '累计学习100小时，厚积薄发！' },
            { key: 'hours_500', type: 'hours',  value: 500, icon: 'fa-hourglass-end', title: '🏆 五百时辰', desc: '累计学习500小时，知识的力量无可估量！' },
        ];

        const achieved = JSON.parse(localStorage.getItem('kaoyan_achievements') || '{}');
        let newAchievement = null;

        for (const m of milestones) {
            if (achieved[m.key]) continue;
            const current = m.type === 'streak' ? streak : m.type === 'total' ? totalDays : Math.floor(stats.totalDuration / 60);
            if (current >= m.value) {
                achieved[m.key] = new Date().toISOString();
                newAchievement = m;
                break; // 只弹出最新的一个
            }
        }

        localStorage.setItem('kaoyan_achievements', JSON.stringify(achieved));

        if (newAchievement) {
            setTimeout(() => this.showAchievementModal(newAchievement), 600);
        }
    }

    showAchievementModal(achievement) {
        const modal = document.getElementById('achievement-modal');
        if (!modal) return;
        document.getElementById('achievement-title').textContent = achievement.title;
        document.getElementById('achievement-desc').textContent = achievement.desc;
        document.getElementById('achievement-badge-icon').innerHTML = `<i class="fas ${achievement.icon}"></i>`;
        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    hideAchievementModal() {
        const modal = document.getElementById('achievement-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    // ===================== 每周周报 =====================
    checkWeeklyReport() {
        const lastReport = localStorage.getItem('kaoyan_last_weekly_report');
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=周日

        // 每周一自动弹出上周周报
        if (lastReport) {
            const lastDate = new Date(lastReport);
            const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            if (daysSince < 7) return;
        }

        // 如果今天是周一，或者距离上次周报超过7天，显示周报
        if (dayOfWeek === 1 || !lastReport) {
            const report = this.generateWeeklyReport();
            if (report.totalMinutes > 0) {
                setTimeout(() => this.showWeeklyModal(report), 1500);
                localStorage.setItem('kaoyan_last_weekly_report', today.toISOString());
            }
        }
    }

    generateWeeklyReport() {
        const data = this.storage.getData();
        const records = data.records;
        const today = new Date();
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - (today.getDay() === 0 ? 7 : today.getDay()) - 6);
        lastWeekStart.setHours(0, 0, 0, 0);

        const weekBefore = new Date(lastWeekStart);
        weekBefore.setDate(weekBefore.getDate() - 7);

        // 本周数据
        let weekMinutes = 0, weekDays = 0, weekRecords = 0;
        const weekSubjects = {};
        const weekMoods = { '高效': 0, '一般': 0, '疲惫': 0 };

        // 上周数据
        let lastWeekMinutes = 0;

        Object.entries(records).forEach(([dateKey, recs]) => {
            const d = new Date(dateKey);
            if (d >= lastWeekStart && d <= today) {
                const dayTotal = recs.reduce((s, r) => s + r.duration, 0);
                if (dayTotal > 0) weekDays++;
                weekMinutes += dayTotal;
                weekRecords += recs.length;
                recs.forEach(r => {
                    weekSubjects[r.subject] = (weekSubjects[r.subject] || 0) + r.duration;
                    if (weekMoods[r.mood] !== undefined) weekMoods[r.mood]++;
                });
            }
            if (d >= weekBefore && d < lastWeekStart) {
                lastWeekMinutes += recs.reduce((s, r) => s + r.duration, 0);
            }
        });

        const change = lastWeekMinutes > 0
            ? Math.round((weekMinutes - lastWeekMinutes) / lastWeekMinutes * 100)
            : (weekMinutes > 0 ? 100 : 0);

        const topSubject = Object.entries(weekSubjects).sort((a, b) => b[1] - a[1])[0];

        return { weekMinutes, weekDays, weekRecords, weekSubjects, weekMoods, change, topSubject, lastWeekMinutes };
    }

    showWeeklyModal(report) {
        const modal = document.getElementById('weekly-modal');
        const content = document.getElementById('weekly-report-content');
        if (!modal || !content) return;

        const hours = Math.floor(report.weekMinutes / 60);
        const mins = report.weekMinutes % 60;
        const changeText = report.change > 0
            ? `📈 比上周多 ${report.change}%`
            : report.change < 0
                ? `📉 比上周少 ${Math.abs(report.change)}%`
                : report.lastWeekMinutes > 0 ? '➡️ 和上周持平' : '';

        const topSubjectText = report.topSubject
            ? `📚 最多的科目：<strong>${report.topSubject[0]}</strong>（${report.topSubject[1]}分钟）`
            : '';

        const avgMins = report.weekDays > 0 ? Math.round(report.weekMinutes / report.weekDays) : 0;

        content.innerHTML = `
            <div class="weekly-summary">
                <div class="weekly-big-number">${hours}<span class="weekly-unit">小时</span>${mins > 0 ? mins + '<span class="weekly-unit">分钟</span>' : ''}</div>
                <div class="weekly-subtitle">本周总学习时长</div>
                <div class="weekly-change ${report.change >= 0 ? 'weekly-up' : 'weekly-down'}">${changeText}</div>
            </div>
            <div class="weekly-details">
                <div class="weekly-detail-item">
                    <i class="fas fa-calendar-check"></i>
                    <span>打卡天数：<strong>${report.weekDays}</strong> 天</span>
                </div>
                <div class="weekly-detail-item">
                    <i class="fas fa-clipboard-list"></i>
                    <span>打卡次数：<strong>${report.weekRecords}</strong> 次</span>
                </div>
                <div class="weekly-detail-item">
                    <i class="fas fa-chart-line"></i>
                    <span>日均学习：<strong>${avgMins}</strong> 分钟</span>
                </div>
                ${topSubjectText ? `<div class="weekly-detail-item">${topSubjectText}</div>` : ''}
            </div>
            <div class="weekly-mood-summary">
                <div class="weekly-mood-label">学习状态分布</div>
                <div class="weekly-mood-bars">
                    <div class="weekly-mood-item">
                        <span>😊 高效</span>
                        <div class="weekly-mood-bar"><div style="width:${report.weekMoods['高效'] ? Math.max(15, report.weekMoods['高效'] / report.weekRecords * 100) : 5}%; background:rgba(142,175,138,0.6)"></div></div>
                        <span>${report.weekMoods['高效']}次</span>
                    </div>
                    <div class="weekly-mood-item">
                        <span>😐 一般</span>
                        <div class="weekly-mood-bar"><div style="width:${report.weekMoods['一般'] ? Math.max(15, report.weekMoods['一般'] / report.weekRecords * 100) : 5}%; background:rgba(123,155,166,0.6)"></div></div>
                        <span>${report.weekMoods['一般']}次</span>
                    </div>
                    <div class="weekly-mood-item">
                        <span>😫 疲惫</span>
                        <div class="weekly-mood-bar"><div style="width:${report.weekMoods['疲惫'] ? Math.max(15, report.weekMoods['疲惫'] / report.weekRecords * 100) : 5}%; background:rgba(200,149,106,0.6)"></div></div>
                        <span>${report.weekMoods['疲惫']}次</span>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        modal.classList.add('show');
    }

    hideWeeklyModal() {
        const modal = document.getElementById('weekly-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    }

    // ===================== 历史记录页 =====================
    renderHistoryPage() {
        const container = document.getElementById('history-page-content');
        if (!container) return;

        const data = this.storage.getData();
        const records = data.records;
        const dateKeys = Object.keys(records).sort().reverse();

        if (dateKeys.length === 0) {
            container.innerHTML = `
                <div class="history-empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>还没有任何打卡记录</p>
                    <p class="history-empty-hint">快去首页开始你的第一次打卡吧！</p>
                </div>`;
            return;
        }

        // 按月分组
        const monthGroups = {};
        dateKeys.forEach(dateKey => {
            const recs = records[dateKey];
            if (!recs || recs.length === 0) return;
            const d = new Date(dateKey);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
            monthGroups[monthKey].push({ dateKey, recs });
        });

        let html = '';
        const now = new Date();
        const todayStr = this.storage.getTodayDate();
        const yesterday = new Date(now.getTime() - 86400000);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

        Object.entries(monthGroups).forEach(([monthKey, days], mIdx) => {
            const [y, m] = monthKey.split('-');
            const monthLabel = `${y}年${parseInt(m)}月`;
            const isCollapsed = mIdx > 0; // 第一个月展开，其余折叠

            html += `
                <div class="history-month-group ${isCollapsed ? 'collapsed' : ''}">
                    <div class="history-month-header" onclick="app.toggleMonthGroup(this)">
                        <i class="fas fa-chevron-down history-month-arrow"></i>
                        <span class="history-month-title">${monthLabel}</span>
                        <span class="history-month-count">${days.length} 天有记录</span>
                    </div>
                    <div class="history-month-body">`;

            days.forEach(({ dateKey, recs }) => {
                const d = new Date(dateKey);
                const dayTotal = recs.reduce((s, r) => s + r.duration, 0);
                let dateLabel = `${d.getMonth() + 1}月${d.getDate()}日`;
                if (dateKey === todayStr) dateLabel += ' (今天)';
                else if (dateKey === yesterdayStr) dateLabel += ' (昨天)';
                const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                dateLabel += ` ${weekDays[d.getDay()]}`;

                html += `
                    <div class="history-day-block">
                        <div class="history-day-header" onclick="app.toggleDayBlock(this)">
                            <div class="history-day-info">
                                <i class="fas fa-calendar-day"></i>
                                <span>${dateLabel}</span>
                                <span class="history-day-summary">${recs.length}次打卡 · ${dayTotal}分钟</span>
                            </div>
                            <i class="fas fa-chevron-down history-day-arrow"></i>
                        </div>
                        <div class="history-day-body">
                            <div class="history-records-list">
                                ${recs.map(r => {
                                    const moodClass = { '高效': 'efficient', '一般': 'normal', '疲惫': 'tired' }[r.mood] || 'normal';
                                    return `
                                        <div class="history-record-item">
                                            <span class="history-record-time">${this.storage.formatTime(r.timestamp)}</span>
                                            <span class="history-record-subject">${r.subject}</span>
                                            <span class="history-record-duration">${r.duration}分钟</span>
                                            <span class="status-badge status-${moodClass}">${r.mood}</span>
                                            <span class="history-record-content">${r.content}</span>
                                        </div>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>`;
            });

            html += `</div></div>`;
        });

        container.innerHTML = html;
    }

    toggleMonthGroup(header) {
        const group = header.closest('.history-month-group');
        group.classList.toggle('collapsed');
    }

    toggleDayBlock(header) {
        const block = header.closest('.history-day-block');
        block.classList.toggle('collapsed');
    }

    // ===================== 离线提醒 =====================
    initReminder() {
        const toggle = document.getElementById('reminder-toggle');
        const timeInput = document.getElementById('reminder-time');
        const enabled = localStorage.getItem('kaoyan_reminder_enabled') === 'true';
        const savedTime = localStorage.getItem('kaoyan_reminder_time') || '08:00';

        if (toggle) toggle.checked = enabled;
        if (timeInput) timeInput.value = savedTime;

        if (enabled) {
            this.startReminderTimer(savedTime);
        }
    }

    toggleReminder(enabled) {
        localStorage.setItem('kaoyan_reminder_enabled', enabled);

        if (enabled) {
            // 请求通知权限
            if ('Notification' in window) {
                Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                        this.startReminderTimer(document.getElementById('reminder-time').value);
                        this.showToast('🔔 提醒已开启', 'success');
                    } else {
                        this.showToast('请允许浏览器通知权限', 'error');
                        document.getElementById('reminder-toggle').checked = false;
                        localStorage.setItem('kaoyan_reminder_enabled', 'false');
                    }
                });
            } else {
                this.showToast('您的浏览器不支持通知功能', 'error');
                document.getElementById('reminder-toggle').checked = false;
                localStorage.setItem('kaoyan_reminder_enabled', 'false');
            }
        } else {
            if (this.reminderTimer) {
                clearInterval(this.reminderTimer);
                this.reminderTimer = null;
            }
            this.showToast('提醒已关闭', 'info');
        }
    }

    startReminderTimer(timeStr) {
        if (this.reminderTimer) clearInterval(this.reminderTimer);

        const [h, m] = timeStr.split(':').map(Number);
        const lastReminded = localStorage.getItem('kaoyan_last_reminded_date') || '';

        this.reminderTimer = setInterval(() => {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

            // 每天只提醒一次
            if (lastReminded === today) return;

            // 在目标时间前后1分钟内触发
            if (now.getHours() === h && Math.abs(now.getMinutes() - m) <= 1) {
                // 检查今天是否已打卡
                const todayRecords = this.storage.getTodayRecords();
                if (todayRecords.length > 0) return; // 今天已打卡不提醒

                if ('Notification' in window && Notification.permission === 'granted') {
                    const streak = this.storage.getStats().streakDays;
                    new Notification('考研打卡提醒', {
                        body: streak > 0
                            ? `你已经连续打卡${streak}天了，今天继续加油！💪`
                            : '新的一天开始了，开始今天的学习吧！📚',
                        icon: '/icons/icon-192x192.png',
                        tag: 'kaoyan-reminder',
                        requireInteraction: false,
                    });
                }
                localStorage.setItem('kaoyan_last_reminded_date', today);
            }
        }, 30000); // 每30秒检查一次
    }

    // ===================== 资讯系统 =====================
    async loadNewsData(forceRefresh = false) {
        const container = document.getElementById('news-page-content');
        const loading = document.getElementById('news-loading');
        const refreshBtn = document.getElementById('news-refresh-btn');

        if (!container) return;

        // 如果已加载且未强制刷新，直接渲染
        if (this.newsData && !forceRefresh) {
            this.renderNewsPage();
            return;
        }

        // 显示加载状态
        if (loading) loading.style.display = 'flex';
        if (refreshBtn) refreshBtn.disabled = true;

        try {
            const newsUrl = `${this.newsBasePath}/data/news.json`;
            const response = await fetch(newsUrl + `?t=${new Date().getTime()}`);
            
            if (!response.ok) throw new Error('Failed to fetch news');
            
            const data = await response.json();
            this.newsData = data.news || [];
            
            // 缓存到 localStorage
            localStorage.setItem('kaoyan_news_cache', JSON.stringify(this.newsData));
            localStorage.setItem('kaoyan_news_cache_time', new Date().toISOString());
            
            this.renderNewsPage();
        } catch (error) {
            console.error('Error loading news:', error);
            
            // 尝试从缓存加载
            const cached = localStorage.getItem('kaoyan_news_cache');
            if (cached) {
                this.newsData = JSON.parse(cached);
                this.renderNewsPage();
                this.showToast('📰 使用缓存资讯', 'info');
            } else {
                if (container) {
                    container.innerHTML = `
                        <div class="news-error-state">
                            <i class="fas fa-wifi-slash"></i>
                            <p>无法加载资讯</p>
                            <p class="news-error-hint">请检查网络连接或稍后重试</p>
                        </div>`;
                }
                this.showToast('⚠️ 资讯加载失败，请检查网络', 'error');
            }
        } finally {
            if (loading) loading.style.display = 'none';
            if (refreshBtn) refreshBtn.disabled = false;
        }
    }

    renderNewsPage() {
        const container = document.getElementById('news-page-content');
        if (!container || !this.newsData) return;

        if (this.newsData.length === 0) {
            container.innerHTML = `
                <div class="news-empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>暂无资讯更新</p>
                    <p class="news-empty-hint">敬请期待后续考研资讯推送</p>
                </div>`;
            return;
        }

        // 按分类分组
        const grouped = {};
        this.newsData.forEach(news => {
            const cat = news.category || '其他';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(news);
        });

        let html = '';
        Object.entries(grouped).forEach(([category, items]) => {
            html += `<div class="news-category">
                <div class="news-category-title">
                    <i class="fas fa-bookmark"></i> ${category}
                </div>
                <div class="news-list">`;
            
            items.forEach(news => {
                const date = new Date(news.date + 'T00:00:00').toLocaleDateString('zh-CN');
                html += `
                    <div class="news-item">
                        <div class="news-item-header">
                            <h3 class="news-item-title">${news.title}</h3>
                            <span class="news-item-date">${date}</span>
                        </div>
                        <p class="news-item-summary">${news.summary}</p>
                        <div class="news-item-footer">
                            <span class="news-item-source">
                                <i class="fas fa-link"></i> ${news.source}
                            </span>
                            ${news.url ? `<a href="${news.url}" target="_blank" class="news-item-link">
                                <i class="fas fa-external-link-alt"></i> 查看全文
                            </a>` : ''}
                        </div>
                    </div>`;
            });

            html += `</div></div>`;
        });

        container.innerHTML = html;
    }
}

// 创建全局应用实例（供内联事件调用）
const app = new KaoyanApp();
