import { useCallback, useEffect } from 'react';

export function useSpeech(enabled: boolean) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis errors
    }
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !supported || !text.trim()) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => v.lang === 'en-NG') ||
          voices.find((v) => v.lang === 'en-GB') ||
          voices.find((v) => v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;
        utterance.rate = 0.96;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore synthesis errors
      }
    },
    [enabled, supported]
  );

  useEffect(() => {
    if (!enabled) stop();
    return () => stop();
  }, [enabled, stop]);

  return { supported, speak, stop };
}
