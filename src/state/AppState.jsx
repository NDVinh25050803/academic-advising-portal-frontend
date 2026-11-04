// In-memory app state. Nothing is written to localStorage, cookies or the server
// beyond the request itself (Team & Project Plan: APP 3 & 6, in-memory sessions).
import { createContext, useContext, useMemo, useState } from 'react';

const Ctx = createContext(null);

export function AppStateProvider({ children }) {
  const [major, setMajor] = useState('artificial-intelligence');
  const [completed, setCompleted] = useState(() => new Set(['COS10009', 'COS10004', 'MAT10004', 'COS20015']));
  const [messages, setMessages] = useState([]); // chat thread for this session only

  const value = useMemo(
    () => ({
      major,
      setMajor,
      completed,
      toggleUnit: (code) =>
        setCompleted((prev) => {
          const next = new Set(prev);
          next.has(code) ? next.delete(code) : next.add(code);
          return next;
        }),
      clearUnits: () => setCompleted(new Set()),
      messages,
      setMessages,
    }),
    [major, completed, messages]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAppState = () => useContext(Ctx);
