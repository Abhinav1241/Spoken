import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const audioUrl = typeof body?.audio_url === 'string' ? body.audio_url.trim() : '';
    if (!/^https?:\/\//.test(audioUrl)) {
      return Response.json({ error: 'audio_url is required' }, { status: 400 });
    }

    const raw = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
    let transcript = '';
    if (typeof raw === 'string') {
      transcript = raw.trim();
    } else if (raw && typeof raw === 'object') {
      transcript = String(raw.text || raw.transcript || raw.result || '').trim();
    }

    return Response.json({ transcript });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
