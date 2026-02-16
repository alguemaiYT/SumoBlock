// ============================================
// SumoBlock - Logo Component
// Replace the SVG below with your own logo
// ============================================

const Logo = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`h-8 w-8 ${className}`}
  >
    <rect x="4" y="8" width="24" height="16" rx="4" fill="hsl(var(--primary))" />
    <circle cx="12" cy="16" r="3" fill="hsl(var(--background))" />
    <circle cx="20" cy="16" r="3" fill="hsl(var(--background))" />
    <rect x="8" y="22" width="4" height="4" rx="1" fill="hsl(var(--muted-foreground))" />
    <rect x="20" y="22" width="4" height="4" rx="1" fill="hsl(var(--muted-foreground))" />
  </svg>
);

export default Logo;
