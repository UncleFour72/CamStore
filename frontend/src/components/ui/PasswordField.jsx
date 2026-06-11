import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  className = '',
  inputClassName = '',
  label,
  onToggle,
  showPassword = false,
  toggleLabel = 'Hiện mật khẩu',
  ...props
}) {
  return (
    <label className={`grid gap-[7px] text-base font-semibold text-[#17212b] ${className}`}>
      {label && <span>{label}</span>}
      <div className="grid min-h-[52px] w-full grid-cols-[minmax(0,1fr)_54px] items-center overflow-hidden rounded-[10px] border border-solid border-[#b8c8d8] bg-[#f6fbff] text-[#111820] transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        <input
          className={`min-h-[50px] w-full !border-0 !bg-transparent px-[18px] text-[#111820] !shadow-none outline-none placeholder:text-[#aebdca] focus:!border-0 focus:!shadow-none focus:!ring-0 ${inputClassName}`}
          type={showPassword ? 'text' : 'password'}
          {...props}
        />
        <button
          aria-label={toggleLabel}
          className="grid h-[50px] w-[50px] place-items-center border-0 bg-transparent text-[#667482] transition hover:text-primary"
          type="button"
          onClick={onToggle}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </label>
  );
}
