const musicWidget = {
    icon: "images/music-icon.png",
    title: "now playing"
};

const apps = [
    { id: "fun", title: "GTA VI", icon: "images/gta6.png", page: "pages/fun.html" },
    { id: "notes", title: "Notes", icon: "images/notes.png", page: "pages/notes.html" }
];

const windowsRoot = document.getElementById("windows");
const taskbar = document.getElementById("taskbar");

const state = {};

apps.forEach(function(app) {
    const win = document.createElement("div");
    win.className = "os-window";
    win.id = "win-" + app.id;

    win.innerHTML =
        '<div class="window-titlebar">' +
            '<span class="titlebar-label">' +
                '<img class="titlebar-icon" src="' + app.icon + '" alt="" />' +
                app.title +
            '</span>' +
            '<div class="window-buttons">' +
                '<button data-action="min">−</button>' +
                '<button data-action="max">□</button>' +
                '<button data-action="close">×</button>' +
            '</div>' +
        '</div>' +
        '<div class="window-content">' +
            '<iframe src="' + app.page + '" frameborder="0"></iframe>' +
            '<div class="iframe-blocker"></div>' +
        '</div>' +
        '<div class="resize"></div>';

    windowsRoot.appendChild(win);

    state[app.id] = {
        el: win,
        bar: win.querySelector(".window-titlebar"),
        resize: win.querySelector(".resize"),
        taskItem: null,
        dragging: false,
        resizing: false,
        maximized: false,
        savedRect: null,
        opened: false,
        x: 0,
        y: 0,
        w: 0,
        h: 0
    };
});

const desktopIcons = document.getElementById("desktop-icons");

apps.forEach(function(app) {
    const icon = document.createElement("div");
    icon.className = "desktop-icon";

    icon.innerHTML =
        '<img src="' + app.icon + '" alt="" />' +
        '<span>' + app.title + '</span>';

    icon.addEventListener("click", function() {
        openWin(app.id);
    });

    desktopIcons.appendChild(icon);
});

function centerWin(id) {
    const s = state[id];
    const rect = s.el.getBoundingClientRect();

    s.el.style.transform = "none";
    s.el.style.left = (window.innerWidth - rect.width) / 2 + "px";
    s.el.style.top = (window.innerHeight - rect.height) / 2 + "px";
}

function openWin(id) {
    const s = state[id];

    s.el.style.display = "block";
    s.el.classList.remove("minimized");

    if (!s.opened) {
        centerWin(id);
        s.opened = true;
    }

    focusWin(id);
    updateTaskbar(id);
}

function closeWin(id) {
    const s = state[id];
    s.el.style.display = "none";
    if (s.taskItem) {
        s.taskItem.remove();
        s.taskItem = null;
    }
}

function minWin(id) {
    const s = state[id];
    s.el.classList.toggle("minimized");
    updateTaskbar(id);
}

function maxWin(id) {
    const s = state[id];

    if (s.maximized) {
        s.el.style.left = s.savedRect.left;
        s.el.style.top = s.savedRect.top;
        s.el.style.width = s.savedRect.width;
        s.el.style.height = s.savedRect.height;
        s.maximized = false;
    } else {
        const rect = s.el.getBoundingClientRect();

        s.savedRect = {
            left: rect.left + "px",
            top: rect.top + "px",
            width: rect.width + "px",
            height: rect.height + "px"
        };

        s.el.style.transform = "none";
        s.el.style.left = "0px";
        s.el.style.top = "0px";
        s.el.style.width = "100vw";
        s.el.style.height = "calc(100vh - 34px)";
        s.maximized = true;
    }

    focusWin(id);
}

function focusWin(id) {
    const s = state[id];
    s.el.style.zIndex = 1001;
    if (s.taskItem) s.taskItem.classList.add("active");
}

function updateTaskbar(id) {
    const app = apps.find(function(a) { return a.id === id; });
    const s = state[id];

    if (!s.taskItem) {
        const item = document.createElement("div");
        item.className = "taskbar-item";

        const icon = document.createElement("img");
        icon.className = "taskbar-icon";
        icon.src = app.icon;
        icon.alt = "";

        const label = document.createElement("span");
        label.textContent = app.title;

        item.appendChild(icon);
        item.appendChild(label);

        item.addEventListener("click", function(e) {
            e.stopPropagation();

            if (s.el.style.display === "none") {
                s.el.style.display = "block";
                s.el.classList.remove("minimized");
            } else {
                minWin(id);
            }

            focusWin(id);
        });

        taskbar.appendChild(item);
        s.taskItem = item;
    }

    if (s.el.classList.contains("minimized")) {
        s.taskItem.classList.remove("active");
    } else {
        s.taskItem.classList.add("active");
    }
}

Object.keys(state).forEach(function(id) {
    const s = state[id];

    s.el.addEventListener("mousedown", function() {
        focusWin(id);
    });

    s.el.querySelector('[data-action="min"]').addEventListener("click", function() {
        minWin(id);
    });

    s.el.querySelector('[data-action="max"]').addEventListener("click", function() {
        maxWin(id);
    });

    s.el.querySelector('[data-action="close"]').addEventListener("click", function() {
        closeWin(id);
    });

    s.bar.addEventListener("mousedown", function(e) {
        if (e.target.tagName === "BUTTON") return;
        if (s.maximized) return;

        s.dragging = true;
        s.el.classList.add("interacting");

        const rect = s.el.getBoundingClientRect();

        s.x = e.clientX - rect.left;
        s.y = e.clientY - rect.top;

        s.el.style.transform = "none";
        s.el.style.left = rect.left + "px";
        s.el.style.top = rect.top + "px";
    });

    s.resize.addEventListener("mousedown", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (s.maximized) return;

        s.resizing = true;
        s.el.classList.add("interacting");

        const rect = s.el.getBoundingClientRect();

        s.x = e.clientX;
        s.y = e.clientY;
        s.w = rect.width;
        s.h = rect.height;
    });
});

document.addEventListener("mousemove", function(e) {
    if (e.buttons === 0) {
        Object.keys(state).forEach(function(id) {
            state[id].dragging = false;
            state[id].resizing = false;
            state[id].el.classList.remove("interacting");
        });
        return;
    }

    Object.keys(state).forEach(function(id) {
        const s = state[id];

        if (s.dragging) {
            s.el.style.left = e.clientX - s.x + "px";
            s.el.style.top = e.clientY - s.y + "px";
        }

        if (s.resizing) {
            const width = s.w + (e.clientX - s.x);
            const height = s.h + (e.clientY - s.y);

            if (width >= 300) s.el.style.width = width + "px";
            if (height >= 200) s.el.style.height = height + "px";
        }
    });
});

document.addEventListener("mouseup", function() {
    Object.keys(state).forEach(function(id) {
        state[id].dragging = false;
        state[id].resizing = false;
        state[id].el.classList.remove("interacting");
    });
});

const mainPanel = document.getElementById("main-panel");

let panelDragging = false;
let panelX = 0;
let panelY = 0;

mainPanel.addEventListener("mousedown", function(e) {
    if (e.target.tagName === "BUTTON") return;

    panelDragging = true;

    const rect = mainPanel.getBoundingClientRect();

    panelX = e.clientX - rect.left;
    panelY = e.clientY - rect.top;

    mainPanel.style.position = "fixed";
    mainPanel.style.left = rect.left + "px";
    mainPanel.style.top = rect.top + "px";
    mainPanel.style.width = rect.width + "px";
    mainPanel.style.margin = "0";
});

document.addEventListener("mousemove", function(e) {
    if (e.buttons === 0) {
        panelDragging = false;
        return;
    }

    if (panelDragging) {
        mainPanel.style.left = e.clientX - panelX + "px";
        mainPanel.style.top = e.clientY - panelY + "px";
    }
});

document.addEventListener("mouseup", function() {
    panelDragging = false;
});

document.getElementById("music-icon-img").src = musicWidget.icon;
document.getElementById("music-title-label").textContent = musicWidget.title;