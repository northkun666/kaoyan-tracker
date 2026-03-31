// 考研打卡助手 - 图表模块（低饱和度配色）

class KaoyanCharts {
    constructor() {
        this.storage = storage;
        this.charts = {};
        // DOM 就绪后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        this.initCharts();
    }

    // 低饱和度配色
    get palette() {
        return ['#8A9B9F', '#A3B8A0', '#D4A574', '#9DB4C0', '#C9B8A8', '#B5C4B1', '#C4A882'];
    }

    // ===================== 初始化 =====================
    initCharts() {
        this.initSubjectChart();
        this.initTrendChart();
        this.initMoodChart();
        this.initTimeChart();
    }

    _destroyChart(key) {
        if (this.charts[key]) {
            this.charts[key].destroy();
            this.charts[key] = null;
        }
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
                    borderColor: 'rgba(255,255,255,0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 12 }, padding: 16, color: '#6B7280' } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total ? Math.round((ctx.raw / total) * 100) : 0;
                                return `${ctx.label}: ${ctx.raw} 分钟 (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 7天趋势折线图
    initTrendChart() {
        this._destroyChart('trend');
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '学习时长（分钟）',
                    data: [],
                    borderColor: '#8A9B9F',
                    backgroundColor: 'rgba(138,155,159,0.12)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#8A9B9F',
                    pointRadius: 4,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#9CA3AF' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9CA3AF' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#6B7280' } },
                    tooltip: { mode: 'index', intersect: false }
                }
            }
        });
    }

    // 学习状态甜甜圈图
    initMoodChart() {
        this._destroyChart('mood');
        const ctx = document.getElementById('mood-chart');
        if (!ctx) return;

        this.charts.mood = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['高效', '一般', '疲惫'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#A3B8A0', '#D4A574', '#C4A0A0'],
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#6B7280', padding: 12 } }
                }
            }
        });
    }

    // 学习时段柱状图
    initTimeChart() {
        this._destroyChart('time');
        const ctx = document.getElementById('time-chart');
        if (!ctx) return;

        this.charts.time = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['早上 6-12', '中午 12-14', '下午 14-18', '晚上 18-22', '深夜 22-6'],
                datasets: [{
                    label: '学习时长（分钟）',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: this.palette.map(c => c + 'CC'),
                    borderColor: this.palette,
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#9CA3AF' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9CA3AF', maxRotation: 0 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // ===================== 数据更新 =====================
    updateAllCharts() {
        // 如果图表已被销毁，重新初始化
        if (!this.charts.subject) this.initSubjectChart();
        if (!this.charts.trend) this.initTrendChart();
        if (!this.charts.mood) this.initMoodChart();
        if (!this.charts.time) this.initTimeChart();

        this.updateSubjectChart();
        this.updateTrendChart();
        this.updateMoodChart();
        this.updateTimeChart();
    }

    updateSubjectChart() {
        if (!this.charts.subject) return;
        const stats = this.storage.getSubjectStats();
        this.charts.subject.data.labels = Object.keys(stats);
        this.charts.subject.data.datasets[0].data = Object.values(stats);
        this.charts.subject.update();
    }

    updateTrendChart() {
        if (!this.charts.trend) return;
        const allRecords = this.storage.getData().records;
        const today = new Date();
        const labels = [];
        const durations = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
            const dayRecords = allRecords[key] || [];
            durations.push(dayRecords.reduce((s, r) => s + r.duration, 0));
        }

        this.charts.trend.data.labels = labels;
        this.charts.trend.data.datasets[0].data = durations;
        this.charts.trend.update();
    }

    updateMoodChart() {
        if (!this.charts.mood) return;
        const allRecords = this.storage.getData().records;
        const counts = { '高效': 0, '一般': 0, '疲惫': 0 };

        Object.values(allRecords).forEach(day => {
            day.forEach(r => { if (counts[r.mood] !== undefined) counts[r.mood] += r.duration; });
        });

        this.charts.mood.data.datasets[0].data = [counts['高效'], counts['一般'], counts['疲惫']];
        this.charts.mood.update();
    }

    updateTimeChart() {
        if (!this.charts.time) return;
        const allRecords = this.storage.getData().records;
        const slots = [0, 0, 0, 0, 0]; // 早/中/晚/夜/深夜

        Object.values(allRecords).forEach(day => {
            day.forEach(r => {
                const h = new Date(r.timestamp).getHours();
                if (h >= 6 && h < 12) slots[0] += r.duration;
                else if (h >= 12 && h < 14) slots[1] += r.duration;
                else if (h >= 14 && h < 18) slots[2] += r.duration;
                else if (h >= 18 && h < 22) slots[3] += r.duration;
                else slots[4] += r.duration;
            });
        });

        this.charts.time.data.datasets[0].data = slots;
        this.charts.time.update();
    }
}

// 注册全局实例（供 app.js 调用）
window.kaoyanCharts = new KaoyanCharts();
