// 考研打卡助手 - 数据存储模块

class KaoyanStorage {
    constructor() {
        this.STORAGE_KEY = 'kaoyan_tracker_data';
        this.GOAL_KEY = 'kaoyan_goal_data';
        this.defaultData = {
            records: {},
            stats: {
                totalDuration: 0,
                streakDays: 0,
                totalPunchDays: 0,
                subjectStats: {}
            }
        };
        
        this.defaultGoal = {
            targetSchool: '',
            targetMajor: '',
            examDate: '',
            dailyGoal: 480, // 默认8小时 = 480分钟
            createdAt: new Date().toISOString()
        };
        
        this.init();
    }
    
    init() {
        // 初始化数据
        if (!this.getData()) {
            this.saveData(this.defaultData);
        }
        
        // 初始化目标
        if (!this.getGoal()) {
            this.saveGoal(this.defaultGoal);
        }
    }
    
    // 获取所有数据
    getData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }
    
    // 保存所有数据
    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
    
    // 获取目标数据
    getGoal() {
        const goal = localStorage.getItem(this.GOAL_KEY);
        return goal ? JSON.parse(goal) : null;
    }
    
    // 保存目标数据
    saveGoal(goal) {
        localStorage.setItem(this.GOAL_KEY, JSON.stringify(goal));
    }
    
    // 添加打卡记录
    addRecord(record) {
        const data = this.getData();
        const today = this.getTodayDate();
        
        // 初始化当天的记录数组
        if (!data.records[today]) {
            data.records[today] = [];
        }
        
        // 添加记录ID和时间戳
        record.id = Date.now();
        record.timestamp = new Date().toISOString();
        record.date = today;
        
        // 添加到当天的记录
        data.records[today].push(record);
        
        // 更新统计数据
        this.updateStats(data, record);
        
        this.saveData(data);
        return record;
    }
    
    // 删除打卡记录
    deleteRecord(recordId) {
        const data = this.getData();
        const today = this.getTodayDate();
        
        if (data.records[today]) {
            const index = data.records[today].findIndex(r => r.id === recordId);
            if (index !== -1) {
                const record = data.records[today][index];
                // 从统计中减去
                data.stats.totalDuration -= record.duration;
                
                // 更新科目统计
                if (data.stats.subjectStats[record.subject]) {
                    data.stats.subjectStats[record.subject] -= record.duration;
                    if (data.stats.subjectStats[record.subject] <= 0) {
                        delete data.stats.subjectStats[record.subject];
                    }
                }
                
                data.records[today].splice(index, 1);
                
                // 如果当天没有记录了，删除当天的记录数组
                if (data.records[today].length === 0) {
                    delete data.records[today];
                }
                
                this.saveData(data);
                return true;
            }
        }
        return false;
    }
    
    // 更新统计数据
    updateStats(data, record) {
        // 更新总时长
        data.stats.totalDuration += record.duration;
        
        // 更新科目统计
        if (!data.stats.subjectStats[record.subject]) {
            data.stats.subjectStats[record.subject] = 0;
        }
        data.stats.subjectStats[record.subject] += record.duration;
        
        // 更新连续打卡天数
        this.updateStreakDays(data);
        
        // 更新总打卡天数
        data.stats.totalPunchDays = Object.keys(data.records).length;
    }
    
    // 更新连续打卡天数
    updateStreakDays(data) {
        const dates = Object.keys(data.records).sort();
        let streak = 0;
        let lastDate = null;
        
        for (let i = dates.length - 1; i >= 0; i--) {
            // 用本地时间解析日期（避免 UTC 时区偏移）
            const [y, m, d] = dates[i].split('-').map(Number);
            const currentDate = new Date(y, m - 1, d);
            
            if (lastDate === null) {
                streak = 1;
                lastDate = currentDate;
            } else {
                const diffDays = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    streak++;
                    lastDate = currentDate;
                } else {
                    break;
                }
            }
        }
        
        data.stats.streakDays = streak;
    }
    
    // 获取今天的所有记录
    getTodayRecords() {
        const data = this.getData();
        const today = this.getTodayDate();
        return data.records[today] || [];
    }
    
    // 获取今天的总学习时长
    getTodayDuration() {
        const todayRecords = this.getTodayRecords();
        return todayRecords.reduce((total, record) => total + record.duration, 0);
    }
    
    // 获取统计数据
    getStats() {
        const data = this.getData();
        return {
            ...data.stats,
            todayDuration: this.getTodayDuration()
        };
    }
    
    // 获取科目统计
    getSubjectStats() {
        const stats = this.getStats();
        return stats.subjectStats || {};
    }
    
    // 获取日期字符串（YYYY-MM-DD），使用本地时区
    getTodayDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 格式化日期显示
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    }
    
    // 格式化时间显示
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    // 计算距离考研的天数
    getDaysToExam() {
        const goal = this.getGoal();
        if (!goal.examDate) return null;
        
        const examDate = new Date(goal.examDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
    }
    
    // 计算今日目标进度百分比
    getTodayGoalProgress() {
        const goal = this.getGoal();
        const todayDuration = this.getTodayDuration();
        
        if (goal.dailyGoal <= 0) return 0;
        
        const progress = Math.min((todayDuration / goal.dailyGoal) * 100, 100);
        return Math.round(progress);
    }
    
    // 导出数据为JSON
    exportData() {
        const data = this.getData();
        const goal = this.getGoal();
        const exportObj = {
            app: 'Kaoyan Tracker',
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: data,
            goal: goal
        };
        
        return JSON.stringify(exportObj, null, 2);
    }
    
    // 从JSON导入数据
    importData(jsonStr) {
        try {
            const importObj = JSON.parse(jsonStr);
            
            if (importObj.app === 'Kaoyan Tracker') {
                this.saveData(importObj.data);
                this.saveGoal(importObj.goal);
                return true;
            }
        } catch (error) {
            console.error('导入数据失败:', error);
        }
        return false;
    }
    
    // 清除所有数据
    clearData() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.GOAL_KEY);
        this.init();
    }
}

// 创建全局存储实例
const storage = new KaoyanStorage();