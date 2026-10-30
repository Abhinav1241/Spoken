import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Public, read-only counts for the homepage. Nothing personal leaves this function.
const list = (r) => (Array.isArray(r) ? r : r?.items || []);

export default async function (req) {
  try {
    const sr = createClientFromRequest(req).asServiceRole;
    const biz = list(await sr.entities.Business.filter({}, '-created_date', 1000));
    const leads = list(await sr.entities.Lead.filter({}, '-created_date', 1000));
    const shops = biz.filter((b) => (b.source === 'web' || b.source === 'whatsapp') && !String(b.slug || '').startsWith('qa-')).length;
    const messages = leads.filter((l) => l.business_slug !== 'rosa-demo' && l.business_slug !== 'builder-request').length;
    return Response.json({ ok: true, shops, messages });
  } catch (error) {
    return Response.json({ ok: false }, { status: 500 });
  }
}
