// ChuoHub mark: a map pin (the central place) holding a graduation cap (the university).
// Same artwork as campuses/default/logo.png and public/favicon.svg.
export default function BrandMark({ className = 'h-14 w-14' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
      <rect width="24" height="24" rx="5.4" className="fill-brand" />
      <g transform="translate(12 12) scale(0.7) translate(-12 -12.6)" stroke="#fff" fill="none">
        <path d="M12 22s7-6.2 7-12.2A7 7 0 0 0 5 9.8C5 15.8 12 22 12 22z" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 6.4 7.6 8.6 12 10.8l4.4-2.2z" fill="#fff" stroke="none" />
        <path d="M9.2 9.6v2.1c0 .9 1.3 1.6 2.8 1.6s2.8-.7 2.8-1.6V9.6" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M16.4 8.6v2.6" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </svg>
  );
}
