const { db } = require('./db');
const { now } = require('./security');

async function audit(admin, action, targetType = 'system', targetId = '', details = {}) {
  const { error } = await db()
    .from('admin_audit_log')
    .insert({
      admin_id: admin.id,
      action: String(action).slice(0, 100),
      target_type: String(targetType).slice(0, 80),
      target_id: String(targetId || '').slice(0, 160),
      details,
      created_at: now(),
    });

  if (error) console.error('[Studiorium audit]', error.message || error);
}

module.exports = { audit };
