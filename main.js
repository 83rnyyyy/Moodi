// State management
let currentMood = 'calm';
let isPlaying = false;
let tasks = [];
let taskIdCounter = 0;

// IndexedDB setup
let db;
const DB_NAME = 'TaskMoodApp';
const DB_VERSION = 1;
const TASK_STORE = 'tasks';
const COUNTER_STORE = 'counters';

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Database failed to open');
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            
            // Create tasks object store
            if (!db.objectStoreNames.contains(TASK_STORE)) {
                const taskStore = db.createObjectStore(TASK_STORE, { keyPath: 'id' });
                taskStore.createIndex('completed', 'completed', { unique: false });
                
            }
            
            // Create counters object store
            if (!db.objectStoreNames.contains(COUNTER_STORE)) {
                const counterStore = db.createObjectStore(COUNTER_STORE, { keyPath: 'name' });
                
                
                // Initialize task counter
                counterStore.add({ name: 'taskId', value: 0 });
            }
        };
    });
}

// IndexedDB operations for tasks
function saveTask(task) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TASK_STORE], 'readwrite');
        const store = transaction.objectStore(TASK_STORE);
        const request = store.put(task);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function loadTasks() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TASK_STORE], 'readonly');
        const store = transaction.objectStore(TASK_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
            tasks = request.result || [];
            resolve(tasks);
        };
        request.onerror = () => reject(request.error);
    });
}

function deleteTaskFromDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([TASK_STORE], 'readwrite');
        const store = transaction.objectStore(TASK_STORE);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function loadTaskCounter() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([COUNTER_STORE], 'readonly');
        const store = transaction.objectStore(COUNTER_STORE);
        const request = store.get('taskId');
        
        request.onsuccess = () => {
            taskIdCounter = request.result ? request.result.value : 0;
            resolve(taskIdCounter);
        };
        request.onerror = () => reject(request.error);
    });
}

function saveTaskCounter() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([COUNTER_STORE], 'readwrite');
        const store = transaction.objectStore(COUNTER_STORE);
        const request = store.put({ name: 'taskId', value: taskIdCounter });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Mood configurations
const moodConfigs = {
    calm: {
        bgClass: 'bg-calm',
        emoji: '😌',
        name: 'Calm',
        backgroundVideo: 'public/calm.mp4',
        tracks: [
            'public/calm.mp3',
        ],
        particles: { count: 15, speed: 0.5 }
    },
    focused: {
        bgClass: 'bg-focused',
        emoji: '🎯',
        name: 'Focused',
        backgroundVideo: 'public/neutral.mp4', 
        tracks: [
            'public/focused.mp3',
        ],
        particles: { count: 25, speed: 0.8 }
    },
    stressed: {
        bgClass: 'bg-stressed',
        emoji: '😰',
        name: 'Stressed',
        backgroundVideo: 'public/stressed.mp4',
        tracks: [
            'public/stressed.mp3',
        ],
        particles: { count: 30, speed: 1.2 }
    },
    happy: {
        bgClass: 'bg-happy',
        emoji: '😊',
        name: 'Happy',
        backgroundVideo: 'public/happy.mp4',
        tracks: [
            'public/happy.mp3',
        ],
        particles: { count: 40, speed: 1.0 }
    },
};

// Initialize particles
function createParticles(count, speed) {
    const particlesContainer = document.getElementById('particles');
    particlesContainer.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = 15 / speed;
        
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
        `;
        
        particlesContainer.appendChild(particle);
    }
}

// Set mood function
function setMood(mood) {
    currentMood = mood;
    const config = moodConfigs[mood];
    
    // Update background overlay
    const overlay = document.getElementById('bgOverlay');
    overlay.className = `bg-overlay ${config.bgClass}`;
    
    // Update background video (if you have custom videos)
    updateBackgroundVideo(mood);
    
    // Update active button
    document.querySelectorAll('.navbar-mood-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mood="${mood}"]`).classList.add('active');
    
    // Update particles
    createParticles(config.particles.count, config.particles.speed);
    
    // Update music if playing
    if (isPlaying) {
        playMoodMusic();
    }
}

// Update background video based on mood
function updateBackgroundVideo(mood) {
    const video = document.getElementById('bgVideo');
    const config = moodConfigs[mood];
    

    
    video.innerHTML = `<source src="${config.backgroundVideo}" type="video/mp4">`;
    video.load();
    video.style.display = 'block';
    video.play();
}

// Music functions
function toggleMusic() {
    const audio = document.getElementById('audioPlayer');
    const btn = document.getElementById('musicToggle');
    const visualizer = document.getElementById('audioVisualizer');
    const desctitle = document.getElementById('welcome-subtitle');
    const desc = document.getElementById('welcome-title')
    
    if (isPlaying) {
        audio.pause();
        btn.textContent = '🎵 Play Music';
        visualizer.classList.remove('active');
        isPlaying = false;
        desctitle.hidden = false;
        desc.hidden = false;
    } else {
        playMoodMusic();
        btn.textContent = '⏸️ Pause Music';
        visualizer.classList.add('active');
        isPlaying = true;
        desc.hidden = true;
        desctitle.hidden = true;
    }
}

function playMoodMusic() {
    const audio = document.getElementById('audioPlayer');
    
    
    audio.src = moodConfigs[currentMood].tracks[0];
    audio.play();
}

function changeTrack() {
    // Removed - no longer needed since each mood has one track
}

// Sidebar functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// Task management with IndexedDB
async function addTask() {
    const input = document.getElementById('taskInput');
    const taskText = input.value.trim();
    
    if (taskText) {
        const task = {
            id: taskIdCounter++,
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        try {
            await saveTask(task);
            await saveTaskCounter();
            tasks.push(task);
            input.value = '';
            renderTasks();
           
        } catch (error) {
            console.error('Error saving task:', error);
            // Rollback counter if save failed
            taskIdCounter--;
        }
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        addTask();
    }
}

async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        
        try {
            await saveTask(task);
            renderTasks();
            
        } catch (error) {
            console.error('Error updating task:', error);
            // Rollback the change
            task.completed = !task.completed;
        }
    }
}

async function deleteTask(id) {
    try {
        await deleteTaskFromDB(id);
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
        
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.innerHTML = `
            <div class="task-text">${task.text}</div>
            <div class="task-actions">
                <button class="task-action" onclick="toggleTask(${task.id})" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                    ${task.completed ? '↩️' : '✅'}
                </button>
                <button class="task-action" onclick="deleteTask(${task.id})" title="Delete task">
                    🗑️
                </button>
            </div>
        `;
        container.appendChild(taskElement);
    });
}

// Initialize the app
async function initializeApp() {
    try {
        // Initialize IndexedDB
        await initDB();
        
        
        // Load saved data
        await loadTaskCounter();
        await loadTasks();
        
        
        // Render tasks
        renderTasks();
        
        // Initialize particles
        createParticles(20, 0.6);
        
        
    } catch (error) {
        console.error('Error initializing app:', error);
        // Initialize particles even if DB fails
        createParticles(20, 0.6);
    }
}

// Close sidebar when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (!sidebar.contains(event.target) && !menuBtn.contains(event.target) && sidebar.classList.contains('open')) {
        toggleSidebar();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);