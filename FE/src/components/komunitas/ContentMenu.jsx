import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Flag, Trash2 } from 'lucide-react';

/** Menu "…" untuk konten komunitas: Hapus (milik sendiri) atau Laporkan (milik orang lain). */
export default function ContentMenu({ isMine, onDelete, onReport, size = 18 }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="content-menu" ref={ref}>
      <button
        type="button"
        className="more-options-btn"
        title="Opsi"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={size} />
      </button>

      {open && (
        <div className="content-menu-popover" role="menu">
          {isMine ? (
            confirmDelete ? (
              <div className="content-menu-confirm">
                <span>Hapus tulisan ini?</span>
                <div>
                  <button
                    type="button"
                    className="content-menu-danger"
                    onClick={() => {
                      setOpen(false);
                      setConfirmDelete(false);
                      onDelete();
                    }}
                  >
                    Hapus
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)}>
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" role="menuitem" className="content-menu-item danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} /> Hapus tulisanku
              </button>
            )
          ) : (
            <button
              type="button"
              role="menuitem"
              className="content-menu-item"
              onClick={() => {
                setOpen(false);
                onReport();
              }}
            >
              <Flag size={14} /> Laporkan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
