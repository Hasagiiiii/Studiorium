import { siteSettingsSchema, type SiteSettings } from '@lorion/contracts';
import { database } from '../../core/client.js';
import { queryList } from '../../core/query.js';

export async function loadSiteSettings(): Promise<SiteSettings> {
  const result = await database().from('site_settings').select('key,value');
  const rows = queryList(result) as Array<{ key: string; value: unknown }>;
  const raw = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return siteSettingsSchema.parse(raw);
}
