const tones = {
  neutral: 'border-[#d9e2ec] bg-[#eef3f8] text-[#26323d]',
  primary: 'border-primary/20 bg-primary/10 text-primary',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  light: 'border-white/70 bg-white/90 text-primary shadow-[0_8px_18px_rgba(15,23,42,0.12)]',
};

const sizes = {
  xs: 'px-2 py-1 text-[11px]',
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  className = '',
  size = 'sm',
  tone = 'neutral',
  ...props
}) {
  if (!children) {
    return null;
  }

  const toneClass = tones[tone] || tones.neutral;
  const sizeClass = sizes[size] || sizes.sm;

  return (
    <span
      className={`inline-flex w-max items-center rounded-full border border-solid font-extrabold leading-none ${toneClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
