import { UserProgress } from '../types/lab';
import { saveTextFile } from './desktop';

const DB_NAME = 'python_data_types_lab_db';
const STORE_NAME = 'progress';
const RECORD_KEY = 'learner_state_v1';
const LS_FALLBACK_KEY = 'pdtl_learner_state_v1';

export const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  completedLessons: [],
  exploredConcepts: [],
  badges: [],
  savedCode: {},
  gameHighScores: {},
  settings: {
    theme: 'light',
    textSize: 'M',
    density: 'comfortable',
    speed: 1,
    reduceMotion: false,
    readAloud: false,
    teachingMode: false,
  },
  panelState: {
    leftOpen: true,
    rightOpen: true,
    bottomOpen: true,
    bottomHeight: 175,
    focusMode: false,
  },
};

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function loadProgressSync(): UserProgress {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return mergeProgress(parsed);
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function loadProgressAsync(): Promise<UserProgress> {
  const db = await openDb();
  if (!db) return loadProgressSync();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(RECORD_KEY);
      req.onsuccess = () => {
        if (req.result) {
          resolve(mergeProgress(req.result as Partial<UserProgress>));
        } else {
          resolve(loadProgressSync());
        }
      };
      req.onerror = () => resolve(loadProgressSync());
    } catch {
      resolve(loadProgressSync());
    }
  });
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(progress));
  } catch {
    // Ignore quota errors
  }
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(progress, RECORD_KEY);
  } catch {
    // Ignore IDB errors
  }
}

function mergeProgress(partial: Partial<UserProgress>): UserProgress {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = partial.lastActiveDate || today;
  let streakDays = partial.streakDays ?? 1;
  if (lastDate !== today) {
    const diffMs = new Date(today).getTime() - new Date(lastDate).getTime();
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays === 1) streakDays += 1;
    else if (diffDays > 1) streakDays = 1;
  }

  return {
    ...DEFAULT_PROGRESS,
    ...partial,
    streakDays,
    lastActiveDate: today,
    settings: {
      ...DEFAULT_PROGRESS.settings,
      ...(partial.settings ?? {}),
    },
    panelState: {
      ...DEFAULT_PROGRESS.panelState,
      ...(partial.panelState ?? {}),
    },
    completedLessons: Array.isArray(partial.completedLessons) ? partial.completedLessons : [],
    exploredConcepts: Array.isArray(partial.exploredConcepts) ? partial.exploredConcepts : [],
    badges: Array.isArray(partial.badges) ? partial.badges : [],
    savedCode: partial.savedCode ?? {},
    gameHighScores: partial.gameHighScores ?? {},
  };
}

export function exportProgressJSON(progress: UserProgress): void {
  const payload = {
    app: 'Python Data Types Lab',
    exportedAt: new Date().toISOString(),
    version: 1,
    progress,
  };
  void saveTextFile({
    filename: `python-lab-progress-${new Date().toISOString().slice(0, 10)}.json`,
    content: JSON.stringify(payload, null, 2),
    mimeType: 'application/json',
    filterName: 'JSON Files',
    extensions: ['json'],
  });
}

export async function parseImportedProgress(file: File): Promise<UserProgress | null> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as { progress?: Partial<UserProgress> } & Partial<UserProgress>;
    const data = parsed.progress ? parsed.progress : parsed;
    if (typeof data !== 'object' || data === null) return null;
    return mergeProgress(data);
  } catch {
    return null;
  }
}
