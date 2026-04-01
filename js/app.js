// 考研打卡助手 - 主应用逻辑

class KaoyanApp {
    constructor() {
        this.storage = storage;
        this.currentMood = '高效';
        this.countdownTimer = null;
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
        this.setupEventListeners();
        this.updateUI();
        this.startCountdownTimer();
        this.registerServiceWorker();
        this.checkFirstTime();
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

        // 恢复主题
        const savedTheme = localStorage.getItem('kaoyan_theme') || 'slate';
        document.body.dataset.theme = savedTheme;
        document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`)?.classList.add('active');
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

        main?.classList.add('hidden');
        statsPage?.classList.add('hidden');
        settingsPage?.classList.add('hidden');

        switch (page) {
            case 'home':
                main?.classList.remove('hidden');
                this.updateUI();
                break;
            case 'stats':
                statsPage?.classList.remove('hidden');
                setTimeout(() => window.kaoyanCharts?.updateAllCharts(), 150);
                break;
            case 'goals':
                main?.classList.remove('hidden'); // 先显示主页再弹模态框
                this.showGoalModal();
                break;
            case 'settings':
                settingsPage?.classList.remove('hidden');
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
        this.updateHistory();
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

    updateHistory() {
        const records = this.storage.getTodayRecords();
        const list = document.getElementById('history-list');
        if (!list) return;
        list.innerHTML = '';

        if (records.length === 0) {
            list.innerHTML = `
                <tr id="empty-row">
                    <td colspan="6" class="empty-message">
                        <i class="fas fa-clipboard-list"></i>
                        <span>今天还没有打卡记录，开始你的第一项学习吧！</span>
                    </td>
                </tr>`;
        } else {
            records.forEach(r => list.appendChild(this.createHistoryRow(r)));
        }
    }

    createHistoryRow(record) {
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
                infoEl.textContent = '未设置考研目标，请点击下方「目标」按钮设置';
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
}

// 启动应用
const app = new KaoyanApp();
