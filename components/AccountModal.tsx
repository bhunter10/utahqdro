"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AccountClient } from "@/components/AccountClient";

export function AccountModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <dialog ref={dialog} className="account-dialog" aria-labelledby="account-modal-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="account-dialog-inner">
        <button className="modal-close-button account-dialog-close" type="button" onClick={onClose} aria-label="Close account form">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        <AccountClient mode="sign-in" onSuccess={onClose} />
      </div>
    </dialog>,
    document.body
  );
}
