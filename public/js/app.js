// 家庭任務管理系統 - 主應用程序

let currentUser = null;
let allTasks = [];
let allUsers = [];
let allTeams = [];
let currentTeam = null;
let currentFilter = 'all';
let selectedDate = new Date();
let currentMonth = new Date();
let isTeamDropdownOpen = false;

// 使用本地農曆轉換庫進行農曆轉換
function solarToLunar(year, month, day) {
    try {
        if (typeof LunarCalendar !== 'undefined') {
            return LunarCalendar.solarToLunar(year, month, day);
        }
    } catch (e) {
        console.error('Lunar conversion error:', e);
    }
    return null;
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
});

// 為日曆視圖生成週期任務實例
function generateRecurringTaskInstances(tasks, startDate, endDate) {
    const instances = [];

    tasks.forEach(task => {
        if (task.task_type === 'recurring' && task.recurrence_config) {
            const config = typeof task.recurrence_config === 'string'
                ? JSON.parse(task.recurrence_config)
                : task.recurrence_config;

            const start = new Date(startDate);
            const end = new Date(endDate);

            // Generate instances based on frequency
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (shouldShowRecurringTask(d, config)) {
                    // Create a virtual task instance for this date
                    instances.push({
                        ...task,
                        due_date: d.toISOString().split('T')[0],
                        isRecurringInstance: true
                    });
                }
            }
        } else {
            // Regular tasks or repeatable tasks - add as-is
            instances.push(task);
        }
    });

    return instances;
}

// 檢查週期任務是否應在特定日期顯示
function shouldShowRecurringTask(date, config) {
    const { frequency } = config;

    if (frequency === 'daily') {
        return true;
    } else if (frequency === 'weekly' && config.days) {
        return config.days.includes(date.getDay());
    } else if (frequency === 'monthly' && config.dates) {
        return config.dates.includes(date.getDate());
    } else if (frequency === 'yearly' && config.month && config.date) {
        return date.getMonth() + 1 === config.month && date.getDate() === config.date;
    }

    return false;
}

// 檢查用戶是否已登錄
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/auth.php?action=check');
        const data = await response.json();

        if (data.logged_in) {
            currentUser = data.user;
            if (document.getElementById('app-screen')) {
                initializeApp();
            }
        }
    } catch (error) {
        console.error('檢查登錄狀態時發生錯誤:', error);
    }
}

// 設置事件監聽器
function setupEventListeners() {
    // 登錄表單
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 註冊表單
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // 任務表單
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }

    // 設置表單
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }

}

// 根據註冊模式切換團隊設置字段
function toggleTeamFields() {
    const registerMode = document.querySelector('input[name="register_mode"]:checked').value;
    const createFields = document.getElementById('create-team-fields');
    const joinFields = document.getElementById('join-team-fields');
    const teamNameInput = document.getElementById('team-name');
    const inviteCodeInput = document.getElementById('invite-code');

    if (registerMode === 'create') {
        createFields.classList.remove('hidden');
        joinFields.classList.add('hidden');
        teamNameInput.required = true;
        inviteCodeInput.required = false;
    } else {
        createFields.classList.add('hidden');
        joinFields.classList.remove('hidden');
        teamNameInput.required = false;
        inviteCodeInput.required = true;
    }
}

// 切換自定義郵箱域名輸入框
function toggleCustomDomain() {
    const emailDomain = document.getElementById('email-domain').value;
    const customDomainInput = document.getElementById('custom-domain');

    if (emailDomain === 'custom') {
        customDomainInput.classList.remove('hidden');
        customDomainInput.required = true;
    } else {
        customDomainInput.classList.add('hidden');
        customDomainInput.required = false;
        customDomainInput.value = '';
    }
}

// 在登錄和註冊標籤之間切換
function switchTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.className = 'tab-active border-primary text-primary whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm';
        registerTab.className = 'tab-inactive border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginTab.className = 'tab-inactive border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm';
        registerTab.className = 'tab-active border-primary text-primary whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm';
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

// 處理登錄
async function handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch('/api/auth.php?action=login', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            window.location.reload();
        } else {
            errorDiv.textContent = data.message;
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = '登入失敗。請重試。';
        errorDiv.classList.remove('hidden');
    }
}

// 處理註冊
async function handleRegister(e) {
    e.preventDefault();

    const errorDiv = document.getElementById('register-error');

    // 獲取郵箱組件
    const emailUsername = document.getElementById('email-username').value.trim();
    const emailDomainSelect = document.getElementById('email-domain').value;
    const customDomain = document.getElementById('custom-domain').value.trim();

    // 拼接完整郵箱地址
    let emailDomain = emailDomainSelect;
    if (emailDomainSelect === 'custom') {
        if (!customDomain) {
            errorDiv.textContent = '請輸入自定義郵箱域名';
            errorDiv.classList.remove('hidden');
            return;
        }
        emailDomain = customDomain;
    }

    const fullEmail = emailUsername + '@' + emailDomain;

    // 驗證郵箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fullEmail)) {
        errorDiv.textContent = '郵箱格式不正確';
        errorDiv.classList.remove('hidden');
        return;
    }

    // 獲取其他表單數據
    const nickname = document.getElementById('reg-nickname').value.trim();
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;

    // 驗證密碼確認
    if (password !== passwordConfirm) {
        errorDiv.textContent = '兩次輸入的密碼不一致';
        errorDiv.classList.remove('hidden');
        return;
    }

    const formData = new FormData(e.target);
    const registerMode = formData.get('register_mode');
    const inviteCode = formData.get('invite_code');

    // 僅驗證加入團隊時的邀請碼
    if (registerMode === 'join') {
        if (!inviteCode || inviteCode.trim() === '') {
            errorDiv.textContent = '請輸入邀請碼';
            errorDiv.classList.remove('hidden');
            return;
        }
        if (inviteCode.length !== 6) {
            errorDiv.textContent = '邀請碼必須是6位字符';
            errorDiv.classList.remove('hidden');
            return;
        }
    }

    try {
        // 創建新的 FormData，使用完整郵箱地址作為 username
        const submitData = new FormData();
        submitData.append('username', fullEmail);
        submitData.append('nickname', nickname);
        submitData.append('password', password);

        // 如果有邀請碼就加入團隊，否則創建新團隊
        if (inviteCode && inviteCode.trim()) {
            submitData.append('invite_code', inviteCode.trim());
        }

        // team_name為可選，為空時後端會使用默認名稱
        const teamName = formData.get('team_name');
        if (teamName && teamName.trim()) {
            submitData.append('team_name', teamName.trim());
        }

        const response = await fetch('/api/auth.php?action=register', {
            method: 'POST',
            body: submitData
        });

        const data = await response.json();

        if (data.success) {
            alert('註冊成功！請登入。');
            switchTab('login');
            e.target.reset();
            errorDiv.classList.add('hidden');
        } else {
            errorDiv.textContent = data.message;
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = '註冊失敗。請重試。';
        errorDiv.classList.remove('hidden');
    }
}

// Initialize main app
async function initializeApp() {
    await loadTeams();
    renderHeader();
    renderMainLayout();
    await loadUsers();
    await loadTasks();
}

// Render main layout with calendar and task list
function renderMainLayout() {
    const main = document.getElementById('app-main');
    main.className = 'flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8';
    main.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <!-- Left: Calendar (2/3 width) -->
            <div class="lg:col-span-2">
                <div class="bg-white dark:bg-slate-900/50 rounded-lg shadow-sm p-6">
                    <div id="calendar-container"></div>
                </div>
            </div>

            <!-- Right: Task List (1/3 width) -->
            <div class="lg:col-span-1">
                <div class="bg-white dark:bg-slate-900/50 rounded-lg shadow-sm p-6 sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">任務列表</h2>
                        <button onclick="openTaskModal()" class="inline-flex items-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Filter buttons -->
                    <div class="flex flex-col gap-2 mb-6">
                        <button onclick="filterTasks('all')" class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-white text-center" data-filter="all">全部</button>
                        <button onclick="filterTasks('pending')" class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center" data-filter="pending">待處理</button>
                        <button onclick="filterTasks('in_progress')" class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center" data-filter="in_progress">進行中</button>
                        <button onclick="filterTasks('completed')" class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center" data-filter="completed">已完成</button>
                    </div>

                    <!-- Task list -->
                    <div id="task-list" class="space-y-3"></div>
                </div>
            </div>
        </div>
    `;

    renderCalendar();
}

// Render calendar
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    // Generate recurring task instances for current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const tasksWithInstances = generateRecurringTaskInstances(allTasks, monthStart, monthEnd);

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    let html = `
        <div class="calendar">
            <!-- Calendar Header -->
            <div class="flex items-center justify-between mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 p-4 rounded-xl">
                <button onclick="previousMonth()" class="p-2.5 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all hover:scale-110">
                    <svg class="h-6 w-6 text-primary dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white tracking-wide">${year}年 ${monthNames[month]}</h3>
                <button onclick="nextMonth()" class="p-2.5 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all hover:scale-110">
                    <svg class="h-6 w-6 text-primary dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>

            <!-- Week days -->
            <div class="grid grid-cols-7 gap-2 mb-3">
                ${weekDays.map(day => `<div class="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">${day}</div>`).join('')}
            </div>

            <!-- Calendar days -->
            <div class="grid grid-cols-7 gap-2">
    `;

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
        html += '<div class="aspect-square min-h-32"></div>';
    }

    // Days in month
    const today = new Date();
    const isToday = (day) => {
        return today.getDate() === day &&
               today.getMonth() === month &&
               today.getFullYear() === year;
    };

    const isSelected = (day) => {
        return selectedDate.getDate() === day &&
               selectedDate.getMonth() === month &&
               selectedDate.getFullYear() === year;
    };

    for (let day = 1; day <= daysInMonth; day++) {
        const todayClass = isToday(day) ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 shadow-lg' : '';
        const isSelectedDay = isSelected(day);
        const selectedClass = isSelectedDay ? 'bg-primary/10 dark:bg-primary/20 border-primary dark:border-primary shadow-md scale-[1.02]' : 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md';

        // Get tasks for this day (including recurring instances)
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTasks = tasksWithInstances.filter(task => task.due_date === dateStr);

        // Get lunar date
        const lunar = solarToLunar(year, month + 1, day);
        // Show month name on the first day of lunar month, otherwise just show day
        const lunarText = lunar ? (lunar.day === '初一' ? lunar.month : lunar.day) : '';

        // Build task list HTML with colored dots
        let tasksHtml = '';
        if (dayTasks.length > 0) {
            const visibleTasks = dayTasks.slice(0, 5);
            tasksHtml = '<div class="w-full space-y-1 mt-2">';
            tasksHtml += visibleTasks.map(task => {
                const priorityColor = task.priority === 'high' ? 'bg-red-500' :
                                     task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500';
                return `<div class="flex items-center gap-1.5 w-full">
                    <div class="w-1.5 h-1.5 rounded-full ${priorityColor} flex-shrink-0 shadow-sm"></div>
                    <span class="text-xs truncate text-gray-700 dark:text-gray-300" title="${task.title}">${task.title}</span>
                </div>`;
            }).join('');
            tasksHtml += '</div>';

            if (dayTasks.length > 5) {
                tasksHtml += `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">+${dayTasks.length - 5} 更多</div>`;
            }
        }

        const dateNumColor = isSelectedDay ? 'text-primary dark:text-blue-400 font-extrabold' : isToday(day) ? 'text-primary dark:text-blue-400' : 'text-gray-900 dark:text-gray-100';
        const lunarColor = isSelectedDay ? 'text-primary/70 dark:text-blue-400/70' : 'text-gray-500 dark:text-gray-400';

        html += `
            <button onclick="selectDate(${year}, ${month}, ${day})"
                    class="relative min-h-32 p-3 flex flex-col items-start rounded-xl text-sm transition-all duration-200 border ${selectedClass} ${todayClass}">
                <div class="flex items-baseline gap-2 w-full">
                    <span class="font-bold text-base ${dateNumColor}">${day}</span>
                    ${lunarText ? `<span class="text-xs ${lunarColor} font-medium">${lunarText}</span>` : ''}
                </div>
                ${tasksHtml}
            </button>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Calendar navigation
function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
}

function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    renderCalendar();
    filterTasksByDate();
}

// Filter tasks by selected date
function filterTasksByDate() {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const filtered = allTasks.filter(task => {
        if (!task.due_date) return false;
        return task.due_date === dateStr;
    });

    renderTasks(filtered.length > 0 ? filtered : allTasks);
}

// 渲染頁首
function renderHeader() {
    const header = document.getElementById('app-header');

    // 構建團隊切換器下拉菜單
    const teamDropdown = allTeams.length > 0 ? `
        <div class="relative">
            <button onclick="toggleTeamDropdown(event)" id="team-dropdown-btn" class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span>${currentTeam?.name || '未選擇團隊'}</span>
                <svg class="h-4 w-4 transition-transform" id="team-dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div id="team-dropdown-menu" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 hidden">
                ${allTeams.map(team => `
                    <button
                        onclick="switchCurrentTeam(${team.id})"
                        class="block w-full text-left px-4 py-2 text-sm ${team.id == currentUser.current_team_id ? 'text-primary font-semibold' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        ${team.name}
                        ${team.id == currentUser.current_team_id ? '<span class="float-right">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
        </div>
    ` : '';

    header.innerHTML = `
        <header class="bg-white dark:bg-background-dark/50 border-b border-gray-200 dark:border-gray-700/50">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center gap-4">
                        <svg class="h-8 w-8 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
                            <path clip-rule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor" fill-rule="evenodd"></path>
                        </svg>
                        <h1 class="text-xl font-bold text-gray-900 dark:text-white">家庭任務管理系統</h1>
                    </div>
                    <div class="flex items-center gap-4">
                        ${teamDropdown}
                        <span class="text-sm text-gray-600 dark:text-gray-300">您好，${currentUser.nickname}</span>
                        <button onclick="showSettings()" class="text-sm text-gray-600 dark:text-gray-300 hover:text-primary">設置</button>
                        <button onclick="handleLogout()" class="text-sm text-gray-600 dark:text-gray-300 hover:text-primary">登出</button>
                    </div>
                </div>
            </div>
        </header>
    `;
}

// 載入團隊列表
async function loadTeams() {
    try {
        const response = await fetch('/api/teams.php');
        const data = await response.json();

        if (data.success) {
            allTeams = data.teams;
            // 查找當前團隊
            if (currentUser?.current_team_id) {
                currentTeam = allTeams.find(t => t.id == currentUser.current_team_id);
            }
        }
    } catch (error) {
        console.error('載入團隊時發生錯誤:', error);
    }
}

// 切換當前團隊
async function switchCurrentTeam(teamId) {
    try {
        const formData = new URLSearchParams();
        formData.append('team_id', teamId);

        const response = await fetch('/api/teams.php?action=switch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            // 更新當前用戶和團隊
            currentUser.current_team_id = teamId;
            currentTeam = allTeams.find(t => t.id == teamId);

            // 刷新介面
            isTeamDropdownOpen = false;
            renderHeader();
            await loadUsers();
            await loadTasks();
        } else {
            alert(data.message || '切換團隊失敗');
        }
    } catch (error) {
        console.error('切換團隊時發生錯誤:', error);
        alert('切換團隊時發生錯誤');
    }
}

// 切換團隊下拉菜單
function toggleTeamDropdown(event) {
    event.stopPropagation();
    isTeamDropdownOpen = !isTeamDropdownOpen;

    const menu = document.getElementById('team-dropdown-menu');
    const arrow = document.getElementById('team-dropdown-arrow');

    if (isTeamDropdownOpen) {
        menu.classList.remove('hidden');
        arrow.style.transform = 'rotate(180deg)';
    } else {
        menu.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}

// 點擊外部關閉團隊下拉菜單
document.addEventListener('click', function(event) {
    if (isTeamDropdownOpen) {
        const menu = document.getElementById('team-dropdown-menu');
        const btn = document.getElementById('team-dropdown-btn');

        if (menu && btn && !menu.contains(event.target) && !btn.contains(event.target)) {
            isTeamDropdownOpen = false;
            menu.classList.add('hidden');
            const arrow = document.getElementById('team-dropdown-arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
    }
});

// Load users for dropdown
async function loadUsers() {
    try {
        const response = await fetch('/api/users.php');
        const data = await response.json();

        if (data.success) {
            allUsers = data.users;
            populateUserDropdown();
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Populate user dropdown in task modal
function populateUserDropdown() {
    const select = document.getElementById('task-assignee');
    select.innerHTML = '<option value="">未指派</option>';

    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.nickname;
        select.appendChild(option);
    });
}

// Load tasks
async function loadTasks(status = 'all') {
    currentFilter = status;
    const url = status === 'all' ? '/api/tasks.php' : `/api/tasks.php?status=${status}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            allTasks = data.tasks;
            renderTasks();
            // Re-render calendar to show tasks
            renderCalendar();
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Filter tasks by status
function filterTasks(status) {
    currentFilter = status;

    // Update filter button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === status) {
            btn.className = 'filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-white';
        } else {
            btn.className = 'filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        }
    });

    // Filter and render tasks
    if (status === 'all') {
        renderTasks(allTasks);
    } else {
        const filtered = allTasks.filter(task => task.status === status);
        renderTasks(filtered);
    }
}

// Render tasks - updated to work with new layout
function renderTasks(tasksToRender = null) {
    const taskList = document.getElementById('task-list');
    const tasks = tasksToRender || allTasks;

    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                沒有找到任務。建立一個開始吧！
            </div>
        `;
        return;
    }

    taskList.innerHTML = tasks.map(task => renderTaskCard(task)).join('');
}

// Render single task card
function renderTaskCard(task) {
    const statusClass = `status-${task.status}`;

    // Map status to Chinese text
    const statusMap = {
        'pending': '待處理',
        'in_progress': '進行中',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    const statusText = statusMap[task.status] || task.status;

    // Priority dot color
    const priorityDotColor = task.priority === 'high' ? 'bg-red-500' :
                             task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500';

    const assigneeName = task.assignee_name || '未指派';
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) : '';

    // Task type badge
    const taskTypeBadge = task.task_type === 'recurring' ? '<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">🔄 週期</span>' :
                         task.task_type === 'repeatable' ? '<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">📋 重複</span>' : '';

    return `
        <div class="group border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800/50" onclick="editTask(${task.id})">
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div class="w-2.5 h-2.5 rounded-full ${priorityDotColor} flex-shrink-0 shadow-sm"></div>
                    <h3 class="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">${task.title}</h3>
                </div>
                <button onclick="event.stopPropagation(); deleteTask(${task.id})" class="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>

            ${task.description ? `<p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 ml-5">${task.description}</p>` : ''}

            <div class="flex items-center gap-1 flex-wrap mb-2 ml-5">
                <span class="px-2 py-0.5 text-xs font-medium rounded-full ${statusClass}">${statusText}</span>
                ${taskTypeBadge}
            </div>

            <div class="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 ml-5">
                ${task.assignee_name ? `
                    <div class="flex items-center">
                        <svg class="h-3 w-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span class="truncate">${assigneeName}</span>
                    </div>
                ` : ''}
                ${dueDate ? `
                    <div class="flex items-center">
                        <svg class="h-3 w-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>${dueDate}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Toggle recurrence options visibility
function toggleRecurrenceOptions() {
    const taskType = document.getElementById('task-type').value;
    const recurrenceOptions = document.getElementById('recurrence-options');

    if (taskType === 'recurring') {
        recurrenceOptions.classList.remove('hidden');
        updateRecurrenceFields();
    } else {
        recurrenceOptions.classList.add('hidden');
    }
}

// Update recurrence fields based on frequency
function updateRecurrenceFields() {
    const frequency = document.getElementById('recurrence-frequency').value;
    document.getElementById('weekly-options').classList.add('hidden');
    document.getElementById('monthly-options').classList.add('hidden');
    document.getElementById('yearly-options').classList.add('hidden');

    if (frequency === 'weekly') {
        document.getElementById('weekly-options').classList.remove('hidden');
    } else if (frequency === 'monthly') {
        document.getElementById('monthly-options').classList.remove('hidden');
    } else if (frequency === 'yearly') {
        document.getElementById('yearly-options').classList.remove('hidden');
    }
}

// Build recurrence config object from form
function buildRecurrenceConfig() {
    const taskType = document.getElementById('task-type').value;
    if (taskType !== 'recurring') {
        return null;
    }

    const frequency = document.getElementById('recurrence-frequency').value;
    const config = { frequency };

    if (frequency === 'weekly') {
        const days = Array.from(document.querySelectorAll('.recurrence-weekday:checked'))
            .map(cb => parseInt(cb.value));
        config.days = days;
    } else if (frequency === 'monthly') {
        const datesInput = document.getElementById('recurrence-monthly-dates').value;
        config.dates = datesInput.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
    } else if (frequency === 'yearly') {
        config.month = parseInt(document.getElementById('recurrence-yearly-month').value);
        config.date = parseInt(document.getElementById('recurrence-yearly-date').value);
    }

    return config;
}

// Open task modal
function openTaskModal(task = null) {
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('task-form');

    if (task) {
        title.textContent = '編輯任務';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-assignee').value = task.assignee_id || '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-due-date').value = task.due_date || '';
        document.getElementById('task-type').value = task.task_type || 'normal';

        // Load recurrence config if exists
        if (task.task_type === 'recurring' && task.recurrence_config) {
            const config = typeof task.recurrence_config === 'string'
                ? JSON.parse(task.recurrence_config)
                : task.recurrence_config;

            document.getElementById('recurrence-frequency').value = config.frequency;
            toggleRecurrenceOptions();
            updateRecurrenceFields();

            if (config.frequency === 'weekly' && config.days) {
                config.days.forEach(day => {
                    const checkbox = document.querySelector(`.recurrence-weekday[value="${day}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            } else if (config.frequency === 'monthly' && config.dates) {
                document.getElementById('recurrence-monthly-dates').value = config.dates.join(',');
            } else if (config.frequency === 'yearly') {
                document.getElementById('recurrence-yearly-month').value = config.month;
                document.getElementById('recurrence-yearly-date').value = config.date;
            }
        } else {
            toggleRecurrenceOptions();
        }
    } else {
        title.textContent = '建立任務';
        form.reset();
        document.getElementById('task-id').value = '';
        document.getElementById('task-type').value = 'normal';
        toggleRecurrenceOptions();
    }

    modal.classList.remove('hidden');
}

// Close task modal
function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.add('hidden');
}

// Edit task
function editTask(taskId) {
    const task = allTasks.find(t => t.id == taskId);
    if (task) {
        openTaskModal(task);
    }
}

// Handle task form submission
async function handleTaskSubmit(e) {
    e.preventDefault();

    const taskId = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        assignee_id: document.getElementById('task-assignee').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        due_date: document.getElementById('task-due-date').value,
        task_type: document.getElementById('task-type').value
    };

    // Add recurrence config if task is recurring
    const recurrenceConfig = buildRecurrenceConfig();
    if (recurrenceConfig) {
        taskData.recurrence_config = recurrenceConfig;
    }

    try {
        const url = taskId ? `/api/tasks.php?id=${taskId}` : '/api/tasks.php';
        const method = taskId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (data.success) {
            closeTaskModal();
            loadTasks(currentFilter);
        } else {
            alert('錯誤：' + data.message);
        }
    } catch (error) {
        alert('儲存任務失敗');
        console.error(error);
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('您確定要刪除此任務嗎？')) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks.php?id=${taskId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            loadTasks(currentFilter);
        } else {
            alert('錯誤：' + data.message);
        }
    } catch (error) {
        alert('刪除任務失敗');
        console.error(error);
    }
}

// 處理登出
async function handleLogout() {
    try {
        await fetch('/api/auth.php?action=logout', { method: 'POST' });
        window.location.reload();
    } catch (error) {
        console.error('登出錯誤:', error);
    }
}

// 顯示設置模態框
function showSettings() {
    const modal = document.getElementById('settings-modal');

    // 重置為個人設置標籤
    switchSettingsTab('profile');

    // 填充個人設置
    document.getElementById('settings-nickname').value = currentUser.nickname;
    document.getElementById('settings-password').value = '';
    document.getElementById('settings-password-confirm').value = '';

    // 載入版本信息
    loadVersionInfo();

    modal.classList.remove('hidden');
}

// 切換設置標籤
function switchSettingsTab(tab) {
    const profileTab = document.getElementById('profile-tab');
    const teamTab = document.getElementById('team-tab');
    const profileSettings = document.getElementById('profile-settings');
    const teamSettings = document.getElementById('team-settings');

    if (tab === 'profile') {
        profileTab.classList.add('text-primary', 'border-b-2', 'border-primary');
        profileTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        teamTab.classList.remove('text-primary', 'border-b-2', 'border-primary');
        teamTab.classList.add('text-gray-500', 'dark:text-gray-400');
        profileSettings.classList.remove('hidden');
        teamSettings.classList.add('hidden');
    } else {
        teamTab.classList.add('text-primary', 'border-b-2', 'border-primary');
        teamTab.classList.remove('text-gray-500', 'dark:text-gray-400');
        profileTab.classList.remove('text-primary', 'border-b-2', 'border-primary');
        profileTab.classList.add('text-gray-500', 'dark:text-gray-400');
        teamSettings.classList.remove('hidden');
        profileSettings.classList.add('hidden');
        loadAllTeamsSettings();
    }
}

// 載入所有團隊設置
async function loadAllTeamsSettings() {
    const allTeamsList = document.getElementById('all-teams-list');
    allTeamsList.innerHTML = '<div class="text-center py-4 text-gray-500 dark:text-gray-400">載入中...</div>';

    try {
        // 載入所有團隊的詳細信息
        const teamsData = await Promise.all(
            allTeams.map(async team => {
                const [teamResponse, membersResponse] = await Promise.all([
                    fetch(`/api/teams.php?id=${team.id}`),
                    fetch(`/api/teams.php?id=${team.id}&action=members`)
                ]);

                const teamData = await teamResponse.json();
                const membersData = await membersResponse.json();

                return {
                    ...teamData.team,
                    members: membersData.members || []
                };
            })
        );

        // 渲染所有團隊
        allTeamsList.innerHTML = teamsData.map(team => {
            const isAdmin = team.user_role === 'admin';
            const isCurrent = team.id == currentUser.current_team_id;

            return `
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${isCurrent ? 'ring-2 ring-primary' : ''}">
                    <!-- 團隊標題 -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${team.name}</h3>
                            ${isCurrent ? '<span class="px-2 py-1 text-xs font-medium bg-primary text-white rounded">當前團隊</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            ${isAdmin ? `<button onclick="toggleTeamEdit(${team.id})" class="text-sm text-primary hover:underline">編輯</button>` : ''}
                            ${isAdmin ? `<button onclick="confirmDeleteTeam(${team.id}, '${team.name}')" class="text-sm text-red-600 hover:underline dark:text-red-400">刪除</button>` : ''}
                        </div>
                    </div>

                    <!-- 團隊名稱編輯表單（默認隱藏） -->
                    <div id="team-edit-${team.id}" class="hidden mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">團隊名稱</label>
                        <div class="flex gap-2">
                            <input type="text" id="team-name-${team.id}" value="${team.name}" class="flex-1 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"/>
                            <button onclick="saveTeamName(${team.id})" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">保存</button>
                            <button onclick="toggleTeamEdit(${team.id})" class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600">取消</button>
                        </div>
                    </div>

                    <!-- 邀請碼 -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邀請碼</label>
                        <div class="flex gap-2">
                            <input type="text" value="${team.invite_code}" readonly class="flex-1 rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-lg tracking-wider"/>
                            <button onclick="copyTeamInviteCode('${team.invite_code}')" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">複製</button>
                            ${isAdmin ? `<button onclick="regenerateTeamInviteCode(${team.id})" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">重新生成</button>` : ''}
                        </div>
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">分享此邀請碼給其他人，讓他們加入您的團隊</p>
                    </div>

                    <!-- 團隊成員 -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">團隊成員 (${team.members.length})</h4>
                        <div class="space-y-2">
                            ${team.members.map(member => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                                            ${member.nickname.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div class="font-medium text-gray-900 dark:text-white">${member.nickname}</div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400">${member.username}</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-1 text-xs font-medium rounded ${member.role === 'admin' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}">
                                            ${member.role === 'admin' ? '管理員' : '成員'}
                                        </span>
                                        ${isAdmin && member.user_id != currentUser.id ? `
                                            <button onclick="removeTeamMember(${team.id}, ${member.user_id})" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('載入團隊設置時發生錯誤:', error);
        allTeamsList.innerHTML = '<div class="text-center py-4 text-red-600">載入失敗，請重試</div>';
    }
}

// 切換團隊編輯模式
function toggleTeamEdit(teamId) {
    const editDiv = document.getElementById(`team-edit-${teamId}`);
    editDiv.classList.toggle('hidden');
}

// 保存團隊名稱
async function saveTeamName(teamId) {
    const newName = document.getElementById(`team-name-${teamId}`).value.trim();

    if (!newName) {
        alert('團隊名稱不能為空');
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append('name', newName);

        const response = await fetch(`/api/teams.php?id=${teamId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            // 更新團隊列表
            const teamIndex = allTeams.findIndex(t => t.id == teamId);
            if (teamIndex !== -1) {
                allTeams[teamIndex].name = newName;
                if (currentTeam && currentTeam.id == teamId) {
                    currentTeam.name = newName;
                    renderHeader();
                }
            }

            // 重新載入團隊設置
            loadAllTeamsSettings();
            alert('團隊名稱已更新');
        } else {
            alert(data.message || '保存失敗');
        }
    } catch (error) {
        console.error('保存團隊名稱時發生錯誤:', error);
        alert('保存團隊名稱時發生錯誤');
    }
}

// 複製團隊邀請碼
function copyTeamInviteCode(inviteCode) {
    navigator.clipboard.writeText(inviteCode).then(() => {
        alert('邀請碼已複製到剪貼板！');
    }).catch(err => {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動複製');
    });
}

// 重新生成團隊邀請碼
async function regenerateTeamInviteCode(teamId) {
    if (!confirm('重新生成邀請碼後，舊的邀請碼將失效。確定要繼續嗎？')) {
        return;
    }

    try {
        const response = await fetch(`/api/teams.php?id=${teamId}&action=regenerate_code`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            // 更新團隊列表中的邀請碼
            const teamIndex = allTeams.findIndex(t => t.id == teamId);
            if (teamIndex !== -1) {
                allTeams[teamIndex].invite_code = data.invite_code;
                if (currentTeam && currentTeam.id == teamId) {
                    currentTeam.invite_code = data.invite_code;
                }
            }

            // 重新載入團隊設置
            loadAllTeamsSettings();
            alert('邀請碼已重新生成！');
        } else {
            alert(data.message || '重新生成失敗');
        }
    } catch (error) {
        console.error('重新生成邀請碼時發生錯誤:', error);
        alert('重新生成邀請碼時發生錯誤');
    }
}

// 移除團隊成員
async function removeTeamMember(teamId, userId) {
    if (!confirm('確定要移除此成員嗎？')) {
        return;
    }

    try {
        const response = await fetch(`/api/teams.php?id=${teamId}&user_id=${userId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            // 重新載入團隊設置
            loadAllTeamsSettings();
            alert('成員已移除');
        } else {
            alert(data.message || '移除失敗');
        }
    } catch (error) {
        console.error('移除成員時發生錯誤:', error);
        alert('移除成員時發生錯誤');
    }
}

// 顯示創建團隊表單
function showCreateTeamForm() {
    const form = document.getElementById('create-team-form');
    form.classList.remove('hidden');
    document.getElementById('new-team-name').value = '';
    document.getElementById('new-team-name').focus();
}

// 隱藏創建團隊表單
function hideCreateTeamForm() {
    const form = document.getElementById('create-team-form');
    form.classList.add('hidden');
    document.getElementById('new-team-name').value = '';
}

// 創建新團隊
async function createNewTeam() {
    const teamName = document.getElementById('new-team-name').value.trim();

    if (!teamName) {
        alert('團隊名稱不能為空');
        return;
    }

    try {
        const response = await fetch('/api/teams.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: teamName })
        });
        const data = await response.json();

        if (data.success) {
            // 添加新團隊到列表
            allTeams.push(data.team);

            // 如果成功創建後自動切換到新團隊，更新當前團隊
            currentTeam = data.team;
            currentUser.current_team_id = data.team.id;

            // 重新載入團隊設置
            hideCreateTeamForm();
            await loadAllTeamsSettings();
            renderHeader();

            alert('團隊創建成功！');
        } else {
            alert(data.message || '創建失敗');
        }
    } catch (error) {
        console.error('創建團隊時發生錯誤:', error);
        alert('創建團隊時發生錯誤');
    }
}

// 確認刪除團隊
function confirmDeleteTeam(teamId, teamName) {
    if (confirm(`確定要刪除團隊「${teamName}」嗎？\n\n刪除團隊將會：\n- 移除所有團隊成員\n- 刪除所有團隊任務\n- 此操作無法撤銷！`)) {
        deleteTeam(teamId);
    }
}

// 刪除團隊
async function deleteTeam(teamId) {
    try {
        const response = await fetch(`/api/teams.php?id=${teamId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            // 如果刪除的是當前團隊，後端會自動切換到另一個團隊
            // 需要重新載入用戶信息以獲取新的 current_team_id
            await checkLoginStatus();

            // 重新載入團隊列表和當前團隊
            await loadTeams();

            // 刷新界面
            renderHeader();
            await loadUsers();
            await loadTasks();
            await loadAllTeamsSettings();

            alert('團隊已刪除');
        } else {
            alert(data.message || '刪除失敗');
        }
    } catch (error) {
        console.error('刪除團隊時發生錯誤:', error);
        alert('刪除團隊時發生錯誤');
    }
}

// 關閉設置模態框
function closeSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('hidden');
}

// 處理設置表單提交
async function handleSettingsSubmit(e) {
    e.preventDefault();

    const nickname = document.getElementById('settings-nickname').value.trim();
    const password = document.getElementById('settings-password').value;
    const passwordConfirm = document.getElementById('settings-password-confirm').value;

    // 驗證輸入
    if (!nickname) {
        alert('暱稱不能為空');
        return;
    }

    // 如果要修改密碼，檢查密碼確認
    if (password || passwordConfirm) {
        if (password !== passwordConfirm) {
            alert('兩次輸入的密碼不一致');
            return;
        }
        if (password.length < 6) {
            alert('密碼至少需要 6 個字符');
            return;
        }
    }

    try {
        const formData = new URLSearchParams();
        formData.append('nickname', nickname);
        if (password) {
            formData.append('password', password);
        }

        const response = await fetch('/api/profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            // 更新當前用戶信息
            currentUser.nickname = nickname;
            // 重新渲染頁首以顯示新暱稱
            renderHeader();
            closeSettings();
            alert('設置已保存');
        } else {
            alert(data.message || '保存失敗');
        }
    } catch (error) {
        console.error('保存設置時發生錯誤:', error);
        alert('保存設置時發生錯誤');
    }
}

// ============================================
// 系統更新功能
// ============================================

// 載入版本信息
async function loadVersionInfo() {
    try {
        const response = await fetch('/api/update.php?action=version');
        const data = await response.json();

        if (data.success) {
            document.getElementById('current-version').textContent = data.version;
            document.getElementById('current-branch').textContent = data.branch;

            if (data.last_update && data.last_update !== 'unknown') {
                const date = new Date(data.last_update);
                document.getElementById('last-update').textContent = date.toLocaleString('zh-TW');
            } else {
                document.getElementById('last-update').textContent = '-';
            }

            if (!data.is_git) {
                document.getElementById('current-version').textContent = '未使用 Git 部署';
            }
        }
    } catch (error) {
        console.error('載入版本信息時發生錯誤:', error);
        document.getElementById('current-version').textContent = '載入失敗';
    }
}

// 檢查更新
async function checkForUpdates() {
    const statusDiv = document.getElementById('update-status');
    const updateBtn = document.getElementById('update-btn');

    statusDiv.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400">檢查中...</div>';
    statusDiv.classList.remove('hidden', 'bg-green-50', 'dark:bg-green-900/20', 'bg-blue-50', 'dark:bg-blue-900/20', 'bg-red-50', 'dark:bg-red-900/20');
    statusDiv.classList.add('bg-gray-50', 'dark:bg-gray-800');
    updateBtn.classList.add('hidden');

    try {
        const response = await fetch('/api/update.php?action=check');
        const data = await response.json();

        if (!data.success) {
            statusDiv.innerHTML = `
                <div class="flex items-start gap-3">
                    <svg class="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-red-800 dark:text-red-200">檢查失敗</div>
                        <div class="text-sm text-red-700 dark:text-red-300 mt-1">${data.message}</div>
                    </div>
                </div>
            `;
            statusDiv.classList.remove('bg-gray-50', 'dark:bg-gray-800');
            statusDiv.classList.add('bg-red-50', 'dark:bg-red-900/20');
            return;
        }

        if (data.has_update) {
            let changelogHtml = '';
            if (data.changelog && data.changelog.length > 0) {
                changelogHtml = `
                    <div class="mt-3 border-t border-blue-200 dark:border-blue-700 pt-3">
                        <div class="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">更新內容：</div>
                        <ul class="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                            ${data.changelog.map(log => `<li class="font-mono">${log}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            statusDiv.innerHTML = `
                <div class="flex items-start gap-3">
                    <svg class="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-blue-800 dark:text-blue-200">發現新版本</div>
                        <div class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            當前版本: <span class="font-mono">${data.current_version}</span><br>
                            最新版本: <span class="font-mono">${data.remote_version}</span>
                        </div>
                        ${changelogHtml}
                    </div>
                </div>
            `;
            statusDiv.classList.remove('bg-gray-50', 'dark:bg-gray-800');
            statusDiv.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            updateBtn.classList.remove('hidden');
        } else {
            statusDiv.innerHTML = `
                <div class="flex items-start gap-3">
                    <svg class="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-green-800 dark:text-green-200">已是最新版本</div>
                        <div class="text-sm text-green-700 dark:text-green-300 mt-1">
                            當前版本: <span class="font-mono">${data.current_version}</span>
                        </div>
                    </div>
                </div>
            `;
            statusDiv.classList.remove('bg-gray-50', 'dark:bg-gray-800');
            statusDiv.classList.add('bg-green-50', 'dark:bg-green-900/20');
        }

        // 重新載入版本信息
        await loadVersionInfo();
    } catch (error) {
        console.error('檢查更新時發生錯誤:', error);
        statusDiv.innerHTML = `
            <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="flex-1">
                    <div class="text-sm font-medium text-red-800 dark:text-red-200">檢查失敗</div>
                    <div class="text-sm text-red-700 dark:text-red-300 mt-1">請檢查網絡連接</div>
                </div>
            </div>
        `;
        statusDiv.classList.remove('bg-gray-50', 'dark:bg-gray-800');
        statusDiv.classList.add('bg-red-50', 'dark:bg-red-900/20');
    }
}

// 執行更新
async function performUpdate() {
    if (!confirm('確定要更新系統嗎？\n\n更新過程中系統可能會短暫不可用。\n建議在更新前備份重要數據。')) {
        return;
    }

    const statusDiv = document.getElementById('update-status');
    const updateBtn = document.getElementById('update-btn');

    statusDiv.innerHTML = `
        <div class="flex items-center gap-3">
            <svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="text-sm text-blue-700 dark:text-blue-300">正在更新系統，請稍候...</div>
        </div>
    `;
    statusDiv.classList.remove('hidden', 'bg-green-50', 'dark:bg-green-900/20', 'bg-red-50', 'dark:bg-red-900/20');
    statusDiv.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
    updateBtn.disabled = true;

    try {
        const response = await fetch('/api/update.php?action=update', {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            statusDiv.innerHTML = `
                <div class="flex items-start gap-3">
                    <svg class="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-green-800 dark:text-green-200">更新成功</div>
                        <div class="text-sm text-green-700 dark:text-green-300 mt-1">系統已更新到最新版本，建議刷新頁面</div>
                        ${data.output ? `<pre class="mt-2 text-xs text-green-700 dark:text-green-300 overflow-x-auto">${data.output}</pre>` : ''}
                    </div>
                </div>
            `;
            statusDiv.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
            statusDiv.classList.add('bg-green-50', 'dark:bg-green-900/20');
            updateBtn.classList.add('hidden');

            // 重新載入版本信息
            await loadVersionInfo();

            // 提示用戶刷新頁面
            setTimeout(() => {
                if (confirm('更新完成！是否立即刷新頁面以應用更新？')) {
                    window.location.reload();
                }
            }, 2000);
        } else {
            statusDiv.innerHTML = `
                <div class="flex items-start gap-3">
                    <svg class="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="flex-1">
                        <div class="text-sm font-medium text-red-800 dark:text-red-200">更新失敗</div>
                        <div class="text-sm text-red-700 dark:text-red-300 mt-1">${data.message}</div>
                        ${data.output ? `<pre class="mt-2 text-xs text-red-700 dark:text-red-300 overflow-x-auto">${data.output}</pre>` : ''}
                    </div>
                </div>
            `;
            statusDiv.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
            statusDiv.classList.add('bg-red-50', 'dark:bg-red-900/20');
            updateBtn.disabled = false;
        }
    } catch (error) {
        console.error('更新時發生錯誤:', error);
        statusDiv.innerHTML = `
            <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="flex-1">
                    <div class="text-sm font-medium text-red-800 dark:text-red-200">更新失敗</div>
                    <div class="text-sm text-red-700 dark:text-red-300 mt-1">請檢查網絡連接或聯繫管理員</div>
                </div>
            </div>
        `;
        statusDiv.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
        statusDiv.classList.add('bg-red-50', 'dark:bg-red-900/20');
        updateBtn.disabled = false;
    }
}
