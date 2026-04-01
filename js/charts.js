// 考研打卡助手 - 图表模块（多主题低饱和度）

class KaoyanCharts {
    constructor() {
        this.storage = storage;
        this.charts = {};
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        // 监听主题变化，自动刷新图表配色
        const observer = new MutationObserver(() => this._refreshChartTheme());
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }

    // 根据当前主题获取配色
    get palette() {
        const theme = document.body.dataset.theme || 'slate';
        const palettes = {
            slate:    ['#7B9BA6', '#96B4A8', '#C8956A', '#9DB8C6', '#B5C4B1', '#C0A882', '#8A9DB8'],
            sand:     ['#B8957A', '#C4A882', '#8FA88A', '#C8B098', '#9EB09A', '#D4B896', '#A89078'],
            sage:     ['#7E9E8A', '#8FB09A', '#C4A86E', '#A4C0A8', '#C0B888', '#88A898', '#B4C8A4'],
            lavender: ['#9490B5', '#A8A0C8', '#C4A882', '#B0ACCB', '#D0C8A8', '#A8B0D0', '#C0B0C8'],
            dark:     ['#7B9BA6', '#86A89C', '#C8956A', '#6E90A0', '#9CB8AA', '#B89870', '#849CB0'],
        };
        return palettes[theme] || palettes.slate;
    }

    get gridColor() {
        const theme = document.body.dataset.theme || 'slate';
        return theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    }

    get tickColor() {
        const theme = document.body.dataset.theme || 'slate';
        return theme === 'dark' ? '#5A7080' : '#94A3B8';
    }

    get legendColor() {
        const theme = document.body.dataset.theme || 'slate';
        return theme === 'dark' ? '#8A9EAC' : '#64748B';
    }

    // 主题切换时刷新所有图表
    _refreshChartTheme() {
        if (Object.keys(this.charts).some(k => this.charts[k])) {
            this.updateAllCharts();
        }
    }

    _destroyChart(key) {
        if (this.charts[key]) {
            this.charts[key].destroy();
            this.charts[key] = null;
        }
    }

    // ===================== 初始化各图表 =====================

    // 30天趋势折线图（宽）
    initTrendChart() {
        this._destroyChart('trend');
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        const p = this.palette;
        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '学习时长（分钟）',
                        data: [],
                        borderColor: p[0],
                        backgroundColor: p[0] + '22',
                        borderWidth: 2.2,
                        pointBackgroundColor: p[0],
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y',
                    },
                    {
                        label: '7日平均',
                        data: [],
                        borderColor: p[2],
                        backgroundColor: 'transparent',
                        borderWidth: 1.8,
                        borderDash: [5, 4],
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: this.gridColor },
                        ticks: { color: this.tickColor, font: { size: 11 } },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: this.tickColor, maxRotation: 0, font: { size: 11 },
                                 maxTicksLimit: 10 }
                    }
                },
                plugins: {
                    legend: { labels: { color: this.legendColor, font: { size: 12 }, padding: 16 } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', cornerRadius: 10, padding: 10 }
                }
            }
        });
    }

    // 科目分布饼图
    initSubjectChart() {
        this._destroyChart('subject');
        const ctx = document.getElementById('subject-chart');
        if (!ctx) return;

        this.charts.subject = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: this.palette,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.6)',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right',
                              labels: { font: { size: 12 }, padding: 14, color: this.legendColor } },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)', cornerRadius: 10, padding: 10,
                        callbacks: {
                            label: (c) => {
                                const total = c.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total ? Math.round(c.raw / total * 100) : 0;
                                return ` ${c.label}: ${c.raw} 分钟 (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 学习状态环形图
    initMoodChart() {
        this._destroyChart('mood');
        const ctx = document.getElementById('mood-chart');
        if (!ctx) return;

        const p = this.palette;
        this.charts.mood = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['😊 高效', '😐 一般', '😫 疲惫'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [p[1], p[2], '#C4A0A0'],
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.6)',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '58%',
                plugins: {
                    legend: { position: 'bottom',
                              labels: { color: this.legendColor, padding: 14, font: { size: 12 } } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', cornerRadius: 10, padding: 10 }
                }
            }
        });
    }

    // 学习时段柱状图
    initTimeChart() {
        this._destroyChart('time');
        const ctx = document.getElementById('time-chart');
        if (!ctx) return;

        const p = this.palette;
        this.charts.time = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['早晨\n6-9', '上午\n9-12', '午间\n12-14', '下午\n14-18', '晚上\n18-22', '深夜\n22+'],
                datasets: [{
                    label: '学习时长（分钟）',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: p.map(c => c + 'BB'),
                    borderColor: p,
                    borderWidth: 1.5,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: this.gridColor },
                        ticks: { color: this.tickColor, font: { size: 11 } },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: this.tickColor, font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', cornerRadius: 10, padding: 10 }
                }
            }
        });
    }

    // 周均学习柱状图（新增）
    initWeekdayChart() {
        this._destroyChart('weekday');
        const ctx = document.getElementById('weekday-chart');
        if (!ctx) return;

        const p = this.palette;
        this.charts.weekday = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                datasets: [{
                    label: '平均学习时长（分钟）',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: p.map(c => c + 'AA'),
                    borderColor: p,
                    borderWidth: 1.5,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: this.gridColor },
                        ticks: { color: this.tickColor, font: { size: 11 } },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: this.tickColor, font: { size: 12 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', cornerRadius: 10, padding: 10 }
                }
            }
        });
    }

    // ===================== 数据更新 =====================

    updateAllCharts() {
        // 懒初始化
        if (!this.charts.trend)   this.initTrendChart();
        if (!this.charts.subject) this.initSubjectChart();
        if (!this.charts.mood)    this.initMoodChart();
        if (!this.charts.time)    this.initTimeChart();
        if (!this.charts.weekday) this.initWeekdayChart();

        this.updateOverviewCards();
        this.updateTrendChart();
        this.updateSubjectChart();
        this.updateMoodChart();
        this.updateTimeChart();
        this.updateWeekdayChart();
    }

    // 顶部概览卡片
    updateOverviewCards() {
        const stats = this.storage.getStats();
        const allRecords = this.storage.getData().records;

        // 累计天数
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('ov-total-days', stats.totalPunchDays);
        set('ov-total-hours', Math.round(stats.totalDuration / 60 * 10) / 10);
        set('ov-streak', stats.streakDays);

        // 日均（有记录的天平均）
        const days = Object.keys(allRecords).filter(k => (allRecords[k] || []).length > 0);
        const totalMin = Object.values(allRecords).reduce((s, arr) =>
            s + arr.reduce((t, r) => t + r.duration, 0), 0);
        const avg = days.length ? Math.round(totalMin / days.length) : 0;
        set('ov-avg', avg);
    }

    // 30天趋势
    updateTrendChart() {
        if (!this.charts.trend) return;
        const allRecords = this.storage.getData().records;
        const today = new Date();
        const labels = [];
        const durations = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push(i % 5 === 0 || i === 0 ? `${d.getMonth()+1}/${d.getDate()}` : '');
            const dayRecs = allRecords[key] || [];
            durations.push(dayRecs.reduce((s, r) => s + r.duration, 0));
        }

        // 计算7日滑动平均
        const movingAvg = durations.map((_, i) => {
            const start = Math.max(0, i - 6);
            const window = durations.slice(start, i + 1);
            return Math.round(window.reduce((a, b) => a + b, 0) / window.length);
        });

        this.charts.trend.data.labels = labels;
        this.charts.trend.data.datasets[0].data = durations;
        this.charts.trend.data.datasets[1].data = movingAvg;
        this.charts.trend.update();
    }

    // 科目分布
    updateSubjectChart() {
        if (!this.charts.subject) return;
        const stats = this.storage.getSubjectStats();
        this.charts.subject.data.labels = Object.keys(stats);
        this.charts.subject.data.datasets[0].data = Object.values(stats);
        this.charts.subject.data.datasets[0].backgroundColor = this.palette;
        this.charts.subject.update();
    }

    // 学习状态
    updateMoodChart() {
        if (!this.charts.mood) return;
        const allRecords = this.storage.getData().records;
        const counts = { '高效': 0, '一般': 0, '疲惫': 0 };
        Object.values(allRecords).forEach(day => {
            day.forEach(r => { if (counts[r.mood] !== undefined) counts[r.mood] += r.duration; });
        });
        const p = this.palette;
        this.charts.mood.data.datasets[0].data = [counts['高效'], counts['一般'], counts['疲惫']];
        this.charts.mood.data.datasets[0].backgroundColor = [p[1], p[2], '#C4A0A0'];
        this.charts.mood.update();
    }

    // 学习时段（6段细分）
    updateTimeChart() {
        if (!this.charts.time) return;
        const allRecords = this.storage.getData().records;
        const slots = [0, 0, 0, 0, 0, 0]; // 早6-9, 上9-12, 午12-14, 下14-18, 晚18-22, 深夜22+

        Object.values(allRecords).forEach(day => {
            day.forEach(r => {
                const h = new Date(r.timestamp).getHours();
                if      (h >= 6  && h < 9)  slots[0] += r.duration;
                else if (h >= 9  && h < 12) slots[1] += r.duration;
                else if (h >= 12 && h < 14) slots[2] += r.duration;
                else if (h >= 14 && h < 18) slots[3] += r.duration;
                else if (h >= 18 && h < 22) slots[4] += r.duration;
                else                         slots[5] += r.duration;
            });
        });

        const p = this.palette;
        this.charts.time.data.datasets[0].data = slots;
        this.charts.time.data.datasets[0].backgroundColor = p.map(c => c + 'BB');
        this.charts.time.data.datasets[0].borderColor = p;
        this.charts.time.update();
    }

    // 周均分布（新增）
    updateWeekdayChart() {
        if (!this.charts.weekday) return;
        const allRecords = this.storage.getData().records;
        // [周一=0 ... 周日=6]
        const weekSum   = [0, 0, 0, 0, 0, 0, 0];
        const weekCount = [0, 0, 0, 0, 0, 0, 0];

        Object.entries(allRecords).forEach(([dateKey, recs]) => {
            if (!recs || recs.length === 0) return;
            const d = new Date(dateKey);
            const dow = (d.getDay() + 6) % 7; // 转成周一=0
            const total = recs.reduce((s, r) => s + r.duration, 0);
            weekSum[dow]   += total;
            weekCount[dow] += 1;
        });

        const avg = weekSum.map((s, i) => weekCount[i] ? Math.round(s / weekCount[i]) : 0);
        const p = this.palette;
        this.charts.weekday.data.datasets[0].data = avg;
        this.charts.weekday.data.datasets[0].backgroundColor = p.map(c => c + 'AA');
        this.charts.weekday.data.datasets[0].borderColor = p;
        this.charts.weekday.update();
    }
}

window.kaoyanCharts = new KaoyanCharts();
