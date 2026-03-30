// ==========================================
// APP NAVIGATION & STATE
// ==========================================
const views = { board: document.getElementById('view-board'), calendar: document.getElementById('view-calendar'), notebooksList: document.getElementById('view-notebooks-list'), whiteboard: document.getElementById('view-whiteboard') };
const navs = { board: document.getElementById('nav-board'), calendar: document.getElementById('nav-calendar'), notebooks: document.getElementById('nav-notebooks') };

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    Object.values(navs).forEach(n => n?.classList.remove('active'));
    views[viewName].classList.add('active');
    
    if (viewName === 'board') navs.board.classList.add('active');
    if (viewName === 'calendar') navs.calendar.classList.add('active');
    if (viewName === 'notebooksList' || viewName === 'whiteboard') navs.notebooks.classList.add('active');
    
    if (viewName !== 'whiteboard' && activeNotebookId) { saveCanvasToNotebook(); activeNotebookId = null; }
}

navs.board.addEventListener('click', () => switchView('board'));
navs.calendar.addEventListener('click', () => { switchView('calendar'); renderCalendar(); });
navs.notebooks.addEventListener('click', () => switchView('notebooksList'));
document.getElementById('btnBackToNotebooks').addEventListener('click', () => switchView('notebooksList'));

// ==========================================
// TASKS & CALENDAR LOGIC (Minified for space)
// ==========================================
let tasks = JSON.parse(localStorage.getItem('apple_style_tasks')) || [];
const taskModal = document.getElementById('createTaskModal'); const isEventToggle = document.getElementById('isEventToggle'); const dateTimeInputs = document.getElementById('dateTimeInputs'); let selectedTaskColor = 'var(--color-red)';
function escapeHTML(str) { return str.replace(/[&<>'"]/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[x])); }
function formatDisplayDate(d, t) { if (!d) return ''; const o = new Date(d + 'T00:00:00'); let f = o.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); if (t) f += ` at ${t}`; return f; }
document.querySelectorAll('.color-swatch').forEach(swatch => { swatch.addEventListener('click', (e) => { document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected')); e.target.classList.add('selected'); selectedTaskColor = e.target.getAttribute('data-color'); }); });
isEventToggle.addEventListener('change', (e) => { if(e.target.checked) { dateTimeInputs.classList.add('active'); if(!document.getElementById('newTaskDate').value) document.getElementById('newTaskDate').value = new Date().toISOString().split('T')[0]; } else { dateTimeInputs.classList.remove('active'); } });
function openTaskModal(preDate = null, isEvent = false) { document.getElementById('newTaskTitle').value = ''; document.getElementById('newTaskDesc').value = ''; document.getElementById('newTaskDate').value = preDate || ''; document.getElementById('newTaskTime').value = ''; document.getElementById('taskModalHeader').innerText = isEvent ? 'New Event' : 'New Task'; isEventToggle.checked = isEvent; if (isEvent) { dateTimeInputs.classList.add('active'); if(!preDate) document.getElementById('newTaskDate').value = new Date().toISOString().split('T')[0]; } else { dateTimeInputs.classList.remove('active'); } taskModal.classList.add('active'); document.getElementById('newTaskTitle').focus(); }
document.getElementById('btnShowTaskModal').addEventListener('click', () => openTaskModal(null, false)); document.getElementById('btnCreateEvent').addEventListener('click', () => openTaskModal(null, true)); window.openModalForDate = function(d) { openTaskModal(d, true); }; document.getElementById('btnCancelTask').addEventListener('click', () => taskModal.classList.remove('active'));
document.getElementById('btnConfirmTask').addEventListener('click', () => { const title = document.getElementById('newTaskTitle').value.trim(); const desc = document.getElementById('newTaskDesc').value.trim(); const isEvent = isEventToggle.checked; const date = isEvent ? document.getElementById('newTaskDate').value : null; const time = isEvent ? document.getElementById('newTaskTime').value : null; if (!title) return alert("Title is required."); if (isEvent && !date) return alert("Date is required."); tasks.push({ id: 'task_' + Date.now(), title: title, description: desc, color: selectedTaskColor, date: date, time: time }); saveAndRenderData(); taskModal.classList.remove('active'); });
window.completeTask = function(e, id) { e.stopPropagation(); tasks = tasks.filter(t => t.id !== id); saveAndRenderData(); }; window.toggleTaskDesc = function(id) { const el = document.getElementById(id); if(el.querySelector('.task-description').innerText !== "") el.classList.toggle('expanded'); };
function saveAndRenderData() { localStorage.setItem('apple_style_tasks', JSON.stringify(tasks)); renderTaskList(); renderCalendar(); }
function renderTaskList() { const c = document.getElementById('taskListContainer'); if (tasks.length === 0) { c.innerHTML = '<div class="empty-tasks">All caught up!</div>'; return; } c.innerHTML = ''; let sorted = [...tasks].sort((a, b) => { if (!a.date && b.date) return -1; if (a.date && !b.date) return 1; if (a.date && b.date) return new Date(a.date) - new Date(b.date); return 0; }); sorted.forEach(t => { const hasDesc = t.description ? true : false; const meta = formatDisplayDate(t.date, t.time); c.innerHTML += `<div class="task-item" id="${t.id}" onclick="toggleTaskDesc('${t.id}')" style="cursor: ${hasDesc ? 'pointer' : 'default'}"><div class="task-header"><div class="task-color-dot" style="background-color: ${t.color}"></div><div class="task-title-area"><div class="task-title">${escapeHTML(t.title)}</div>${meta ? `<div class="task-meta">🗓 ${meta}</div>` : ''}</div><button class="btn-done" onclick="completeTask(event, '${t.id}')">✓ Done</button></div>${hasDesc ? `<div class="task-description">${escapeHTML(t.description).replace(/\n/g, '<br>')}</div>` : `<div class="task-description" style="display:none;"></div>`}</div>`; }); }
let currentCalendarDate = new Date(); document.getElementById('btnPrevMonth').addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendar(); }); document.getElementById('btnNextMonth').addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendar(); }); document.getElementById('btnToday').addEventListener('click', () => { currentCalendarDate = new Date(); renderCalendar(); });
function renderCalendar() { const grid = document.getElementById('calendarGrid'); if (!grid) return; grid.innerHTML = ''; const year = currentCalendarDate.getFullYear(); const month = currentCalendarDate.getMonth(); const firstDayIndex = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; document.getElementById('calendarMonthYear').innerText = `${monthNames[month]} ${year}`; for(let i=0; i<firstDayIndex; i++) grid.innerHTML += `<div class="calendar-day empty"></div>`; const today = new Date(); for(let i=1; i<=daysInMonth; i++) { const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear(); const dayEvents = tasks.filter(t => t.date === dateStr); let eventsHTML = dayEvents.map(t => `<div class="event-badge" style="background-color: ${t.color}">${t.time ? t.time + ' ' : ''}${escapeHTML(t.title)}</div>`).join(''); grid.innerHTML += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="openModalForDate('${dateStr}')"><div class="day-number">${i}</div>${eventsHTML}</div>`; } }
saveAndRenderData();


// ==========================================
// MULTI-PAGE NOTEBOOKS LOGIC
// ==========================================
let notebooks = JSON.parse(localStorage.getItem('notebooks_data')) || [];

// Backward Compatibility: Migrate old single-page notebooks to the new multi-page array format
notebooks = notebooks.map(nb => {
    if (!nb.pages) nb.pages = [nb.drawingData || null]; // Move old drawing to page 1
    if (!nb.paperColor) nb.paperColor = 'paper-white';  // Set default color
    return nb;
});

let activeNotebookId = null;
let currentPageIndex = 0; // Tracks which page we are on

const notebookGrid = document.getElementById('notebookGrid');
const nbModal = document.getElementById('createNotebookModal');

// Create Notebook
document.getElementById('btnShowNotebookModal').addEventListener('click', () => { document.getElementById('newNotebookName').value = ''; nbModal.classList.add('active'); document.getElementById('newNotebookName').focus(); });
document.getElementById('btnCancelNotebook').addEventListener('click', () => nbModal.classList.remove('active'));

document.getElementById('btnConfirmNotebook').addEventListener('click', () => {
    const name = document.getElementById('newNotebookName').value.trim() || 'Untitled Notebook';
    const paper = document.getElementById('newNotebookPaper').value;
    const color = document.getElementById('newNotebookColor').value;
    
    // Create new notebook with an empty page 1
    notebooks.push({ 
        id: 'nb_' + Date.now(), 
        name: name, 
        paperType: paper, 
        paperColor: color,
        pages: [null] // Array holding image strings
    });
    
    saveNotebooksList(); renderNotebooksList();
    nbModal.classList.remove('active');
});

window.deleteNotebook = function(e, id) { e.stopPropagation(); if(confirm('Are you sure you want to delete this notebook?')) { notebooks = notebooks.filter(nb => nb.id !== id); saveNotebooksList(); renderNotebooksList(); } };
function saveNotebooksList() { localStorage.setItem('notebooks_data', JSON.stringify(notebooks)); }
function renderNotebooksList() {
    const addButtonHTML = `<div class="notebook-add-card" id="btnShowNotebookModal" onclick="document.getElementById('createNotebookModal').classList.add('active'); document.getElementById('newNotebookName').focus();"><div class="add-icon">+</div><div>New Notebook</div></div>`;
    let gridHTML = '';
    notebooks.forEach(nb => { 
        // Readability fix for color name
        let colorName = nb.paperColor.replace('paper-', '');
        gridHTML += `
        <div class="notebook-card" onclick="openNotebook('${nb.id}')">
            <button class="notebook-card-delete" onclick="deleteNotebook(event, '${nb.id}')">Delete</button>
            <div class="notebook-card-title">${escapeHTML(nb.name)}</div>
            <div class="notebook-card-type">${nb.paperType} • ${colorName}</div>
        </div>`; 
    });
    notebookGrid.innerHTML = gridHTML + addButtonHTML;
}

// ==========================================
// HIGH-FIDELITY ENGINE + SWIPING PAGES
// ==========================================
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d', { desynchronized: true });
const canvasWrapper = document.getElementById('canvasWrapper');
const colorPicker = document.getElementById('colorPicker');
const toolbar = document.querySelector('.toolbar');
const pageIndicator = document.getElementById('pageIndicator');

let isDrawing = false, isEraser = false;
let lastX = 0, lastY = 0, points = [];
let saveTimeout = null; 

function setupRetinaCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = '800px'; canvas.style.height = '600px';
    canvas.width = 800 * dpr; canvas.height = 600 * dpr;
    ctx.scale(dpr, dpr);
}

function getCoords(e) { const rect = canvas.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; }

// Render a specific page from the active notebook array
function loadCurrentPage() {
    const notebook = notebooks.find(nb => nb.id === activeNotebookId);
    
    // Update Page Numbers in Toolbar
    pageIndicator.innerText = `${currentPageIndex + 1}/${notebook.pages.length}`;
    document.getElementById('btnPrevPage').disabled = (currentPageIndex === 0);
    document.getElementById('btnNextPage').disabled = (currentPageIndex === notebook.pages.length - 1);

    ctx.clearRect(0, 0, 800, 600); 
    
    const pageData = notebook.pages[currentPageIndex];
    if (pageData) { 
        const img = new Image(); 
        img.onload = () => ctx.drawImage(img, 0, 0, 800, 600); 
        img.src = pageData; 
    }
}

window.openNotebook = function(id) {
    const notebook = notebooks.find(nb => nb.id === id);
    if (!notebook) return;
    
    activeNotebookId = id; 
    currentPageIndex = 0; // Always open to page 1

    document.getElementById('activeNotebookTitle').innerText = notebook.name; 
    
    // Apply Background & Lines
    canvasWrapper.className = `canvas-wrapper bg-${notebook.paperType} ${notebook.paperColor}`; 
    
    // If opening a black notebook, change default pen color to white for visibility
    if (notebook.paperColor === 'paper-black') { colorPicker.value = '#ffffff'; } else { colorPicker.value = '#1d1d1f'; }
    
    setupRetinaCanvas();
    loadCurrentPage();
    switchView('whiteboard');
};

// --- Page Navigation Controls ---
document.getElementById('btnAddPage').addEventListener('click', () => {
    saveCanvasToNotebook(); // Save current before switching
    const notebook = notebooks.find(nb => nb.id === activeNotebookId);
    notebook.pages.push(null); // Add empty page slot
    currentPageIndex = notebook.pages.length - 1; // Jump to new page
    loadCurrentPage();
});

document.getElementById('btnPrevPage').addEventListener('click', () => {
    if (currentPageIndex > 0) { saveCanvasToNotebook(); currentPageIndex--; loadCurrentPage(); }
});

document.getElementById('btnNextPage').addEventListener('click', () => {
    const notebook = notebooks.find(nb => nb.id === activeNotebookId);
    if (currentPageIndex < notebook.pages.length - 1) { saveCanvasToNotebook(); currentPageIndex++; loadCurrentPage(); }
});

// --- iPad Swipe Gestures (Two-Finger Swipe) ---
let touchStartX = 0;
canvasWrapper.addEventListener('touchstart', (e) => {
    // Only track swipes if it's a touch event (not Apple Pencil)
    if (e.touches.length > 0) { touchStartX = e.touches[0].screenX; }
}, {passive: true});

canvasWrapper.addEventListener('touchend', (e) => {
    if (e.changedTouches.length > 0) {
        let touchEndX = e.changedTouches[0].screenX;
        const notebook = notebooks.find(nb => nb.id === activeNotebookId);
        
        // Swipe Left -> Go Forward
        if (touchEndX < touchStartX - 75 && currentPageIndex < notebook.pages.length - 1) {
            saveCanvasToNotebook(); currentPageIndex++; loadCurrentPage();
        }
        // Swipe Right -> Go Back
        if (touchEndX > touchStartX + 75 && currentPageIndex > 0) {
            saveCanvasToNotebook(); currentPageIndex--; loadCurrentPage();
        }
    }
}, {passive: true});

// --- Drawing Engine ---
const btnPen = document.getElementById('btnPen'); const btnEraser = document.getElementById('btnEraser');
btnPen.addEventListener('click', () => { isEraser = false; btnPen.classList.add('active'); btnEraser.classList.remove('active'); canvas.style.cursor = 'crosshair'; });
btnEraser.addEventListener('click', () => { isEraser = true; btnEraser.classList.add('active'); btnPen.classList.remove('active'); canvas.style.cursor = 'cell'; });

function setupBrush() {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (isEraser) { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 30; } 
    else { ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = 3; ctx.strokeStyle = colorPicker.value; }
}

canvas.addEventListener('pointerdown', (e) => { 
    if (e.pointerType === 'touch') return; 
    e.preventDefault(); 
    isDrawing = true; 
    const coords = getCoords(e); points = [coords]; 
    canvas.setPointerCapture(e.pointerId); toolbar.style.pointerEvents = 'none'; 
    if (saveTimeout) clearTimeout(saveTimeout);
    setupBrush(); ctx.beginPath(); ctx.moveTo(coords.x, coords.y); ctx.lineTo(coords.x + 0.1, coords.y + 0.1); ctx.stroke();
});

canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing || e.pointerType === 'touch') return; e.preventDefault(); setupBrush();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (let ev of events) {
        const coords = getCoords(ev); points.push(coords);
        if (points.length >= 3) {
            ctx.beginPath();
            let p0 = points[points.length - 3], p1 = points[points.length - 2], p2 = points[points.length - 1];
            let mid1X = (p0.x + p1.x) / 2, mid1Y = (p0.y + p1.y) / 2, mid2X = (p1.x + p2.x) / 2, mid2Y = (p1.y + p2.y) / 2;
            ctx.moveTo(mid1X, mid1Y); ctx.quadraticCurveTo(p1.x, p1.y, mid2X, mid2Y); ctx.stroke();
        }
    }
});

canvas.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') return; if (isDrawing) { isDrawing = false; saveTimeout = setTimeout(saveCanvasToNotebook, 1000); } toolbar.style.pointerEvents = 'auto'; });
canvas.addEventListener('pointercancel', (e) => { if (e.pointerType === 'touch') return; if (isDrawing) { isDrawing = false; saveTimeout = setTimeout(saveCanvasToNotebook, 1000); } toolbar.style.pointerEvents = 'auto'; });
document.getElementById('btnClearCanvas').addEventListener('click', () => { ctx.clearRect(0, 0, 800, 600); saveCanvasToNotebook(); });

function saveCanvasToNotebook() {
    if (!activeNotebookId) return; 
    const notebookIndex = notebooks.findIndex(nb => nb.id === activeNotebookId);
    if (notebookIndex > -1) { 
        // Save string to the specific page index array
        notebooks[notebookIndex].pages[currentPageIndex] = canvas.toDataURL('image/png'); 
        saveNotebooksList(); 
    }
}

// MULTI-PAGE PDF EXPORT
document.getElementById('btnSavePdf').addEventListener('click', async () => {
    // Save current ink first
    saveCanvasToNotebook(); 
    
    const notebook = notebooks.find(nb => nb.id === activeNotebookId);
    const { jsPDF } = window.jspdf; 
    const pdf = new jsPDF('l', 'pt', [800, 600]);
    
    const tmpCanvas = document.createElement('canvas'); 
    tmpCanvas.width = 800; tmpCanvas.height = 600; 
    const tCtx = tmpCanvas.getContext('2d');
    
    // Set actual PDF background colors based on user selection
    let bgColor = '#ffffff'; let lineCol = '#e5e5ea';
    if (notebook.paperColor === 'paper-yellow') { bgColor = '#fffdd0'; lineCol = '#e5cc99'; }
    if (notebook.paperColor === 'paper-black') { bgColor = '#1c1c1e'; lineCol = '#3a3a3c'; }
    
    // Loop through all pages and construct the document
    for (let i = 0; i < notebook.pages.length; i++) {
        if (i > 0) pdf.addPage(); // Add new page to PDF for page 2, 3, etc.
        
        // Paint background and lines
        tCtx.fillStyle = bgColor; tCtx.fillRect(0, 0, 800, 600);
        tCtx.strokeStyle = lineCol; tCtx.fillStyle = lineCol; tCtx.lineWidth = 1;
        
        const cp = notebook.paperType; 
        if (cp === 'lined' || cp === 'squared') { for(let y = 40; y < 600; y+=40) { tCtx.beginPath(); tCtx.moveTo(0, y); tCtx.lineTo(800, y); tCtx.stroke(); } }
        if (cp === 'squared') { for(let x = 40; x < 800; x+=40) { tCtx.beginPath(); tCtx.moveTo(x, 0); tCtx.lineTo(800, 600); tCtx.stroke(); } }
        if (cp === 'dotted') { for(let y = 40; y < 600; y+=40) { for(let x = 40; x < 800; x+=40) { tCtx.beginPath(); tCtx.arc(x, y, 2, 0, Math.PI*2); tCtx.fill(); } } }
        
        // Paint the ink over top if it exists
        if (notebook.pages[i]) {
            const img = new Image();
            img.src = notebook.pages[i];
            // We have to wait for the image to load before drawing it to the PDF canvas
            await new Promise(resolve => {
                img.onload = () => { tCtx.drawImage(img, 0, 0, 800, 600); resolve(); };
            });
        }
        
        const finalImage = tmpCanvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(finalImage, 'JPEG', 0, 0, 800, 600); 
    }
    
    pdf.save(`${notebook.name || 'Notes'}.pdf`);
});

renderNotebooksList();