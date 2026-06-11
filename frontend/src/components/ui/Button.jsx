const baseClasses =
  'inline-flex min-h-[52px] items-center justify-center gap-3 rounded-[10px] border-solid px-5 text-base font-extrabold outline-none transition disabled:cursor-not-allowed disabled:opacity-65';

const variants = {
  primary:
    'border border-transparent bg-primary text-white shadow-[0_10px_22px_rgba(0,101,145,0.24)] hover:bg-[#005b82] focus-visible:ring-4 focus-visible:ring-primary/20',
  outline:
    'border border-[#b8c8d8] bg-[#f8fcff] text-[#111820] hover:border-[#7da9c2] hover:shadow-[0_8px_18px_rgba(17,24,32,0.08)] focus-visible:ring-4 focus-visible:ring-primary/15',
  ghost:
    'border border-transparent bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-4 focus-visible:ring-primary/15',
};

export default function Button({
  children,
  className = '',
  fullWidth = false,
  variant = 'primary',
  type = 'button',
  ...props
}) {
  const widthClass = fullWidth ? 'w-full' : '';
  const variantClass = variants[variant] || variants.primary;

  return (
    <button className={`${baseClasses} ${variantClass} ${widthClass} ${className}`} type={type} {...props}>
      {children}
    </button>
  );
}
