const { db, fail } = require('../db');
const { requireUser } = require('../auth');
const { id, now } = require('../security');
const S = require('../serializers');

async function createNotification(userId, values = {}) {
  if (!userId) return null;
  const row = {
    id: id('ntf'),
    user_id: userId,
    type: String(values.type || 'system').slice(0, 60),
    title: String(values.title || 'Atualização do Studiorium').trim().slice(0, 140),
    message: String(values.message || '').trim().slice(0, 1200),
    link: String(values.link || '').trim().slice(0, 400),
    created_at: now(),
  };
  const { data, error } = await db().from('notifications').insert(row).select('*').single();
  fail(error);
  return S.notification(data);
}

async function listNotifications(req) {
  const user = await requireUser(req);
  const { data, error } = await db()
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(40);
  fail(error);
  const notifications = data.map(S.notification);
  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.readAt).length,
  };
}

async function markRead(req, notificationId) {
  const user = await requireUser(req);
  const { data, error } = await db()
    .from('notifications')
    .update({ read_at: now() })
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle();
  fail(error);
  if (!data) throw Object.assign(new Error('Notificação não encontrada.'), { statusCode: 404 });
  return { notification: S.notification(data) };
}

async function markAllRead(req) {
  const user = await requireUser(req);
  const { error } = await db()
    .from('notifications')
    .update({ read_at: now() })
    .eq('user_id', user.id)
    .is('read_at', null);
  fail(error);
  return { ok: true, unreadCount: 0 };
}

module.exports = { createNotification, listNotifications, markRead, markAllRead };
