const apps = [
    { id: "hello", title: "Hello", icon: "images/verity.png", page: "pages/hello.html", autoOpen: true, width: 300, height: 220 },
    { id: "about", title: "About Me", icon: "images/confused.jpg", page: "pages/about.html", autoOpen: true, width: 260, height: 190 },
    { id: "fun", title: "GTA VI", icon: "images/gta6.png", page: "pages/fun.html" },
    { id: "notes", title: "Notes", icon: "images/notes.png", page: "pages/notes.html" },
    { id: "credits", title: "Credits", icon: "images/credits.png", page: "pages/credits.html" },
    { id: "themes", title: "Display", icon: "images/theme.png", page: "pages/themes.html", width: 440, height: 430 }
];

const FRAME_SPEEDS = { slow: 650, normal: 350, fast: 150 };

const petPack = {
    walkFrames: [
        { src: "shimeji/shime1.png", speed: "normal" },
        { src: "shimeji/shime2.png", speed: "fast" }
    ],
    idleFrames: [
        { src: "shimeji/shime15.png", speed: "slow" },
        { src: "shimeji/shime16.png", speed: "slow" },
        { src: "shimeji/shime17.png", speed: "normal" },
        { src: "shimeji/shime26.png", speed: "slow" },
        { src: "shimeji/shime27.png", speed: "slow" }
    ],
    reactFrame: "shimeji/shime42.png",
    lines: ["*noises*", "...", "miku dayo", "*singing*"],
    width: 64
};

const THEME_CLASSES = ["theme-dark", "theme-miku"];

function setSiteTheme(theme) {
    THEME_CLASSES.forEach(function(cls) {
        document.body.classList.remove(cls);
    });

    if (theme === "dark" || theme === "miku") {
        document.body.classList.add("theme-" + theme);
    }

    localStorage.setItem("riceSiteTheme", theme || "");
}

function getSiteTheme() {
    return localStorage.getItem("riceSiteTheme") || "";
}

window.setSiteTheme = setSiteTheme;
window.getSiteTheme = getSiteTheme;

setSiteTheme(getSiteTheme());

const WALLPAPERS = [
    { id: "clouds", label: "Clouds", src: "wallpapers/clouds.png" },
    { id: "mourning", label: "Mourning", src: "wallpapers/mourning.jpeg" },
    { id: "tung", label: "Tung Virus", src: "wallpapers/tung.png" },
    { id: "kuru", label: "Kuru", src: "wallpapers/kuru.png" }
];

const wallpaperEl = document.createElement("div");
wallpaperEl.id = "wallpaper";
document.body.appendChild(wallpaperEl);

function setSiteWallpaper(id) {
    const wp = WALLPAPERS.find(function(w) {
        return w.id === id;
    });

    if (wp) {
        wallpaperEl.style.backgroundImage = 'url("' + wp.src + '")';
        document.body.classList.add("has-wallpaper");
        localStorage.setItem("riceSiteWallpaper", wp.id);
    } else {
        wallpaperEl.style.backgroundImage = "";
        document.body.classList.remove("has-wallpaper");
        localStorage.setItem("riceSiteWallpaper", "");
    }
}

function getSiteWallpaper() {
    return localStorage.getItem("riceSiteWallpaper") || "";
}

window.WALLPAPERS = WALLPAPERS;
window.setSiteWallpaper = setSiteWallpaper;
window.getSiteWallpaper = getSiteWallpaper;

setSiteWallpaper(getSiteWallpaper());

const originalPageTitle = document.title;

const windowsRoot = document.getElementById("windows");
const taskbar = document.getElementById("taskbar");

const state = {};

let audioUnlocked = false;
let topZ = 1000;
let audioCtx = null;
let sfxMuted = localStorage.getItem("riceSiteSfxMuted") === "true";

const startButton = document.createElement("button");
startButton.id = "start-button";
startButton.type = "button";
startButton.textContent = "Start";
if (taskbar) {
    taskbar.appendChild(startButton);
}

const taskbarItems = document.createElement("div");
taskbarItems.id = "taskbar-items";
if (taskbar) {
    taskbar.appendChild(taskbarItems);
}

const sfxToggle = document.createElement("button");
sfxToggle.id = "sfx-toggle";
sfxToggle.type = "button";
sfxToggle.title = "mute / unmute all sound";

const sfxIcon = document.createElement("img");
sfxIcon.alt = "";
sfxToggle.appendChild(sfxIcon);

function updateSfxToggle() {
    sfxIcon.src = sfxMuted ? "images/speaker_mute.png" : "images/speaker.png";

    const musicAudio = document.getElementById("audio");
    if (musicAudio) musicAudio.muted = sfxMuted;
}

updateSfxToggle();

sfxToggle.addEventListener("click", function(e) {
    e.stopPropagation();

    sfxMuted = !sfxMuted;
    localStorage.setItem("riceSiteSfxMuted", sfxMuted ? "true" : "false");
    updateSfxToggle();

    if (!sfxMuted) playClickSound();
});

if (taskbar) {
    taskbar.appendChild(sfxToggle);
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
    if (sfxMuted) return;

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
        snapped: null,
        snapRestore: null,
        dragOrigin: null,
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

    const currentWallpaper = WALLPAPERS.find(function(w) {
        return w.id === getSiteWallpaper();
    });

    const wallpaperName = document.body.classList.contains("backrooms")
        ? "The Backrooms"
        : (currentWallpaper ? currentWallpaper.label : "Teal (Windows 95 Classic)");

    overlay.innerHTML =
        '<div class="properties-titlebar">' +
            '<span>Display Properties</span>' +
            '<button class="properties-close" type="button">×</button>' +
        '</div>' +
        '<div class="properties-body">' +
            '<p><strong>Wallpaper:</strong> ' + wallpaperName + '</p>' +
            '<p><strong>Icons:</strong> ' + apps.length + ' installed, freely draggable</p>' +
            '<p><strong>Theme:</strong> Windows 95 Classic</p>' +
            '<p><strong>Screen saver:</strong> Bouncing logo (3 min)</p>' +
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
        entry.style.padding = "5px 10px";
        entry.style.cursor = "pointer";
        entry.style.whiteSpace = "nowrap";
        entry.style.display = "flex";
        entry.style.alignItems = "center";
        entry.style.gap = "8px";

        if (item.icon) {
            const icon = document.createElement("img");
            icon.src = item.icon;
            icon.alt = "";
            icon.className = "context-menu-icon";
            entry.appendChild(icon);
        }

        const labelSpan = document.createElement("span");
        labelSpan.textContent = item.label;
        entry.appendChild(labelSpan);

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

    Object.keys(state).forEach(function(id) {
        if (state[id].snapped) layoutSnapped(state[id]);
    });
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

function shutDown() {
    closeContextMenu();
    playCloseSound();

    const overlay = document.createElement("div");
    overlay.id = "shutdown-overlay";
    overlay.innerHTML = '<p>It is now safe to turn off your computer.</p>' +
        '<p class="shutdown-hint">click anywhere to restart</p>';

    document.body.appendChild(overlay);

    const REBOOT_DELAY_MS = 3 * 60 * 1000;

    const rebootTimer = setTimeout(function() {
        location.reload();
    }, REBOOT_DELAY_MS);

    overlay.addEventListener("click", function() {
        clearTimeout(rebootTimer);
        location.reload();
    });
}

if (startButton) {
    startButton.addEventListener("click", function(e) {
        e.stopPropagation();
        playClickSound();

        const rect = startButton.getBoundingClientRect();

        const menuItems = apps.map(function(app) {
            return {
                label: app.title,
                icon: app.icon,
                onClick: function() { openWin(app.id); }
            };
        });

        menuItems.push({ separator: true });
        menuItems.push({ label: "Shut Down...", onClick: shutDown });

        openContextMenu(rect.left, rect.top - 4, menuItems);

        if (activeContextMenu) {
            const menuRect = activeContextMenu.getBoundingClientRect();
            activeContextMenu.style.top = (rect.top - menuRect.height - 4) + "px";
        }
    });
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
                { label: "Properties", onClick: showPropertiesDialog },
                { label: "Screen Saver", onClick: function() { if (window.startScreensaver) window.startScreensaver(); } },
                { separator: true },
                { label: "Shut Down...", onClick: shutDown }
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

function loadWindowStates() {
    try {
        return JSON.parse(localStorage.getItem("riceSiteWindowStates") || "{}");
    } catch (error) {
        localStorage.removeItem("riceSiteWindowStates");
        return {};
    }
}

function saveWindowState(id) {
    const s = state[id];
    if (!s) return;

    const states = loadWindowStates();
    const prev = states[id] || {};

    const isOpen = s.el.style.display !== "none" && s.el.style.display !== "";
    const isMinimized = s.el.classList.contains("minimized");
    const rect = s.el.getBoundingClientRect();

    const left = parseFloat(s.el.style.left);
    const top = parseFloat(s.el.style.top);
    const width = isMinimized && isFinite(prev.width) ? prev.width : rect.width;
    const height = isMinimized && isFinite(prev.height) ? prev.height : rect.height;

    if (!isFinite(left) || !isFinite(top) || !isFinite(width) || !isFinite(height)) return;

    states[id] = {
        open: isOpen,
        minimized: isMinimized,
        maximized: !!s.maximized,
        left: left,
        top: top,
        width: width,
        height: height
    };

    localStorage.setItem("riceSiteWindowStates", JSON.stringify(states));
}

function sanitizeWindowStates(states) {
    const autoOpenIds = apps
        .filter(function(a) { return a.autoOpen; })
        .map(function(a) { return a.id; });

    if (autoOpenIds.length > 1) {
        const positions = autoOpenIds
            .map(function(id) { return states[id]; })
            .filter(function(s) { return s && s.open && isFinite(s.left) && isFinite(s.top); });

        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const a = positions[i];
                const b = positions[j];

                if (Math.abs(a.left - b.left) < 40 && Math.abs(a.top - b.top) < 40) {
                    localStorage.removeItem("riceSiteWindowStates");
                    return {};
                }
            }
        }
    }

    return states;
}

function setMaximizedSilently(id) {
    const s = state[id];
    if (!s) return;

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

function centerWin(id) {
    const s = state[id];
    if (!s) return;

    const rect = s.el.getBoundingClientRect();

    s.el.style.transform = "none";
    s.el.style.left = (window.innerWidth - rect.width) / 2 + "px";
    s.el.style.top = (window.innerHeight - rect.height) / 2 + "px";
}

function openWin(id, options) {
    const opts = options || {};
    const s = state[id];
    if (!s) return;

    const wasHidden =
        s.el.style.display === "none" ||
        s.el.style.display === "";

    if (wasHidden && !opts.silent) playOpenSound();

    s.el.style.display = "block";
    s.el.classList.remove("minimized");

    if (!s.opened) {
        centerWin(id);
        s.opened = true;
    }

    focusWin(id);
    updateTaskbar(id);

    if (!opts.silent) saveWindowState(id);
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

    saveWindowState(id);
}

function getTaskbarTarget(s) {
    if (s.taskItem) {
        const taskRect = s.taskItem.getBoundingClientRect();
        return {
            x: taskRect.left + taskRect.width / 2,
            y: taskRect.top + taskRect.height / 2
        };
    }

    return {
        x: window.innerWidth / 2,
        y: window.innerHeight
    };
}

function animateMinimize(id, minimizing) {
    const s = state[id];
    if (!s) return;

    const el = s.el;

    if (minimizing) {
        const rect = el.getBoundingClientRect();
        const target = getTaskbarTarget(s);

        const dx = target.x - (rect.left + rect.width / 2);
        const dy = target.y - (rect.top + rect.height / 2);

        el.style.setProperty("--mz-dx", dx + "px");
        el.style.setProperty("--mz-dy", dy + "px");

        function onEnd(e) {
            if (e.target !== el || e.propertyName !== "transform") return;
            el.removeEventListener("transitionend", onEnd);
            el.classList.remove("minimizing-out");
            el.classList.add("minimized");
            updateTaskbar(id);
            saveWindowState(id);
        }

        el.addEventListener("transitionend", onEnd);

        requestAnimationFrame(function() {
            el.classList.add("minimizing-out");
        });
    } else {
        el.classList.remove("minimized");

        const rect = el.getBoundingClientRect();
        const target = getTaskbarTarget(s);

        const dx = target.x - (rect.left + rect.width / 2);
        const dy = target.y - (rect.top + rect.height / 2);

        el.style.setProperty("--mz-dx", dx + "px");
        el.style.setProperty("--mz-dy", dy + "px");

        el.style.transition = "none";
        el.classList.add("minimizing-out");

        void el.offsetWidth;

        el.style.transition = "";
        el.classList.remove("minimizing-out");

        updateTaskbar(id);
        saveWindowState(id);
    }
}

function minWin(id) {
    const s = state[id];
    if (!s) return;

    playClickSound();

    const isCurrentlyMinimized = s.el.classList.contains("minimized");
    animateMinimize(id, !isCurrentlyMinimized);
}

function maxWin(id) {
    const s = state[id];
    if (!s) return;

    playClickSound();

    s.snapped = null;

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
    saveWindowState(id);
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
        s.dragOrigin = { x: point.x, y: point.y };

        s.el.style.transform = "none";
        s.el.style.left = rect.left + "px";
        s.el.style.top = rect.top + "px";

        if (e.type === "touchstart") {
            e.preventDefault();
        }
    }

    s.bar.addEventListener("dblclick", function(e) {
        if (e.target.tagName === "BUTTON") return;
        maxWin(id);
    });

    s.bar.addEventListener("mousedown", startDrag);
    s.bar.addEventListener("touchstart", startDrag, {
        passive: false
    });

    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();

        if (s.maximized) return;

        s.resizing = true;
        s.snapped = null;
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

let dragSnapZone = null;
let snapPreviewEl = null;

function getSnapPreview() {
    if (!snapPreviewEl) {
        snapPreviewEl = document.createElement("div");
        snapPreviewEl.id = "snap-preview";
        document.body.appendChild(snapPreviewEl);
    }

    return snapPreviewEl;
}

function snapZoneFor(point) {
    const edge = 4;

    if (point.x <= edge) return "left";
    if (point.x >= window.innerWidth - 1 - edge) return "right";
    if (point.y <= edge) return "top";

    return null;
}

function snapRect(zone) {
    const half = Math.floor(window.innerWidth / 2);
    const height = window.innerHeight - 34;

    if (zone === "left") return { left: 0, top: 0, width: half, height: height };
    if (zone === "right") return { left: half, top: 0, width: window.innerWidth - half, height: height };

    return { left: 0, top: 0, width: window.innerWidth, height: height };
}

function showSnapPreview(zone) {
    const el = getSnapPreview();

    if (!zone) {
        el.classList.remove("visible");
        return;
    }

    const r = snapRect(zone);

    el.style.left = r.left + "px";
    el.style.top = r.top + "px";
    el.style.width = r.width + "px";
    el.style.height = r.height + "px";
    el.classList.add("visible");
}

function layoutSnapped(s) {
    const r = snapRect(s.snapped);

    s.el.style.transform = "none";
    s.el.style.left = r.left + "px";
    s.el.style.top = r.top + "px";
    s.el.style.width = r.width + "px";
    s.el.style.height = r.height + "px";
}

function applySnap(id, zone) {
    const s = state[id];
    if (!s || s.maximized) return;

    if (zone === "top") {
        maxWin(id);
        return;
    }

    if (!s.snapped) {
        const rect = s.el.getBoundingClientRect();
        s.snapRestore = { width: rect.width, height: rect.height };
    }

    s.snapped = zone;
    layoutSnapped(s);
    focusWin(id);
    playClickSound();
}

function releaseSnap(s, point) {
    const rect = s.el.getBoundingClientRect();
    const ratio = rect.width > 0 ? (point.x - rect.left) / rect.width : 0.5;
    const w = s.snapRestore ? s.snapRestore.width : 420;
    const h = s.snapRestore ? s.snapRestore.height : 320;
    const left = point.x - ratio * w;
    const top = Math.max(0, point.y - 14);

    s.el.style.width = w + "px";
    s.el.style.height = h + "px";
    s.el.style.left = left + "px";
    s.el.style.top = top + "px";

    s.x = point.x - left;
    s.y = point.y - top;
    s.snapped = null;
}

function handleMove(e) {
    if (e.type === "mousemove" && e.buttons === 0) {
        Object.keys(state).forEach(function(id) {
            state[id].dragging = false;
            state[id].resizing = false;
            state[id].el.classList.remove("interacting");
        });

        dragSnapZone = null;
        showSnapPreview(null);

        return;
    }

    const point = getPoint(e);
    let isInteracting = false;

    Object.keys(state).forEach(function(id) {
        const s = state[id];

        if (s.dragging) {
            if (s.snapped && s.dragOrigin && Math.abs(point.x - s.dragOrigin.x) + Math.abs(point.y - s.dragOrigin.y) > 4) {
                releaseSnap(s, point);
            }

            if (!s.snapped) {
                s.el.style.left = point.x - s.x + "px";
                s.el.style.top = point.y - s.y + "px";
                dragSnapZone = snapZoneFor(point);
                showSnapPreview(dragSnapZone);
            }

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
    const zone = dragSnapZone;

    dragSnapZone = null;
    showSnapPreview(null);

    Object.keys(state).forEach(function(id) {
        const s = state[id];
        const wasDragging = s.dragging;
        const wasInteracting = s.dragging || s.resizing;

        s.dragging = false;
        s.resizing = false;
        s.el.classList.remove("interacting");

        if (wasDragging && zone) {
            applySnap(id, zone);
        }

        if (wasInteracting) {
            saveWindowState(id);
        }
    });
}

document.addEventListener("mouseup", handleInteractionEnd);
document.addEventListener("touchend", handleInteractionEnd);
document.addEventListener("touchcancel", handleInteractionEnd);

const savedWindowStates = sanitizeWindowStates(loadWindowStates());
const hasSavedWindowStates = Object.keys(savedWindowStates).length > 0;

apps.forEach(function(app) {
    const saved = savedWindowStates[app.id];

    if (saved) {
        if (saved.open) {
            openWin(app.id, { silent: true });

            const s = state[app.id];

            if (isFinite(saved.width) && saved.width >= 300) {
                s.el.style.width = saved.width + "px";
            }

            if (isFinite(saved.height) && saved.height >= 200) {
                s.el.style.height = saved.height + "px";
            }

            if (isFinite(saved.left) && isFinite(saved.top)) {
                const clampedLeft = Math.max(-50, Math.min(saved.left, window.innerWidth - 50));
                const clampedTop = Math.max(0, Math.min(saved.top, window.innerHeight - 50));

                s.el.style.transform = "none";
                s.el.style.left = clampedLeft + "px";
                s.el.style.top = clampedTop + "px";
            }

            if (saved.maximized) {
                setMaximizedSilently(app.id);
            }

            if (saved.minimized) {
                s.el.classList.add("minimized");
            }

            updateTaskbar(app.id);
            saveWindowState(app.id);
        }
    } else if (app.autoOpen) {
        openWin(app.id);
    }
});

if (!hasSavedWindowStates) {
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

    if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body) return;

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

    audio.muted = sfxMuted;

    let girlFrame = 0;
    let girlTimer = null;
    let stillLifeFrame = 0;
    let stillLifeTimer = null;
    let backroomsActive = false;
    let currentArtUrl = null;

    window.isBackroomsActive = function() {
        return backroomsActive;
    };

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

function initKonami() {
    const SEQUENCE = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    const RAIN_SPRITES = ["shimeji/shime9.png", "shimeji/shime10.png", "shimeji/shime19.png", "shimeji/shime22.png"];
    const EFFECTS = ["rain", "bsod", "zoomies", "backrooms"];

    let progress = 0;
    let busy = false;
    let lastEffect = "";

    function blocked() {
        const entry = document.getElementById("entry-overlay");
        const saver = document.getElementById("screensaver");

        if (entry && entry.style.display !== "none") return true;
        if (document.getElementById("shutdown-overlay")) return true;
        if (saver && saver.classList.contains("active")) return true;

        return busy;
    }

    function rain() {
        busy = true;

        const layer = document.createElement("div");
        layer.id = "konami-rain";

        for (let i = 0; i < 28; i++) {
            const img = document.createElement("img");
            img.src = RAIN_SPRITES[Math.floor(Math.random() * RAIN_SPRITES.length)];
            img.alt = "";
            img.style.left = Math.random() * 92 + "%";
            img.style.width = 48 + Math.random() * 56 + "px";
            img.style.animationDuration = 2.6 + Math.random() * 2.4 + "s";
            img.style.animationDelay = Math.random() * 2.2 + "s";
            img.style.setProperty("--spin", (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360) + "deg");
            layer.appendChild(img);
        }

        document.body.appendChild(layer);

        [660, 784, 988, 1319].forEach(function(freq, i) {
            setTimeout(function() {
                playBlip(freq, 0.1);
            }, i * 90);
        });

        setTimeout(function() {
            layer.remove();
            busy = false;
        }, 7800);
    }

    function bsod() {
        busy = true;

        const screen = document.createElement("div");
        screen.id = "konami-bsod";
        screen.innerHTML =
            '<div class="bsod-title">RICE-PC</div>' +
            '<p>A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) + 00010E36. The current application will be terminated.</p>' +
            '<p>*&nbsp; Press any key to terminate the current application.</p>' +
            '<p>*&nbsp; Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.</p>' +
            '<p class="bsod-prompt">Press any key to continue <span class="bsod-blink">_</span></p>';

        document.body.appendChild(screen);
        playCloseSound();

        const armedAt = Date.now();
        let closed = false;

        function close() {
            if (closed) return;
            closed = true;

            document.removeEventListener("keydown", onKey);
            screen.remove();
            playOpenSound();
            busy = false;
        }

        function onKey() {
            if (Date.now() - armedAt > 900) close();
        }

        document.addEventListener("keydown", onKey);

        screen.addEventListener("click", function() {
            if (Date.now() - armedAt > 900) close();
        });

        setTimeout(close, 5000);
    }

    function zoomies() {
        busy = true;

        if (typeof window.petFrenzy === "function") {
            window.petFrenzy(6000);
        }

        [523, 659, 784, 1047, 784, 1047].forEach(function(freq, i) {
            setTimeout(function() {
                playBlip(freq, 0.07);
            }, i * 70);
        });

        setTimeout(function() {
            busy = false;
        }, 6000);
    }

    function backroomsFlash() {
        busy = true;

        document.body.classList.add("backrooms");
        applyBackroomsBranding(true);

        apps.forEach(function(app) {
            toggleIframeBackrooms(app, true);
        });

        playBlip(110, 0.45, "sawtooth");

        setTimeout(function() {
            playBlip(92, 0.5, "sawtooth");
        }, 220);

        setTimeout(function() {
            if (typeof window.isBackroomsActive === "function" && window.isBackroomsActive()) {
                busy = false;
                return;
            }

            document.body.classList.remove("backrooms");
            applyBackroomsBranding(false);

            apps.forEach(function(app) {
                toggleIframeBackrooms(app, false);
            });

            busy = false;
        }, 5000);
    }

    function run(name) {
        if (blocked()) return;

        let pick = name;

        if (EFFECTS.indexOf(pick) === -1) {
            const pool = EFFECTS.filter(function(n) {
                return n !== lastEffect;
            });

            pick = pool[Math.floor(Math.random() * pool.length)];
        }

        if (pick === "backrooms" && typeof window.isBackroomsActive === "function" && window.isBackroomsActive()) {
            pick = "rain";
        }

        lastEffect = pick;

        if (pick === "rain") rain();
        else if (pick === "bsod") bsod();
        else if (pick === "zoomies") zoomies();
        else backroomsFlash();
    }

    function onKey(e) {
        const key = (e.key || "").toLowerCase();

        if (key === SEQUENCE[progress]) {
            progress += 1;

            if (progress === SEQUENCE.length) {
                progress = 0;
                run();
            }
        } else {
            progress = key === SEQUENCE[0] ? 1 : 0;
        }
    }

    document.addEventListener("keydown", onKey);

    Object.keys(state).forEach(function(id) {
        const iframe = state[id].el.querySelector("iframe");
        if (!iframe) return;

        function hook() {
            try {
                if (iframe.contentDocument) {
                    iframe.contentDocument.addEventListener("keydown", onKey);
                }
            } catch (error) {}
        }

        iframe.addEventListener("load", hook);
        hook();
    });

    window.runKonamiEffect = run;
}

function initScreensaver() {
    const IDLE_MS = 3 * 60 * 1000;
    const LOGO_SIZE = 96;
    const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "wheel"];

    const saver = document.createElement("div");
    saver.id = "screensaver";

    const logo = document.createElement("img");
    logo.src = "images/watermark.png";
    logo.alt = "";
    saver.appendChild(logo);

    document.body.appendChild(saver);

    let lastActivity = Date.now();
    let active = false;
    let activatedAt = 0;
    let rafId = null;
    let lastTime = 0;
    let x = 0;
    let y = 0;
    let vx = 0.12;
    let vy = 0.09;
    let hue = 0;
    let lastMouseX = null;
    let lastMouseY = null;

    function canStart() {
        const entry = document.getElementById("entry-overlay");
        if (entry && entry.style.display !== "none") return false;
        if (document.getElementById("shutdown-overlay")) return false;
        return true;
    }

    function step(now) {
        if (!active) return;

        const dt = Math.min(now - lastTime, 50);
        lastTime = now;

        const w = logo.offsetWidth || LOGO_SIZE;
        const h = logo.offsetHeight || LOGO_SIZE;
        let bounced = false;

        x += vx * dt;
        y += vy * dt;

        if (x <= 0) {
            x = 0;
            vx = Math.abs(vx);
            bounced = true;
        }

        if (x >= window.innerWidth - w) {
            x = Math.max(0, window.innerWidth - w);
            vx = -Math.abs(vx);
            bounced = true;
        }

        if (y <= 0) {
            y = 0;
            vy = Math.abs(vy);
            bounced = true;
        }

        if (y >= window.innerHeight - h) {
            y = Math.max(0, window.innerHeight - h);
            vy = -Math.abs(vy);
            bounced = true;
        }

        if (bounced) {
            hue = (hue + 70) % 360;
            logo.style.filter = "hue-rotate(" + hue + "deg)";
        }

        logo.style.transform = "translate(" + x + "px, " + y + "px)";
        rafId = requestAnimationFrame(step);
    }

    function start() {
        if (active) return;

        active = true;
        activatedAt = Date.now();
        saver.classList.add("active");

        x = Math.random() * Math.max(1, window.innerWidth - LOGO_SIZE);
        y = Math.random() * Math.max(1, window.innerHeight - LOGO_SIZE);
        vx = (Math.random() < 0.5 ? -1 : 1) * 0.12;
        vy = (Math.random() < 0.5 ? -1 : 1) * 0.09;
        lastTime = performance.now();

        rafId = requestAnimationFrame(step);
    }

    function stop() {
        active = false;
        saver.classList.remove("active");
        cancelAnimationFrame(rafId);
        lastActivity = Date.now();
    }

    function onActivity(e) {
        if (e && e.type === "mousemove") {
            const moved =
                lastMouseX === null ||
                Math.abs(e.screenX - lastMouseX) + Math.abs(e.screenY - lastMouseY) > 3;

            lastMouseX = e.screenX;
            lastMouseY = e.screenY;

            if (!moved) return;
        }

        if (active) {
            if (Date.now() - activatedAt < 600) return;
            stop();
        }

        lastActivity = Date.now();
    }

    function attachTo(doc) {
        ACTIVITY_EVENTS.forEach(function(name) {
            doc.addEventListener(name, onActivity, { passive: true });
        });
    }

    attachTo(document);

    Object.keys(state).forEach(function(id) {
        const iframe = state[id].el.querySelector("iframe");
        if (!iframe) return;

        function hook() {
            try {
                if (iframe.contentDocument) attachTo(iframe.contentDocument);
            } catch (error) {}
        }

        iframe.addEventListener("load", hook);
        hook();
    });

    setInterval(function() {
        if (!active && canStart() && Date.now() - lastActivity >= IDLE_MS) {
            start();
        }
    }, 1000);

    window.startScreensaver = start;
}

function initDesktopPet() {
    if (!desktopIcons) return;

    const pet = document.createElement("div");
    pet.id = "desktop-pet";

    const petImg = document.createElement("img");
    petImg.src = petPack.walkFrames[0];
    petImg.alt = "";
    pet.appendChild(petImg);

    desktopIcons.appendChild(pet);

    const PET_BOX = 72;
    const FLOOR_GAP = 1;

    let x = 40;
    let y = 0;
    let dir = 1;
    let frameIndex = 0;
    let frameElapsed = 0;
    let mode = "walk";
    let modeTimer = 0;
    let modeDuration = 3000 + Math.random() * 3000;
    let walkSpeed = 0.03 + Math.random() * 0.025;
    let velocity = 0;
    let pauseTimer = 0;
    let bobPhase = 0;
    let frenzyUntil = 0;

    function bounds() {
        const rect = desktopIcons.getBoundingClientRect();
        return { w: rect.width, h: rect.height };
    }

    function floorY() {
        return Math.max(0, bounds().h - PET_BOX - FLOOR_GAP);
    }

    y = floorY();
    pet.style.left = x + "px";
    pet.style.top = y + "px";

    function pickNewMode() {
        mode = mode === "walk" ? "idle" : "walk";
        modeTimer = 0;
        modeDuration = mode === "walk" ? 2500 + Math.random() * 3500 : 2000 + Math.random() * 2000;
        frameIndex = 0;
        frameElapsed = 0;

        if (mode === "walk") {
            dir = Math.random() < 0.5 ? -1 : 1;
            walkSpeed = 0.03 + Math.random() * 0.025;
            velocity = 0;
            pauseTimer = 0;
        } else {
            pet.style.top = y + "px";
        }
    }

    function tick(dt) {
        const frenzy = Date.now() < frenzyUntil;

        modeTimer += dt;

        if (frenzy && mode === "idle") {
            pickNewMode();
        }

        if (modeTimer >= modeDuration && !frenzy) {
            pickNewMode();
        }

        const frames = mode === "walk" ? petPack.walkFrames : petPack.idleFrames;

        frameElapsed += dt;
        const currentDuration = (FRAME_SPEEDS[frames[frameIndex].speed] || FRAME_SPEEDS.normal) / (frenzy ? 2.2 : 1);

        if (frameElapsed >= currentDuration) {
            frameElapsed -= currentDuration;
            frameIndex = (frameIndex + 1) % frames.length;
        }

        petImg.src = frames[frameIndex].src;

        if (mode === "walk") {
            const b = bounds();

            if (pauseTimer > 0) {
                pauseTimer -= dt;
                velocity *= 0.85;
            } else {
                const targetVelocity = dir * (frenzy ? 0.42 : walkSpeed);
                velocity += (targetVelocity - velocity) * Math.min(1, dt / (frenzy ? 90 : 220));
            }

            x += velocity * dt;
            bobPhase += dt * (frenzy ? 2 : 1);

            const bobOffset = pauseTimer > 0 ? 0 : -Math.abs(Math.sin(bobPhase / 140)) * (frenzy ? 6 : 3);
            pet.style.top = (y + bobOffset) + "px";

            if (x <= 0) {
                x = 0;
                dir = 1;
                pauseTimer = frenzy ? 0 : 260 + Math.random() * 220;
            }

            if (x >= b.w - petPack.width) {
                x = b.w - petPack.width;
                dir = -1;
                pauseTimer = frenzy ? 0 : 260 + Math.random() * 220;
            }

            pet.style.left = x + "px";
            pet.style.transform = dir === -1 ? "scaleX(1)" : "scaleX(-1)";
        }
    }

    let lastTime = performance.now();

    function loop(now) {
        const dt = Math.min(now - lastTime, 50);
        lastTime = now;
        tick(dt);
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    let resizeTimer = null;

    window.addEventListener("resize", function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            y = floorY();
            if (mode === "idle") {
                pet.style.top = y + "px";
            }
        }, 150);
    });

    let bubbleTimer = null;

    pet.addEventListener("click", function(e) {
        e.stopPropagation();

        const prevSrc = petImg.src;
        petImg.src = petPack.reactFrame;
        setTimeout(function() {
            petImg.src = prevSrc;
        }, 400);

        let bubble = document.getElementById("pet-bubble");

        if (!bubble) {
            bubble = document.createElement("div");
            bubble.id = "pet-bubble";
            desktopIcons.appendChild(bubble);
        }

        bubble.textContent = petPack.lines[Math.floor(Math.random() * petPack.lines.length)];
        bubble.style.left = x + "px";
        bubble.style.top = (y - 26) + "px";
        bubble.style.display = "block";

        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(function() {
            bubble.style.display = "none";
        }, 2200);
    });

    window.petFrenzy = function(ms) {
        frenzyUntil = Date.now() + ms;
    };
}

initScreensaver();
initKonami();
initDesktopPet();
startTaskbarClock();