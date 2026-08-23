import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { useToast } from '../../../components/feedback/toasts/ToastProvider.js';

export function RecommendBookForm() {
  const navigate = useNavigate();
  const { data, reload } = useAppState();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Leituras da comunidade');
  const [isbn, setIsbn] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [recommend, setRecommend] = useState(true);

  if (!data?.user) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const result = await services.library.create({
        title,
        author,
        description,
        category,
        isbn,
        coverUrl,
        purchaseUrl,
        purchaseLabel: '',
        rating,
        review,
        recommend,
      });
      await reload();
      pushToast({ message: 'Livro adicionado à Biblioteca com sua review.', tone: 'success' });
      navigate(`/livros/${encodeURIComponent(result.book.id)}`);
    } catch (cause) {
      pushToast({ message: cause instanceof Error ? cause.message : 'Não foi possível adicionar o livro.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="recommend-book">
      <button className="button primary" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? 'Fechar recomendação' : 'Recomendar um livro'}
      </button>
      {open ? (
        <form className="auth-form recommend-book-form" onSubmit={submit}>
          <h2>Adicionar livro e publicar sua review</h2>
          <label>Título<input required minLength={2} maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>Autor<input required minLength={2} maxLength={160} value={author} onChange={(event) => setAuthor(event.target.value)} /></label>
          <label>Descrição<textarea maxLength={1400} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label>Categoria<input maxLength={80} value={category} onChange={(event) => setCategory(event.target.value)} /></label>
          <label>ISBN (opcional)<input maxLength={32} value={isbn} onChange={(event) => setIsbn(event.target.value)} /></label>
          <label>URL HTTPS da capa (opcional)<input type="url" maxLength={1000} value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} /></label>
          <label>URL HTTPS de compra (opcional)<input type="url" maxLength={1000} value={purchaseUrl} onChange={(event) => setPurchaseUrl(event.target.value)} /></label>
          <label>
            Nota
            <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}
            </select>
          </label>
          <label>Review<textarea required minLength={10} maxLength={2400} rows={6} value={review} onChange={(event) => setReview(event.target.value)} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={recommend} onChange={(event) => setRecommend(event.target.checked)} />Recomendo esta obra</label>
          <p className="create-launcher-note">Se você informar um ISBN e não fornecer capa, o Lorion tentará usar a capa pública do Open Library. O link de compra pode ser gerado para busca da edição.</p>
          <button className="button primary" type="submit" disabled={saving}>{saving ? 'Publicando…' : 'Adicionar à Biblioteca'}</button>
        </form>
      ) : null}
    </section>
  );
}
