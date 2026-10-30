import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// The owner page's one door: checks the site's edit code, then reads or changes only that site.
// Edit codes never leave this function. Wrong codes are counted per site (5 wrong = locked for 15 minutes).

const THEMES = ['editorial', 'bold', 'craft', 'minimal', 'zine'];
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const DEMO_SLUG = 'rosa-demo';
const DEMO_SEED = {
  tagline: 'Baked before sunrise, gone by noon.', hours: 'Mon–Sat, 6:00–14:00', phone_or_contact: '', theme: 'craft',
  services: [{ name: 'Butter croissant', price: '$3.50', description: '' }, { name: 'Sourdough loaf', price: '$7.00', description: '' }, { name: 'Cardamom bun', price: '$3.75', description: '' }],
};
const BAD = 'That code doesn’t open this page.';

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const clip = (v, n) => text(v).slice(0, n).trim();
const list = (r) => (Array.isArray(r) ? r : r?.items || []);
function same(a, b) {
  a = String(a || '');
  b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
const parse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

function pub(b) {
  return {
    slug: b.slug,
    business_name: b.business_name || '',
    tagline: b.tagline || '',
    about: b.about || '',
    services: Array.isArray(b.services) ? b.services : [],
    hours: b.hours || '',
    location: b.location || '',
    phone_or_contact: b.phone_or_contact || '',
    theme: b.theme || 'editorial',
    source: b.source || 'web',
    created_date: b.created_date,
  };
}

const FIELD_OF = {
  add_service: 'services',
  edit_service_price: 'services',
  set_hours: 'hours',
  set_tagline: 'tagline',
  set_theme: 'theme',
  set_contact: 'phone_or_contact',
};
function validAction(a, biz) {
  if (!a || typeof a !== 'object' || FIELD_OF[a.type] !== a.field) return false;
  const v = a.value;
  if (a.type === 'add_service') return v && typeof v.name === 'string' && v.name.trim() && typeof v.price === 'string' && v.name.length <= 80 && v.price.length <= 30;
  if (a.type === 'edit_service_price') return v && (biz.services || []).some((s) => s.name === v.name) && typeof v.price === 'string' && v.price.length <= 30;
  if (a.type === 'set_theme') return THEMES.includes(v);
  return typeof v === 'string' && v.trim().length > 0 && v.length <= 140;
}
function describe(a) {
  const v = a.value;
  switch (a.type) {
    case 'add_service': return `${v.name} added, ${v.price}`;
    case 'edit_service_price': return `${v.name} set to ${v.price}`;
    case 'set_hours': return `Hours set to “${String(v).replace(/\n/g, ', ')}”`;
    case 'set_tagline': return `Tagline set to “${v}”`;
    case 'set_theme': return `Design set to ${v[0].toUpperCase()}${v.slice(1)}`;
    default: return `Contact set to “${v}”`;
  }
}

const SUGGESTED = ['add_service', 'edit_service_price', 'set_hours', 'set_tagline'];
const INSIGHT_SCHEMA = {
  type: 'object',
  required: ['summary', 'insights'],
  properties: {
    summary: { type: 'string' },
    insights: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'text', 'action'],
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          action: {
            type: 'object',
            required: ['type', 'field', 'value'],
            properties: {
              type: { type: 'string', enum: SUGGESTED },
              field: { type: 'string', enum: ['services', 'hours', 'tagline'] },
              value: {},
            },
          },
        },
      },
    },
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const slug = clip(body?.slug, 80).toLowerCase();
    const code = text(body?.code).toUpperCase();
    const action = text(body?.action) || 'open';
    if (!slug || code.length !== 6) return Response.json({ ok: false, message: BAD });

    const found = list(await sr.entities.Business.filter({ slug }));
    const biz = found[0];
    let state = list(await sr.entities.OwnerState.filter({ business_slug: slug }))[0];
    const now = Date.now();
    if (state && state.locked_until > now && slug !== DEMO_SLUG) {
      return Response.json({ ok: false, locked: true, message: 'Editing is paused for this page. Too many wrong codes. Try again in a few minutes.' });
    }
    if (!biz || !biz.edit_code || !same(code, String(biz.edit_code).toUpperCase())) {
      if (biz && slug !== DEMO_SLUG) {
        const fails = (state?.fails || 0) + 1;
        const patch = fails >= MAX_FAILS ? { fails: 0, locked_until: now + LOCK_MS } : { fails };
        if (state) await sr.entities.OwnerState.update(state.id, patch);
        else await sr.entities.OwnerState.create({ business_slug: slug, ...patch });
        if (fails >= MAX_FAILS) return Response.json({ ok: false, locked: true, message: 'Editing is paused for this page. Too many wrong codes. Try again in a few minutes.' });
        return Response.json({ ok: false, message: BAD, tries_left: MAX_FAILS - fails });
      }
      return Response.json({ ok: false, message: BAD });
    }
    if (state && state.fails) await sr.entities.OwnerState.update(state.id, { fails: 0 });
    if (!state) state = await sr.entities.OwnerState.create({ business_slug: slug, fails: 0, locked_until: 0 });

    const loadLeads = async () => list(await sr.entities.Lead.filter({ business_slug: slug }, '-created_date', 60)).map((l) => ({ id: l.id, name: l.name || '', contact: l.contact || '', message: l.message || '', created_date: l.created_date }));
    const loadChanges = async () => list(await sr.entities.ChangeLog.filter({ business_slug: slug }, '-created_date', 30)).map((c) => ({ id: c.id, field: c.field, label: c.label, source: c.source, undone: !!c.undone, created_date: c.created_date, can_undo: c.before != null && c.before !== '' }));
    const cached = () => {
      const j = parse(state.insights);
      return j && j.summary ? j : null;
    };

    if (action === 'open' && slug === DEMO_SLUG) {
      // the public demo always opens fresh, so anything a visitor changes is gone next time
      await sr.entities.Business.update(biz.id, DEMO_SEED);
      Object.assign(biz, DEMO_SEED);
      for (const c of list(await sr.entities.ChangeLog.filter({ business_slug: slug }, '-created_date', 100))) await sr.entities.ChangeLog.delete(c.id);
    }

    if (action === 'open') {
      return Response.json({ ok: true, business: pub(biz), leads: await loadLeads(), changes: await loadChanges(), insights: cached() });
    }

    if (action === 'apply') {
      const a = body?.act;
      if (!validAction(a, biz)) return Response.json({ ok: false, message: 'That change isn’t allowed.' });
      const field = a.field;
      const before = field === 'services' ? biz.services || [] : biz[field] ?? '';
      let value;
      if (a.type === 'add_service') value = [...(biz.services || []), { name: clip(a.value.name, 80), price: clip(a.value.price, 30), description: clip(a.value.description, 120) }];
      else if (a.type === 'edit_service_price') value = (biz.services || []).map((s) => (s.name === a.value.name ? { ...s, price: clip(a.value.price, 30) } : s));
      else value = clip(a.value, 140);
      const updated = await sr.entities.Business.update(biz.id, { [field]: value });
      await sr.entities.ChangeLog.create({
        business_slug: slug, field, label: describe({ ...a, value: a.type === 'add_service' || a.type === 'edit_service_price' ? a.value : value }),
        before: JSON.stringify(before), after: JSON.stringify(value), source: clip(body?.source, 30) || 'owner_page', insight_id: clip(body?.insight_id, 40), undone: false,
      });
      return Response.json({ ok: true, business: pub({ ...biz, ...(updated || {}), [field]: value }), changes: await loadChanges() });
    }

    if (action === 'undo') {
      const latest = list(await sr.entities.ChangeLog.filter({ business_slug: slug }, '-created_date', 10)).find((c) => !c.undone);
      if (!latest || latest.before == null || latest.before === '') return Response.json({ ok: false, message: 'Nothing to undo.' });
      const prev = parse(latest.before);
      await sr.entities.Business.update(biz.id, { [latest.field]: prev });
      await sr.entities.ChangeLog.update(latest.id, { undone: true });
      return Response.json({ ok: true, business: pub({ ...biz, [latest.field]: prev }), changes: await loadChanges(), undone_insight: latest.insight_id || '' });
    }

    if (action === 'insights') {
      const leads = await loadLeads();
      const force = !!body?.force;
      const c = cached();
      // the public demo keeps one fixed, checked summary; it never calls the AI again
      if (c && (slug === DEMO_SLUG || (!force && state.insights_leads === leads.length))) return Response.json({ ok: true, insights: c, leads_count: leads.length });
      if (c && force && now - (state.insights_at || 0) < 45000) return Response.json({ ok: true, insights: c, leads_count: leads.length });
      if (!leads.length) {
        const empty = { summary: 'No messages yet. When someone presses “Message us” on your site, it lands here, and this page will tell you what people are asking for.', insights: [] };
        await sr.entities.OwnerState.update(state.id, { insights: JSON.stringify(empty), insights_leads: 0, insights_at: now });
        return Response.json({ ok: true, insights: empty, leads_count: 0 });
      }
      const facts = `Business: ${biz.business_name}\nTagline: ${biz.tagline || ''}\nAbout: ${biz.about || ''}\nHours: ${biz.hours || ''}\nLocation: ${biz.location || ''}\nServices:\n${(biz.services || []).map((s) => `- ${s.name}: ${s.price}`).join('\n')}\nOriginal voice note transcript: ${clip(biz.transcript, 1200)}`;
      const msgs = leads.slice(0, 30).map((l, i) => `${i + 1}. ${l.name}: ${l.message}`).join('\n');
      const out = await sr.integrations.Core.InvokeLLM({
        prompt: `You help a small business owner. Below are the facts on their website and the messages customers sent through it.\n\n${facts}\n\nCustomer messages:\n${msgs}\n\nWrite: (1) summary: 3 to 4 plain sentences, second person, warm and direct, about what customers asked this week. Use only facts from the messages. Do not invent numbers. (2) insights: up to 3 items, fewer is better than weak ones. Each: id (a short slug), text (one sentence: what customers asked and why it matters, based only on the messages), action: ONE change to the website that directly answers it. Rules for actions. add_service (field services, value {name, price, description}): only when customers asked for something the shop does not list; use the price \"Ask us\" unless the owner already stated a price. edit_service_price (field services, value {name (must be an existing service name), price}): only if a customer message names a new price. set_hours (field hours, value string): only restate the hours already in the facts, for example adding \"Closed Sundays\" when no Sunday hours are listed; never add new open days or times. set_tagline (field tagline, value string up to 100 chars): only by rewording the owner's own words; never add new claims about ingredients, quality or services. Never suggest design changes. If nothing fits, return fewer insights.`,
        response_json_schema: INSIGHT_SCHEMA,
      });
      const known = `${facts}\n${msgs}`;
      const items = (Array.isArray(out?.insights) ? out.insights : [])
        .filter((i) => i && typeof i.text === 'string' && SUGGESTED.includes(i.action?.type) && validAction(i.action, biz))
        .slice(0, 3)
        .map((i, k) => {
          const act = i.action;
          // a suggested price must already appear in the owner's own words; otherwise the owner sets it
          if (act.type === 'add_service' && !known.includes(act.value.price)) act.value = { ...act.value, price: 'Ask us' };
          return { id: clip(i.id, 30) || `i${k}`, text: clip(i.text, 260), action: act };
        });
      const res = { summary: clip(out?.summary, 700) || 'Here is what people asked this week.', insights: items };
      await sr.entities.OwnerState.update(state.id, { insights: JSON.stringify(res), insights_leads: leads.length, insights_at: now });
      return Response.json({ ok: true, insights: res, leads_count: leads.length });
    }

    return Response.json({ ok: false, message: 'Unknown request.' });
  } catch (error) {
    return Response.json({ ok: false, error: error.message, message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
