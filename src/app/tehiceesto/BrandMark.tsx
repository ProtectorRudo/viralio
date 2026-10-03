import Link from "next/link";

export default function BrandMark({
  href,
  compact = false,
  tagline = false,
}: {
  href: string;
  compact?: boolean;
  tagline?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`thi-logo-lockup ${compact ? "compact" : ""}`}
      aria-label="Te Hice Esto"
    >
      <span className="thi-logo-wordmark">
        <span>Te</span><em>Hice</em><span>Esto</span>
      </span>
      <span className="thi-logo-seal" aria-hidden="true">
        <span>♥</span>
        <i />
      </span>
      {tagline && <small>Regalos digitales para el alma</small>}
    </Link>
  );
}
