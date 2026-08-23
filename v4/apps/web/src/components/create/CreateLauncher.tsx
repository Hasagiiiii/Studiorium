import { useEffect, useRef, useState } from 'react';
import { uploadToSignedMediaUrl } from '@lorion/api-client';
import type { PostKind } from '@lorion/contracts';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { services } from '../../app/services/services.js';
import { useAppState } from '../../app/state/useAppState.js';
import { useToast } from '../feedback/toasts/ToastProvider.js';

type CreateLauncherProps = {
  open: boolean;
  onClose(): void;
};

type ComposerKind = Exclude<PostKind, 'video'> | 'video' | null;

type MediaMeta = {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

function kindLabel(kind: ComposerKind) {
  if (kind === 'text') return 'Texto';
  if (kind === 'photo') return 'Foto';
  if (kind === 'photo_text') return 'Foto + texto';
  if (kind === 'video') return 'Vídeo curto';
  return 'Criar';
}

function fileError(file: File, kind: ComposerKind): string | null {
  if (kind === 'photo' || kind === 'photo_text') {
    if (!IMAGE_TYPES.has(file.type)) return 'Use JPG, PNG, WebP ou AVIF.';
    if (file.size > MAX_IMAGE_BYTES) return 'A imagem deve ter no máximo 12 MB.';
  }
  if (kind === 'video') {
    if (!VIDEO_TYPES.has(file.type)) return 'Use vídeo MP4 ou WebM.';
    if (file.size > MAX_VIDEO_BYTES) return 'O vídeo deve ter no máximo 80 MB.';
  }
  return null;
}

async function inspectMedia(file: File, kind: ComposerKind): Promise<MediaMeta> {
  if (kind === 'photo' || kind === 'photo_text') {
    const url = URL.createObjectURL(file);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        image.src = url;
      });
      if (!dimensions.width || !dimensions.height) throw new Error('A imagem não possui dimensões válidas.');
      return { durationSeconds: null, width: dimensions.width, height: dimensions.height };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (kind === 'video') {
    const url = URL.createObjectURL(file);
    try {
      const duration = await new Promise<number>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () => reject(new Error('Não foi possível ler o vídeo.'));
        video.src = url;
      });
      if (!Number.isFinite(duration) || duration <= 0 || duration > 60) {
        throw new Error('O vídeo deve ter no máximo 60 segundos.');
      }
      return { durationSeconds: duration, width: null, height: null };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return { durationSeconds: null, width: null, height: null };
}

export function CreateLauncher({ open, onClose }: CreateLauncherProps) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data } = useAppState();
  const { pushToast } = useToast();
  const [compact, setCompact] = useState(false);
  const [kind, setKind] = useState<ComposerKind>(null);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 880px)');
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (open) return;
    setKind(null);
    setBody('');
    setFile(null);
    setError(null);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
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
  }, [open, onClose, submitting]);

  function chooseKind(nextKind: Exclude<ComposerKind, null>) {
    setKind(nextKind);
    setError(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (nextKind === 'photo') setBody('');
  }

  async function publish() {
    if (!kind || submitting) return;
    if (!data?.user) {
      setError('Entre na sua conta para publicar.');
      return;
    }
    const trimmedBody = body.trim();
    if ((kind === 'text' || kind === 'photo_text') && !trimmedBody) {
      setError(kind === 'text' ? 'Escreva algo antes de publicar.' : 'Adicione um texto à foto.');
      return;
    }
    const needsFile = kind !== 'text';
    if (needsFile && !file) {
      setError(kind === 'video' ? 'Escolha um vídeo.' : 'Escolha uma imagem.');
      return;
    }

    setSubmitting(true);
    setError(null);
    let reservedId: string | null = null;
    try {
      let mediaId: string | null = null;
      if (file) {
        const basicError = fileError(file, kind);
        if (basicError) throw new Error(basicError);
        const meta = await inspectMedia(file, kind);
        const mediaKind = kind === 'video' ? 'video' : 'image';
        const reservation = await services.social.reserveMedia({
          kind: mediaKind,
          mimeType: file.type,
          sizeBytes: file.size,
          durationSeconds: meta.durationSeconds,
        });
        reservedId = reservation.mediaId;
        await uploadToSignedMediaUrl(reservation.signedUrl, file);
        await services.social.finalizeMedia({
          mediaId: reservation.mediaId,
          durationSeconds: meta.durationSeconds,
          width: meta.width,
          height: meta.height,
        });
        mediaId = reservation.mediaId;
      }

      await services.social.createPost({
        kind,
        body: kind === 'photo' ? null : trimmedBody || null,
        mediaId,
      });
      reservedId = null;
      pushToast({ message: 'Publicação enviada.', tone: 'success' });
      window.dispatchEvent(new Event('lorion:feed-refresh'));
      window.dispatchEvent(new Event('lorion:profile-posts-refresh'));
      onClose();
    } catch (cause) {
      if (reservedId) {
        await services.social.discardMedia(reservedId).catch(() => undefined);
      }
      const message = cause instanceof Error ? cause.message : 'Não foi possível publicar.';
      setError(message);
      pushToast({ message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const needsFile = kind === 'photo' || kind === 'photo_text' || kind === 'video';

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
          onMouseDown={() => { if (!submitting) onClose(); }}
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
            drag={!reduceMotion && compact && !submitting ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (!submitting && (info.offset.y > 110 || info.velocity.y > 700)) onClose();
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {compact ? <div className="sheet-handle" aria-hidden="true" /> : null}
            <header>
              <div>
                <span className="eyebrow">Criar</span>
                <h2 id="create-launcher-title">{kind ? kindLabel(kind) : 'Comece algo novo'}</h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="icon-button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            {!data?.user ? (
              <div className="inline-feedback">
                <p>Entre na sua conta para publicar ou criar projetos no seu workspace.</p>
                <Link className="button primary" to="/entrar" onClick={onClose}>Entrar</Link>
              </div>
            ) : null}

            {!kind ? (
              <div className="create-launcher-grid">
                <button type="button" className="create-launcher-action" onClick={() => chooseKind('text')}>
                  <strong>Texto</strong><span>Publique uma ideia, atualização ou reflexão.</span>
                </button>
                <button type="button" className="create-launcher-action" onClick={() => chooseKind('photo')}>
                  <strong>Foto</strong><span>Compartilhe uma imagem sem legenda.</span>
                </button>
                <button type="button" className="create-launcher-action" onClick={() => chooseKind('photo_text')}>
                  <strong>Foto + texto</strong><span>Combine imagem e contexto em uma publicação.</span>
                </button>
                <Link to="/projetos?criar=1" onClick={onClose} className="create-launcher-action">
                  <strong>Projeto</strong><span>Crie no workspace pessoal e escolha a visibilidade.</span>
                </Link>
                <button type="button" className="create-launcher-action" onClick={() => chooseKind('video')}>
                  <strong>Vídeo curto</strong><span>MP4 ou WebM, com até 60 segundos.</span>
                </button>
              </div>
            ) : (
              <div className="composer-form">
                <button type="button" className="composer-back" onClick={() => chooseKind('text')} disabled={submitting}>
                  ← Trocar tipo
                </button>

                {kind !== 'photo' ? (
                  <label className="composer-field">
                    <span>{kind === 'video' ? 'Texto opcional' : 'Texto'}</span>
                    <textarea
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      maxLength={5000}
                      rows={5}
                      placeholder={kind === 'photo_text' ? 'Conte o contexto desta foto…' : 'O que você quer compartilhar?'}
                      disabled={submitting}
                    />
                    <small>{body.length}/5000</small>
                  </label>
                ) : null}

                {needsFile ? (
                  <label className="composer-field">
                    <span>{kind === 'video' ? 'Vídeo' : 'Imagem'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={kind === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/avif'}
                      disabled={submitting}
                      onChange={(event) => {
                        const next = event.currentTarget.files?.[0] || null;
                        setFile(next);
                        setError(next ? fileError(next, kind) : null);
                      }}
                    />
                    <small>
                      {kind === 'video' ? 'Até 60 s e 80 MB. Qualidade original preservada.' : 'JPG, PNG, WebP ou AVIF, até 12 MB.'}
                    </small>
                    {file ? <span className="composer-file-name">{file.name}</span> : null}
                  </label>
                ) : null}

                {error ? <p className="inline-error" role="alert">{error}</p> : null}

                <div className="composer-actions">
                  <button type="button" className="button secondary" onClick={() => setKind(null)} disabled={submitting}>
                    Cancelar
                  </button>
                  <button type="button" className="button primary" onClick={() => void publish()} disabled={submitting || !data?.user}>
                    {submitting ? 'Publicando…' : 'Publicar'}
                  </button>
                </div>
              </div>
            )}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
