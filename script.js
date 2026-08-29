const win = document.getElementById("funny");
const bar = document.getElementById("titlebar");
const resize = document.querySelector(".resize");
const taskbar = document.getElementById("taskbar");

let dragging = false;
let resizing = false;
let x = 0;
let y = 0;
let w = 0;
let h = 0;

let taskItem = null;

function openWin() {
    win.style.display = "block";
    win.classList.remove("minimized");
    focusWin();
    updateTaskbar();
}

function closeWin() {
    win.style.display = "none";
    removeTaskItem();
}

function minWin() {
    win.classList.toggle("minimized");
    updateTaskbar();
}

function focusWin() {
    win.style.zIndex = 1001;
    if (taskItem) taskItem.classList.add("active");
}

function updateTaskbar() {
    if (!taskItem) {
        taskItem = document.createElement("div");
        taskItem.className = "taskbar-item";
        taskItem.textContent = "fun";

        taskItem.addEventListener("click", function() {
            if (win.style.display === "none") {
                win.style.display = "block";
                win.classList.remove("minimized");
            } else {
                minWin();
            }
            focusWin();
        });

        taskbar.appendChild(taskItem);
    }

    if (win.classList.contains("minimized")) {
        taskItem.classList.remove("active");
    } else {
        taskItem.classList.add("active");
    }
}

function removeTaskItem() {
    if (taskItem) {
        taskItem.remove();
        taskItem = null;
    }
}

win.addEventListener("mousedown", function() {
    focusWin();
});

bar.addEventListener("mousedown", function(e) {
    if (e.target.tagName === "BUTTON") return;

    dragging = true;

    const rect = win.getBoundingClientRect();

    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    win.style.transform = "none";
    win.style.left = rect.left + "px";
    win.style.top = rect.top + "px";
});

resize.addEventListener("mousedown", function(e) {
    e.preventDefault();
    e.stopPropagation();

    resizing = true;

    const rect = win.getBoundingClientRect();

    x = e.clientX;
    y = e.clientY;
    w = rect.width;
    h = rect.height;
});

document.addEventListener("mousemove", function(e) {
    if (dragging) {
        win.style.left = e.clientX - x + "px";
        win.style.top = e.clientY - y + "px";
    }

    if (resizing) {
        const width = w + (e.clientX - x);
        const height = h + (e.clientY - y);

        if (width >= 300) win.style.width = width + "px";
        if (height >= 200) win.style.height = height + "px";
    }
});

document.addEventListener("mouseup", function() {
    dragging = false;
    resizing = false;
});