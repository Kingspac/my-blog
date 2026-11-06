import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import styles from "./styles/Modal.module.css";

const ModalContext = createContext(null);

const ICONS = { info: "ℹ️", success: "✅", error: "❌", warning: "⚠️", confirm: "❓", prompt: "✏️" };
const TITLES = {
  info: "Notice",
  success: "Success",
  error: "Something went wrong",
  warning: "Warning",
  confirm: "Are you sure?",
  prompt: "Enter details",
};

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const pendingRef = useRef(null);

  const open = useCallback((config) => {
    return new Promise((resolve) => {
      // If another modal is still open, dismiss it first
      if (pendingRef.current) {
        pendingRef.current.resolve(pendingRef.current.dismissValue);
      }
      pendingRef.current = {
        resolve,
        dismissValue: config.type === "prompt" ? null : false,
      };
      setInputValue(config.defaultValue || "");
      setModal(config);
    });
  }, []);

  // close() with no argument = dismissed (false, or null for prompts)
  const close = useCallback((result) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setModal(null);
    if (pending) {
      pending.resolve(result === undefined ? pending.dismissValue : result);
    }
  }, []);

  const showAlert = useCallback((message, options = {}) => open({ type: "info", message, ...options }), [open]);
  const showSuccess = useCallback((message, options = {}) => open({ type: "success", message, ...options }), [open]);
  const showError = useCallback((message, options = {}) => open({ type: "error", message, ...options }), [open]);
  const showWarning = useCallback((message, options = {}) => open({ type: "warning", message, ...options }), [open]);
  const showConfirm = useCallback(
    (message, options = {}) => open({ type: "confirm", message, showCancel: true, ...options }),
    [open]
  );
  // Resolves to the typed text, or null if cancelled
  const showPrompt = useCallback(
    (message, options = {}) => open({ type: "prompt", message, showCancel: true, ...options }),
    [open]
  );

  // For guests: explains they must log in, and sends them to the login page if they agree
  const showLoginRequired = useCallback(
    async (message, options = {}) => {
      const ok = await open({
        type: "confirm",
        icon: "🔒",
        title: "Login required",
        message: `${message}\n\nNew here? Tap Login, then choose "Create one" to register.`,
        showCancel: true,
        confirmText: "Login",
        cancelText: "Not now",
        ...options,
      });
      if (ok) window.location.assign("/login");
      return ok;
    },
    [open]
  );

  // Escape key = cancel
  useEffect(() => {
    if (!modal) return;
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, close]);

  const value = useMemo(
    () => ({ showAlert, showSuccess, showError, showWarning, showConfirm, showPrompt, showLoginRequired }),
    [showAlert, showSuccess, showError, showWarning, showConfirm, showPrompt, showLoginRequired]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}

      {modal && (
        <div className={styles.overlay} onClick={() => close()}>
          <div
            className={`${styles.modal} ${styles[modal.type] || ""}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.icon}>{modal.icon || ICONS[modal.type]}</div>
            <h3 className={styles.title}>{modal.title || TITLES[modal.type]}</h3>
            <p className={styles.message}>{modal.message}</p>

            {modal.type === "prompt" && (
              <input
                className={styles.promptInput}
                type="text"
                value={inputValue}
                placeholder={modal.placeholder || ""}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") close(inputValue);
                }}
                autoFocus
              />
            )}

            <div className={styles.actions}>
              {modal.showCancel && (
                <button className={styles.cancelBtn} onClick={() => close()}>
                  {modal.cancelText || "Cancel"}
                </button>
              )}
              <button
                className={`${styles.confirmBtn} ${modal.danger ? styles.danger : ""}`}
                onClick={() => close(modal.type === "prompt" ? inputValue : true)}
                autoFocus={modal.type !== "prompt"}
              >
                {modal.confirmText || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside <ModalProvider>");
  return ctx;
}
