import { Link } from 'react-router-dom';

const VARIANTS = {
  editorial: {
    wrap: 'mt-16 border-t border-[#1C1A17]/20 pb-10 pt-6 text-sm text-[#6B6359]',
    link: 'underline decoration-[#8A2A1F] underline-offset-4',
  },
  bold: {
    wrap: 'mt-16 border-t-2 border-[#F2F0EA]/15 pb-10 pt-6 text-sm text-[#9C9AA3]',
    link: 'font-anton uppercase tracking-wide text-[#E8FF3A]',
  },
  craft: {
    wrap: 'mt-12 border-t-2 border-dashed border-[#2B2118]/40 pb-10 pt-6 font-plexmono text-sm text-[#6A5847]',
    link: 'font-bold text-[#9A3B14] underline',
  },
  minimal: {
    wrap: 'mt-16 border-t border-neutral-200 pb-10 pt-6 text-sm text-neutral-500',
    link: 'text-[#111111] underline',
  },
  zine: {
    wrap: 'mt-16 border-t-2 border-[#14120F] pb-10 pt-6 font-spacemono text-sm text-[#14120F]/70',
    link: 'font-bold text-[#E5197F] underline',
  },
};

export default function SiteFooter({ variant = 'editorial' }) {
  const v = VARIANTS[variant] || VARIANTS.editorial;
  return (
    <footer className={v.wrap}>
      <p>This site was made from a single voice note.</p>
      <Link to="/" className={`mt-1 inline-block min-h-[44px] py-3 ${v.link}`}>
        Make yours
      </Link>
    </footer>
  );
}
