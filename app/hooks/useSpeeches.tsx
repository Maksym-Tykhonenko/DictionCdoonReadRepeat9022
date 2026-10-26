import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { vault, type RehearsalAttempt, type SpeechDraft } from '../storage/vault';
import { makeLocalId } from '../utils/text';

const MAX_ATTEMPTS = 10;

function useSpeechStore() {
  const [speeches, setSpeeches] = useState<SpeechDraft[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    vault.getSpeeches().then(items => {
      if (alive) {
        setSpeeches(items);
        setReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const commit = useCallback((fn: (prev: SpeechDraft[]) => SpeechDraft[]) => {
    setSpeeches(prev => {
      const next = fn(prev);
      void vault.setSpeeches(next);
      return next;
    });
  }, []);

  /** Creates (no id) or updates a speech; returns its id. */
  const saveSpeech = useCallback(
    (draft: Pick<SpeechDraft, 'title' | 'text' | 'lang'> & { id?: string }) => {
      const id = draft.id ?? makeLocalId('speech');
      commit(prev => {
        const existing = prev.find(s => s.id === id);
        const item: SpeechDraft = {
          id,
          title: draft.title,
          text: draft.text,
          lang: draft.lang,
          updatedAt: Date.now(),
          attempts: existing?.attempts ?? [],
        };
        return [item, ...prev.filter(s => s.id !== id)];
      });
      return id;
    },
    [commit],
  );

  const removeSpeech = useCallback(
    (id: string) => commit(prev => prev.filter(s => s.id !== id)),
    [commit],
  );

  const addAttempt = useCallback(
    (id: string, attempt: RehearsalAttempt) =>
      commit(prev =>
        prev.map(s =>
          s.id === id ? { ...s, attempts: [attempt, ...s.attempts].slice(0, MAX_ATTEMPTS) } : s,
        ),
      ),
    [commit],
  );

  return useMemo(
    () => ({ speeches, ready, saveSpeech, removeSpeech, addAttempt }),
    [speeches, ready, saveSpeech, removeSpeech, addAttempt],
  );
}

type SpeechStore = ReturnType<typeof useSpeechStore>;

const SpeechesContext = createContext<SpeechStore | null>(null);

/** Shares the user's speeches between the list, editor and rehearsal screens. */
export function SpeechesProvider({ children }: { children: React.ReactNode }) {
  const store = useSpeechStore();
  return <SpeechesContext.Provider value={store}>{children}</SpeechesContext.Provider>;
}

/** The user's own speeches for the rehearsal mode, persisted locally. */
export function useSpeeches(): SpeechStore {
  const ctx = useContext(SpeechesContext);
  if (!ctx) {
    throw new Error('useSpeeches must be used inside a SpeechesProvider');
  }
  return ctx;
}
