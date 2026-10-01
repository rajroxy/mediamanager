# ScriptForge

An Electron media app that ships as **two standalone apps** from one source tree.

| App | What it is | Entry |
| --- | --- | --- |
| **ScriptForge Player** | The dashboard's media player, on its own — no dashboard, no library chrome. This is the app the operating system hands audio/video files to. | `index.html?app=player` |
| **Media Manager** | The Manager page as the whole app: library, folders and queue, straight from launch, with **Import** on the library bar and **Statistics · Settings** in the top bar. | `index.html?app=manager` |
| *(full app)* | The Manager page plus the dashboard's floating **Player**, Settings and Statistics. | `index.html` |

Every shell is the same `index.html`; the `?app=` parameter decides which app it
becomes. The block at the end of `app.js` builds the app around that choice and
the last block of `manager.css` styles it.

The Manager page is the app's **home** — the old dashboard is gone, so every
route that used to open it lands on the library instead (`goPage` in `pages.js`).

## Run

```bash
npm install
npm start            # the full app
npm run player       # ScriptForge Player
npm run manager      # Media Manager
npm run preview      # browser preview at http://localhost:3000
```

## Opening files from the file manager

`main.js` reads media paths from the command line, from `second-instance` and
from macOS `open-file`, and always routes them to the **player** app — starting
or raising its window and playing the file. The player also accepts files
dragged onto the window, plus its own **Open** button (a native dialog).

Packaging declares the associations so a double-click in Explorer/Finder opens
the player:

```bash
npm install            # installs electron-builder
npm run dist:player    # → dist/player  (ScriptForge Player, file associations)
npm run dist:manager   # → dist/manager (Media Manager)
```

Each build pins itself to its own app via `extraMetadata.sfApp`, so launching it
without a file still opens the right window.

## Preview URLs

```
/                     full app
/index.html?app=player    ScriptForge Player
/index.html?app=manager   Media Manager
```

Add `&file=/path/to/movie.mp4` to the player URL to boot straight into a file.
