const apps = [
    { id: "hello", title: "Hello", icon: "images/verity.png", page: "pages/hello.html", autoOpen: true, width: 300, height: 220 },
    { id: "about", title: "About Me", icon: "images/confused.jpg", page: "pages/about.html", autoOpen: true, width: 260, height: 190 },
    { id: "fun", title: "GTA VI", icon: "images/gta6.png", page: "pages/fun.html" },
    { id: "notes", title: "Notes", icon: "images/notes.png", page: "pages/notes.html" },
    { id: "credits", title: "Credits", icon: "images/credits.png", page: "pages/credits.html" }
];

const windowsRoot = document.getElementById("windows");
const taskbar = document.getElementById("taskbar");

const state = {};

let audioUnlocked = false;

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
    if (!s) return;

    const rect = s.el.getBoundingClientRect();

    s.el.style.transform = "none";
    s.el.style.left = (window.innerWidth - rect.width) / 2 + "px";
    s.el.style.top = (window.innerHeight - rect.height) / 2 + "px";
}

function openWin(id) {
    const s = state[id];
    if (!s) return;

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

    s.el.style.display = "none";
    if (s.taskItem) {
        s.taskItem.remove();
        s.taskItem = null;
    }
}

function minWin(id) {
    const s = state[id];
    if (!s) return;

    s.el.classList.toggle("minimized");
    updateTaskbar(id);
}

function maxWin(id) {
    const s = state[id];
    if (!s) return;

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

    s.el.style.zIndex = 1001;
    if (s.taskItem) s.taskItem.classList.add("active");
}

function updateTaskbar(id) {
    const app = apps.find(function(a) { return a.id === id; });
    const s = state[id];
    if (!s || !app) return;

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

apps.forEach(function(app) {
    if (app.autoOpen) {
        openWin(app.id);
    }
});

const autoOpenApps = apps.filter(function(a) { return a.autoOpen; });

if (autoOpenApps.length > 0) {
    const gap = 20;
    const widths = autoOpenApps.map(function(a) { return state[a.id].el.getBoundingClientRect().width; });
    const totalWidth = widths.reduce(function(sum, w) { return sum + w; }, 0) + gap * (autoOpenApps.length - 1);

    let cursorX = (window.innerWidth - totalWidth) / 2;
    const centerY = (window.innerHeight - state[autoOpenApps[0].id].el.getBoundingClientRect().height) / 2;

    autoOpenApps.forEach(function(app, i) {
        const s = state[app.id];
        s.el.style.left = cursorX + "px";
        s.el.style.top = centerY + "px";
        cursorX += widths[i] + gap;
    });
}

const entryOverlay = document.getElementById("entry-overlay");

entryOverlay.addEventListener("click", function() {
    entryOverlay.style.display = "none";
    audioUnlocked = true;

    const audio = document.getElementById("audio");
    if (audio) {
        audio.play().catch(function(error) {
            console.log("play failed:", error);
        });
    }
});

fetch("pages/music.html")
    .then(function(res) {
        if (!res.ok) throw new Error("status " + res.status);
        return res.text();
    })
    .then(function(html) {
        document.getElementById("music-player-content").innerHTML = html;
        initMusicPlayer();
    })
    .catch(function(error) {
        console.log("failed to load music player:", error);
    });

function initMusicPlayer() {
    const tracks = [
        "audio/Jamie Paige, OK Glass - BIRDBRAIN (feat. Kasane Teto).mp3",
        "audio/The Larping Tombstome - Looping the Rooms (Larping the Rooms).mp3"
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

    if (!audio) {
        console.log("initMusicPlayer: #audio not found");
        return;
    }

    function setToggleIcon(isPlaying) {
        iconPlay.style.display = isPlaying ? "none" : "block";
        iconPause.style.display = isPlaying ? "block" : "none";
    }

    setToggleIcon(false);

    let trackIndex = 0;
    let shuffleOn = false;
    let repeatOn = false;

    const savedPrefs = JSON.parse(localStorage.getItem("riceSiteMusicPrefs") || "{}");

    if (typeof savedPrefs.volume === "number") {
        volume.value = savedPrefs.volume;
    }
    if (typeof savedPrefs.shuffle === "boolean") {
        shuffleOn = savedPrefs.shuffle;
    }
    if (typeof savedPrefs.repeat === "boolean") {
        repeatOn = savedPrefs.repeat;
    }
    if (typeof savedPrefs.trackIndex === "number" && savedPrefs.trackIndex < tracks.length) {
        trackIndex = savedPrefs.trackIndex;
    }

    function updateToggleVisuals() {
        shuffleToggle.classList.remove("active");
        repeatToggle.classList.remove("active");
        if (shuffleOn) shuffleToggle.classList.add("active");
        if (repeatOn) repeatToggle.classList.add("active");
    }

    updateToggleVisuals();

    function savePrefs() {
        localStorage.setItem("riceSiteMusicPrefs", JSON.stringify({
            volume: parseFloat(volume.value),
            shuffle: shuffleOn,
            repeat: repeatOn,
            trackIndex: trackIndex
        }));
    }

    function formatTime(sec) {
        if (!isFinite(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ":" + (s < 10 ? "0" : "") + s;
    }

    function buildTrackList() {
        trackList.innerHTML = "";

        tracks.forEach(function(path, i) {
            const item = document.createElement("div");
            item.className = "track-item";
            if (i === trackIndex) item.classList.add("active");
            item.textContent = (i + 1) + ". " + path.split("/").pop().replace(".mp3", "");

            item.addEventListener("click", function() {
                loadTrack(i);
                playTrack();
            });

            trackList.appendChild(item);
        });
    }

    function highlightActiveTrack() {
        const items = trackList.querySelectorAll(".track-item");
        items.forEach(function(item, i) {
            item.classList.toggle("active", i === trackIndex);
        });
    }

    function loadTrack(index) {
        trackIndex = (index + tracks.length) % tracks.length;
        const path = tracks[trackIndex];

        audio.src = path;
        trackLabel.textContent = "loading...";
        artistLabel.textContent = "—";
        trackNumberLabel.textContent = (trackIndex + 1) + "/" + tracks.length;
        art.src = "images/music-icon.png";
        seek.value = 0;
        currentTimeLabel.textContent = "0:00";
        durationLabel.textContent = "0:00";

        savePrefs();
        highlightActiveTrack();

        fetch(path)
            .then(function(res) {
                return res.arrayBuffer();
            })
            .then(function(buffer) {
                const mp3tag = new MP3Tag(buffer);
                mp3tag.read();

                if (mp3tag.error) {
                    console.log("mp3tag.js failed:", mp3tag.error);
                    trackLabel.textContent = path.split("/").pop();
                    return;
                }

                const tags = mp3tag.tags;

                trackLabel.textContent = tags.title || path.split("/").pop();
                if (tags.artist) artistLabel.textContent = tags.artist;

                if (tags.v2 && tags.v2.APIC && tags.v2.APIC.length > 0) {
                    const pic = tags.v2.APIC[0];
                    const bytes = new Uint8Array(pic.data);
                    let binary = "";
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    art.src = "data:" + pic.format + ";base64," + btoa(binary);
                }
            })
            .catch(function(error) {
                console.log("failed to read tags:", error);
                trackLabel.textContent = path.split("/").pop();
            });
    }

    function playTrack() {
        audio.play().catch(function(error) {
            console.log("play failed:", error);
        });
    }

    function goToNextTrack() {
        if (shuffleOn) {
            let randIndex = Math.floor(Math.random() * tracks.length);
            if (tracks.length > 1) {
                while (randIndex === trackIndex) {
                    randIndex = Math.floor(Math.random() * tracks.length);
                }
            }
            loadTrack(randIndex);
        } else {
            loadTrack(trackIndex + 1);
        }
        playTrack();
    }

    audio.addEventListener("play", function() {
        setToggleIcon(true);
    });

    audio.addEventListener("pause", function() {
        setToggleIcon(false);
    });

    toggle.addEventListener("click", function() {
        if (audio.paused) {
            playTrack();
        } else {
            audio.pause();
        }
        toggle.blur();
    });

    prev.addEventListener("click", function() {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
        prev.blur();
    });

    next.addEventListener("click", function() {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
        next.blur();
    });

    prevTrack.addEventListener("click", function() {
        loadTrack(trackIndex - 1);
        playTrack();
        prevTrack.blur();
    });

    nextTrack.addEventListener("click", function() {
        goToNextTrack();
        nextTrack.blur();
    });

    audio.addEventListener("ended", function() {
        if (repeatOn) {
            audio.currentTime = 0;
            playTrack();
        } else {
            goToNextTrack();
        }
    });

    audio.addEventListener("loadedmetadata", function() {
        seek.max = audio.duration;
        durationLabel.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", function() {
        seek.value = audio.currentTime;
        currentTimeLabel.textContent = formatTime(audio.currentTime);
    });

    seek.addEventListener("input", function() {
        audio.currentTime = seek.value;
    });

    volume.addEventListener("input", function() {
        audio.volume = volume.value;
        volumePercent.textContent = Math.round(volume.value * 100) + "%";
        savePrefs();
    });

    shuffleToggle.addEventListener("click", function() {
        shuffleOn = !shuffleOn;
        updateToggleVisuals();
        savePrefs();
        shuffleToggle.blur();
    });

    repeatToggle.addEventListener("click", function() {
        repeatOn = !repeatOn;
        updateToggleVisuals();
        savePrefs();
        repeatToggle.blur();
    });

    listToggle.addEventListener("click", function() {
        musicPlayerEl.classList.toggle("expanded");
        listToggle.blur();
    });

    buildTrackList();
    loadTrack(trackIndex);
    volumePercent.textContent = Math.round(volume.value * 100) + "%";
    audio.volume = volume.value;

    if (audioUnlocked) {
        playTrack();
    }
}

const localSaveNotice = document.getElementById("local-save-notice");
const noticeClose = document.getElementById("notice-close");

if (!localStorage.getItem("riceSiteNoticeSeen")) {
    localSaveNotice.classList.add("visible");
}

noticeClose.addEventListener("click", function() {
    localSaveNotice.classList.remove("visible");
    localStorage.setItem("riceSiteNoticeSeen", "true");
});