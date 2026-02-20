import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, type = "default" }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`modal-box modal-${type}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <h3 id="modal-title" className="modal-title">
            {title}
          </h3>
        )}
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
