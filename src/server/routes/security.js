const { db, fail } = require('../db');
const { requireAdmin } = require('../auth');

async function recentEvents(req) {
  await requireAdmin(req);
  const { data, error } = await db()
    .from('security_events')
    .select('id,event,user_id,email_hash,ip_hash,details,created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  fail(error);
  return {
    events: (data || []).map((row) => ({
      id: row.id,
      event: row.event,
      userId: row.user_id,
      emailHash: row.email_hash,
      ipHash: row.ip_hash,
      details: row.details || {},
      createdAt: row.created_at,
    })),
  };
}

module.exports = { recentEvents };
