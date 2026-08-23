import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';

type CreateLauncherProps = {
  open: boolean;
  onClose(): void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CreateLauncher({ open, onClose }: CreateLauncherProps) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 880px)');
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => !element.hasAttribute('disabled'),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="create-launcher-layer"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
          onMouseDown={onClose}
        >
          <motion.section
            ref={dialogRef}
            className="create-launcher"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-launcher-title"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 56, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 42, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.8 }}
            drag={!reduceMotion && compact ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 700) onClose();
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {compact ? <div className="sheet-handle" aria-hidden="true" /> : null}
            <header>
              <div>
                <span className="eyebrow">Criar</span>
                <h2 id="create-launcher-title">Comece algo novo</h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="icon-button"
                onClick={onClose}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className="create-launcher-grid">
              <Link to="/projetos?criar=1" onClick={onClose} className="create-launcher-action">
                <strong>Projeto</strong>
                <span>Crie um projeto no seu workspace e escolha se ele será privado ou público.</span>
              </Link>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
