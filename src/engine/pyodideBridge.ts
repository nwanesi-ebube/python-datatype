export type EngineMode = 'builtin' | 'loading-pyodide' | 'pyodide-ready' | 'pyodide-error';

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (text: string) => void }) => void;
  setStderr: (opts: { batched: (text: string) => void }) => void;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInstance>;
  }
}

let cachedPyodide: PyodideInstance | null = null;

export async function enableFullPythonMode(): Promise<PyodideInstance> {
  if (cachedPyodide) return cachedPyodide;
  if (typeof window === 'undefined') throw new Error('Browser environment required');

  const indexURL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  if (!window.loadPyodide) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${indexURL}pyodide.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load Full Python runtime while offline.'));
      document.head.appendChild(script);
    });
  }

  if (!window.loadPyodide) {
    throw new Error('Pyodide loader not available');
  }
  cachedPyodide = await window.loadPyodide({ indexURL });
  return cachedPyodide;
}

export async function runWithPyodide(code: string): Promise<{ stdout: string; stderr: string; error?: string }> {
  const pyodide = await enableFullPythonMode();
  let stdout = '';
  let stderr = '';
  pyodide.setStdout({ batched: (t) => { stdout += t + '\n'; } });
  pyodide.setStderr({ batched: (t) => { stderr += t + '\n'; } });
  try {
    await pyodide.runPythonAsync(code);
    return { stdout, stderr };
  } catch (err) {
    return {
      stdout,
      stderr,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
