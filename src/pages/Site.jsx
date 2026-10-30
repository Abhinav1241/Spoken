import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SpokenSite from '@/components/site/SpokenSite';

const THEMES = ['craft', 'editorial', 'bold', 'minimal', 'zine'];

export default function Site() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.Business.filter({ slug })
      .then((records) => {
        if (!active) return;
        const matches = Array.isArray(records) ? records : records?.items || [];
        setRecord(matches[0] || null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setRecord(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // live updates: edits made on the owner page or over WhatsApp appear without a reload
  useEffect(() => {
    if (!record?.id) return undefined;
    return base44.entities.Business.subscribe((event) => {
      if (event.data?.id === record.id) setRecord(event.data);
    });
  }, [record?.id]);

  useEffect(() => {
    const prev = document.title;
    if (record?.business_name) document.title = record.business_name;
    return () => { document.title = prev; };
  }, [record?.business_name]);

  const override = searchParams.get('theme');
  const business = useMemo(
    () => (record && THEMES.includes(override) ? { ...record, theme: override } : record),
    [record, override]
  );

  if (loading) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif', fontSize: 14 }}>Loading…</div>;
  }
  if (!business) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif', fontSize: 15, lineHeight: 1.6 }}>
        <p>We couldn't find that site.</p>
        <p><a href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>Back to Spoken</a></p>
      </div>
    );
  }
  return <SpokenSite key={business.id} business={business} home="/" />;
}
