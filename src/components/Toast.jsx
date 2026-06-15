import { useState, useCallback } from "react";
import { IconCheck, IconAlert } from "./Icons";

// Tiny toast hook — returns { toast, showToast, Toast }
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const Toast = () =>
    toast ? (
      <div className={`toast ${toast.type}`}>
        {toast.type === "error" ? <IconAlert size={17} /> : <IconCheck size={17} />}
        {toast.message}
      </div>
    ) : null;

  return { toast, showToast, Toast };
}
