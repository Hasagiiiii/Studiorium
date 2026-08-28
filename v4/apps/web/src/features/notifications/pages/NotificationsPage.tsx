import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Notification } from '@lorion/contracts';
import { services } from '../../../app/services/services.js';
import { useAppState } from '../../../app/state/useAppState.js';
import { SkeletonBlock } from '../../../components/feedback/skeleton/Skeleton.js';

type PageStatus = 'idle' | 'loading' | 'ready' | 'error';

function notificationDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function NotificationsSkeleton() {
  return (
    <div className="notifications-skeleton" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <article className="notification-skeleton-card" key={index}>
          <SkeletonBlock className="notification-skeleton-marker" />
          <div>
            <SkeletonBlock className="skeleton-kicker" />
            <SkeletonBlock className="skeleton-title" />
            <SkeletonBlock className="skeleton-line short" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const { data } = useAppState();
  const [status, setStatus] = useState<PageStatus>('idle');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!data?.user) return;
    setStatus('loading');
    setError('');
    try {
      const result = await services.notifications.list();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setStatus('ready');
    } catch (cause) {
      setStatus('error');
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível carregar as notificações.',
      );
    }
  }, [data?.user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data?.user) {
    return (
      <main className="notifications-page notifications-guest">
        <span className="eyebrow">Notificações</span>
        <h1>Entre para acompanhar sua atividade</h1>
        <p>As notificações são privadas e ficam vinculadas à sua conta.</p>
        <Link className="button primary" to="/entrar">
          Entrar
        </Link>
      </main>
    );
  }

  async function markRead(item: Notification) {
    if (item.readAt || updatingId) return;
    setUpdatingId(item.id);
    try {
      await services.notifications.markRead(item.id);
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, readAt } : entry)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível atualizar a notificação.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function markAllRead() {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    try {
      await services.notifications.markAllRead();
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((entry) => ({ ...entry, readAt: entry.readAt || readAt })),
      );
      setUnreadCount(0);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível atualizar as notificações.',
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <main className="notifications-page" aria-busy={status === 'loading'}>
      <header className="notifications-heading">
        <div>
          <span className="eyebrow">Sua atividade</span>
          <h1>Notificações</h1>
          <p>Acompanhe respostas, conexões e atualizações relevantes sem perder o contexto.</p>
        </div>
        <div className="notifications-summary" aria-label={`${unreadCount} notificações não lidas`}>
          <strong>{unreadCount}</strong>
          <span>não lidas</span>
        </div>
      </header>

      <section className="notifications-panel" aria-live="polite">
        <header className="notifications-toolbar">
          <div>
            <strong>Atividade recente</strong>
            <span>{notifications.length} no total</span>
          </div>
          {unreadCount ? (
            <button
              className="button secondary"
              type="button"
              disabled={markingAll}
              onClick={() => void markAllRead()}
            >
              {markingAll ? 'Atualizando…' : 'Marcar todas como lidas'}
            </button>
          ) : null}
        </header>

        {error && status !== 'loading' ? (
          <div className="notifications-feedback" role="alert">
            <div>
              <strong>Algo não saiu como esperado.</strong>
              <p>{error}</p>
            </div>
            {status === 'error' ? (
              <button className="button secondary" type="button" onClick={() => void load()}>
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}

        {status === 'loading' ? <NotificationsSkeleton /> : null}

        {status === 'ready' && notifications.length ? (
          <div className="notification-list">
            {notifications.map((item) => {
              const unread = !item.readAt;
              return (
                <article key={item.id} className={`notification-item${unread ? ' unread' : ''}`}>
                  <span className="notification-status-marker" aria-hidden="true" />
                  <div className="notification-copy">
                    <div className="notification-meta">
                      <span>{item.type}</span>
                      {item.createdAt ? (
                        <time dateTime={item.createdAt}>{notificationDate(item.createdAt)}</time>
                      ) : null}
                      {unread ? <strong>Não lida</strong> : null}
                    </div>
                    <h2>{item.title}</h2>
                    {item.message ? <p>{item.message}</p> : null}
                  </div>
                  <div className="notification-actions">
                    {item.link ? (
                      <Link
                        className="button secondary"
                        to={item.link}
                        onClick={() => void markRead(item)}
                      >
                        Abrir
                      </Link>
                    ) : unread ? (
                      <button
                        className="button secondary"
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => void markRead(item)}
                      >
                        {updatingId === item.id ? 'Atualizando…' : 'Marcar como lida'}
                      </button>
                    ) : (
                      <span className="notification-read-label">Lida</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {status === 'ready' && !notifications.length ? (
          <div className="notifications-empty">
            <span aria-hidden="true">✓</span>
            <div>
              <h2>Tudo em dia por aqui</h2>
              <p>
                Quando alguém interagir com você ou surgir uma atualização importante, ela aparecerá
                aqui.
              </p>
            </div>
            <Link className="button secondary" to="/">
              Voltar ao feed
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
