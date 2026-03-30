// ==========================================
// APP NAVIGATION & STATE
// ==========================================
const views = {
    board: document.getElementById('view-board'),
    calendar: document.getElementById('view-calendar'),
    notebooksList: document.getElementById('view-notebooks-list'),
    whiteboard: document.getElementById('view-whiteboard')
};
const navs = {
    board: document.getElementById('nav-board'),
    calendar: document.getElementById('nav-calendar'),
    notebooks: document.getElementById('nav-notebooks')
};

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    Object.values(navs).forEach(n => n?.classList.remove('active'));
    
    views[viewName].classList.add('active');
    
    if (viewName === 'board') navs.board.classList.add('active');
    if (viewName === 'calendar') navs.calendar.classList.add('active');
    if (viewName === 'notebooksList' || viewName === 'whiteboard') navs.notebooks.classList.add('active');
    
    if (viewName !== 'whiteboard' && activeNotebookId) {
        saveCanvasToNotebook();
        activeNotebookId = null;
    }
}

navs.board.addEventListener('click', () => switchView('board'));
navs.calendar.addEventListener('click', () => { switchView('calendar'); renderCalendar(); });
navs.notebooks.addEventListener('click', () => switchView('notebooksList'));
document.getElementById('btnBackToNotebooks').addEventListener('click', () => switchView('notebooksList'));

// ==========================================
// TASK & EVENT CREATION LOGIC
// ==========================================
let tasks = JSON.parse(localStorage.getItem('apple_style_tasks')) || [];
const taskModal = document.getElementById('createTaskModal');
const isEventToggle = document.getElementById('isEventToggle');
const dateTimeInputs = document.getElementById('dateTimeInputs');
let selectedTaskColor = 'var(--color-red)';

function escapeHTML(str) { 
    return str.replace(/[&<>'"]/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[x])); 
}

function formatDisplayDate(dateStr, timeStr) {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00'); 
    const options = { month: 'short', day: 'numeric' };
    let formatted = dateObj.toLocaleDateString(undefined, options);
    if (timeStr) formatted += ` at ${timeStr}`;
    return formatted;
}

document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedTaskColor = e.target.getAttribute('data-color');
    });
});

isEventToggle.addEventListener('change', (e) => {
    if(e.target.checked) {
        dateTimeInputs.classList.add('active');
        if(!document.getElementById('newTaskDate').value) document.getElementById('newTaskDate').value = new Date().toISOString().split('T')[0];
    } else {
        dateTimeInputs.classList.remove('active');
    }
});

function openTaskModal(prefillDate = null, isCalendarEvent = false) {
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskDesc').value = '';
    document.getElementById('newTaskDate').value = prefillDate || '';
    document.getElementById('newTaskTime').value = '';
    document.getElementById('taskModalHeader').innerText = isCalendarEvent ? 'New Event' : 'New Task';
    
    isEventToggle.checked = isCalendarEvent;
    if (isCalendarEvent) {
        dateTimeInputs.classList.add('active');
        if(!prefillDate) document.getElementById('newTaskDate').value = new Date().toISOString().split('T')[0];
    } else {
        dateTimeInputs.classList.remove('active');
    }
    taskModal.classList.add('active');
    document.getElementById('newTaskTitle').focus();
}

document.getElementById('btnShowTaskModal').addEventListener('click', () => openTaskModal(null, false));
document.getElementById('btnCreateEvent').addEventListener('click', () => openTaskModal(null, true));
window.openModalForDate = function(dateStr) { openTaskModal(dateStr, true); }; 

document.getElementById('btnCancelTask').addEventListener('click', () => taskModal.classList.remove('active'));

document.getElementById('btnConfirmTask').addEventListener('click', () => {
    const title = document.getElementById('newTaskTitle').value.trim();
    const desc = document.getElementById('newTaskDesc').value.trim();
    const isEvent = isEventToggle.checked;
    const date = isEvent ? document.getElementById('newTaskDate').value : null;
    const time = isEvent ? document.getElementById('newTaskTime').value : null;
    
    if (!title) return alert("Title is required.");
    if (isEvent && !date) return alert("Date is required for an event.");

    tasks.push({ id: 'task_' + Date.now(), title: title, description: desc, color: selectedTaskColor, date: date, time: time });
    saveAndRenderData();
    taskModal.classList.remove('active');
});

window.completeTask = function(e, id) { e.stopPropagation(); tasks = tasks.filter(t => t.id !== id); saveAndRenderData(); };
window.toggleTaskDesc = function(id) {
    const taskElement = document.getElementById(id);
    if(taskElement.querySelector('.task-description').innerText !== "") taskElement.classList.toggle('expanded');
};

function saveAndRenderData() {
    localStorage.setItem('apple_style_tasks', JSON.stringify(tasks));
    renderTaskList();
    renderCalendar();
}

function renderTaskList() {
    const container = document.getElementById('taskListContainer');
    if (tasks.length === 0) { container.innerHTML = '<div class="empty-tasks">All caught up! No active tasks or events.</div>'; return; }

    container.innerHTML = '';
    let sortedTasks = [...tasks].sort((a, b) => {
        if (!a.date && b.date) return -1;
        if (a.date && !b.date) return 1;
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        return 0;
    });

    sortedTasks.forEach(t => {
        const hasDesc = t.description ? true : false;
        const metaText = formatDisplayDate(t.date, t.time);
        container.innerHTML += `
            <div class="task-item" id="${t.id}" onclick="toggleTaskDesc('${t.id}')" style="cursor: ${hasDesc ? 'pointer' : 'default'}">
                <div class="task-header">
                    <div class="task-color-dot" style="background-color: ${t.color}"></div>
                    <div class="task-title-area">
                        <div class="task-title">${escapeHTML(t.title)}</div>
                        ${metaText ? `<div class="task-meta">🗓 ${metaText}</div>` : ''}
                    </div>
                    <button class="btn-done" onclick="completeTask(event, '${t.id}')">✓ Done</button>
                </div>
                ${hasDesc ? `<div class="task-description">${escapeHTML(t.description).replace(/\n/g, '<br>')}</div>` : `<div class="task-description" style="display:none;"></div>`}
            </div>
        `;
    });
}

// ==========================================
// CALENDAR GRID LOGIC
// ==========================================
let currentCalendarDate = new Date();

document.getElementById('btnPrevMonth').addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendar(); });
document.getElementById('btnNextMonth').addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendar(); });
document.getElementById('btnToday').addEventListener('click', () => { currentCalendarDate = new Date(); renderCalendar(); });

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return; 
    
    grid.innerHTML = '';
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calendarMonthYear').innerText = `${monthNames[month]} ${year}`;
    
    for(let i=0; i<firstDayIndex; i++) grid.innerHTML += `<div class="calendar-day empty"></div>`;
    
    const today = new Date();
    
    for(let i=1; i<=daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        
        const dayEvents = tasks.filter(t => t.date === dateStr);
        let eventsHTML = dayEvents.map(t => `<div class="event-badge" style="background-color: ${t.color}" title="${escapeHTML(t.title)}">${t.time ? t.time + ' ' : ''}${escapeHTML(t.title)}</div>`).join('');

        grid.innerHTML += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="openModalForDate('${dateStr}')"><div class="day-number">${i}</div>${eventsHTML}</div>`;
    }
}
saveAndRenderData();


// ==========================================
// NOTEBOOKS LOGIC
// ==========================================
let notebooks = JSON.parse(localStorage.getItem('notebooks_data')) || [];
let activeNotebookId = null;

const notebookGrid = document.getElementById('notebookGrid');
const nbModal = document.getElementById('createNotebookModal');

document.getElementById('btnShowNotebookModal').addEventListener('click', () => { document.getElementById('newNotebookName').value = ''; nbModal.classList.add('active'); document.getElementById('newNotebookName').focus(); });
document.getElementById('btnCancelNotebook').addEventListener('click', () => nbModal.classList.remove('active'));

document.getElementById('btnConfirmNotebook').addEventListener('click', () => {
    const name = document.getElementById('newNotebookName').value.trim() || 'Untitled Notebook';
    const paper = document.getElementById('newNotebookPaper').value;
    notebooks.push({ id: 'nb_' + Date.now(), name: name, paperType: paper, drawingData: null });
    saveNotebooksList(); renderNotebooksList();
    nbModal.classList.remove('active');
});

window.deleteNotebook = function(e, id) {
    e.stopPropagation(); 
    if(confirm('Are you sure you want to delete this notebook?')) { notebooks = notebooks.filter(nb => nb.id !== id); saveNotebooksList(); renderNotebooksList(); }
};

function saveNotebooksList() { localStorage.setItem('notebooks_data', JSON.stringify(notebooks)); }

function renderNotebooksList() {
    const addButtonHTML = `<div class="notebook-add-card" id="btnShowNotebookModal" onclick="document.getElementById('createNotebookModal').classList.add('active'); document.getElementById('newNotebookName').focus();"><div class="add-icon">+</div><div>New Notebook</div></div>`;
    let gridHTML = '';
    notebooks.forEach(nb => { gridHTML += `<div class="notebook-card" onclick="openNotebook('${nb.id}')"><button class="notebook-card-delete" onclick="deleteNotebook(event, '${nb.id}')">Delete</button><div class="notebook-card-title">${escapeHTML(nb.name)}</div><div class="notebook-card-type">${nb.paperType} Paper</div></div>`; });
    notebookGrid.innerHTML = gridHTML + addButtonHTML;
}

// ==========================================
// HIGH-FIDELITY APPLE PENCIL ENGINE
// ==========================================
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d', { desynchronized: true }); // Faster rendering on iPad
const canvasWrapper = document.getElementById('canvasWrapper');
const colorPicker = document.getElementById('colorPicker');
const toolbar = document.querySelector('.toolbar');

let isDrawing = false, isEraser = false;
let lastX = 0, lastY = 0;
let saveTimeout = null; 

// Retina Setup
function setupRetinaCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    canvas.width = 800 * dpr;
    canvas.height = 600 * dpr;
    ctx.scale(dpr, dpr);
}

// Get accurate coordinates regardless of scaling or palm resting
function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

window.openNotebook = function(id) {
    const notebook = notebooks.find(nb => nb.id === id);
    if (!notebook) return;
    activeNotebookId = id; 
    document.getElementById('activeNotebookTitle').innerText = notebook.name; 
    document.getElementById('activePaperDisplay').innerText = notebook.paperType;
    canvasWrapper.className = `canvas-wrapper bg-${notebook.paperType}`; 
    
    setupRetinaCanvas();
    ctx.clearRect(0, 0, 800, 600); 
    
    if (notebook.drawingData) { 
        const img = new Image(); 
        img.onload = () => ctx.drawImage(img, 0, 0, 800, 600); 
        img.src = notebook.drawingData; 
    }
    switchView('whiteboard');
};

const btnPen = document.getElementById('btnPen'); const btnEraser = document.getElementById('btnEraser');
btnPen.addEventListener('click', () => { isEraser = false; btnPen.classList.add('active'); btnEraser.classList.remove('active'); canvas.style.cursor = 'crosshair'; });
btnEraser.addEventListener('click', () => { isEraser = true; btnEraser.classList.add('active'); btnPen.classList.remove('active'); canvas.style.cursor = 'cell'; });

function setupBrush() {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (isEraser) { 
        ctx.globalCompositeOperation = 'destination-out'; 
        ctx.lineWidth = 25; 
    } else { 
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.lineWidth = 3; 
        ctx.strokeStyle = colorPicker.value; 
    }
}

canvas.addEventListener('pointerdown', (e) => { 
    if (e.pointerType === 'touch') return; // Palm Rejection
    e.preventDefault(); // Stops Safari from stealing strokes

    isDrawing = true; 
    const coords = getCoords(e);
    points = [coords]; // Start a fresh point array for smoothing

    canvas.setPointerCapture(e.pointerId); 
    toolbar.style.pointerEvents = 'none'; // Force Field
    if (saveTimeout) clearTimeout(saveTimeout);

    // INSTANT INK FIX: Draw a tiny dot the exact millisecond the pen touches
    // This guarantees fast, short strokes (like crossing a "t" or a "7") never drop!
    setupBrush();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x + 0.1, coords.y + 0.1); 
    ctx.stroke();
});

canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing || e.pointerType === 'touch') return; 
    e.preventDefault(); 
    
    setupBrush();
    
    // Read the ultra-fast Apple Pencil sub-frames
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    
    for (let ev of events) {
        const coords = getCoords(ev);
        points.push(coords);
        
        // BEZIER SMOOTHING: Restored for buttery smooth curves
        if (points.length >= 3) {
            ctx.beginPath();
            let p0 = points[points.length - 3];
            let p1 = points[points.length - 2];
            let p2 = points[points.length - 1];
            
            let mid1X = (p0.x + p1.x) / 2;
            let mid1Y = (p0.y + p1.y) / 2;
            let mid2X = (p1.x + p2.x) / 2;
            let mid2Y = (p1.y + p2.y) / 2;
            
            ctx.moveTo(mid1X, mid1Y);
            ctx.quadraticCurveTo(p1.x, p1.y, mid2X, mid2Y);
            ctx.stroke();
        }
    }
});

canvas.addEventListener('pointerup', (e) => { 
    if (e.pointerType === 'touch') return;
    if (isDrawing) { 
        isDrawing = false; 
        saveTimeout = setTimeout(saveCanvasToNotebook, 1500); // 1.5s debounce to fix saving stutter
    } 
    toolbar.style.pointerEvents = 'auto'; 
});

canvas.addEventListener('pointercancel', (e) => { 
    if (e.pointerType === 'touch') return;
    if (isDrawing) { 
        isDrawing = false; 
        saveTimeout = setTimeout(saveCanvasToNotebook, 1500); 
    } 
    toolbar.style.pointerEvents = 'auto'; 
});

document.getElementById('btnClearCanvas').addEventListener('click', () => { 
    ctx.clearRect(0, 0, 800, 600); 
    saveCanvasToNotebook(); 
});

function saveCanvasToNotebook() {
    if (!activeNotebookId) return; 
    const notebookIndex = notebooks.findIndex(nb => nb.id === activeNotebookId);
    if (notebookIndex > -1) { 
        notebooks[notebookIndex].drawingData = canvas.toDataURL('image/png'); 
        saveNotebooksList(); 
    }
}

document.getElementById('btnSavePdf').addEventListener('click', () => {
    const notebook = notebooks.find(nb => nb.id === activeNotebookId);
    const { jsPDF } = window.jspdf; 
    const pdf = new jsPDF('l', 'pt', [800, 600]);
    const tmpCanvas = document.createElement('canvas'); 
    tmpCanvas.width = 800; tmpCanvas.height = 600; 
    const tCtx = tmpCanvas.getContext('2d');
    
    tCtx.fillStyle = '#ffffff'; tCtx.fillRect(0, 0, 800, 600);
    const currentPaper = notebook.paperType; tCtx.strokeStyle = '#e5e5ea'; tCtx.fillStyle = '#e5e5ea'; tCtx.lineWidth = 1;
    
    if (currentPaper === 'lined' || currentPaper === 'squared') { for(let y = 40; y < 600; y+=40) { tCtx.beginPath(); tCtx.moveTo(0, y); tCtx.lineTo(800, y); tCtx.stroke(); } }
    if (currentPaper === 'squared') { for(let x = 40; x < 800; x+=40) { tCtx.beginPath(); tCtx.moveTo(x, 0); tCtx.lineTo(x, 600); tCtx.stroke(); } }
    if (currentPaper === 'dotted') { for(let y = 40; y < 600; y+=40) { for(let x = 40; x < 800; x+=40) { tCtx.beginPath(); tCtx.arc(x, y, 2, 0, Math.PI*2); tCtx.fill(); } } }
    
    tCtx.drawImage(canvas, 0, 0, 800, 600); 
    const finalImage = tmpCanvas.toDataURL('image/jpeg', 1.0);
    pdf.addImage(finalImage, 'JPEG', 0, 0, 800, 600); pdf.save(`${notebook.name || 'Notes'}.pdf`);
});

renderNotebooksList();