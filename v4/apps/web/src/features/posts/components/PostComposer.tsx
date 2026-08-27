import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { MAX_POST_MEDIA, MAX_POST_VIDEO_DURATION_SECONDS } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  onCancel?(): void;
  onCreated?(): void;
};

type LocalMedia = {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime';

function imageMeta(
  file: File,
  previewUrl: string,
): Promise<Pick<LocalMedia, 'width' | 'height' | 'durationSeconds'>> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        width: image.naturalWidth || null,
        height: image.naturalHeight || null,
        durationSeconds: null,
      });
    image.onerror = () => reject(new Error('Não foi possível ler esta imagem.'));
    image.src = previewUrl;
  });
}

function videoMeta(
  file: File,
  previewUrl: string,
): Promise<Pick<LocalMedia, 'width' | 'height' | 'durationSeconds'>> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration))
        return reject(new Error('Não foi possível validar a duração do vídeo.'));
      resolve({
        width: video.videoWidth || null,
        height: video.videoHeight || null,
        durationSeconds: video.duration,
      });
    };
    video.onerror = () => reject(new Error('Não foi possível ler este vídeo.'));
    video.src = previewUrl;
  });
}

export function PostComposer({ onCancel, onCreated }: Props) {
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [communitySlug, setCommunitySlug] = useState('');
  const [media, setMedia] = useState<LocalMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [readingMedia, setReadingMedia] = useState(false);
  const [error, setError] = useState('');

  const communities = useMemo(
    () =>
      (data?.communities || []).filter(
        (community) =>
          community.joined &&
          community.membershipStatus === 'active' &&
          community.memberModerationStatus === 'clear',
      ),
    [data?.communities],
  );

  function clearMedia() {
    media.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setMedia([]);
    if (fileInput.current) fileInput.current.value = '';
  }

  function removeMedia(index: number) {
    setMedia((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, position) => position !== index);
    });
  }

  async function chooseMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setError('');

    if (files.length + media.length > MAX_POST_MEDIA) {
      setError(`Você pode adicionar no máximo ${MAX_POST_MEDIA} fotos.`);
      event.target.value = '';
      return;
    }
    if (files.some((file) => file.size > MAX_MEDIA_BYTES)) {
      setError('Cada foto ou vídeo pode ter no máximo 25 MB.');
      event.target.value = '';
      return;
    }

    const incomingHasVideo = files.some((file) => file.type.startsWith('video/'));
    const existingHasVideo = media.some((item) => item.type === 'video');
    if ((incomingHasVideo && (files.length > 1 || media.length)) || existingHasVideo) {
      setError('Publique um vídeo por vez. Para carrossel, selecione somente fotos.');
      event.target.value = '';
      return;
    }

    setReadingMedia(true);
    try {
      const next: LocalMedia[] = [];
      for (const file of files) {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const previewUrl = URL.createObjectURL(file);
        try {
          const meta =
            type === 'video'
              ? await videoMeta(file, previewUrl)
              : await imageMeta(file, previewUrl);
          if (type === 'video' && (meta.durationSeconds || 0) > MAX_POST_VIDEO_DURATION_SECONDS) {
            throw new Error(
              `O vídeo pode ter no máximo ${MAX_POST_VIDEO_DURATION_SECONDS} segundos.`,
            );
          }
          next.push({ file, previewUrl, type, ...meta });
        } catch (cause) {
          URL.revokeObjectURL(previewUrl);
          throw cause;
        }
      }
      setMedia((current) => [...current, ...next]);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível preparar a mídia.';
      setError(message);
      pushToast({ message, tone: 'error' });
    } finally {
      setReadingMedia(false);
      event.target.value = '';
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || readingMedia || (!body.trim() && !media.length)) return;
    setSubmitting(true);
    setError('');
    try {
      const uploaded = [];
      for (const item of media) {
        uploaded.push(
          await services.posts.uploadMedia(item.file, {
            width: item.width,
            height: item.height,
            durationSeconds: item.durationSeconds,
          }),
        );
      }

      await services.posts.create({
        title: title.trim(),
        body: body.trim(),
        communitySlug: communitySlug || null,
        mediaIds: uploaded.map((item) => item.id),
      });
      await reload();
      setTitle('');
      setBody('');
      setCommunitySlug('');
      clearMedia();
      pushToast({ message: 'Publicação criada.', tone: 'success' });
      onCreated?.();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível publicar.';
      setError(message);
      pushToast({ message, tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form post-composer" onSubmit={submit}>
      <div>
        <span className="eyebrow">Publicação</span>
        <h3>Compartilhe uma atualização</h3>
      </div>

      <label>
        Título opcional
        <input
          maxLength={160}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Dê um título curto quando ajudar"
        />
      </label>

      <label>
        Legenda
        <textarea
          maxLength={4000}
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escreva uma legenda ou compartilhe uma ideia…"
        />
        <small>{body.length}/4000</small>
      </label>

      <div className="post-media-picker">
        <input
          ref={fileInput}
          className="post-media-input"
          type="file"
          accept={ACCEPTED}
          multiple
          onChange={(event) => void chooseMedia(event)}
        />
        <button
          className="button secondary"
          type="button"
          disabled={submitting || readingMedia || media.some((item) => item.type === 'video')}
          onClick={() => fileInput.current?.click()}
        >
          {readingMedia ? 'Preparando…' : media.length ? 'Adicionar fotos' : 'Foto ou vídeo'}
        </button>
        <small>Até 10 fotos ou 1 vídeo de até 60 s · 25 MB por arquivo</small>
      </div>

      {media.length ? (
        <div className={`post-media-preview ${media.length > 1 ? 'is-carousel' : ''}`}>
          {media.map((item, index) => (
            <figure key={item.previewUrl} className="post-media-preview-item">
              {item.type === 'video' ? (
                <video src={item.previewUrl} controls playsInline preload="metadata" />
              ) : (
                <img src={item.previewUrl} alt={`Prévia da foto ${index + 1}`} />
              )}
              <button
                type="button"
                aria-label={`Remover mídia ${index + 1}`}
                onClick={() => removeMedia(index)}
              >
                ×
              </button>
            </figure>
          ))}
        </div>
      ) : null}

      <label>
        Comunidade opcional
        <select value={communitySlug} onChange={(event) => setCommunitySlug(event.target.value)}>
          <option value="">Publicar no meu perfil e feed geral</option>
          {communities.map((community) => (
            <option key={community.id} value={community.slug}>
              {community.name}
            </option>
          ))}
        </select>
      </label>

      {communitySlug ? (
        <p className="feed-status">
          A visibilidade será definida pelas regras da comunidade escolhida.
        </p>
      ) : null}
      {error ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        {onCancel ? (
          <button
            className="button secondary"
            type="button"
            disabled={submitting}
            onClick={onCancel}
          >
            Voltar
          </button>
        ) : null}
        <button
          className="button primary"
          type="submit"
          disabled={submitting || readingMedia || (!body.trim() && !media.length)}
        >
          {submitting ? (media.length ? 'Enviando mídia…' : 'Publicando…') : 'Publicar'}
        </button>
      </div>
    </form>
  );
}
