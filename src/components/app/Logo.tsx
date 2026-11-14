export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <span className={`${className} grid place-items-center rounded-lg bg-ink`} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-[62%]">
        <defs>
          <linearGradient id="fp-mark" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0" stopColor="#12b76a" />
            <stop offset="1" stopColor="#2e90fa" />
          </linearGradient>
        </defs>
        <circle cx="4" cy="19" r="1.6" fill="#fff" opacity=".45" />
        <circle cx="9" cy="15.5" r="1.6" fill="#fff" opacity=".65" />
        <circle cx="14" cy="11" r="1.6" fill="#fff" opacity=".85" />
        <path d="M14 11 L20 4.5" stroke="url(#fp-mark)" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="20" cy="4.5" r="2.2" fill="url(#fp-mark)" />
      </svg>
    </span>
  );
}
