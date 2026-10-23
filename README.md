<img width="1918" height="876" alt="Rice's WebOS personal site" src="https://github.com/user-attachments/assets/f01a8bb4-67fe-4e9e-bdbf-e99f25fe9dec" />

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Stardance-purple.svg">
</p>

<h1 align="center">Rice's Site</h1>

<p align="center"><b>A personal website designed as a Windows 95-style desktop, with draggable windows, a working music player, themes, a desktop pet, and hidden easter eggs.</b></p>

<p align="center">
  <a href="https://my-website-mocha-alpha.vercel.app"><b>▶ Try it (PLEASE)</b></a>
</p>

---

## Demo

[▶ Watch the demo!!](https://github.com/spearedrice/my-website/raw/refs/heads/main/demos/1792726578195-2026-10-22_23-33-14.mp4) (recorded by someone else in Hack Club, thanks!)

## Quick start

Just open the live link and click to enter. Sound is on, so turn your volume to a reasonable level.

## Features

- **Real window manager:** drag, resize, minimize, maximize, and close, with focus/z-index handling and a taskbar
- **Start menu + desktop icons** that open each "app" (Hello, About, Notes, Fun, Music, Credits, Themes)
- **Music player:** reads track title, artist, and cover art straight from the MP3s, with shuffle, repeat, ±10s seek, a track list, and saved volume/last-track
- **Theme switcher:** Teal 95, Dark Mode, and Miku
- **Desktop pet:** a Miku shimeji wandering around your desktop
- **Fake Shut Down** that reboots itself after a few minutes
- **Easter eggs:** try the Konami code (it can do 2 different things, one's rare). The rest you have to find.

## Run it locally

- **Requirements:** I used something called Live Server in VScode, and I was using Windows at the time, so I'm not sure how it is for other OSes. It also doesn't work without Live Server or whatever local dev server thingie you're using so please make note of that.

```bash
git clone https://github.com/spearedrice/my-website.git
cd my-website
python -m http.server 8000
# then open http://localhost:8000
```

## How it works

The window apps (Hello, About, Notes, etc.) load as iframes, so each page stays self-contained. The music player is the exception: it's fetched and injected directly into `index.html`. Every browser I've seen blocks audio that's started without a real click *in the same frame*, so an iframe player couldn't unlock playback from the "click to enter" screen I added (that was a solution to enable audio!).  Putting it directly into the main site made it so it would work, so I stuck with that

Music metadata (title, artist, cover art) is read from the MP3 tags at runtime with mp3tag.js , so adding a song is just dropping in a file. Volume, shuffle, repeat, and last track persist using `localStorage`. You will have to add the file to script.js too to get it to work also!!

## Roadmap

- A Projects app to show off my work
- Draggable music player

## Credits

- [mp3tag.js](https://github.com/ewomackQA/mp3tag.js) for reading MP3 metadata
- Miku shimeji sprites by [zarla](https://www.deviantart.com/zarla)
- [Hospital wallpaper](https://x.com/myticalcat/status/1977059230583865426) - [myticalcat](https://x.com/myticalcat)
- Music: "BIRDBRAIN" by Jamie Paige & OK Glass (feat. Kasane Teto), "Looping the Rooms" by The Larping Tombstone
- Walkthrough video by a very nice [person!](https://github.com/blowupthenoobs)

