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

## Licence

No licence file is included yet. Remember to choose and add a licence in your GitHub repository settings (for example, MIT or Apache-2.0) if you want others to know how they may reuse or share your code.
