/** Hero artwork: a print "proof sheet" – garment, halftone print area, registration marks and ink swatches. */
function RegMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 0v24M0 12h24" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default function ProofSheet() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] animate-ink [animation-delay:.15s]">
      <div className="relative rounded-[22px] border border-line bg-surface p-6 shadow-pop sm:p-8">
        <RegMark className="absolute left-3 top-3 h-5 w-5 text-ink/40" />
        <RegMark className="absolute right-3 top-3 h-5 w-5 text-ink/40" />
        <RegMark className="absolute bottom-3 left-3 h-5 w-5 text-ink/40" />
        <RegMark className="absolute bottom-3 right-3 h-5 w-5 text-ink/40" />

        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-semibold text-ink">Job GH-2026-0142</span>
          <span>Front print · 12 × 14 in</span>
        </div>

        <div className="relative mt-4 grid place-items-center rounded-2xl bg-surface-2 py-6">
          <svg viewBox="0 0 300 300" className="w-[78%]" aria-label="T-shirt mockup">
            <defs>
              <pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse">
                <circle cx="4.5" cy="4.5" r="2.1" fill="rgb(var(--accent))" />
              </pattern>
              <pattern id="dots2" width="9" height="9" patternUnits="userSpaceOnUse">
                <circle cx="4.5" cy="4.5" r="1.3" fill="rgb(var(--brand))" />
              </pattern>
            </defs>
            <path
              d="M96 32 L60 48 L18 86 L46 124 L74 108 L74 272 L226 272 L226 108 L254 124 L282 86 L240 48 L204 32 C196 52 176 64 150 64 C124 64 104 52 96 32 Z"
              fill="rgb(var(--brand-deep))"
            />
            <path d="M96 32 C104 52 124 64 150 64 C176 64 196 52 204 32" fill="none" stroke="rgb(var(--bg))" strokeOpacity=".35" strokeWidth="3" />
            <rect x="108" y="100" width="84" height="98" rx="6" fill="none" stroke="rgb(var(--bg))" strokeOpacity=".5" strokeDasharray="4 4" />
            <circle cx="150" cy="140" r="30" fill="url(#dots)" />
            <path d="M118 188 L182 188" stroke="rgb(var(--bg))" strokeWidth="7" strokeLinecap="round" />
            <path d="M128 172 L172 172" stroke="url(#dots2)" strokeWidth="9" strokeLinecap="round" />
          </svg>

          <span className="absolute -right-3 top-6 animate-stamp rounded-lg border-2 border-accent bg-surface px-3 py-1.5 font-display text-sm font-extrabold text-accent shadow-lift">
            Proof approved
          </span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            ['Groove blue', 'bg-brand'],
            ['Cart navy', 'bg-brand-deep'],
            ['Print orange', 'bg-accent'],
            ['Base white', 'bg-white ring-1 ring-line'],
          ].map(([name, cls]) => (
            <div key={name} className="overflow-hidden rounded-lg border border-line">
              <div className={`h-9 ${cls}`} />
              <p className="truncate bg-surface px-2 py-1 text-[10px] font-semibold text-muted">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
