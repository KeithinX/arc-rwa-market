"use client";

type LogoVariant = "default" | "onDark";

/** Arc RWA：开口环 + 中心点；onDark 提高描边亮度并加外框，避免沉进深色底 */
export function Logo({
  size = 32,
  className = "",
  variant = "default",
}: {
  size?: number;
  className?: string;
  variant?: LogoVariant;
}) {
  const onDark = variant === "onDark";
  const plate = onDark ? "#1e293b" : "#0f172a";
  const ring = onDark ? "#5eead4" : "#2dd4bf";
  const highlight = "#f8fafc";
  const rim = onDark ? "#2dd4bf" : "#334155";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.25"
        fill={plate}
        stroke={rim}
        strokeWidth={onDark ? 1.5 : 1}
      />
      <path
        d="M23.8 9.4A9.2 9.2 0 1 0 24.5 21.2"
        stroke={ring}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="16" r="3.2" fill={ring} />
      <path
        d="M21.2 8.6C23.4 9.8 25 12.2 25.2 15"
        stroke={highlight}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
