import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import HeroFilm from '@/components/home/HeroFilm';

const FAILURE_MESSAGE = "Couldn't build a site from that, try again.";

export default function Try() {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const maxTimerRef = useRef(null);

  const stop = () => {
    window.clearTimeout(maxTimerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setRecording(false);
  };

  const start = async () => {
    setError('');
    setResult(null);
    setStatus('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setError('Microphone access was blocked.');
      return;
    }
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      process(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    maxTimerRef.current = window.setTimeout(stop, 60000);
  };

  const process = async (blob) => {
    setBusy(true);
    try {
      setStatus('Uploading…');
      const file = new File([blob], 'voice-note.webm', { type: blob.type || 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });

      setStatus('Transcribing…');
      const pending = base44.functions.invoke('createBusinessSite', { audio_url: file_url });
      const buildTimer = window.setTimeout(() => setStatus('Building your site…'), 3000);
      const response = await pending;
      window.clearTimeout(buildTimer);

      const data = response?.data;
      if (!data?.ok) {
        setStatus('');
        setError(FAILURE_MESSAGE);
        return;
      }
      setStatus('Done');
      setResult({ slug: data.slug, edit_code: data.edit_code });
    } catch (e) {
      setStatus('');
      setError(FAILURE_MESSAGE);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper font-geist text-ink">
      <HeroFilm />
      <section id="recorder" className="mx-auto max-w-xl scroll-mt-4 px-6 py-16 sm:py-20">
        <h1 className="text-2xl font-semibold">Spoken</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Talk about your business for up to 60 seconds. We turn it into a one-page site.
        </p>

        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={busy}
          className="mt-10 w-full border border-black px-6 py-6 text-lg disabled:opacity-40"
        >
          {recording ? 'Tap to stop' : 'Hold to record'}
        </button>
        <p className="mt-2 text-xs text-neutral-500">
          {recording ? 'Recording… up to 60 seconds.' : 'Tap to start, tap again to stop.'}
        </p>

        {status && <p className="mt-8 text-sm">{status}</p>}
        {error && <p className="mt-8 text-sm">{error}</p>}

        {result && (
          <div className="mt-8 text-sm">
            <p>
              Your site is at{' '}
              <Link to={`/s/${result.slug}`} className="underline">
                /s/{result.slug}
              </Link>
            </p>
            <p className="mt-2">
              Edit code: <span className="font-mono">{result.edit_code}</span>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
