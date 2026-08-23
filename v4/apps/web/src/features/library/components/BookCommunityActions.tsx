import { useEffect, useState, type FormEvent } from 'react';
import type { BookDetail, BookShelfStatus } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

type Props = {
  detail: BookDetail;
  onChanged(): Promise<void> | void;
};

const STATUS_LABELS: Array<{ value: BookShelfStatus; label: string }> = [
  { value: 'want_to_read', label: 'Quero ler' },
  { value: 'reading', label: 'Lendo' },
  { value: 'read', label: 'Lido' },
  { value: 'abandoned', label: 'Abandonado' },
];

export function BookCommunityActions({ detail, onChanged }: Props) {
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const [shelfStatus, setShelfStatus] = useState<BookShelfStatus>(detail.viewerShelfStatus || 'want_to_read');
  const [rating, setRating] = useState(detail.viewerReview?.rating || 5);
  const [review, setReview] = useState(detail.viewerReview?.review || '');
  const [recommend, setRecommend] = useState(detail.viewerReview?.recommend ?? true);
  const [savingShelf, setSavingShelf] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    setShelfStatus(detail.viewerShelfStatus || 'want_to_read');
    setRating(detail.viewerReview?.rating || 5);
    setReview(detail.viewerReview?.review || '');
    setRecommend(detail.viewerReview?.recommend ?? true);
  }, [detail]);

  if (!data?.user) return <p className="create-launcher-note">Entre para organizar sua estante e publicar uma review.</p>;

  async function saveShelf() {
    if (savingShelf) return;
    setSavingShelf(true);
    try {
      await services.library.save(detail.book.id, { shelfStatus });
      await Promise.all([onChanged(), reload()]);
      pushToast({ message: 'Estante atualizada.', tone: 'success' });
    } catch (cause) {
      pushToast({ message: cause instanceof Error ? cause.message : 'Não foi possível atualizar a estante.', tone: 'error' });
    } finally {
      setSavingShelf(false);
    }
  }

  async function removeShelf() {
    if (savingShelf) return;
    setSavingShelf(true);
    try {
      await services.library.remove(detail.book.id);
      await Promise.all([onChanged(), reload()]);
      pushToast({ message: 'Livro removido da sua estante.', tone: 'success' });
    } catch (cause) {
      pushToast({ message: cause instanceof Error ? cause.message : 'Não foi possível remover o livro.', tone: 'error' });
    } finally {
      setSavingShelf(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingReview) return;
    setSavingReview(true);
    try {
      await services.library.review(detail.book.id, { rating, review, recommend });
      await Promise.all([onChanged(), reload()]);
      pushToast({ message: detail.viewerReview ? 'Review atualizada.' : 'Review publicada.', tone: 'success' });
    } catch (cause) {
      pushToast({ message: cause instanceof Error ? cause.message : 'Não foi possível salvar a review.', tone: 'error' });
    } finally {
      setSavingReview(false);
    }
  }

  return (
    <section className="book-community-actions" aria-labelledby="book-actions-title">
      <h2 id="book-actions-title">Sua leitura</h2>
      <div className="book-shelf-controls">
        <label>
          Estante
          <select value={shelfStatus} onChange={(event) => setShelfStatus(event.target.value as BookShelfStatus)}>
            {STATUS_LABELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <div className="form-actions">
          <button className="button primary" type="button" disabled={savingShelf} onClick={() => void saveShelf()}>
            {savingShelf ? 'Salvando…' : detail.viewerShelfStatus ? 'Atualizar estante' : 'Adicionar à estante'}
          </button>
          {detail.viewerShelfStatus ? (
            <button className="button secondary" type="button" disabled={savingShelf} onClick={() => void removeShelf()}>
              Remover da estante
            </button>
          ) : null}
        </div>
      </div>

      <form className="auth-form book-review-form" onSubmit={submitReview}>
        <h3>{detail.viewerReview ? 'Editar sua review' : 'Publicar uma review'}</h3>
        <label>
          Nota
          <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}
          </select>
        </label>
        <label>
          Review
          <textarea required minLength={10} maxLength={2400} rows={6} value={review} onChange={(event) => setReview(event.target.value)} />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={recommend} onChange={(event) => setRecommend(event.target.checked)} />
          Recomendo esta obra
        </label>
        <button className="button primary" type="submit" disabled={savingReview}>
          {savingReview ? 'Salvando…' : detail.viewerReview ? 'Atualizar review' : 'Publicar review'}
        </button>
      </form>
    </section>
  );
}
