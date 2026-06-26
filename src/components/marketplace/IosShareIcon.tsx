type Props = {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
};

export function IosShareIcon({ size = 20, color = "currentColor", className, strokeWidth = 1.6 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Rounded box base */}
      <path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16" />
      {/* Arrow shaft */}
      <line x1="12" y1="3.5" x2="12" y2="14.5" />
      {/* Arrow head */}
      <polyline points="8.25,7.25 12,3.5 15.75,7.25" />
    </svg>
  );
}
