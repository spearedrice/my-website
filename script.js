const apps = [
    { id: "hello", title: "Hello", icon: "images/verity.png", page: "pages/hello.html", autoOpen: true, width: 300, height: 220 },
    { id: "about", title: "About Me", icon: "images/confused.jpg", page: "pages/about.html", autoOpen: true, width: 260, height: 190 },
    { id: "fun", title: "GTA VI", icon: "images/gta6.png", page: "pages/fun.html" },
    { id: "notes", title: "Notes", icon: "images/notes.png", page: "pages/notes.html" },
    { id: "credits", title: "Credits", icon: "images/credits.png", page: "pages/credits.html" }
];

const originalPageTitle = document.title;

const windowsRoot = document.getElementById("windows");
const taskbar = document.getElementById("taskbar");

const state = {};

let audioUnlocked = false;
let topZ = 1000;
let audioCtx = null;

const taskbarItems = document.createElement("div");
taskbarItems.id = "taskbar-items";
if (taskbar) {
    taskbar.appendChild(taskbarItems);
}

function getAudioCtx() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtx = new AudioContextClass();
    }
    return audioCtx;
}

function playBlip(freq, duration, type) {
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type || "square";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (error) {
        console.log("sfx failed:", error);
    }
}

function playOpenSound() {
    playBlip(660, 0.09);
    setTimeout(function() {
        playBlip(880, 0.09);
    }, 60);
}

function playCloseSound() {
    playBlip(440, 0.09);
    setTimeout(function() {
        playBlip(220, 0.1);
    }, 60);
}

function playClickSound() {
    playBlip(520, 0.05);
}

apps.forEach(function(app) {
    const win = document.createElement("div");
    win.className = "os-window";
    win.id = "win-" + app.id;

    if (app.width) win.style.width = app.width + "px";
    if (app.height) win.style.height = app.height + "px";

    win.innerHTML =
        '<div class="window-titlebar">' +
            '<span class="titlebar-label">' +
                '<img class="titlebar-icon" src="' + app.icon + '" alt="" />' +
                '<span class="titlebar-title-text">' + app.title + '</span>' +
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

    if (windowsRoot) {
        windowsRoot.appendChild(win);
    }

    state[app.id] = {
        el: win,
        bar: win.querySelector(".window-titlebar"),
        resize: win.querySelector(".resize"),
        titlebarIcon: win.querySelector(".titlebar-icon"),
        titlebarTitle: win.querySelector(".titlebar-title-text"),
        taskItem: null,
        taskIcon: null,
        taskLabel: null,
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
const desktopIconEls = {};
const columnStep = 92;
const rowStep = 96;
const iconsPerColumn = 5;

function gridPositionFor(index) {
    const col = Math.floor(index / iconsPerColumn);
    const row = index % iconsPerColumn;
    return {
        left: 15 + col * columnStep,
        top: 10 + row * rowStep
    };
}

function sanitizeIconPositions(positions) {
    const ids = Object.keys(positions);
    let corrupted = false;

    ids.forEach(function(id) {
        const pos = positions[id];
        if (!pos || typeof pos.left !== "number" || typeof pos.top !== "number" || !isFinite(pos.left) || !isFinite(pos.top)) {
            corrupted = true;
        }
    });

    if (!corrupted) {
        for (let i = 0; i < ids.length && !corrupted; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const a = positions[ids[i]];
                const b = positions[ids[j]];

                if (Math.abs(a.left - b.left) < 15 && Math.abs(a.top - b.top) < 15) {
                    corrupted = true;
                    break;
                }
            }
        }
    }

    if (corrupted) {
        localStorage.removeItem("riceSiteIconPositions");
        return {};
    }

    return positions;
}

function loadIconPositions() {
    try {
        const parsed = JSON.parse(localStorage.getItem("riceSiteIconPositions") || "{}");
        return sanitizeIconPositions(parsed);
    } catch (error) {
        localStorage.removeItem("riceSiteIconPositions");
        return {};
    }
}

function saveIconPosition(id, left, top) {
    if (!isFinite(left) || !isFinite(top)) return;

    const positions = loadIconPositions();
    positions[id] = { left: left, top: top };
    localStorage.setItem("riceSiteIconPositions", JSON.stringify(positions));
}

function makeIconDraggable(iconEl, app) {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    function onMove(e) {
        if (!dragging) return;

        const point = getPoint(e);
        const dx = point.x - startX;
        const dy = point.y - startY;

        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;

        const parentRect = desktopIcons.getBoundingClientRect();
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;

        newLeft = Math.max(0, Math.min(newLeft, parentRect.width - iconEl.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, parentRect.height - iconEl.offsetHeight));

        iconEl.style.left = newLeft + "px";
        iconEl.style.top = newTop + "px";

        if (e.type === "touchmove" && e.cancelable) e.preventDefault();
    }

    function onUp() {
        if (!dragging) return;
        dragging = false;
        iconEl.classList.remove("dragging");

        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchend", onUp);

        if (moved) {
            saveIconPosition(app.id, parseFloat(iconEl.style.left), parseFloat(iconEl.style.top));
        }
    }

    function onDown(e) {
        moved = false;
        dragging = true;
        iconEl.classList.add("dragging");

        const rect = iconEl.getBoundingClientRect();
        const parentRect = desktopIcons.getBoundingClientRect();
        const point = getPoint(e);

        startX = point.x;
        startY = point.y;
        startLeft = rect.left - parentRect.left;
        startTop = rect.top - parentRect.top;

        document.addEventListener("mousemove", onMove);
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchend", onUp);

        if (e.type === "touchstart") e.preventDefault();
    }

    iconEl.addEventListener("mousedown", onDown);
    iconEl.addEventListener("touchstart", onDown, { passive: false });

    iconEl.addEventListener("click", function(e) {
        if (moved) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        openWin(app.id);
    });
}

if (desktopIcons) {
    const savedIconPositions = loadIconPositions();

    apps.forEach(function(app, index) {
        const icon = document.createElement("div");
        icon.className = "desktop-icon";
        icon.dataset.appId = app.id;

        const img = document.createElement("img");
        img.src = app.icon;
        img.alt = "";

        const label = document.createElement("span");
        label.textContent = app.title;

        icon.appendChild(img);
        icon.appendChild(label);

        desktopIcons.appendChild(icon);

        const saved = savedIconPositions[app.id];

        if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
            icon.style.left = saved.left + "px";
            icon.style.top = saved.top + "px";
        } else {
            const pos = gridPositionFor(index);
            icon.style.left = pos.left + "px";
            icon.style.top = pos.top + "px";
        }

        makeIconDraggable(icon, app);

        desktopIconEls[app.id] = { el: icon, img: img, label: label, defaultIcon: app.icon, defaultTitle: app.title };
    });
}

function showPropertiesDialog() {
    if (document.getElementById("properties-dialog")) return;

    playClickSound();

    const overlay = document.createElement("div");
    overlay.id = "properties-dialog";
    overlay.className = "properties-dialog";
    overlay.style.position = "fixed";
    overlay.style.top = "50%";
    overlay.style.left = "50%";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.zIndex = "5001";
    overlay.style.width = "260px";
    overlay.style.background = "#d4d0c8";
    overlay.style.border = "2px solid #808080";
    overlay.style.boxShadow = "3px 3px 0 rgba(0, 0, 0, 0.4)";
    overlay.style.fontFamily = '"MS Sans Serif", "Tahoma", Arial, sans-serif';
    overlay.style.fontSize = "12px";

    const wallpaperName = document.body.classList.contains("backrooms") ? "The Backrooms" : "Teal (Windows 95 Classic)";

    overlay.innerHTML =
        '<div class="properties-titlebar">' +
            '<span>Display Properties</span>' +
            '<button class="properties-close" type="button">×</button>' +
        '</div>' +
        '<div class="properties-body">' +
            '<p><strong>Wallpaper:</strong> ' + wallpaperName + '</p>' +
            '<p><strong>Icons:</strong> ' + apps.length + ' installed, freely draggable</p>' +
            '<p><strong>Theme:</strong> Windows 95 Classic</p>' +
            '<p><strong>Color depth:</strong> ??? bit</p>' +
            '<p><strong>Site by:</strong> rice</p>' +
        '</div>' +
        '<div class="properties-footer">' +
            '<button class="properties-ok" type="button">OK</button>' +
        '</div>';

    document.body.appendChild(overlay);

    function closeDialog(e) {
        if (e) e.stopPropagation();
        overlay.remove();
    }

    overlay.addEventListener("click", function(e) { e.stopPropagation(); });
    overlay.querySelector(".properties-close").addEventListener("click", closeDialog);
    overlay.querySelector(".properties-ok").addEventListener("click", closeDialog);
}

let activeContextMenu = null;

function closeContextMenu() {
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
}

function openContextMenu(x, y, items) {
    closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.position = "fixed";
    menu.style.zIndex = "5000";
    menu.style.background = "#d4d0c8";
    menu.style.border = "2px solid #808080";
    menu.style.boxShadow = "3px 3px 0 rgba(0, 0, 0, 0.4)";
    menu.style.fontFamily = '"MS Sans Serif", "Tahoma", Arial, sans-serif';
    menu.style.fontSize = "12px";
    menu.style.padding = "2px";
    menu.style.minWidth = "170px";

    items.forEach(function(item) {
        if (item.separator) {
            const sep = document.createElement("div");
            sep.className = "context-menu-separator";
            menu.appendChild(sep);
            return;
        }

        const entry = document.createElement("div");
        entry.className = "context-menu-item";
        entry.textContent = item.label;
        entry.style.padding = "5px 10px";
        entry.style.cursor = "pointer";
        entry.style.whiteSpace = "nowrap";

        entry.addEventListener("click", function(e) {
            e.stopPropagation();
            closeContextMenu();
            playClickSound();
            if (typeof item.onClick === "function") item.onClick();
        });

        menu.appendChild(entry);
    });

    document.body.appendChild(menu);
    activeContextMenu = menu;

    menu.style.left = x + "px";
    menu.style.top = y + "px";

    const rect = menu.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - 4;
    const maxTop = window.innerHeight - rect.height - 4;

    if (x > maxLeft) menu.style.left = Math.max(4, maxLeft) + "px";
    if (y > maxTop) menu.style.top = Math.max(4, maxTop) + "px";
}

document.addEventListener("click", function() {
    closeContextMenu();
});

document.addEventListener("scroll", function() {
    closeContextMenu();
}, true);

window.addEventListener("resize", function() {
    closeContextMenu();
});

function resetAllIconPositions() {
    localStorage.removeItem("riceSiteIconPositions");

    apps.forEach(function(app, index) {
        const els = desktopIconEls[app.id];
        if (!els) return;

        const pos = gridPositionFor(index);
        els.el.style.left = pos.left + "px";
        els.el.style.top = pos.top + "px";
    });
}

function resetIconPosition(app) {
    const positions = loadIconPositions();
    delete positions[app.id];
    localStorage.setItem("riceSiteIconPositions", JSON.stringify(positions));

    const els = desktopIconEls[app.id];
    if (!els) return;

    const index = apps.indexOf(app);
    const pos = gridPositionFor(index);
    els.el.style.left = pos.left + "px";
    els.el.style.top = pos.top + "px";
}

if (desktopIcons) {
    desktopIcons.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        e.stopPropagation();

        const iconEl = e.target.closest(".desktop-icon");

        if (iconEl) {
            const app = apps.find(function(a) { return a.id === iconEl.dataset.appId; });
            if (!app) return;

            openContextMenu(e.clientX, e.clientY, [
                { label: "Open", onClick: function() { openWin(app.id); } },
                { separator: true },
                { label: "Reset Position", onClick: function() { resetIconPosition(app); } }
            ]);
        } else {
            openContextMenu(e.clientX, e.clientY, [
                { label: "Arrange Icons", onClick: resetAllIconPositions },
                { label: "Refresh", onClick: function() { location.reload(); } },
                { separator: true },
                { label: "Properties", onClick: showPropertiesDialog }
            ]);
        }
    });
}

const backroomsBrandingOverrides = {
    hello: { icon: "images/trash.png", title: "NO SIGNAL" },
    about: { title: "WHO ARE YOU" },
    fun: { title: "STILL HERE?" },
    notes: { title: "..." },
    credits: { title: "THE EXIT" }
};

function applyBackroomsBranding(active) {
    Object.keys(backroomsBrandingOverrides).forEach(function(id) {
        const override = backroomsBrandingOverrides[id];
        const desktopEls = desktopIconEls[id];
        const s = state[id];
        if (!desktopEls) return;

        const icon = active ? (override.icon || desktopEls.defaultIcon) : desktopEls.defaultIcon;
        const title = active ? (override.title || desktopEls.defaultTitle) : desktopEls.defaultTitle;

        desktopEls.img.src = icon;
        desktopEls.label.textContent = title;

        if (s) {
            if (s.titlebarIcon) s.titlebarIcon.src = icon;
            if (s.titlebarTitle) s.titlebarTitle.textContent = title;
            if (s.taskIcon) s.taskIcon.src = icon;
            if (s.taskLabel) s.taskLabel.textContent = title;
        }
    });
}

function getPoint(e) {
    if (e.touches && e.touches.length > 0) {
        return {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    }

    if (e.changedTouches && e.changedTouches.length > 0) {
        return {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };
    }

    return {
        x: e.clientX,
        y: e.clientY
    };
}

function centerWin(id) {
    const s = state[id];
    if (!s) return;

    const rect = s.el.getBoundingClientRect();

    s.el.style.transform = "none";
    s.el.style.left = (window.innerWidth - rect.width) / 2 + "px";
    s.el.style.top = (window.innerHeight - rect.height) / 2 + "px";
}

function openWin(id) {
    const s = state[id];
    if (!s) return;

    const wasHidden =
        s.el.style.display === "none" ||
        s.el.style.display === "";

    if (wasHidden) playOpenSound();

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
    if (!s) return;

    playCloseSound();

    s.el.style.display = "none";

    if (s.taskItem) {
        s.taskItem.remove();
        s.taskItem = null;
        s.taskIcon = null;
        s.taskLabel = null;
    }
}

function minWin(id) {
    const s = state[id];
    if (!s) return;

    playClickSound();

    s.el.classList.toggle("minimized");
    updateTaskbar(id);
}

function maxWin(id) {
    const s = state[id];
    if (!s) return;

    playClickSound();

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
    if (!s) return;

    topZ += 1;
    s.el.style.zIndex = topZ;

    if (s.taskItem) {
        s.taskItem.classList.add("active");
    }
}

function updateTaskbar(id) {
    const app = apps.find(function(a) {
        return a.id === id;
    });

    const s = state[id];

    if (!s || !app || !taskbar) return;

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
                playClickSound();
                s.el.style.display = "block";
                s.el.classList.remove("minimized");
            } else {
                minWin(id);
            }

            focusWin(id);
        });

        taskbarItems.appendChild(item);
        s.taskItem = item;
        s.taskIcon = icon;
        s.taskLabel = label;
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

    s.el.addEventListener("touchstart", function() {
        focusWin(id);
    }, {
        passive: true
    });

    s.el.querySelector('[data-action="min"]').addEventListener("click", function(e) {
        e.stopPropagation();
        minWin(id);
    });

    s.el.querySelector('[data-action="max"]').addEventListener("click", function(e) {
        e.stopPropagation();
        maxWin(id);
    });

    s.el.querySelector('[data-action="close"]').addEventListener("click", function(e) {
        e.stopPropagation();
        closeWin(id);
    });

    function startDrag(e) {
        if (e.target.tagName === "BUTTON") return;
        if (s.maximized) return;

        s.dragging = true;
        s.el.classList.add("interacting");

        const rect = s.el.getBoundingClientRect();
        const point = getPoint(e);

        s.x = point.x - rect.left;
        s.y = point.y - rect.top;

        s.el.style.transform = "none";
        s.el.style.left = rect.left + "px";
        s.el.style.top = rect.top + "px";

        if (e.type === "touchstart") {
            e.preventDefault();
        }
    }

    s.bar.addEventListener("mousedown", startDrag);
    s.bar.addEventListener("touchstart", startDrag, {
        passive: false
    });

    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();

        if (s.maximized) return;

        s.resizing = true;
        s.el.classList.add("interacting");

        const rect = s.el.getBoundingClientRect();
        const point = getPoint(e);

        s.x = point.x;
        s.y = point.y;
        s.w = rect.width;
        s.h = rect.height;
    }

    s.resize.addEventListener("mousedown", startResize);
    s.resize.addEventListener("touchstart", startResize, {
        passive: false
    });
});

function handleMove(e) {
    if (e.type === "mousemove" && e.buttons === 0) {
        Object.keys(state).forEach(function(id) {
            state[id].dragging = false;
            state[id].resizing = false;
            state[id].el.classList.remove("interacting");
        });

        return;
    }

    const point = getPoint(e);
    let isInteracting = false;

    Object.keys(state).forEach(function(id) {
        const s = state[id];

        if (s.dragging) {
            s.el.style.left = point.x - s.x + "px";
            s.el.style.top = point.y - s.y + "px";
            isInteracting = true;
        }

        if (s.resizing) {
            const width = s.w + (point.x - s.x);
            const height = s.h + (point.y - s.y);

            if (width >= 300) {
                s.el.style.width = width + "px";
            }

            if (height >= 200) {
                s.el.style.height = height + "px";
            }

            isInteracting = true;
        }
    });

    if (e.type === "touchmove" && isInteracting && e.cancelable) {
        e.preventDefault();
    }
}

document.addEventListener("mousemove", handleMove);
document.addEventListener("touchmove", handleMove, {
    passive: false
});

function handleInteractionEnd() {
    Object.keys(state).forEach(function(id) {
        state[id].dragging = false;
        state[id].resizing = false;
        state[id].el.classList.remove("interacting");
    });
}

document.addEventListener("mouseup", handleInteractionEnd);
document.addEventListener("touchend", handleInteractionEnd);
document.addEventListener("touchcancel", handleInteractionEnd);

apps.forEach(function(app) {
    if (app.autoOpen) {
        openWin(app.id);
    }
});

const autoOpenApps = apps.filter(function(a) {
    return a.autoOpen;
});

if (autoOpenApps.length > 0) {
    const gap = 20;

    const widths = autoOpenApps.map(function(a) {
        return state[a.id].el.getBoundingClientRect().width;
    });

    const totalWidth =
        widths.reduce(function(sum, w) {
            return sum + w;
        }, 0) +
        gap * (autoOpenApps.length - 1);

    let cursorX = (window.innerWidth - totalWidth) / 2;

    const centerY =
        (window.innerHeight -
            state[autoOpenApps[0].id].el.getBoundingClientRect().height) / 2;

    autoOpenApps.forEach(function(app, i) {
        const s = state[app.id];

        s.el.style.left = cursorX + "px";
        s.el.style.top = centerY + "px";

        cursorX += widths[i] + gap;
    });
}

const entryOverlay = document.getElementById("entry-overlay");

if (entryOverlay) {
    entryOverlay.addEventListener("click", function() {
        entryOverlay.style.display = "none";
        audioUnlocked = true;

        const ctx = getAudioCtx();

        if (ctx && ctx.state === "suspended") {
            ctx.resume().catch(function() {});
        }

        const audio = document.getElementById("audio");

        if (audio) {
            audio.play().catch(function(error) {
                console.log("play failed:", error);
            });
        }
    });
}

fetch("pages/music.html")
    .then(function(res) {
        if (!res.ok) {
            throw new Error("status " + res.status);
        }

        return res.text();
    })
    .then(function(html) {
        const playerContent = document.getElementById("music-player-content");
        if (playerContent) {
            playerContent.innerHTML = html;
            initMusicPlayer();
        }
    })
    .catch(function(error) {
        console.log("failed to load music player:", error);
    });

function swapHelloVideo(toBackrooms) {
    const helloState = state.hello;

    if (!helloState) return;

    const iframe = helloState.el.querySelector("iframe");

    if (!iframe || !iframe.contentWindow) return;

    const win = iframe.contentWindow;

    if (typeof win.resumeCurrentVideo === "function") {
        win.resumeCurrentVideo(toBackrooms);
    } else if (toBackrooms) {
        if (typeof win.showNoSignal === "function") {
            win.showNoSignal();
        }
    } else {
        if (typeof win.showVerity === "function") {
            win.showVerity();
        }
    }
}

function toggleIframeBackrooms(app, active) {
    const s = state[app.id];

    if (!s) return;

    const iframe = s.el.querySelector("iframe");

    if (!iframe || !iframe.contentDocument) return;

    iframe.contentDocument.body.classList.toggle(
        "backrooms-iframe",
        active
    );
}

function initMusicPlayer() {
    const tracks = [
        "audio/Jamie Paige, OK Glass - BIRDBRAIN (feat. Kasane Teto).mp3",
        "audio/The Larping Tombstome - Looping the Rooms (Larping the Rooms).mp3"
    ];

    const backroomsTrack =
        "audio/The Larping Tombstome - Looping the Rooms (Larping the Rooms).mp3";

    const girlFrames = [
        "images/backrooms-girl-1.png",
        "images/backrooms-girl-2.png",
        "images/backrooms-girl-3.png",
        "images/backrooms-girl-4.png"
    ];

    const stillLifeFrames = [
        "images/backrooms-still-life-1.png",
        "images/backrooms-still-life-2.png",
        "images/backrooms-still-life-3.png",
        "images/backrooms-still-life-4.png"
    ];

    const musicPlayerEl = document.getElementById("music-player");
    const audio = document.getElementById("audio");
    const toggle = document.getElementById("toggle");
    const iconPlay = document.getElementById("icon-play");
    const iconPause = document.getElementById("icon-pause");
    const prev = document.getElementById("prev");
    const next = document.getElementById("next");
    const prevTrack = document.getElementById("prev-track");
    const nextTrack = document.getElementById("next-track");
    const volume = document.getElementById("volume");
    const volumePercent = document.getElementById("volume-percent");
    const seek = document.getElementById("seek");
    const currentTimeLabel = document.getElementById("current-time");
    const durationLabel = document.getElementById("duration");
    const trackLabel = document.getElementById("track");
    const artistLabel = document.getElementById("artist");
    const trackNumberLabel = document.getElementById("track-number");
    const art = document.getElementById("art");
    const listToggle = document.getElementById("list-toggle");
    const trackList = document.getElementById("track-list");
    const shuffleToggle = document.getElementById("shuffle-toggle");
    const repeatToggle = document.getElementById("repeat-toggle");
    const backroomsGirl = document.getElementById("backrooms-girl");
    const backroomsStillLife = document.getElementById("backrooms-still-life");

    if (!audio) {
        console.log("initMusicPlayer: #audio not found");
        return;
    }

    let girlFrame = 0;
    let girlTimer = null;
    let stillLifeFrame = 0;
    let stillLifeTimer = null;
    let backroomsActive = false;
    let currentArtUrl = null;

    function startGirl() {
        if (girlTimer || !backroomsGirl) return;

        girlTimer = setInterval(function() {
            girlFrame = (girlFrame + 1) % girlFrames.length;
            backroomsGirl.src = girlFrames[girlFrame];
        }, 350);
    }

    function stopGirl() {
        if (girlTimer) {
            clearInterval(girlTimer);
            girlTimer = null;
        }
    }

    function startStillLife() {
        if (stillLifeTimer || !backroomsStillLife) return;

        stillLifeTimer = setInterval(function() {
            stillLifeFrame =
                (stillLifeFrame + 1) % stillLifeFrames.length;

            backroomsStillLife.src =
                stillLifeFrames[stillLifeFrame];
        }, 350);
    }

    function stopStillLife() {
        if (stillLifeTimer) {
            clearInterval(stillLifeTimer);
            stillLifeTimer = null;
        }
    }

    function checkBackrooms() {
        const active = tracks[trackIndex] === backroomsTrack;

        if (active === backroomsActive) return;

        backroomsActive = active;

        document.body.classList.toggle("backrooms", active);

        swapHelloVideo(active);
        applyBackroomsBranding(active);

        apps.forEach(function(app) {
            toggleIframeBackrooms(app, active);
        });

        if (active) {
            startGirl();
            startStillLife();
        } else {
            stopGirl();
            stopStillLife();
        }
    }

    function setToggleIcon(isPlaying) {
        if (iconPlay) iconPlay.style.display = isPlaying ? "none" : "block";
        if (iconPause) iconPause.style.display = isPlaying ? "block" : "none";
    }

    setToggleIcon(false);

    let trackIndex = 0;
    let shuffleOn = false;
    let repeatOn = false;
    let playOrder = [];
    let orderPos = 0;

    const savedPrefs =
        JSON.parse(
            localStorage.getItem("riceSiteMusicPrefs") || "{}"
        );

    if (typeof savedPrefs.volume === "number" && volume) {
        volume.value = savedPrefs.volume;
    }

    if (typeof savedPrefs.shuffle === "boolean") {
        shuffleOn = savedPrefs.shuffle;
    }

    if (typeof savedPrefs.repeat === "boolean") {
        repeatOn = savedPrefs.repeat;
    }

    if (
        typeof savedPrefs.trackIndex === "number" &&
        savedPrefs.trackIndex < tracks.length
    ) {
        trackIndex = savedPrefs.trackIndex;
    }

    function updateToggleVisuals() {
        if (shuffleToggle) shuffleToggle.classList.toggle("active", shuffleOn);
        if (repeatToggle) repeatToggle.classList.toggle("active", repeatOn);
    }

    updateToggleVisuals();

    function savePrefs() {
        localStorage.setItem(
            "riceSiteMusicPrefs",
            JSON.stringify({
                volume: volume ? parseFloat(volume.value) : 1,
                shuffle: shuffleOn,
                repeat: repeatOn,
                trackIndex: trackIndex
            })
        );
    }

    function formatTime(sec) {
        if (!isFinite(sec)) return "0:00";

        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);

        return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function buildPlayOrder() {
        const indices = tracks.map(function(_, i) {
            return i;
        });

        if (shuffleOn) {
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = indices[i];

                indices[i] = indices[j];
                indices[j] = temp;
            }
        }

        playOrder = indices;
        orderPos = playOrder.indexOf(trackIndex);

        if (orderPos === -1) {
            orderPos = 0;
        }
    }

    function buildTrackList() {
        if (!trackList) return;
        trackList.innerHTML = "";

        tracks.forEach(function(path, i) {
            const item = document.createElement("div");

            item.className = "track-item";

            if (i === trackIndex) {
                item.classList.add("active");
            }

            item.textContent =
                (i + 1) +
                ". " +
                path.split("/").pop().replace(".mp3", "");

            item.addEventListener("click", function() {
                loadTrack(i);

                orderPos = playOrder.indexOf(i);

                if (orderPos === -1) {
                    orderPos = 0;
                }

                playTrack();
            });

            trackList.appendChild(item);
        });
    }

    function highlightActiveTrack() {
        if (!trackList) return;
        const items = trackList.querySelectorAll(".track-item");

        items.forEach(function(item, i) {
            item.classList.toggle(
                "active",
                i === trackIndex
            );
        });
    }

    function syncTabTitle() {
        if (!trackLabel) return;

        if (audio.paused) {
            document.title = originalPageTitle;
        } else {
            document.title = "♪ " + trackLabel.textContent;
        }
    }

    function loadTrack(index) {
        trackIndex =
            (index + tracks.length) % tracks.length;

        const path = tracks[trackIndex];

        audio.src = path;

        if (trackLabel) trackLabel.textContent = path.split("/").pop().replace(".mp3", "");
        if (artistLabel) artistLabel.textContent = "—";
        if (trackNumberLabel) trackNumberLabel.textContent = (trackIndex + 1) + "/" + tracks.length;

        syncTabTitle();

        if (currentArtUrl) {
            URL.revokeObjectURL(currentArtUrl);
            currentArtUrl = null;
        }

        if (art) art.src = "images/music-icon.png";

        if (seek) seek.value = 0;
        if (currentTimeLabel) currentTimeLabel.textContent = "0:00";
        if (durationLabel) durationLabel.textContent = "0:00";

        savePrefs();
        highlightActiveTrack();
        checkBackrooms();

        fetch(path)
            .then(function(res) {
                return res.arrayBuffer();
            })
            .then(function(buffer) {
                if (typeof MP3Tag === "undefined") return;
                const mp3tag = new MP3Tag(buffer);
                mp3tag.read();

                if (mp3tag.error) {
                    console.log(
                        "mp3tag.js failed:",
                        mp3tag.error
                    );

                    return;
                }

                const tags = mp3tag.tags;

                if (tags.title && trackLabel) {
                    trackLabel.textContent = tags.title;
                    syncTabTitle();
                }

                if (tags.artist && artistLabel) {
                    artistLabel.textContent = tags.artist;
                }

                if (
                    tags.v2 &&
                    tags.v2.APIC &&
                    tags.v2.APIC.length > 0 &&
                    art
                ) {
                    const pic = tags.v2.APIC[0];

                    const blob = new Blob(
                        [new Uint8Array(pic.data)],
                        { type: pic.format }
                    );

                    currentArtUrl =
                        URL.createObjectURL(blob);

                    art.src = currentArtUrl;
                }
            })
            .catch(function(error) {
                console.log(
                    "failed to read tags:",
                    error
                );
            });
    }

    function playTrack() {
        audio.play().catch(function(error) {
            console.log("play failed:", error);
        });
    }

    function goToNextTrack() {
        orderPos =
            (orderPos + 1) % playOrder.length;

        loadTrack(playOrder[orderPos]);
        playTrack();
    }

    function goToPrevTrack() {
        orderPos =
            (orderPos - 1 + playOrder.length) %
            playOrder.length;

        loadTrack(playOrder[orderPos]);
        playTrack();
    }

    audio.addEventListener("play", function() {
        setToggleIcon(true);
        syncTabTitle();
    });

    audio.addEventListener("pause", function() {
        setToggleIcon(false);
        syncTabTitle();
    });

    if (toggle) {
        toggle.addEventListener("click", function() {
            if (audio.paused) {
                playTrack();
            } else {
                audio.pause();
            }

            toggle.blur();
        });
    }

    if (prev) {
        prev.addEventListener("click", function() {
            audio.currentTime =
                Math.max(0, audio.currentTime - 10);

            prev.blur();
        });
    }

    if (next) {
        next.addEventListener("click", function() {
            audio.currentTime =
                Math.min(
                    audio.duration || 0,
                    audio.currentTime + 10
                );

            next.blur();
        });
    }

    if (prevTrack) {
        prevTrack.addEventListener("click", function() {
            goToPrevTrack();
            prevTrack.blur();
        });
    }

    if (nextTrack) {
        nextTrack.addEventListener("click", function() {
            goToNextTrack();
            nextTrack.blur();
        });
    }

    audio.addEventListener("ended", function() {
        if (repeatOn) {
            audio.currentTime = 0;
            playTrack();
        } else {
            goToNextTrack();
        }
    });

    audio.addEventListener("loadedmetadata", function() {
        if (seek) seek.max = audio.duration;
        if (durationLabel) durationLabel.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", function() {
        if (seek) seek.value = audio.currentTime;
        if (currentTimeLabel) currentTimeLabel.textContent = formatTime(audio.currentTime);
    });

    if (seek) {
        seek.addEventListener("input", function() {
            audio.currentTime = seek.value;
        });
    }

    if (volume) {
        volume.addEventListener("input", function() {
            audio.volume = volume.value;

            if (volumePercent) {
                volumePercent.textContent =
                    Math.round(volume.value * 100) + "%";
            }

            savePrefs();
        });
    }

    if (shuffleToggle) {
        shuffleToggle.addEventListener("click", function() {
            shuffleOn = !shuffleOn;

            updateToggleVisuals();
            savePrefs();
            shuffleToggle.blur();

            buildPlayOrder();

            if (shuffleOn && tracks.length > 1) {
                goToNextTrack();
            }
        });
    }

    if (repeatToggle) {
        repeatToggle.addEventListener("click", function() {
            repeatOn = !repeatOn;

            updateToggleVisuals();
            savePrefs();
            repeatToggle.blur();
        });
    }

    if (listToggle && musicPlayerEl) {
        listToggle.addEventListener("click", function() {
            musicPlayerEl.classList.toggle("expanded");
            listToggle.blur();
        });
    }

    buildTrackList();
    loadTrack(trackIndex);
    buildPlayOrder();

    if (volume) {
        audio.volume = volume.value;
        if (volumePercent) volumePercent.textContent = Math.round(volume.value * 100) + "%";
    }

    if (audioUnlocked) {
        playTrack();
    }
}

const localSaveNotice = document.getElementById("local-save-notice");
const noticeClose = document.getElementById("notice-close");

if (localSaveNotice && !localStorage.getItem("riceSiteNoticeSeen")) {
    localSaveNotice.classList.add("visible");
}

if (noticeClose) {
    noticeClose.addEventListener("click", function() {
        if (localSaveNotice) localSaveNotice.classList.remove("visible");
        localStorage.setItem("riceSiteNoticeSeen", "true");
    });
}

function startTaskbarClock() {
    if (!taskbar) return;

    const clock = document.createElement("div");
    clock.id = "taskbar-clock";
    clock.className = "taskbar-clock";
    taskbar.appendChild(clock);

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";

        hours = hours % 12;
        if (hours === 0) hours = 12;

        const paddedMinutes = minutes < 10 ? "0" + minutes : minutes;
        clock.textContent = hours + ":" + paddedMinutes + " " + ampm;
    }

    updateClock();
    setInterval(updateClock, 15000);
}

startTaskbarClock();