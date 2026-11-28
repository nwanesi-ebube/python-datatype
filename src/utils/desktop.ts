export function isTauriDesktop(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
}

export async function openExternalUrl(url: string): Promise<void> {
  if (isTauriDesktop()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function saveTextFile(options: {
  filename: string;
  content: string;
  mimeType: string;
  filterName: string;
  extensions: string[];
}): Promise<boolean> {
  if (isTauriDesktop()) {
    const [{ save }, { writeTextFile }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs'),
    ]);
    const targetPath = await save({
      defaultPath: options.filename,
      filters: [{ name: options.filterName, extensions: options.extensions }],
    });
    if (!targetPath) return false;
    await writeTextFile(targetPath, options.content);
    return true;
  }

  const blob = new Blob([options.content], { type: options.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
