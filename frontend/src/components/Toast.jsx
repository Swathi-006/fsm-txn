import { createContext, useCallback, useContext, useState } from 'react';
const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'info') => {
    const id = Math.random();
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((i) => i.id !== id)), 4500);
  }, []);
  return <Ctx.Provider value={push}>{children}<div className="toasts" role="status">{items.map((i) => <div key={i.id} className={`toast ${i.type}`}>{i.message}</div>)}</div></Ctx.Provider>;
}
