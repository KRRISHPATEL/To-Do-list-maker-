// Task Management
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.categories = {
            design: { color: '#6c5ce7', icon: 'fas fa-palette' },
            meeting: { color: '#ff6b6b', icon: 'fas fa-users' },
            learning: { color: '#00b894', icon: 'fas fa-book' }
        };
    }

    addTask(task) {
        task.id = Date.now();
        task.completed = false;
        this.tasks.push(task);
        this.saveTasks();
        this.updateCategoryCounts();
        this.updateProgress();
        return task;
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.updateCategoryCounts();
            this.updateProgress();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.updateCategoryCounts();
        this.updateProgress();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    getTasksByDate(date) {
        return this.tasks.filter(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === date.toDateString();
        });
    }

    updateCategoryCounts() {
        Object.keys(this.categories).forEach(category => {
            const count = this.tasks.filter(t => t.category === category).length;
            document.querySelector(`.category-card.${category} .task-count`).textContent = count;
        });
    }

    updateProgress() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        document.querySelector('.progress').style.width = `${percentage}%`;
        document.querySelector('.percentage').textContent = `${percentage}%`;
    }

    getTasksByView(view) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (view) {
            case 'today':
                return this.tasks.filter(task => {
                    const taskDate = new Date(task.dueDate);
                    taskDate.setHours(0, 0, 0, 0);
                    return taskDate.getTime() === today.getTime();
                });
            case 'upcoming':
                return this.tasks.filter(task => {
                    const taskDate = new Date(task.dueDate);
                    taskDate.setHours(0, 0, 0, 0);
                    return taskDate.getTime() > today.getTime();
                });
            default:
                return this.tasks;
        }
    }
}

// UI Controller
class UIController {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.currentView = 'all';
        this.selectedDate = new Date();
        this.initializeUI();
        this.initializeEventListeners();
        this.renderTasks();
    }

    initializeUI() {
        // Set current date
        const dateElem = document.querySelector('.date');
        dateElem.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Initialize calendar strip
        this.renderCalendarStrip();

        // Update category counts and progress
        this.taskManager.updateCategoryCounts();
        this.taskManager.updateProgress();
    }

    initializeEventListeners() {
        // Add Task Button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            document.getElementById('taskModal').classList.add('active');
        });

        // Close Modal Button
        document.querySelector('.close-btn').addEventListener('click', () => {
            document.getElementById('taskModal').classList.remove('active');
        });

        // Cancel Task Button
        document.querySelector('.cancel-btn').addEventListener('click', () => {
            document.getElementById('taskModal').classList.remove('active');
        });

        // Task Form Submit
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const task = {
                title: document.getElementById('taskTitle').value,
                category: document.getElementById('taskCategory').value,
                dueDate: document.getElementById('taskDate').value + 'T' + document.getElementById('taskTime').value,
                priority: document.querySelector('input[name="priority"]:checked').value
            };
            this.taskManager.addTask(task);
            this.renderTasks();
            document.getElementById('taskModal').classList.remove('active');
            document.getElementById('taskForm').reset();
        });

        // View Options
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.view-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.renderTasks();
            });
        });
    }

    renderCalendarStrip() {
        const calendarDays = document.querySelector('.calendar-days');
        const days = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }

        calendarDays.innerHTML = days.map((date, index) => `
            <div class="calendar-day ${index === 0 ? 'active' : ''}" data-date="${date.toISOString()}">
                <div class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="day-number">${date.getDate()}</div>
            </div>
        `).join('');

        // Add click events to calendar days
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                document.querySelector('.calendar-day.active').classList.remove('active');
                day.classList.add('active');
                this.selectedDate = new Date(day.dataset.date);
                this.renderTasks();
            });
        });
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const tasks = this.taskManager.getTasksByView(this.currentView);
        
        tasksList.innerHTML = tasks.map(task => `
            <div class="task-item" data-id="${task.id}">
                <div class="task-left">
                    <div class="task-checkbox ${task.completed ? 'completed' : ''}" 
                         onclick="taskManager.toggleTask(${task.id}); uiController.renderTasks();">
                        ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-content">
                        <h3>${task.title}</h3>
                        <div class="task-meta">
                            <span><i class="far fa-clock"></i> ${new Date(task.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span class="priority-${task.priority}">${task.priority}</span>
                        </div>
                    </div>
                </div>
                <span class="task-category ${task.category}">
                    <i class="${this.taskManager.categories[task.category].icon}"></i>
                    ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                </span>
            </div>
        `).join('');
    }
}

// Initialize the application
const taskManager = new TaskManager();
const uiController = new UIController(taskManager);
