import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Full-colour object art (Fluent Emoji, MIT) is fetched once and cached for the whole session.
let artPromise = null;
function loadArt() {
  if (!artPromise) {
    artPromise = fetch('/spoken/art.json?v=3')
      .then((r) => r.json())
      .then((j) => window.SpokenIcons && window.SpokenIcons.addArt(j))
      .catch((e) => console.warn('art library not loaded', e));
  }
  return artPromise;
}

// Renders one Business record with the Spoken scene engine (public/spoken/*).
export default function SpokenSite({ business, home = '/' }) {
  const root = useRef(null);
  const site = useRef(null);
  const shown = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadArt().finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    if (!window.SpokenEngine) {
      console.error('SpokenSite: engine scripts not loaded');
      return undefined;
    }
    site.current = window.SpokenEngine.site(root.current, business, {
      home,
      onLead: (lead) => base44.entities.Lead.create(lead),
    });
    shown.current = business;
    return () => {
      if (site.current) site.current.destroy();
      site.current = null;
      document.body.className = '';
      document.body.removeAttribute('style');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!site.current || business === shown.current) return;
    site.current.update(business);
    shown.current = business;
  }, [business]);

  return <div ref={root} />;
}
