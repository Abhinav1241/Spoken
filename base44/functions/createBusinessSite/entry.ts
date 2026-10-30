import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const REFUSAL = "Couldn't build a site from that, try again.";
const NEEDS_MORE =
  'I need a bit more: say the name of your business, what you do, and at least your prices, hours or where you are.';
const SITE = 'https://groovy-speak-build-grow.base44.app';

const THEMES = ['craft', 'minimal', 'zine', 'bold', 'editorial'];
const LANGS = ['en', 'pt', 'es', 'fr', 'de', 'it', 'nl'];
const ARCHETYPES = ['hearth', 'counter', 'workbench', 'studio', 'desk', 'street'];
const SET_PIECES = ['none', 'bakery', 'records', 'books'];
const MOODS = ['dawn', 'day', 'dusk', 'night'];
const OLD_ICONS = 'loaf croissant cake coffee_cup coffee_beans teapot wine_glass beer pizza noodle_bowl fish wheat book_stack open_book pen tulip bouquet potted_plant leaf sun vinyl guitar headphones bicycle wrench hammer screwdriver gear faucet pipe drop scissors comb mirror nail_polish paw dog bone tattoo_machine paintbrush lotus dumbbell yoga_mat briefcase scales document laptop key camera needle_thread piano music_note car house truck tooth phone_repair taxi candle cheese ice_cream toolbox paint_roller broom teddy bus plane shears mic spray_bottle storefront heart star sparkle clock map_pin chat gift'.split(' ');

let remote = null;
let remoteAt = 0;
async function loadRemote() {
  if (remote && Date.now() - remoteAt < 60000) return remote;
  const t = Math.floor(Date.now() / 60000);
  const get = (f) =>
    fetch(`${SITE}/spoken/${f}?t=${t}`).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${f} ${r.status}`))));
  try {
    const [prompt, ids] = await Promise.all([get('prompt.txt'), get('art-ids.txt')]);
    const list = ids.trim().split(/\s+/).filter(Boolean);
    if (prompt.includes('{{OBJECTS}}') && list.length > 100) {
      remote = { prompt, ids: list, set: new Set([...list, ...OLD_ICONS]) };
      remoteAt = Date.now();
    }
  } catch (e) {
    console.warn('prompt files unavailable', e && e.message);
  }
  return remote;
}

const SCHEMA = {
  type: 'object',
  required: [
    'business_name', 'category', 'language', 'tagline', 'about', 'services',
    'hours', 'location', 'phone_or_contact', 'theme', 'scene_spec',
  ],
  properties: {
    business_name: { type: 'string' },
    category: { type: 'string' },
    language: { type: 'string', enum: [...LANGS, 'other'] },
    tagline: { type: 'string' },
    about: { type: 'string' },
    services: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'price', 'description'],
        properties: {
          name: { type: 'string' },
          price: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    hours: { type: 'string' },
    location: { type: 'string' },
    phone_or_contact: { type: 'string' },
    theme: { type: 'string', enum: THEMES },
    scene_spec: {
      type: 'object',
      required: ['archetype', 'set_piece', 'objects', 'palette', 'mood', 'kicker'],
      properties: {
        archetype: { type: 'string', enum: ARCHETYPES },
        set_piece: { type: 'string', enum: SET_PIECES },
        objects: { type: 'array', items: { type: 'string' } },
        palette: { type: 'array', items: { type: 'string' } },
        mood: { type: 'string', enum: MOODS },
        kicker: { type: 'string' },
      },
    },
  },
};

function text(v) {
  return typeof v === 'string' ? v.trim() : '';
}
function clip(v, n) {
  const s = text(v);
  return s.length > n ? s.slice(0, n).trim() : s;
}
function slugify(v) {
  return text(v)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
function makeEditCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 6; i += 1) code += chars[bytes[i] % chars.length];
  return code;
}
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function cleanSpec(raw, transcript, allowed) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const archetype = ARCHETYPES.includes(s.archetype) ? s.archetype : 'street';
  const set_piece = SET_PIECES.includes(s.set_piece) ? s.set_piece : 'none';
  const objects = [
    ...new Set((Array.isArray(s.objects) ? s.objects : []).map(text).filter((id) => allowed.has(id))),
  ].slice(0, 5);
  const hx = /^#[0-9a-f]{6}$/i;
  const pal = Array.isArray(s.palette) ? s.palette.map(text) : [];
  const palette = pal.length === 3 && pal.every((c) => hx.test(c)) ? pal : null;
  const mood = MOODS.includes(s.mood) ? s.mood : 'day';
  let kicker = text(s.kicker).replace(/^["“”'‘’]+|["“”'‘’.]+$/g, '');
  if (!kicker || kicker.length > 90 || !norm(transcript).includes(norm(kicker))) kicker = '';
  const out = { archetype, set_piece, objects, mood, kicker };
  if (palette) out.palette = palette;
  return out;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let transcript = text(body?.transcript);
    const source = body?.source === 'whatsapp' ? 'whatsapp' : 'web';

    try {
      const recent = await base44.asServiceRole.entities.Business.filter({ source: 'web' }, '-created_date', 40);
      const list = Array.isArray(recent) ? recent : recent?.items || [];
      const hourAgo = Date.now() - 3600 * 1000;
      if (list.filter((r) => r.created_date && new Date(r.created_date).getTime() > hourAgo).length >= 40) {
        return Response.json({ ok: false, message: "We're very busy right now. Please try again in a little while." });
      }
    } catch (e) {
      console.warn('rate check skipped', e && e.message);
    }

    if (!transcript) {
      let audioUrl = text(body?.audio_url);
      const b64 = text(body?.audio_base64);
      if (!audioUrl && b64) {
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        if (bin.length > 8_000_000) return Response.json({ ok: false, message: 'That recording is too long. Try 60 seconds or less.' });
        const mime = text(body?.mime) || 'audio/webm';
        const up = await base44.asServiceRole.integrations.Core.UploadFile({
          file: new File([bin], mime.includes('mp4') ? 'voice.m4a' : 'voice.webm', { type: mime }),
        });
        audioUrl = up?.file_url || '';
      }
      if (!/^https?:\/\//.test(audioUrl)) {
        return Response.json({ error: 'audio_url, audio_base64 or transcript is required' }, { status: 400 });
      }
      const raw = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
      transcript = text(
        typeof raw === 'string' ? raw : raw?.text || raw?.transcript || raw?.result,
      );
    }
    if (!transcript) return Response.json({ ok: false, message: REFUSAL });
    if (transcript.length > 6000) transcript = transcript.slice(0, 6000);

    const R = await loadRemote();
    if (!R) return Response.json({ error: 'prompt files unavailable, try again' }, { status: 503 });
    const profile = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${R.prompt.replace('{{OBJECTS}}', R.ids.join(' '))}\n\n<transcript>\n${transcript}\n</transcript>`,
      response_json_schema: SCHEMA,
    });

    const name = clip(profile?.business_name, 80);
    const category = clip(profile?.category, 60);
    if (!name && !category) return Response.json({ ok: false, message: REFUSAL });

    const services = (Array.isArray(profile?.services) ? profile.services : [])
      .filter((x) => x && typeof x === 'object' && text(x.name))
      .slice(0, 12)
      .map((x) => ({ name: clip(x.name, 80), price: clip(x.price, 30), description: clip(x.description, 120) }));
    const hours = clip(profile?.hours, 120);
    const location = clip(profile?.location, 120);
    const contact = clip(profile?.phone_or_contact, 80);

    if (!name || !(services.length || hours || location)) {
      return Response.json({ ok: false, needs_more: true, message: NEEDS_MORE });
    }

    const baseSlug = slugify(name) || slugify(category) || 'business';
    let slug = baseSlug;
    let n = 1;
    let taken = true;
    while (taken && n < 200) {
      const existing = await base44.asServiceRole.entities.Business.filter({ slug });
      const list = Array.isArray(existing) ? existing : existing?.items || [];
      taken = list.length > 0;
      if (taken) {
        n += 1;
        slug = `${baseSlug}-${n}`;
      }
    }

    const language = LANGS.includes(profile?.language) ? profile.language : 'en';
    const created = await base44.asServiceRole.entities.Business.create({
      slug,
      business_name: name,
      category,
      language,
      tagline: clip(profile?.tagline, 80),
      about: clip(profile?.about, 300),
      services,
      hours,
      location,
      phone_or_contact: contact,
      theme: THEMES.includes(profile?.theme) ? profile.theme : 'craft',
      scene_spec: JSON.stringify(cleanSpec(profile?.scene_spec, transcript, R.set)),
      source,
      edit_code: makeEditCode(),
      transcript,
    });

    return Response.json({ ok: true, slug: created?.slug || slug, edit_code: created?.edit_code });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
