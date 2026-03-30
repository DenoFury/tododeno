// ==========================================
// APP NAVIGATION & STATE
// ==========================================
const views = {
    board: document.getElementById('view-board'),
    notebooksList: document.getElementById('view-notebooks-list'),
    whiteboard: document.getElementById('view-whiteboard')
};
const navs = {
    board: document.getElementById('nav-board'),
    notebooks: document.getElementById('nav-notebooks')
};

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    Object.values(navs).forEach(n => n?.classList.remove('active'));
    
    views[viewName].classList.add('active');
    
    if (viewName === 'board') navs.board.classList.add('active');
    if (viewName === 'notebooksList' || viewName === 'whiteboard') navs.notebooks.classList.add('active');
    
    if (viewName !== 'whiteboard' && activeNotebookId) {
        saveCanvasToNotebook();
        activeNotebookId = null;
    }
}

navs.board.addEventListener('click', () => switchView('board'));
navs.notebooks.addEventListener('click', () => switchView('notebooksList'));
document.getElementById('btnBackToNotebooks').addEventListener('click', () => switchView('notebooksList'));

// ==========================================
// NEW REMINDERS-STYLE TASK LOGIC
// ==========================================
let tasks = JSON.parse(localStorage.getItem('apple_style_tasks')) || [];
const taskModal = document.getElementById('createTaskModal');
let selectedTaskColor = 'var(--color-red)'; // Default

// Setup Color Picker Swatches
document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedTaskColor = e.target.getAttribute('data-color');
    });
});

// Open/Close Task Modal
document.getElementById('btnShowTaskModal').addEventListener('click', () => {
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskDesc').value = '';
    taskModal.classList.add('active');
    document.getElementById('newTaskTitle').focus();
});
document.getElementById('btnCancelTask').addEventListener('click', () => taskModal.classList.remove('active'));

// Create Task
document.getElementById('btnConfirmTask').addEventListener('click', () => {
    const title = document.getElementById('newTaskTitle').value.trim();
    const desc = document.getElementById('newTaskDesc').value.trim();
    
    if (!title) return alert("Task name is required.");

    tasks.push({
        id: 'task_' + Date.now(),
        title: title,
        description: desc,
        color: selectedTaskColor
    });

    saveAndRenderTasks();
    taskModal.classList.remove('active');
});

// Mark Task as Done (Deletes it)
window.completeTask = function(e, id) {
    e.stopPropagation(); // Prevents the card from expanding when clicking the button
    tasks = tasks.filter(t => t.id !== id);
    saveAndRenderTasks();
};

// Expand/Collapse Task Description
window.toggleTaskDesc = function(id) {
    const taskElement = document.getElementById(id);
    // Only toggle if there is a description
    if(taskElement.querySelector('.task-description').innerText !== "") {
        taskElement.classList.toggle('expanded');
    }
};

function saveAndRenderTasks() {
    localStorage.setItem('apple_style_tasks', JSON.stringify(tasks));
    const container = document.getElementById('taskListContainer');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-tasks">All caught up! No active tasks.</div>';
        return;
    }

    container.innerHTML = '';
    tasks.forEach(t => {
        const hasDesc = t.description ? true : false;
        
        // Security encoding for display
        const safeTitle = t.title.replace(/[&<>'"]/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[x]));
        const safeDesc = t.description.replace(/[&<>'"]/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[x]));
        
        container.innerHTML += `
            <div class="task-item" id="${t.id}" onclick="toggleTaskDesc('${t.id}')" style="cursor: ${hasDesc ? 'pointer' : 'default'}">
                <div class="task-header">
                    <div class="task-color-dot" style="background-color: ${t.color}"></div>
                    <div class="task-title">${safeTitle}</div>
                    <button class="btn-done" onclick="completeTask(event, '${t.id}')">✓ Done</button>
                </div>
                ${hasDesc ? `<div class="task-description">${safeDesc.replace(/\n/g, '<br>')}</div>` : `<div class="task-description" style="display:none;"></div>`}
            </div>
        `;
    });
}

// Initial load
saveAndRenderTasks();

// ==========================================
// NOTEBOOKS MANAGER LOGIC
// ==========================================
let notebooks = JSON.parse(localStorage.getItem('notebooks_data')) || [];
let activeNotebookId = null;

const notebookGrid = document.getElementById('notebookGrid');
const nbModal = document.getElementById('createNotebookModal');

document.getElementById('btnShowNotebookModal').addEventListener('click', () => {
    document.getElementById('newNotebookName').value = '';
    nbModal.classList.add('active');
    document.getElementById('newNotebookName').focus();
});
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
    if(confirm('Are you sure you want to delete this notebook?')) {
        notebooks = notebooks.filter(nb => nb.id !== id);
        saveNotebooksList(); renderNotebooksList();
    }
};

function saveNotebooksList() { localStorage.setItem('notebooks_data', JSON.stringify(notebooks)); }

function renderNotebooksList() {
    const addButtonHTML = `<div class="notebook-add-card" id="btnShowNotebookModal" onclick="document.getElementById('createNotebookModal').classList.add('active'); document.getElementById('newNotebookName').focus();">
        <div class="add-icon">+</div><div>New Notebook</div></div>`;
    let gridHTML = '';
    notebooks.forEach(nb => {
        gridHTML += `
            <div class="notebook-card" onclick="openNotebook('${nb.id}')">
                <button class="notebook-card-delete" onclick="deleteNotebook(event, '${nb.id}')">Delete</button>
                <div class="notebook-card-title">${nb.name.replace(/[&<>'"]/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[x]))}</div>
                <div class="notebook-card-type">${nb.paperType} Paper</div>
            </div>
        `;
    });
    notebookGrid.innerHTML = gridHTML + addButtonHTML;
}

// ==========================================
// ACTIVE WHITEBOARD CANVAS LOGIC 
// ==========================================
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvasWrapper');
const colorPicker = document.getElementById('colorPicker');
let isDrawing = false, isEraser = false, points = [];

window.openNotebook = function(id) {
    const notebook = notebooks.find(nb => nb.id === id);
    if (!notebook) return;
    activeNotebookId = id;
    document.getElementById('activeNotebookTitle').innerText = notebook.name;
    document.getElementById('activePaperDisplay').innerText = notebook.paperType;
    canvasWrapper.className = `canvas-wrapper bg-${notebook.paperType}`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (notebook.drawingData) {
        const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = notebook.drawingData;
    }
    switchView('whiteboard');
};

const btnPen = document.getElementById('btnPen');
const btnEraser = document.getElementById('btnEraser');
btnPen.addEventListener('click', () => { isEraser = false; btnPen.classList.add('active'); btnEraser.classList.remove('active'); canvas.style.cursor = 'crosshair'; });
btnEraser.addEventListener('click', () => { isEraser = true; btnEraser.classList.add('active'); btnPen.classList.remove('active'); canvas.style.cursor = 'cell'; });

function setupBrush() {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (isEraser) { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 25; } 
    else { ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = 3; ctx.strokeStyle = colorPicker.value; }
}

canvas.addEventListener('pointerdown', (e) => { isDrawing = true; points = [{ x: e.offsetX, y: e.offsetY }]; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return; e.preventDefault(); 
    points.push({ x: e.offsetX, y: e.offsetY }); setupBrush(); ctx.beginPath();
    if (points.length < 3) { let b = points[0]; ctx.moveTo(b.x, b.y); ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); return; }
    let p0 = points[points.length - 3], p1 = points[points.length - 2], p2 = points[points.length - 1];
    let mid1X = (p0.x + p1.x) / 2, mid1Y = (p0.y + p1.y) / 2; let mid2X = (p1.x + p2.x) / 2, mid2Y = (p1.y + p2.y) / 2;
    ctx.moveTo(mid1X, mid1Y); ctx.quadraticCurveTo(p1.x, p1.y, mid2X, mid2Y); ctx.stroke();
});
canvas.addEventListener('pointerup', () => { if(isDrawing) { isDrawing = false; saveCanvasToNotebook(); } });
canvas.addEventListener('pointercancel', () => { if(isDrawing) { isDrawing = false; saveCanvasToNotebook(); } });

document.getElementById('btnClearCanvas').addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); saveCanvasToNotebook(); });

function saveCanvasToNotebook() {
    if (!activeNotebookId) return;
    const notebookIndex = notebooks.findIndex(nb => nb.id === activeNotebookId);
    if (notebookIndex > -1) { notebooks[notebookIndex].drawingData = canvas.toDataURL('image/png'); saveNotebooksList(); }
}

document.getElementById('btnSavePdf').addEventListener('click', () => {
    const notebook = notebooks.find(nb => nb.id === activeNotebookId);
    const { jsPDF } = window.jspdf; const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height]);
    const tmpCanvas = document.createElement('canvas'); tmpCanvas.width = canvas.width; tmpCanvas.height = canvas.height;
    const tCtx = tmpCanvas.getContext('2d');
    tCtx.fillStyle = '#ffffff'; tCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    const currentPaper = notebook.paperType; tCtx.strokeStyle = '#e5e5ea'; tCtx.fillStyle = '#e5e5ea'; tCtx.lineWidth = 1;
    if (currentPaper === 'lined' || currentPaper === 'squared') { for(let y = 40; y < tmpCanvas.height; y+=40) { tCtx.beginPath(); tCtx.moveTo(0, y); tCtx.lineTo(tmpCanvas.width, y); tCtx.stroke(); } }
    if (currentPaper === 'squared') { for(let x = 40; x < tmpCanvas.width; x+=40) { tCtx.beginPath(); tCtx.moveTo(x, 0); tCtx.lineTo(x, tmpCanvas.height); tCtx.stroke(); } }
    if (currentPaper === 'dotted') { for(let y = 40; y < tmpCanvas.height; y+=40) { for(let x = 40; x < tmpCanvas.width; x+=40) { tCtx.beginPath(); tCtx.arc(x, y, 2, 0, Math.PI*2); tCtx.fill(); } } }
    tCtx.drawImage(canvas, 0, 0);
    const finalImage = tmpCanvas.toDataURL('image/jpeg', 1.0);
    pdf.addImage(finalImage, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${notebook.name || 'Notes'}.pdf`);
});

// Initialize App
renderNotebooksList();