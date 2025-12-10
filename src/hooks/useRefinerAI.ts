import { useCallback } from 'react';

// Custom event for triggering the Refiner AI panel
export const REFINER_AI_OPEN_EVENT = 'refiner-ai-open';

export interface RefinerAIOpenPayload {
  prompt?: string;
}

export function useRefinerAI() {
  const openWithPrompt = useCallback((prompt: string) => {
    const event = new CustomEvent<RefinerAIOpenPayload>(REFINER_AI_OPEN_EVENT, {
      detail: { prompt },
    });
    window.dispatchEvent(event);
  }, []);

  const open = useCallback(() => {
    const event = new CustomEvent<RefinerAIOpenPayload>(REFINER_AI_OPEN_EVENT, {
      detail: {},
    });
    window.dispatchEvent(event);
  }, []);

  return { openWithPrompt, open };
}
