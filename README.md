# Python Data Types Lab

An interactive, animated Python learning simulator built for beginners, secondary school learners (JSS1–SSS3), teachers, and self-learners. Learners step line by line through story-driven scenes, watch variables and memory IDs update live, test real interactive `input()` prompts, explore every core data type and method, play mini-games, and practise with a 248-question exam bank.

**Live site:** <https://nwanesi-ebube.github.io/python-datatype/>

---

## Features

- **Scenario Theatre**: 32 animated lessons across Modules A to E with play, pause, step forward/back, speed control, read-aloud narration, and live memory inspection (`id()`, types, mutability, aliasing vs copying).
- **100% Offline Built-In Python Engine**: Runs in the browser with no backend server and no API keys required. Optional **Full Python (Pyodide)** mode can also be loaded once online and cached for offline use.
- **Interactive Tools & Mini-Games**: Variable Name Checker, Do & Don't Board, `print()` Studio, Method & Type Explorer, Conversion Matrix, Operation Lab, Mutability Lab, Type Chooser, 7 mini-games, and 3 guided Capstone Projects.
- **Practice Bank & Classroom Mode**: 15 MCQs, 6 theory prompts, 6 coding tasks, and 4 debugging tasks per module (248 total), plus **Teaching Mode** (larger projector scale + teacher keys) and printable module summary handouts.
- **Installable PWA**: Works offline after the first visit on laptops, Android phones/tablets, and iPhones/iPads.

---

## Run Locally

Requirements: [Node.js](https://nodejs.org/) (LTS version).

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal (default `http://localhost:3000`).

---

## Build for Production

```bash
npm run build
npm run preview
```

- Local and desktop builds default to a relative base path (`./`), so the `dist/` folder works from a plain local folder or static server.
- For GitHub Pages under `/python-datatype/`, set `BASE_PATH=/python-datatype/` when building (handled automatically by the GitHub Actions workflow).

---

## GitHub Pages Deployment

1. Open your GitHub repository (`nwanesi-ebube/python-datatype`).
2. Go to **Settings > Pages**.
3. Under **Build and deployment > Source**, choose **GitHub Actions**.
4. Push to the `main` branch (or run **Actions > Deploy to GitHub Pages > Run workflow** manually).

The workflow in `.github/workflows/deploy.yml` installs dependencies cleanly for Linux (`npm install`), builds with `BASE_PATH=/python-datatype/`, and deploys `./dist` to `https://nwanesi-ebube.github.io/python-datatype/`.

---

## Install as an App & Use Offline

- **Laptop (Chrome / Edge)**: Click the **Install App** button in the app toolbar (or the install icon in the browser address bar).
- **Android (Chrome)**: Tap **Install App** in the menu/header or choose **Add to Home screen** from the browser menu.
- **iPhone / iPad (Safari)**: Tap **Install** in the top bar (or Safari's **Share** icon) and choose **Add to Home Screen**.

Once loaded once online, all lessons, code editor, exercises, mini-games, and progress storage (localStorage / IndexedDB) continue working offline. When a new version is published, a **New version ready — Reload** notice appears in the bottom-right corner.

---

## Desktop App (Windows)

Students who prefer a standalone Windows installer (`.exe`) that installs once and works completely offline without opening a web browser can download it from the GitHub Releases page:

**Download Windows installer:** <https://github.com/nwanesi-ebube/python-datatype/releases>

### How to Install on Windows

1. Open the Releases link above and download the `.exe` installer under **Assets** (for example `Python Data Types Lab_1.0.0_x64-setup.exe`).
2. Double-click the downloaded `.exe` file. It installs per-user and **does not require administrator rights**.
3. **Windows SmartScreen notice**: Because the installer is not commercially code-signed, Windows may show *"Windows protected your PC"*. Click **More info**, then click **Run anyway** to continue safely.
4. **Very old Windows 10 PCs**: Windows 11 and modern Windows 10 PCs already include Microsoft WebView2. If a very old Windows 10 computer does not have it yet, the installer automatically downloads Microsoft's WebView2 component once during installation (internet required for that first-time setup only).
5. Once installed, launch **Python Data Types Lab** from the Start Menu or Desktop shortcut and use it 100% offline. Progress, XP, badges, settings, and saved code persist automatically between launches.

### How to Make a New Desktop Release

1. Update `"version"` to the new number (for example `"1.0.1"`) in **both** `package.json` and `src-tauri/tauri.conf.json` (and optionally `src-tauri/Cargo.toml`).
2. Commit and push your changes to `main`.
3. In GitHub, open **Actions > Desktop release > Run workflow** (or push a Git tag starting with `v`, such as `v1.0.1`).
4. Once finished, the new `.exe` installer appears automatically on the **Releases** page.

### How to Uninstall on Windows

Open **Windows Settings > Apps > Installed apps** (or **Add or remove programs**), search for **Python Data Types Lab**, and click **Uninstall**.

---

## Licence

No licence file is included yet. Remember to choose and add a licence in your GitHub repository settings (for example, MIT or Apache-2.0) if you want others to know how they may reuse or share your code.
