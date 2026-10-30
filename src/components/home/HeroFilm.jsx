import { useEffect, useRef, useState } from 'react';
import TopNav from '@/components/home/TopNav';

const VIDEO_URL = '/hero.mp4'; // copy assets/hero.mp4 into public/ to use the scrubbed video hero

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const fadeIn = (p, start, end) => clamp01((p - start) / (end - start));
const fadeOut = (p, start, end) => clamp01((end - p) / (end - start));

const LABEL = 'font-geist text-xs uppercase tracking-[0.3em] text-[#F6F3EC] [text-shadow:0_2px_10px_rgba(0,0,0,0.55)] sm:text-sm';
const HEADLINE = 'font-fraunces font-semibold leading-[1.02] text-[#F6F3EC] [text-shadow:0_2px_16px_rgba(0,0,0,0.55)] text-4xl sm:text-7xl lg:text-8xl';

export default function HeroFilm() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (event) => setReduced(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (reduced) {
      const showLastFrame = () => {
        if (video.duration) video.currentTime = Math.max(0, video.duration - 0.05);
      };
      video.addEventListener('loadedmetadata', showLastFrame);
      if (video.duration) showLastFrame();
      return () => video.removeEventListener('loadedmetadata', showLastFrame);
    }

    let raf = 0;
    let target = 0;
    let current = 0;
    let shown = -1;
    const tick = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      const v = videoRef.current;
      if (v && v.duration) v.currentTime = current * v.duration;
      if (current !== shown) {
        shown = current;
        setProgress(current);
      }
      raf = requestAnimationFrame(tick);
    };
    const measure = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      target = clamp01(scrollable > 0 ? -rect.top / scrollable : 0);
    };
    measure();
    raf = requestAnimationFrame(tick);
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [reduced]);

  const scrollToRecorder = () => {
    const el = document.getElementById('recorder');
    if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  const p = reduced ? 1 : progress;
  const opacity1 = reduced ? 0 : Math.min(fadeIn(p, 0, 0.04), fadeOut(p, 0.1, 0.15));
  const opacity2 = reduced ? 0 : Math.min(fadeIn(p, 0.35, 0.4), fadeOut(p, 0.5, 0.55));
  const opacity3 = reduced ? 1 : fadeIn(p, 0.8, 0.86);

  return (
    <section ref={sectionRef} className={reduced ? 'relative' : 'relative h-[400vh]'}>
      <div className="sticky top-0 h-screen overflow-hidden bg-paper">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          onCanPlay={() => setReady(true)}
        />

        <TopNav />

        <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ opacity: opacity1, visibility: opacity1 > 0.01 ? 'visible' : 'hidden' }}>
          <div>
            <p className={LABEL}>Spoken</p>
            <h1 className={`mt-4 ${HEADLINE}`}>Say it.</h1>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ opacity: opacity2, visibility: opacity2 > 0.01 ? 'visible' : 'hidden' }}>
          <h1 className={HEADLINE}>Every word opens a shop.</h1>
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ opacity: opacity3, visibility: opacity3 > 0.01 ? 'visible' : 'hidden' }}>
          <div>
            <h1 className={HEADLINE}>
              One voice note.
              <br />
              One live website.
            </h1>
            <button
              type="button"
              onClick={scrollToRecorder}
              className="mt-8 bg-vermilion px-6 py-4 font-geist text-sm uppercase tracking-widest text-[#F6F3EC] sm:px-8"
            >
              Try it: hold to record
            </button>
          </div>
        </div>

        {!ready && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-paper">
            <span className="font-fraunces text-2xl font-semibold text-ink">Spoken</span>
          </div>
        )}
      </div>
    </section>
  );
}
