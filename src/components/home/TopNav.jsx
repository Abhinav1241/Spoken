export default function TopNav() {
  const scrollToRecorder = () => {
    const el = document.getElementById('recorder');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
      <span className="font-fraunces text-xl font-semibold text-[#F6F3EC] [text-shadow:0_2px_10px_rgba(0,0,0,0.55)] sm:text-2xl">
        Spoken
      </span>
      <div className="flex items-center gap-5 text-[#F6F3EC] [text-shadow:0_2px_10px_rgba(0,0,0,0.55)] sm:gap-7">
        <button type="button" onClick={scrollToRecorder} className="font-geist text-sm sm:text-base">
          How it works
        </button>
        <button type="button" onClick={scrollToRecorder} className="font-geist text-sm sm:text-base">
          Try it
        </button>
      </div>
    </nav>
  );
}
